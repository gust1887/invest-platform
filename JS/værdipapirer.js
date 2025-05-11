document.addEventListener("DOMContentLoaded", async () => {
  const portfolioId = sessionStorage.getItem("selectedPortfolioId");

  const name = sessionStorage.getItem("selectedPortfolioName");
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

    // Hent valuta fra sessionStorage 
    const currency = sessionStorage.getItem("accountCurrency") || "USD";


    securities.forEach(security => {
      const cached = getCachedPrice(security.ticker);
      const currentPrice = Number.isFinite(cached) ? cached : 100;
      const total = currentPrice * security.totalQuantity;
      const change24h = get24hChange(security.ticker);

      totalValue += total;

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

    // Opdaterer total portfølje værdi
    const totalVal = document.getElementById("totalValueDisplay");
    totalVal.innerText = `${totalValue.toFixed(2)} ${currency}`;
    // Grøn farve for positiv værdi
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

// Knapper til buy/sell → åbner nye sider
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
  const maxAge = 24 * 60 * 60 * 1000; // 24 timer

  if (Date.now() - parsed.timestamp < maxAge) {
    const prices = parsed.data;
    return prices && prices.length > 0
      ? prices[prices.length - 1].pris // sidste pris i listen
      : null;
  }

  return null;
}

// Kalder API og opdaterer alle aktiekurser i den valgte portefølje (fra API og gemmer i localStorage)
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

      // Gemmer ny kursdata i localStorage
      saveToCache(sec.ticker, data);
    }

    alert("Shares have been updated - Refreshing site");
    location.reload();
  } catch (err) {
    console.error("Error when refreshing shares:", err);
    alert("Could not update shares.");
  }
}

// Beregn 24 timers ændring baseret på localStorage data
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
  const formatted = `${pct > 0 ? '+' : ''}${pct.toFixed(2)}%`;
  return formatted;
}

