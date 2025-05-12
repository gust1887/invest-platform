const express = require('express');
const path = require('path');
// Importerer alle ruter relateret til brugere (fx opret bruger, login)
const userRoutes = require('./routes/userRoutes');
// Importerer alle ruter relateret til bankkonti (fx opret konto, indsæt penge)
const accountRoutes = require('./routes/accountRoutes');
// Importerer alle ruter relateret til portføljer
const portfolioRoutes = require('./routes/portfolioRoutes');

//API KEY 
const API_KEY = 'SPJG5Q18L7YNPKXQ'; 

// Connection til SQL db 
const { getConnection } = require('./database');
const sql = require('mssql');


const app = express();
const port = 5001;

app.use(express.json()); // Gør det muligt at læse JSON i req.body

// Henter image til visning 
const express = require('express');
const path = require('path');
const app = express();

// Gør HTML-mappen og dens undermapper offentlige
app.use(express.static(path.join(__dirname, '../HTML')));


//Henter aktiedata fra Alpha Vantage 

app.get('/api/:symbol', async(req,res) => {
  const symbol = req.params.symbol;
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${API_KEY}`;
  
  const svar = await fetch(url);
  const json = await svar.json();
  const data = json['Time Series (Daily)'];
  
  // Hvis data ikke er opfyldt vil den returnere en intern data fejl (500)
  if(!data) return res.status(500).json({error: 'Data could not be found or wrong'});

  const resultat = Object.entries(data)
  .slice(0,7)
  .map(([dato, værdier]) => ({
    dato, 
    pris: parseFloat(værdier['4. close'])
  }))
  .reverse()
  res.json(resultat);
});

// Henter nøgletal fra Alpha Vantage 

app.get('/api/nogletal/:symbol', async (req, res) => {
  const symbol = req.params.symbol;
  const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${API_KEY}`;

  try {
    const svar = await fetch(url);
    const json = await svar.json();

    if (!json || !json.Symbol) {
      return res.status(500).json({ error: 'No key figures could be found' });
    }

    const data = {
      pe: json.PERatio,
      volume: json.Volume,
      marketCap: json.MarketCapitalization,
      eps: json.EPS,
      dividendYield: json.DividendYield
    };

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Fail getting the key figures' });
  }
});

//Henter det valgte mængde og prisen på købet ind i databasen
app.post('/api/buy', async (req, res) => {
  const { symbol, amount, price, currency, accountId, portfolioId } = req.body;

  const totalPrice = price * amount;

  try {
    const pool = await getConnection();


    //  Find eller opret security
    let secResult = await pool.request()
      .input('ticker', sql.NVarChar, symbol)
      .query('SELECT id FROM Securities WHERE ticker = @ticker');

    let securityId;
    if (secResult.recordset.length === 0) {
      const insertSec = await pool.request()
        .input('securitiesName', sql.NVarChar, symbol) // evt. bedre navn senere
        .input('ticker', sql.NVarChar, symbol)
        .input('securityType', sql.NVarChar, 'Stock')
        .query(`
          INSERT INTO Securities (securitiesName, ticker, securityType)
          OUTPUT INSERTED.id
          VALUES (@securitiesName, @ticker, @securityType)
        `);
      securityId = insertSec.recordset[0].id;
    } else {
      securityId = secResult.recordset[0].id;
    }

    // Tjek saldo
    const balanceCheck = await pool.request()
      .input('accountId', sql.Int, accountId)
      .query('SELECT balance FROM Accounts WHERE id = @accountId');

    const currentBalance = balanceCheck.recordset[0].balance;
    if (currentBalance < totalPrice) {
      return res.status(400).json({ success: false, message: "Insufficient funds." });
    }

    //  Indsæt trade
    await pool.request()
      .input('portfolioId', sql.Int, portfolioId)
      .input('accountId', sql.Int, accountId)
      .input('securityId', sql.Int, securityId)
      .input('amount', sql.Int, amount)
      .input('totalPrice', sql.Decimal(18, 2), totalPrice)
      .input('fee', sql.Decimal(18, 2), 0)
      .input('type', sql.NVarChar, 'BUY')
      .query(`
        INSERT INTO Trades (portfolio_id, account_id, security_id, quantity, total_price, fee, trade_type)
        VALUES (@portfolioId, @accountId, @securityId, @amount, @totalPrice, @fee, @type)
      `);

    //  Træk pengene fra konto
    await pool.request()
      .input('amount', sql.Decimal(18, 2), totalPrice)
      .input('accountId', sql.Int, accountId)
      .query(`
        UPDATE Accounts
        SET balance = balance - @amount
        WHERE id = @accountId
      `);

    return res.json({ success: true, message: "Trade successful" });

  } catch (err) {
    console.error("Fejl ved køb:", err);
    res.status(500).json({ success: false, message: "Server error during trade" });
  }
});



