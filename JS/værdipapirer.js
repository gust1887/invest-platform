//LAVET MED CHAT
// vaerdipapirer.js
// Funktion til at beregne værdien af hvert værdipapir i en portefølje baseret på antal aktier og aktuel pris fra API

const axios = require('axios'); //Axios bruges til at hente data fra eksterne API’er – f.eks. Alpha Vantage. Må det bruges?
const ALPHA_VANTAGE_API_KEY = 'din_api_nøgle';

// Funktion til at hente aktuel aktiekurs for en given symbol
async function fetchStockPrice(symbol) {
  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const response = await axios.get(url);
    const quote = response.data["Global Quote"];
    const price = parseFloat(quote["05. price"]);
    return price;
  } catch (error) {
    console.error(`Fejl ved hentning af pris for ${symbol}:`, error.message);
    return 0; // fallback hvis fejl
  }
}

// Beregn værdien af hvert værdipapir
async function calculateSecuritiesValue(securities) {
  const result = [];

  for (const item of securities) {
    const price = await fetchStockPrice(item.symbol);
    const totalValue = price * item.shares;
    result.push({
      symbol: item.symbol,
      shares: item.shares,
      price: price,
      totalValue: totalValue
    });
  }

  return result;
}

module.exports = { fetchStockPrice, calculateSecuritiesValue };
