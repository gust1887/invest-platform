// Dummy data updater
document.getElementById("totalValue").textContent = "224.543 DKK";
document.getElementById("change24h").textContent = "+1.4%";
document.getElementById("change7d").textContent = "-1.7%";
document.getElementById("change30d").textContent = "+2.4%";

// Donut chart
const ctx = document.getElementById("portfolioChart").getContext("2d");
new Chart(ctx, {
  type: "doughnut",
  data: {
    labels: ["Growth Tech", "Tech Leaders", "ETF", "Space & Defence", "E-com"],
    datasets: [{
      data: [35, 12, 24, 14, 15],
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

// Opret ny portefølje funktionalitet
const addPortfolioBtn = document.getElementById("addPortfolioBtn");
const newPortfolioForm = document.getElementById("newPortfolioForm");
const submitNewPortfolio = document.getElementById("submitNewPortfolio");
const portfolioTableBody = document.getElementById("portfolioTableBody");

addPortfolioBtn.addEventListener("click", function() {
  newPortfolioForm.style.display = "block";  // Vis formularen
});

submitNewPortfolio.addEventListener("click", function() {
  const portfolioName = document.getElementById("portfolioName").value;
  const bankAccount = document.getElementById("bankAccount").value;

  if (portfolioName && bankAccount) {
    const newRow = document.createElement("tr");
    newRow.innerHTML = `
      <td>${portfolioName}</td>
      <td>${bankAccount}</td>
      <td class="green">+0.00%</td>
      <td>--/--/---- --:--</td>
      <td>0 DKK</td>
    `;
    portfolioTableBody.appendChild(newRow);

    // Skjul formularen igen og ryd inputfelterne
    newPortfolioForm.style.display = "none";
    document.getElementById("portfolioName").value = "";
    document.getElementById("bankAccount").value = "";
  } else {
    alert("Udfyld venligst alle felter.");
  }
});


//Skal sættes op med SQL og ALPA API for at få reelle tal ind. 