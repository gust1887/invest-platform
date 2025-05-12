// Login-funktionen
document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault(); // Forhindrer side reload

  // Henter brugerens input fra formularen
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  //Valider adgnagskode
  const passwordIsValid = password.length >= 8 &&
    password.length <= 20 &&
    /\d/.test(password); // Tjek mindst ét tal

  //Hvis adgangskoden er ugyldig: 
  if (!passwordIsValid) {
    document.getElementById('message').innerText =
      'Adgangskoden skal være 8-20 tegn og indeholde mindst ét tal.';
    return;
  }

  try {
    // Sender login-data til serveren via en POST-request
    const response = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, // Fortæller vi snede json
      body: JSON.stringify({ username, password }) // Konverterer til json format
    });

    const data = await response.json();

    if (response.ok) {
      // Gemmer brugernavn og bruger-ID i sessionStorage til senere brug
      sessionStorage.setItem('loggedInUser', username);
      sessionStorage.setItem('userId', data.userId); 
      // Viser succesbesked og videresender brugeren til accounts
      document.getElementById('message').innerText = data.message || 'Login succesfuldt.';
      window.location.href = '/accounts'; // Send brugeren videre
    } else {
      // Hvis login fejler
      document.getElementById('message').innerText = data.error || 'Login mislykkedes.';
    }
  } catch (err) {
    // Hvis der opstår en fejl under fetch, vis en generel fejlbesked
    console.error('Fejl i login:', err);
    document.getElementById('message').innerText = 'Serverfejl under login.';
  }
});

