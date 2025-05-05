//indsæt get-metode fra sql-database til at hente kontoens porteføljer
//hent aktier fra API
//LAVET MED CHAT

const fetch = require('node-fetch');

// Midlertidig portefølje (bruges indtil SQL-databasen er færdig)
const dummyPortfolio = [
  { symbol: 'AAPL', shares: 10 },
  { symbol: 'MSFT', shares: 5 },
  { symbol: 'TSLA', shares: 3 }
];

// API-nøgler
const ALPHA_API_KEY = 'DIN_ALPHA_VANTAGE_NØGLE';
const EXCHANGE_API_KEY = 'DIN_EXCHANGERATE_API_NØGLE';

// Funktion til at hente aktiekurs fra Alpha Vantage
async function getStockPrice(symbol) {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_API_KEY}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const price = parseFloat(data["Global Quote"]["05. price"]);
    return isNaN(price) ? null : price;
  } catch (error) {
    console.error(`Fejl ved hentning af aktiekurs for ${symbol}:`, error);
    return null;
  }
}

// Funktion til at hente valutakurs (USD til målvaluta)
async function getExchangeRate(toCurrency = 'DKK') {
  const url = `https://v6.exchangerate-api.com/v6/${EXCHANGE_API_KEY}/latest/USD`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const rate = data.conversion_rates[toCurrency];
    return rate || null;
  } catch (error) {
    console.error(`Fejl ved hentning af valutakurs:`, error);
    return null;
  }
}

// Beregn værdi af portefølje i både USD og ønsket valuta
async function getPortfolioValue(portfolio, toCurrency = 'DKK') {
  const result = [];
  let totalUSD = 0;

  for (const stock of portfolio) {
    const price = await getStockPrice(stock.symbol);

    if (price !== null) {
      const totalValue = price * stock.shares;
      totalUSD += totalValue;
      result.push({
        symbol: stock.symbol,
        shares: stock.shares,
        priceUSD: price,
        totalUSD: totalValue.toFixed(2)
      });
    } else {
      result.push({
        symbol: stock.symbol,
        shares: stock.shares,
        priceUSD: 'N/A',
        totalUSD: 'N/A'
      });
    }
  }

  const exchangeRate = await getExchangeRate(toCurrency);
  const totalConverted = exchangeRate ? (totalUSD * exchangeRate).toFixed(2) : 'N/A';

  return {
    portfolio: result,
    totalUSD: totalUSD.toFixed(2),
    exchangeRate,
    totalInCurrency: totalConverted,
    currency: toCurrency
  };
}

// Kør det hele og vis i konsollen
getPortfolioValue(dummyPortfolio, 'DKK').then(result => {
  console.log("🧾 Porteføljeoversigt i USD:");
  console.table(result.portfolio);
  console.log(`💰 Samlet værdi: $${result.totalUSD} USD`);
  if (result.exchangeRate) {
    console.log(`💱 Valutakurs (USD → ${result.currency}): ${result.exchangeRate}`);
    console.log(`💶 Samlet værdi i ${result.currency}: ${result.totalInCurrency} ${result.currency}`);
  }
});


/*
Når din SQL-database er klar:
Erstat dummyPortfolio med en funktion som:
async function getPortfolioFromDatabase(userId) {
  // fx med mysql2 eller sqlite3
  const db = require('./db');
  const [rows] = await db.query('SELECT symbol, shares FROM portfolios WHERE user_id = ?', [userId]);
  return rows;
}

Og brug den sådan her:
const portfolio = await getPortfolioFromDatabase(1);
const result = await getPortfolioValue(portfolio);
*/



/*Her får du et simpelt HTML-dashboard med en grafisk visning af porteføljen ved hjælp af Chart.js, 
som du kan koble sammen med portefølje.js.
1. public/portefølje.html
<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="UTF-8" />
  <title>Min Portefølje</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 2rem;
      background: #f9f9f9;
    }

    h1 {
      text-align: center;
    }

    #chart-container {
      width: 80%;
      margin: auto;
    }
  </style>
</head>
<body>
  <h1>Porteføljeoversigt</h1>
  <div id="chart-container">
    <canvas id="portfolioChart"></canvas>
  </div>

  <script>
    // Fetch data fra din server-side route
    async function fetchPortfolioData() {
      const response = await fetch('/api/portefolje');
      const data = await response.json();

      const labels = data.map(item => item.symbol);
      const values = data.map(item => item.totalValue);

      const ctx = document.getElementById('portfolioChart').getContext('2d');

      new Chart(ctx, {
        type: 'pie',
        data: {
          labels,
          datasets: [{
            label: 'Portefølje værdi (DKK/USD)',
            data: values,
            backgroundColor: [
              '#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'right',
            },
            title: {
              display: true,
              text: 'Aktuel Porteføljefordeling'
            }
          }
        }
      });
    }

    fetchPortfolioData();
  </script>
</body>
</html>

2. Tilføj en route i din Express-server
I din app.js eller server.js skal du have noget i stil med:
const express = require('express');
const app = express();
const port = 3000;

const { getPortfolioValue } = require('./portefølje');

// Midlertidig dummy-data
const dummyPortfolio = [
  { symbol: 'AAPL', shares: 10 },
  { symbol: 'MSFT', shares: 5 },
  { symbol: 'TSLA', shares: 3 }
];

app.use(express.static('public'));

// API-endpoint til portefølje
app.get('/api/portefolje', async (req, res) => {
  const result = await getPortfolioValue(dummyPortfolio); // Senere: hent fra SQL
  res.json(result);
});

app.listen(port, () => {
  console.log(`Server kører på http://localhost:${port}`);
});
Nu vil portefølje.html automatisk kalde /api/portefolje, hente de nyeste aktiekurser via Alpha Vantage, 
og vise dem i en cirkelgraf!
*/
