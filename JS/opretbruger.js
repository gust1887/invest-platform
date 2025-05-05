// Dummy users-array til frontend-validering (kun til test)
const users = [
  { username: 'testbruger', password: 'tester1234', email: 'test@example.com' },
  { username: 'admin', password: 'admin123', email: 'admin@example.com' }
];

// Lyt efter submit
document.getElementById('signupForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const username = document.getElementById('signupUsername').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;

  const messageElement = document.getElementById('signupMessage');

  // Valider adgangskode
  const passwordIsValid = password.length >= 8 &&
                          password.length <= 20 &&
                          /\d/.test(password); // mindst ét tal

  if (!passwordIsValid) {
    messageElement.textContent = 'Adgangskoden skal være mellem 8-20 tegn og indeholde mindst ét tal.';
    return;
  }

  // Valider e-mail
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailIsValid) {
    messageElement.textContent = 'Ugyldig e-mailadresse.';
    return;
  }

  // Tjek om brugernavn allerede findes (lokalt)
  const existingUser = users.find(u => u.username === username);
  if (existingUser) {
    messageElement.textContent = 'Brugernavn er allerede i brug.';
    return;
  }

  // Send til backend
  try {
    const response = await fetch('/api/users/opretbruger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email })
    });

    const result = await response.json();

    if (response.ok) {
      messageElement.style.color = 'green';
      messageElement.textContent = 'Bruger oprettet!';
      // Kan evt. omdirigere efter 2 sekunder:
      // setTimeout(() => window.location.href = 'login.html', 2000);
    } else {
      messageElement.textContent = result.error || 'Fejl ved oprettelse.';
    }
  } catch (err) {
    console.error(err);
    messageElement.textContent = 'Netværksfejl. Prøv igen senere.';
  }
});
