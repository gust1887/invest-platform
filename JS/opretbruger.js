
// Lyt efter submit på opret-bruger formular
document.getElementById('signupForm').addEventListener('submit', async function (e) {
  e.preventDefault(); // Forhindrer side reload

  // Hent inputværdier
  const newUsername = document.getElementById('signupUsername').value;
  const newPassword = document.getElementById('signupPassword').value;
  const newEmail = document.getElementById('signupEmail').value;

  // Tjek adgangskodekrav
  const passwordIsValid = newPassword.length >= 8 &&
                          newPassword.length <= 20 &&
                          /\d/.test(newPassword); // Min. ét tal

  if (!passwordIsValid) {
    document.getElementById('signupMessage').innerText =
      'Adgangskoden skal være mellem 8-20 tegn og indeholde mindst ét tal.';
    return;
  }

  // Tjek om e-mail er gyldig
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail);
  if (!emailIsValid) {
    document.getElementById('signupMessage').innerText = 'Ugyldig e-mailadresse.';
    return;
  }

  
  // Tilføj bruger
  try {
    console.log("Sender til server:", newUsername, newPassword, newEmail);
    const response = await fetch('/api/users/opretbruger', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: newUsername,
        password: newPassword,
        email: newEmail
      })
      
    });

    const data = await response.json();

    if (response.ok) {
      document.getElementById('signupMessage').innerText = 'Bruger oprettet!';
      window.location.href = '/login'; // Send brugeren videre
    } else {
      document.getElementById('signupMessage').innerText = data.error || 'Fejl ved oprettelse.';
    }
  } catch (err) {
    console.error(err);
    document.getElementById('signupMessage').innerText = 'Netværksfejl.';
  }
});

