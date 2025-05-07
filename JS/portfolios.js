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

  submitNewPortfolio.addEventListener("click", async function () {
    const portfolioName = document.getElementById("portfolioName").value.trim();
    const bankAccount = document.getElementById("bankAccount").value.trim();
    const accountId = sessionStorage.getItem("selectedAccountId");

    // Hvis brugeren ikke har valgt en konto i accounts.html, vis advarsel
    if (!accountId) {
      alert("Du skal vælge en konto først (via Accounts-siden).");
      return;
    }

    // Hvis begge felter er udfyldt...
    if (portfolioName && bankAccount) {
      try {
        // Send POST-request til serveren for at oprette porteføljen i databasen
        const res = await fetch('/api/portfolios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            account_id: parseInt(accountId), // fra sessionStorage
            portfolioName: portfolioName
          })
        });

        const result = await res.json();
        // Hvis oprettelsen lykkes (status 201 fra serveren)
        if (res.ok) {
          // Tilføj porteføljen direkte til tabellen i brugerfladen
          const newRow = document.createElement("tr");
          newRow.innerHTML = `
            <td><a href="vaerdipapirer.html?portfolio=${encodeURIComponent(portfolioName)}">${portfolioName}</a></td>
            <td>${bankAccount}</td>
            <td class="green">+0.00%</td>
            <td>--/--/---- --:--</td>
            <td>0 DKK</td>
          `;
          portfolioTableBody.appendChild(newRow);

          // Ryd og skjul formularen
          newPortfolioForm.style.display = "none";
          document.getElementById("portfolioName").value = "";
          document.getElementById("bankAccount").value = "";

          // Vis en bekræftelse
          alert("Portefølje oprettet!");
        } else {
          // Hvis serveren returnerer fejl
          alert(result.error || "Fejl ved oprettelse.");
        }
      } catch (err) {
        // Hvis fetch fejler (fx serveren er nede)
        console.error(err);
        alert("Serverfejl.");
      }
    } else {
      // Hvis brugeren ikke har udfyldt begge felter
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