// Fortsæt fra tidligere users-array
const users = [
    { username: 'testbruger', password: 'tester1234', email: 'test@example.com' },
    { username: 'admin', password: 'admin123', email: 'admin@example.com' }
  ];
  
  // Lyt efter submit på opret-bruger formular
  document.getElementById('signupForm').addEventListener('submit', function (e) {
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
  
    // Tjek om brugernavnet allerede findes
    const existingUser = users.find(u => u.username === newUsername);
    if (existingUser) {
      document.getElementById('signupMessage').innerText = 'Brugernavn er allerede i brug.';
      return;
    }
  
    // Tilføj bruger
    users.push({
      username: newUsername,
      password: newPassword,
      email: newEmail
    });
  
    document.getElementById('signupMessage').innerText = 'Bruger oprettet!';
    // Du kan evt. omdirigere: window.location.href = 'login.html';
  });
  
