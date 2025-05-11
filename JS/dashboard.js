document.addEventListener("DOMContentLoaded", async () => {
  const accountId = sessionStorage.getItem("selectedAccountId");
  const currency = sessionStorage.getItem("accountCurrency") || "DKK";

  if (!accountId) {
    alert("No account selected");
    return;
  }

  try {
    const res = await fetch(`/api/portfolios/summary/${accountId}`);
    const portfolios = await res.json();

    // Beregn total værdi
    const total = portfolios.reduce((sum, p) => sum + (p.totalValue || 0), 0);
    document.getElementById("totalValue").innerText = `${total.toFixed(2)} ${currency}`;

    // Sorter og vis top 5 porteføljer efter værdi
    const sortedByValue = [...portfolios].sort((a, b) => b.totalValue - a.totalValue).slice(0, 5);
    const valueTable = document.getElementById("topValueTable");
    valueTable.innerHTML = "";
    sortedByValue.forEach(p => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${p.portfolioName}</td><td>${(p.totalValue || 0).toFixed(2)} ${currency}</td>`;
      valueTable.appendChild(row);
    });

    // Realiseret gevinst
    const realizedRes = await fetch(`/api/portfolios/realized/${accountId}`);
    const realizedData = await realizedRes.json();
    document.getElementById("realizedGain").innerText = `${realizedData.total.toFixed(2)} ${currency}`;

    // Urealiseret gevinst
    const unrealizedRes = await fetch(`/api/portfolios/unrealized/${accountId}`);
    const unrealizedData = await unrealizedRes.json();
    document.getElementById("unrealizedGain").innerText = `${unrealizedData.total.toFixed(2)} ${currency}`;


    // Dummy grafdata for nu
    const months = ["May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];
    const values = new Array(11).fill(0).concat(total);

    const ctx = document.getElementById("yearChart").getContext("2d");
    new Chart(ctx, {
      type: "line",
      data: {
        labels: months,
        datasets: [{
          label: `Total Value (${currency})`,
          data: values,
          fill: true,
          backgroundColor: "rgba(33, 150, 243, 0.2)",
          borderColor: "#2196f3",
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 5
        }]
      },
      options: {
        scales: {
          y: {
            ticks: { color: "#ffffff" },
            grid: { color: "rgba(255,255,255,0.1)" }
          },
          x: {
            ticks: { color: "#ffffff" },
            grid: { color: "rgba(255,255,255,0.1)" }
          }
        },
        plugins: {
          legend: { labels: { color: "#ffffff" } }
        }
      }
    });
  } catch (err) {
    console.error("Error fetching portfolio data for dashboard:", err);
    alert("Could not load dashboard data");
  }
});
