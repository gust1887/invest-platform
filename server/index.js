const express = require('express');
const path = require('path');
// Importerer alle ruter relateret til brugere (fx opret bruger, login)
const userRoutes = require('./routes/userRoutes');
// Importerer alle ruter relateret til bankkonti (fx opret konto, indsæt penge)
const accountRoutes = require('./routes/accountRoutes');
// Importerer alle ruter relateret til portføljer
const portfolioRoutes = require('./routes/portfolioRoutes');

//API KEY 
const API_KEY = 'JKHJKNXLK7K3FNOF'; 

// Connection til SQL db 
const { getConnection } = require('./database');


const app = express();
const port = 5000;

app.use(express.json()); // Gør det muligt at læse JSON i req.body


//Henter aktiedata fra en API

app.get('/api/:symbol', async(req,res) => {
  const symbol = req.params.symbol;
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${API_KEY}`;
  const svar = await fetch(url);
  const json = await svar.json();
  const data = json['Time Series (Daily)'];
  
  // Hvis data ikke er opfyldt vil den returnere en intern data fejl (500)
  if(!data) return res.status(500).json({error: 'Data ikke fundet eller forkert navn'});

  const resultat = Object.entries(data)
  .slice(0,7)
  .map(([dato, værdier]) => ({
    dato, 
    pris: parseFloat(værdier['4. close'])
  }))
  .reverse()
  res.json(resultat);
});

app.get('/api/nogletal/:symbol', async (req, res) => {
  const symbol = req.params.symbol;
  const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${API_KEY}`;

  try {
    const svar = await fetch(url);
    const json = await svar.json();

    if (!json || !json.Symbol) {
      return res.status(500).json({ error: 'Ingen nøgletal fundet' });
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
    res.status(500).json({ error: 'Fejl ved hentning af nøgletal' });
  }
});

app.post('/api/buy', async (req, res) => {
  const {symbol, amount, price, currency} = req.body;
  const accountId = 1;
  const totalPrice = amount * price;

  try {
    //Forbinder til databasen

    const connection = await getConnection();
    
    //Henter bruger ids balance 
    const result = await connection.request()
    .input('accountId', sql.Int, accountId)
    .query('SELECT balance FROM dbo.Accounts WHERE id = @accountId');

    if(result.recordset.length === 0) {
      return res.status(404).json({success: false, message: 'Acount couldnt be found'});

    }
    const balance = result.recordset[0].balance;    
    //Tjekker om der er penge nok
    if(balance < totalPrice) {
      return res.status(404).json({succes: false, message: 'Not enough money on the acount'});
    }

    await connection.request()
    .input('totalPrice', sql.Decimal(18,2), totalPrice)
    .input('accountId', sql.Int, accountId)
    .query('UPDATE dbo.Accounts SET balance = balance - @totalPrice WHERE id = @accountId');

    await connection.request()
    .input('accountId', sql.Int, accountId)
    .input('symbol', sql.NVarChar(10), symbol)
    .input('amount', sql.Int, amount)
    .input('price', sql.Decimal(18, 2), price)
    .input('currency', sql.NVarChar(10), currency)
    .query(`INSERT INTO dbo.Trades (account_id, security_id, quantity, total_price, trade_type, fee) 
                VALUES (@accountId, @symbol, @amount, @price, 'BUY', 0.00)`);
    
    //Kommer tilbage succesfyldt til frontend
    res.status(200).json({suceess: true, message: 'Went through'});

    } catch(error) {
      console.error("Something went wrong trying to buy the stock", error.message);
      res.status(500).json({succes: false, message: 'Something happent to the server'})
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