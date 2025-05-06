const express = require('express');
const path = require('path');
// Importerer alle ruter relateret til brugere (fx opret bruger, login)
const userRoutes = require('./routes/userRoutes');
// Importerer alle ruter relateret til bankkonti (fx opret konto, indsæt penge)
const accountRoutes = require('./routes/accountRoutes');

//API KEY 
API_KEY = '67T6LZMPL60CMGW4'; 

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

/* Når klienten besøger en sti, der starter med f.eks. /api/users,
 så videresendes det til de ruter, der er defineret i userRoutes.js
 Eksempel: POST /api/users/opretbruger */
app.use('/api/users', userRoutes);
app.use('/api/accounts', accountRoutes);

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