document.addEventListener("DOMContentLoaded", () => {
    // Dummy data
    const months = ["May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];
    const values = [190000, 195000, 200000, 210000, 205000, 215000, 220000, 225000, 230000, 220000, 222000, 224543];
  
    const topByValue = [
      { name: "Novo Nordisk", value: 53000 },
      { name: "Vestas", value: 46000 },
      { name: "Tesla", value: 42000 },
      { name: "Apple", value: 39000 },
      { name: "Microsoft", value: 33000 }
    ];
  
    const topByProfit = [
      { name: "Tesla", profit: 8200 },
      { name: "Apple", profit: 6500 },
      { name: "Novo Nordisk", profit: 6100 },
      { name: "Netflix", profit: 4200 },
      { name: "Vestas", profit: 3800 }
    ];
  
    // Chart
    const ctx = document.getElementById("yearChart").getContext("2d");
    new Chart(ctx, {
      type: "line",
      data: {
        labels: months,
        datasets: [{
          label: "Total Value (DKK)",
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
  
    // Fyld top 5 værdipapirer tabeller
    const valueTable = document.getElementById("topValueTable");
    const profitTable = document.getElementById("topProfitTable");
  
    topByValue.forEach(stock => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${stock.name}</td><td>${stock.value.toLocaleString()} DKK</td>`;
      valueTable.appendChild(row);
    });
  
    topByProfit.forEach(stock => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${stock.name}</td><td>${stock.profit.toLocaleString()} DKK</td>`;
      profitTable.appendChild(row);
    });
  });
  
