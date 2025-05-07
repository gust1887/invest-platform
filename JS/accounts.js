document.addEventListener('DOMContentLoaded', async () => {
    // Hent brugerens ID fra sessionStorage (forudsætter at man er logget ind)
    const userId = sessionStorage.getItem('userId');
    if (!userId) return alert("Du skal være logget ind for at se dine konti.");

    try {
        // Hent konti fra backend til den aktuelle bruger
        const res = await fetch(`/api/accounts/${userId}`);
        const accounts = await res.json();

        // Find containeren hvor konti skal vises
        const mainContent = document.querySelector('.main-content');
        mainContent.innerHTML = ''; // Fjern evt. placeholder-indhold

        // Gennemgå alle konti og vis dem én for én
        accounts.forEach(account => {
            // Opret en boks til kontoen
            const accountBox = document.createElement('div');
            accountBox.className = 'account-box';

            // Indsæt HTML-indhold til kontoen
            accountBox.innerHTML = `
              <div class="account-left">
                <div class="icon">👤</div>
                <div class="info">
                  <p><strong>Account:</strong> ${account.accountName}</p>
                  <p><strong>Currency:</strong> ${account.currency}</p>
                  <p><strong>Balance:</strong> ${Number(account.balance).toLocaleString('da-DK', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
              <div class="account-actions">
                <button class="transfer-btn">Transfer Money</button>
                <button class="close-btn">${account.is_closed ? 'Reopen Account' : 'Close Account'}</button>
              </div>
            `;

            // Tilføj boksen til siden
            mainContent.appendChild(accountBox);

            // Hent knapperne fra boksen
            const transferBtn = accountBox.querySelector('.transfer-btn');
            const closeBtn = accountBox.querySelector('.close-btn');

            // Funktion: Tilføj penge til kontoen
            transferBtn.addEventListener('click', async () => {
                if (account.is_closed) {
                    return alert("Denne konto er lukket og kan ikke tilføjes penge.");
                }

                const amount = prompt("Indtast beløb der skal tilføjes:");
                if (!amount || isNaN(amount)) return;

                // Send PUT-request til backend for at opdatere balancen
                const res = await fetch('/api/accounts/addbalance', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        accountId: account.id,
                        amount: parseFloat(amount)
                    })
                });

                const result = await res.json();
                if (res.ok) {
                    alert('Penge tilføjet');
                    location.reload(); // Opdater siden for at vise ny balance
                } else {
                    alert(result.error || 'Fejl ved tilføjelse');
                }
            });

            // Funktion: Luk eller genåbn konto
            closeBtn.addEventListener('click', async () => {
                const confirmMsg = account.is_closed
                    ? 'Vil du genåbne kontoen?'
                    : 'Er du sikker på, at du vil lukke kontoen?';

                if (confirm(confirmMsg)) {
                    const res = await fetch(`/api/accounts/${account.id}/status`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ is_closed: account.is_closed ? 0 : 1 })
                    });

                    if (res.ok) {
                        alert(account.is_closed ? 'Konto genåbnet' : 'Konto lukket');
                        location.reload();
                    } else {
                        alert('Fejl ved opdatering af konto');
                    }
                }
            });
        });

        //  Knappen til at oprette en ny konto
        const addBtn = document.createElement('button');
        addBtn.className = 'add-account-btn';
        addBtn.textContent = '+ Tilføj konto';
        addBtn.onclick = () => window.location.href = '/opretkonto';
        mainContent.appendChild(addBtn);

    } catch (err) {
        console.error("Fejl ved hentning af konti:", err);
    }
});
