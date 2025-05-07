// værdipapirer.js

document.addEventListener("DOMContentLoaded", async () => {
  const ALPHA_VANTAGE_API_KEY = 'T9RVKBMGMJ5YU5Z6'; // Din API-nøgle fra Alpha Vantage

  // Dummy-data med navn, symbol, antal aktier og samlet anskaffelsespris (krav: GAK)
  const securities = [
    { name: "Apple Inc.", symbol: "AAPL", shares: 20, acquisitionTotal: 23000 },
    { name: "Microsoft Corp.", symbol: "MSFT", shares: 15, acquisitionTotal: 18000 },
    { name: "iShares Core MSCI World ETF", symbol: "IWRD.LON", shares: 1, acquisitionTotal: 6000 },
    { name: "Tesla Inc.", symbol: "TSLA", shares: 5, acquisitionTotal: 8000 },
    { name: "Nvidia Corp.", symbol: "NVDA", shares: 6, acquisitionTotal: 15000 }
  ];

  // Funktion der henter aktuel aktiekurs fra Alpha Vantage
  async function fetchStockData(symbol) {
    try {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

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

  // Funktion der henter alle aktiedata og beregner kravene til opgaven
  async function fetchAndDisplayData() {
    const updatedSecurities = [];

    for (const s of securities) {
      const { price, change } = await fetchStockData(s.symbol);
      const value = s.shares * price; // Forventet værdi (krav 3)
      const gak = s.acquisitionTotal / s.shares; // Gennemsnitlig anskaffelseskurs (krav 2)
      const unrealized = value - s.acquisitionTotal; // Urealiseret gevinst/tab (krav 4)

      updatedSecurities.push({
        ...s,
        price,
        value,
        gak,
        unrealized,
        change
      });
    }

    // Samlet totaler for porteføljen (krav 5)
    const totalValue = updatedSecurities.reduce((sum, s) => sum + s.value, 0);
    const totalAcquisition = updatedSecurities.reduce((sum, s) => sum + s.acquisitionTotal, 0);
    const totalUnrealized = totalValue - totalAcquisition;

    // Vis total værdi (krav 5.2)
    document.getElementById("totalValueDisplay").textContent = `${totalValue.toFixed(2)} DKK`;

    // Tilføj ekstra visning for samlet anskaffelse og gevinst/tab (krav 5.1 og 5.3)
    const container = document.querySelector(".top-stats");
    const extraBox = document.createElement("div");
    extraBox.classList.add("box");
    extraBox.innerHTML = `
      <h3>Portfolio Summary</h3>
      <p>Acquisition: ${totalAcquisition.toFixed(2)} DKK</p>
      <p>Unrealized Gain/Loss: ${totalUnrealized.toFixed(2)} DKK</p>
    `;
    container.appendChild(extraBox);

    // Opdater tabel (krav 2-4)
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

    // Tegn cirkeldiagram over værdifordeling i porteføljen
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

  // Kør når siden er loadet
  await fetchAndDisplayData();
});



// Når man trykker på buy button så kommer man videre til buyStocks.html
function handleBuy() {
  window.location.href = '/buystocks'
};

// Når man trykker på buy button så kommer man videre til sellStocks.html
function handleSell() {
  window.location.href = '/sellstocks'
};
