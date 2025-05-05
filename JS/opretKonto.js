document.getElementById('signupForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    console.log("userId i sessionStorage:", sessionStorage.getItem('userId'));

    const accountName = document.getElementById('accountName').value;
    const currency = document.getElementById('currency').value;
  
    const userId = sessionStorage.getItem('userId'); // antag logget ind bruger
  
    if (!userId) {
      document.getElementById('signupMessage').innerText = 'Du skal være logget ind for at oprette en konto.';
      return;
    }
  
    try {
      const response = await fetch('/api/accounts/opretkonto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: parseInt(userId),
          name,
          balance: 0,
          currency
        })
      });
  
      const result = await response.json();
  
        if (response.ok) {
            window.location.href = '/accounts';
          } else {
        document.getElementById('signupMessage').innerText = result.error || 'Fejl ved oprettelse.';
      }
    } catch (error) {
      console.error('Fejl ved opretkonto fetch:', error);
      document.getElementById('signupMessage').innerText = 'Serverfejl ved oprettelse.';
    }
  });
  