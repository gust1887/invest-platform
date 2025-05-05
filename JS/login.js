
// LOGIN-FUNKTION
document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault(); // Forhindrer side reload

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  const passwordIsValid = password.length >= 8 &&
    password.length <= 20 &&
    /\d/.test(password); // Tjek mindst ét tal

  if (!passwordIsValid) {
    document.getElementById('message').innerText =
      'Adgangskoden skal være 8-20 tegn og indeholde mindst ét tal.';
    return;
  }

  try {
    const response = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
      sessionStorage.setItem('loggedInUser', username);
      sessionStorage.setItem('userId', data.userId); 
      document.getElementById('message').innerText = data.message || 'Login succesfuldt.';
      window.location.href = '/dashboard'; // Send brugeren videre
    } else {
      document.getElementById('message').innerText = data.error || 'Login mislykkedes.';
    }
  } catch (err) {
    console.error('Fejl i login:', err);
    document.getElementById('message').innerText = 'Serverfejl under login.';
  }
});

