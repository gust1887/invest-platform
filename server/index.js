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

// Henter nøgeltal fra Alpha Vantage 

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
  const {symbol, amount, price, currency, accountId} = req.body;
  const totalPrice = amount * price;

  try {
    // Forbinder til databasen
    const connection = await getConnection();
    

    // Der søges i dbo.Securities for at finde ID på baggrund af ticker
    let securityResult = await connection.request()
      .input('ticker', sql.NVarChar(10), symbol)
      .query('SELECT id FROM dbo.Securities WHERE ticker = @ticker');


    // Hvis aktien ikke findes, opretter vi den
    if (securityResult.recordset.length === 0) {
      const insertResult = await connection.request()
        .input('ticker', sql.NVarChar(10), symbol)
        .input('name', sql.NVarChar(50), symbol)
        .input('market', sql.NVarChar(10), 'Unknown') 
        .input('currency', sql.NVarChar(10), currency)
        .query('INSERT INTO dbo.Securities (ticker, name, market, currency) OUTPUT INSERTED.id VALUES (@ticker, @name, @market, @currency)');

      securityResult = insertResult;
      console.log("Aktie oprettet med ID:", securityResult.recordset[0].id);
    }

    // Henter det korrekte ID
    const securityId = securityResult.recordset[0].id;

    // Henter brugerens balance
    const result = await connection.request()
      .input('accountId', sql.Int, accountId)
      .query('SELECT balance FROM dbo.Accounts WHERE id = @accountId');

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Account couldnt be found' });
    }

    const balance = result.recordset[0].balance;

    // Tjekker om der er penge nok
    if (balance < totalPrice) {
      return res.status(404).json({ success: false, message: 'Not enough money in the account' });
    }

    // Trækker beløbet fra kontoen
    await connection.request()
      .input('totalPrice', sql.Decimal(18, 2), totalPrice)
      .input('accountId', sql.Int, accountId)
      .query('UPDATE dbo.Accounts SET balance = balance - @totalPrice WHERE id = @accountId');

    // Indsætter i dbo.Trades
    await connection.request()
      .input('accountId', sql.Int, accountId)
      .input('securityId', sql.Int, securityId)
      .input('amount', sql.Int, amount)
      .input('totalPrice', sql.Decimal(18, 2), totalPrice)
      .input('currency', sql.NVarChar(10), currency)
      .query(`INSERT INTO dbo.Trades (account_id, security_id, quantity, total_price, trade_type, fee) 
              VALUES (@accountId, @securityId, @amount, @totalPrice, 'BUY', 39.00)`);

    res.status(200).json({ success: true, message: 'It went thruogh' });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Something happened to the server' });
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