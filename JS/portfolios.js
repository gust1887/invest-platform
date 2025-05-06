document.addEventListener("DOMContentLoaded", () => {
  // Donut chart
  const ctx = document.getElementById("portfolioChart").getContext("2d");
  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Growth Tech", "Tech Leaders", "ETF", "Space & Defence", "E-com"],
      datasets: [{
        data: [35201, 11000, 7584, 6842, 6500],
        backgroundColor: [
          "#ffc107", "#2196f3", "#4caf50", "#9c27b0", "#ff5722"
        ],
        borderWidth: 1
      }]
    },
    options: {
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: 'white'
          }
        }
      }
    }
  });

  // Add portfolio functionality
  const addPortfolioBtn = document.getElementById("addPortfolioBtn");
  const newPortfolioForm = document.getElementById("newPortfolioForm");
  const submitNewPortfolio = document.getElementById("submitNewPortfolio");
  const portfolioTableBody = document.getElementById("portfolioTableBody");

  addPortfolioBtn.addEventListener("click", function () {
    const isVisible = newPortfolioForm.style.display === "block";
    newPortfolioForm.style.display = isVisible ? "none" : "block";
  });

  submitNewPortfolio.addEventListener("click", function () {
    const portfolioName = document.getElementById("portfolioName").value.trim();
    const bankAccount = document.getElementById("bankAccount").value.trim();

    if (portfolioName && bankAccount) {
      const newRow = document.createElement("tr");
      newRow.innerHTML = `
        <td><a href="vaerdipapirer.html?portfolio=${encodeURIComponent(portfolioName)}">${portfolioName}</a></td>
        <td>${bankAccount}</td>
        <td class="green">+0.00%</td>
        <td>--/--/---- --:--</td>
        <td>0 DKK</td>
      `;
      portfolioTableBody.appendChild(newRow);

      newPortfolioForm.style.display = "none";
      document.getElementById("portfolioName").value = "";
      document.getElementById("bankAccount").value = "";
    } else {
      alert("Udfyld venligst alle felter.");
    }
  });

  // Make existing names clickable
  const rows = portfolioTableBody.getElementsByTagName("tr");
  for (let row of rows) {
    const cell = row.cells[0];
    const name = cell.textContent.trim();

    const link = document.createElement("a");
    link.href = `vaerdipapirer.html?portfolio=${encodeURIComponent(name)}`;
    link.textContent = name;
    link.style.textDecoration = "none";
    link.style.color = "inherit";

    cell.textContent = "";
    cell.appendChild(link);
  }
});




//Skal sættes op med SQL og ALPA API for at få reelle tal ind. 