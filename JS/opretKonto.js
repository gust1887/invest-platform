// Lytter på submit-event på opret konto-formularen
document.getElementById('signupForm').addEventListener('submit', async function (e) {
  e.preventDefault(); // Forhindrer standardformularens opførsel (reload)

  // Henter input-værdier fra formularen
  const accountName = document.getElementById('accountName').value;
  const currency = document.getElementById('currency').value;

  // Tjekker om brugeren er logget ind (userId fra sessionStorage)
  const userId = sessionStorage.getItem('userId');
  
  if (!userId) {
    document.getElementById('signupMessage').innerText = 'Du skal være logget ind for at oprette en konto.';
    return; // Stop videre udførelse
  }

  // Forsøger at oprette konto via API
  try {
    const response = await fetch('/api/accounts/opretkonto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: parseInt(userId), // UserId som heltal
        accountName, // Kontoens navn
        balance: 0, // Initial balance
        currency // Valuta valgt af bruger
      })
    });

    const result = await response.json();

    // Hvis oprettelse lykkedes, send videre til kontosiden
    if (response.ok) {
      window.location.href = '/accounts'; // Omdirigering
    } else {
      document.getElementById('signupMessage').innerText = result.error || 'Fejl ved oprettelse.';
    }
  } catch (error) {
    // Fejl ved API-kald eller netværk
    console.error('Fejl ved opretkonto fetch:', error);
    document.getElementById('signupMessage').innerText = 'Serverfejl ved oprettelse.';
  }
});
