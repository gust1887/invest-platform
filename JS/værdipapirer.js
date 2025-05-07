// værdipapirer.js
document.addEventListener("DOMContentLoaded", async () => {
  const ALPHA_VANTAGE_API_KEY = 'T9RVKBMGMJ5YU5Z6'; // ← Udskift med din egen nøgle

  const securities = [
    { name: "Apple Inc.", symbol: "AAPL", shares: 20 },
    { name: "Microsoft Corp.", symbol: "MSFT", shares: 15 },
    { name: "iShares Core MSCI World ETF", symbol: "IWRD.LON", shares: 1 },
    { name: "Tesla Inc.", symbol: "TSLA", shares: 5 },
    { name: "Nvidia Corp.", symbol: "NVDA", shares: 6 }
  ];

  async function fetchStockData(symbol) {
    try {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      console.log(`Data for ${symbol}:`, data); // DEBUG

      if (!data["Global Quote"] || Object.keys(data["Global Quote"]).length === 0) {
        console.warn(`No valid data for ${symbol}`);
        return { price: 0, change: "N/A" };
      }

      const quote = data["Global Quote"];
      const price = parseFloat(quote["05. price"]);
      const changePercent = quote["10. change percent"] || "0%";

      return {
        price: isNaN(price) ? 0 : price,
        change: changePercent
      };
    } catch (error) {
      console.error(`Fejl ved hentning af data for ${symbol}:`, error);
      return { price: 0, change: "?" };
    }
  }

  async function fetchAndDisplayData() {
    const updatedSecurities = [];

    for (const s of securities) {
      const { price, change } = await fetchStockData(s.symbol);
      const value = s.shares * price;

      updatedSecurities.push({
        name: s.name,
        symbol: s.symbol,
        shares: s.shares,
        price,
        value,
        change
      });
    }

    // Opdater total værdi
    const total = updatedSecurities.reduce((sum, s) => sum + s.value, 0);
    document.getElementById("totalValueDisplay").textContent = `${total.toFixed(2)} DKK`;

    // Vis i tabel
    const tableBody = document.getElementById("securitiesTableBody");
    tableBody.innerHTML = "";
    updatedSecurities.forEach(s => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${s.name}</td>
        <td>${s.symbol}</td>
        <td>${s.shares}</td>
        <td>${s.price.toFixed(2)} DKK</td>
        <td>${s.value.toFixed(2)} DKK</td>
        <td>${s.change}</td>
      `;
      tableBody.appendChild(row);
    });

    // Generer diagram
    const labels = updatedSecurities.map(s => s.name);
    const data = updatedSecurities.map(s => s.value);

    const ctx = document.getElementById("securitiesChart").getContext("2d");
    new Chart(ctx, {
      type: "pie",
      data: {
        labels: labels,
        datasets: [{
          label: "Portfolio Breakdown",
          data: data,
          backgroundColor: [
            "#4CAF50", "#2196F3", "#FFC107", "#FF5722", "#9C27B0"
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right'
          },
          title: {
            display: true,
            text: 'Securities Value Distribution'
          }
        }
      }
    });
  }

  await fetchAndDisplayData();
});

