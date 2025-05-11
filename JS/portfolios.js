document.addEventListener("DOMContentLoaded", () => {



  const portfolioTableBody = document.getElementById("portfolioTableBody");

  // Kør ved page load
  getAndShowPortfolios();



  // Henter og viser porteføljer for den valgte konto
  async function getAndShowPortfolios() {
    const accountId = sessionStorage.getItem("selectedAccountId");

    if (!accountId) {
      console.warn("No account chosen – Cannot get portfolios");
      return;
    }

    try {
      const res = await fetch(`/api/portfolios/summary/${accountId}`);
      const portfolios = await res.json();

      // Ryd eksisterende tabelindhold
      portfolioTableBody.innerHTML = "";

      const currency = sessionStorage.getItem("accountCurrency") || "DKK";
      const totalValueEl = document.getElementById("totalValue");

      let samletVærdi = 0; // Akkumuleret værdi for alle porteføljer
      const labels = [];   // Navne til donut chart
      const values = [];   // Værdier til donut chart

      portfolios.forEach((p) => {
        samletVærdi += p.totalValue || 0;
        labels.push(p.portfolioName);
        values.push(p.totalValue || 0);

        const row = document.createElement("tr");

        // Opret klikbart link til portefølje
        const link = document.createElement("a");
        link.href = "#";
        link.textContent = p.portfolioName;
        link.classList.add("portfolio-link");

        // Når man klikker på porteføljen, gem ID og navn i sessionStorage
        link.addEventListener("click", function (e) {
          e.preventDefault();
          sessionStorage.setItem("selectedPortfolioId", p.id);
          sessionStorage.setItem("selectedPortfolioName", p.portfolioName);
          window.location.href = "vaerdipapirer.html";
        });

        // Sæt op celler til rækken
        const nameCell = document.createElement("td");
        nameCell.appendChild(link);

        const changeCell = document.createElement("td");
        changeCell.classList.add("green");
        changeCell.textContent = "+0.00%"; // Placeholder

        const dateCell = document.createElement("td");
        dateCell.textContent = p.lastTrade
          ? new Date(p.lastTrade).toLocaleString("da-DK")
          : "--/--/----";

        const valueCell = document.createElement("td");
        valueCell.textContent = p.totalValue
          ? `${p.totalValue.toFixed(2)} ${currency}`
          : `0 ${currency}`;

        // Tilføj alle celler til rækken
        row.appendChild(nameCell);
        row.appendChild(changeCell);
        row.appendChild(dateCell);
        row.appendChild(valueCell);

        // Tilføj rækken til tabellen
        portfolioTableBody.appendChild(row);
      });

      // Opdater feltet med samlet værdi i boksen
      totalValueEl.textContent = `${samletVærdi.toFixed(2)} ${currency}`;

      // Opdater donut-grafen med nye data
      setTimeout(() => {
        updateDonutChart(labels, values, currency);
      }, 100);
    } catch (err) {
      console.error("Fejl ved hentning af porteføljer:", err);
    }
  }





  // Tilføj portfølje funktionalitet
  const addPortfolioBtn = document.getElementById("addPortfolioBtn");
  const newPortfolioForm = document.getElementById("newPortfolioForm");
  const submitNewPortfolio = document.getElementById("submitNewPortfolio");

  addPortfolioBtn.addEventListener("click", function () {
    const isVisible = newPortfolioForm.style.display === "block";
    newPortfolioForm.style.display = isVisible ? "none" : "block";
  });

  submitNewPortfolio.addEventListener("click", async function () {
    const portfolioName = document.getElementById("portfolioName").value.trim();
    const accountId = sessionStorage.getItem("selectedAccountId");

    // Hvis brugeren ikke har valgt en konto i accounts.html, vis advarsel
    if (!accountId) {
      alert("Du skal vælge en konto først (via Accounts-siden).");
      return;
    }

    // Hvis begge felter er udfyldt...
    if (portfolioName) {
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
            <td class="green">+0.00%</td>
            <td>--/--/---- --:--</td>
            <td>0 DKK</td>
          `;
          portfolioTableBody.appendChild(newRow);

          // Ryd og skjul formularen
          newPortfolioForm.style.display = "none";
          document.getElementById("portfolioName").value = "";

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


  function updateDonutChart(labels, values, currency) {
    const ctx = document.getElementById("portfolioChart").getContext("2d");

    // Slet tidligere graf hvis den findes
    if (window.portfolioChart && typeof window.portfolioChart.destroy === "function") {
      window.portfolioChart.destroy();
    }

    window.portfolioChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: [
            "#ffc107", "#2196f3", "#4caf50", "#9c27b0", "#ff5722"
          ],
          borderWidth: 1
        }]
      },
      options: {
        plugins: {
          legend: {
            position: "right",
            labels: {
              color: "white"
            }
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return `${context.label}: ${context.raw.toFixed(2)} ${currency}`;
              }
            }
          }
        }
      }
    });
  }

});


