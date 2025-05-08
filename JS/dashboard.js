document.addEventListener("DOMContentLoaded", async () => {
    const accountId = sessionStorage.getItem("selectedAccountId");
    if (!accountId) return;
  
    try {
      const res = await fetch(`/api/portfolios/konto/${accountId}`);
      const portfolios = await res.json();
  
      let totalValue = 0;
      let realizedProfit = 0;
      let unrealizedProfit = 0;
  
      const valueList = document.getElementById("valueList");
      const profitList = document.getElementById("profitList");
  
      valueList.innerHTML = "";
      profitList.innerHTML = "";
  
      let securities = [];
      portfolios.forEach((portfolio) => {
        if (portfolio.securities && Array.isArray(portfolio.securities)) {
          securities = securities.concat(portfolio.securities);
        }
        totalValue += portfolio.totalValue || 0;
        realizedProfit += portfolio.realizedGain || 0;
        unrealizedProfit += portfolio.unrealizedGain || 0;
      });
  
      // Top 5 by value
      const topByValue = [...securities].sort((a, b) => (b.value || 0) - (a.value || 0)).slice(0, 5);
      topByValue.forEach((sec) => {
        const li = document.createElement("li");
        li.textContent = `${sec.name || "Unnamed"}: ${sec.value?.toLocaleString() || 0} DKK`;
        valueList.appendChild(li);
      });
  
      // Top 5 by profit
      const topByProfit = [...securities].sort((a, b) => (b.profit || 0) - (a.profit || 0)).slice(0, 5);
      topByProfit.forEach((sec) => {
        const li = document.createElement("li");
        li.textContent = `${sec.name || "Unnamed"}: ${sec.profit?.toLocaleString() || 0} DKK`;
        profitList.appendChild(li);
      });
  
      // Opdater kort
      document.querySelector("#totalValueCard .card-value").textContent = `${totalValue.toLocaleString()} DKK`;
      document.querySelector("#realizedProfitCard .card-value").textContent = `${realizedProfit.toLocaleString()} DKK`;
      document.querySelector("#unrealizedProfitCard .card-value").textContent = `${unrealizedProfit.toLocaleString()} DKK`;
  
      // Graf
      const canvas = document.getElementById("performanceChart");
      if (!canvas) {
        console.error("Canvas element with ID 'performanceChart' not found.");
        return;
      }
  
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.error("Could not get canvas context.");
        return;
      }
  
      console.log("Initializing Chart.js on:", ctx);
  
      new Chart(ctx, {
        type: "line",
        data: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May"],
          datasets: [{
            label: "Portfolio Value",
            data: [100000, 120000, 110000, 130000, 125000],
            borderColor: "#4caf50",
            backgroundColor: "rgba(76, 175, 80, 0.2)",
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          scales: {
            x: { ticks: { color: "#ccc" } },
            y: { ticks: { color: "#ccc" } }
          },
          plugins: {
            legend: { labels: { color: "#fff" } }
          }
        }
      });
  
    } catch (err) {
      console.error("Dashboard data fetch failed:", err);
    }
  });
  
