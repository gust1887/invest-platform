document.addEventListener("DOMContentLoaded", async () => {
  // Henter det valgte portefølje-ID fra sessionStorage
  const portfolioId = sessionStorage.getItem("selectedPortfolioId");
  const name = sessionStorage.getItem("selectedPortfolioName");

  // Overskrift → navn hvis valgt
  document.getElementById("portfolioHeading").innerText = name ? `Securities in ${name}` : "Securities Overview";

  if (!portfolioId) {
    alert("No portfolio chosen.");
    return;
  }

  try {
    const response = await fetch(`/api/portfolios/${portfolioId}/securities`);
    const securities = await response.json();

    const tbody = document.getElementById("securitiesTableBody");
    tbody.innerHTML = "";

    const labels = [];
    const chartData = [];
    let totalValue = 0;

    // Standardvaluta hvis ikke angivet
    const currency = sessionStorage.getItem("accountCurrency") || "USD";

    securities.forEach(security => {
      const cached = getCachedPrice(security.ticker);
      // Bruger cached pris hvis tilgængelig, ellers fallback til dummy-pris 100
      const currentPrice = Number.isFinite(cached) ? cached : 100;
      const total = currentPrice * security.totalQuantity;
      // Henter 24-timers kursændring fra localStorage
      const change24h = get24hChange(security.ticker);

      totalValue += total;

      // Indsætter række i tabellen
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${security.securitiesName}</td>
        <td>${security.ticker}</td>
        <td>${security.totalQuantity}</td>
        <td>${currentPrice.toFixed(2)} ${currency}</td>
        <td>${total.toFixed(2)} ${currency}</td>
        <td>${change24h}</td>
      `;
      tbody.appendChild(row);

      labels.push(security.ticker);
      chartData.push(total);
    });

    // Vis samlet værdi og farve
    const totalVal = document.getElementById("totalValueDisplay");
    totalVal.innerText = `${totalValue.toFixed(2)} ${currency}`;
    totalVal.style.color = totalValue > 0 ? "#4caf50" : "white";

    

    // Tegn donut chart
    const ctx = document.getElementById("securitiesChart").getContext("2d");
    new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [{
          data: chartData,
          backgroundColor: [
            "#4caf50", "#2196f3", "#ff9800", "#e91e63", "#9c27b0", "#ffc107"
          ]
        }]
      },
      options: {
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: 'white' }
          }
        }
      }
    });

  } catch (err) {
    console.error("Fejl ved hentning af værdipapirer:", err);
  }
});

// Køb/solgt knapper → nye sider
function handleBuy() {
  window.location.href = "buystocks.html";
}
function handleSell() {
  window.location.href = "sellstocks.html";
}


function getCachedPrice(symbol) {
  const raw = localStorage.getItem(`stockData-${symbol}`);
  if (!raw) return null;

  const parsed = JSON.parse(raw);
  const maxAge = 24 * 60 * 60 * 1000;

  if (Date.now() - parsed.timestamp < maxAge) {
    const prices = parsed.data;
    return prices && prices.length > 0
      ? prices[prices.length - 1].pris
      : null;
  }

  return null;
}

// Henter aktiekurser igen og opdaterer localStorage
async function opdaterAlleKurser() {
  const portfolioId = sessionStorage.getItem("selectedPortfolioId");
  if (!portfolioId) {
    alert("No portfolio selected");
    return;
  }

  try {
    const res = await fetch(`/api/portfolios/${portfolioId}/securities`);
    const securities = await res.json();

    for (const sec of securities) {
      const response = await fetch(`/api/${sec.ticker}`);
      const data = await response.json();
      saveToCache(sec.ticker, data);
    }

    alert("Shares have been updated - Refreshing site");
    location.reload();
  } catch (err) {
    console.error("Error when refreshing shares:", err);
    alert("Could not update shares.");
  }
}

// Udregn 24 timers ændring i procent
const get24hChange = symbol => {
  const raw = localStorage.getItem(`stockData-${symbol}`);
  if (!raw) return "0.00%";

  const parsed = JSON.parse(raw);
  const prices = parsed.data;
  if (!prices || prices.length < 2) return "0.00%";

  const current = prices[prices.length - 1].pris;
  const yesterday = prices[prices.length - 2]?.pris;
  if (!current || !yesterday || yesterday === 0) return "0.00%";

  const diff = current - yesterday;
  const pct = (diff / yesterday) * 100;
  return `${pct > 0 ? '+' : ''}${pct.toFixed(2)}%`;
};

