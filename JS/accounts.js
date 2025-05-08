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

            const selectedId = sessionStorage.getItem('selectedAccountId');
            if (selectedId == account.id) {
                accountBox.classList.add('selected'); // CSS-klassen 'selected'
            }


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
              <button class="select-btn">Select Account</button>
              <button class="transfer-btn">Transfer Money</button>
              <button class="close-btn">${account.is_closed ? 'Reopen Account' : 'Close Account'}</button>
            </div>
          `;

            // Tilføj boksen til siden
            mainContent.appendChild(accountBox);

            // Hent knapperne fra boksen
            const transferBtn = accountBox.querySelector('.transfer-btn');
            const closeBtn = accountBox.querySelector('.close-btn');
            const selectBtn = accountBox.querySelector('.select-btn');

            // Funktion: Vælg en konto
            selectBtn.addEventListener('click', () => {
                if (account.is_closed) {
                    return alert("You cannot choose a closed account");
                }

                sessionStorage.setItem('selectedAccountId', account.id);
                alert(`Konto "${account.accountName}" er valgt.`);
                location.reload(); // Genindlæs for at vise markering
            });

            // Funktion: Tilføj penge til kontoen
            transferBtn.addEventListener('click', async () => {
                if (account.is_closed) {
                    return alert("This account is closed and money could not be transferred.");
                }

                const amount = prompt("Indtast beløb der skal overføres:");
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
                    alert('Money transfered');
                    location.reload(); // Opdater siden for at vise ny balance
                } else {
                    alert(result.error || 'Error during transfer');
                }
            });

            // Funktion: Luk eller genåbn konto
            closeBtn.addEventListener('click', async () => {
                const confirmMsg = account.is_closed
                    ? 'Do you want to reopen the account?'
                    : 'Are you sure you want to close this account?';

                if (confirm(confirmMsg)) {
                    const res = await fetch(`/api/accounts/${account.id}/status`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ is_closed: account.is_closed ? 0 : 1 })
                    });

                    if (res.ok) {
                        alert(account.is_closed ? 'Account reopened' : 'Account closed');
                        location.reload();
                    } else {
                        alert('Error when updating account');
                    }
                }
            });
        });

        //  Knappen til at oprette en ny konto
        const addBtn = document.createElement('button');
        addBtn.className = 'add-account-btn';
        addBtn.textContent = '+ Add account';
        addBtn.onclick = () => window.location.href = '/opretkonto';
        mainContent.appendChild(addBtn);

    } catch (err) {
        console.error("Error when loading account:", err);
    }
});