app.post('/api/sell', async (req, res) => {
  const { symbol, amount, price, currency, accountId, portfolioId } = req.body;

  const totalPrice = price * amount;

  try {
    const pool = await getConnection();

    // Find security
    const secResult = await pool.request()
      .input('ticker', sql.NVarChar, symbol)
      .query('SELECT id FROM Securities WHERE ticker = @ticker');

    if (secResult.recordset.length === 0) {
      return res.status(400).json({ success: false, message: "Stock not found in database" });
    }

    const securityId = secResult.recordset[0].id;

    // Tjek beholdning
    const holdings = await pool.request()
      .input('portfolioId', sql.Int, portfolioId)
      .input('securityId', sql.Int, securityId)
      .query(`
        SELECT 
          SUM(CASE WHEN trade_type = 'BUY' THEN quantity ELSE -quantity END) AS total
        FROM Trades
        WHERE portfolio_id = @portfolioId AND security_id = @securityId
      `);

    const owned = holdings.recordset[0].total || 0;

    if (owned < amount) {
      return res.status(400).json({ success: false, message: "Not enough shares to sell" });
    }

    //  Indsæt trade
    await pool.request()
      .input('portfolioId', sql.Int, portfolioId)
      .input('accountId', sql.Int, accountId)
      .input('securityId', sql.Int, securityId)
      .input('amount', sql.Int, amount)
      .input('totalPrice', sql.Decimal(18, 2), totalPrice)
      .input('fee', sql.Decimal(18, 2), 0)
      .input('type', sql.NVarChar, 'SELL')
      .query(`
        INSERT INTO Trades (portfolio_id, account_id, security_id, quantity, total_price, fee, trade_type)
        VALUES (@portfolioId, @accountId, @securityId, @amount, @totalPrice, @fee, @type)
      `);

    // Opdater balance
    await pool.request()
      .input('amount', sql.Decimal(18, 2), totalPrice)
      .input('accountId', sql.Int, accountId)
      .query(`
        UPDATE Accounts
        SET balance = balance + @amount
        WHERE id = @accountId
      `);

    res.json({ success: true, message: "Sale completed" });

  } catch (err) {
    console.error("Fejl ved salg:", err);
    res.status(500).json({ success: false, message: "Server error during sale" });
  }
});




/* Når klienten besøger en sti, der starter med f.eks. /api/users,
 så videresendes det til de ruter, der er defineret i userRoutes.js
 Eksempel: POST /api/users/opretbruger */
app.use('/api/users', userRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/portfolios', portfolioRoutes);

app.use('/CSS', express.static(path.join(__dirname, '..', 'CSS'))); // CSS mappen ligger uden for server mappen
app.use('/JS', express.static(path.join(__dirname, '..', 'JS'))); // JS mappen ligger uden for server mappen
app.use(express.static(path.join(__dirname, '..', 'HTML')));  // HTML mappen ligger uden for server mappen
app.use('/images', express.static(path.join(__dirname, '..', 'HTML', 'images')));


// Hjemmeside rute (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'HTML', 'frontpage.html'));
});

// Login rute
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../HTML', 'login.html')); 
});

// Opret bruger
app.get('/opretbruger', (req, res) => {
  res.sendFile(path.join(__dirname, '../HTML', 'opretbruger.html'));
});

//Dashboard

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../HTML', 'dashboard.html'));
});

// Opret konto
app.get('/opretkonto', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'HTML', 'opretkonto.html'));
});

// Kontier
app.get('/accounts', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'HTML', 'accounts.html'));
});

//Køb af aktier

app.get('/buystocks', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'HTML', 'buystocks.html'));
});

//Salg af aktier
app.get('/sellstocks', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'HTML', 'sellstocks.html'));
});

// Start serveren
app.listen(port, () => {
  console.log(`Server kører på http://localhost:${port}`);
});

// Sikrer forbindelse til SQL db
(async () => {
  try {
    await getConnection();
  } catch (err) {
    console.error("Forbindelse til databasen fejlede:", err);
  }
})();