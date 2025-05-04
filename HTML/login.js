
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

// SKIFT ADGANGSKODE-FUNKTION (kun hvis formularen findes på siden)
const changePasswordForm = document.getElementById('changePasswordForm');

if (changePasswordForm) {
  changePasswordForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const loggedInUser = sessionStorage.getItem('loggedInUser');
    if (!loggedInUser) {
      document.getElementById('changeMessage').innerText =
        'Du skal være logget ind for at ændre adgangskode.';
      return;
    }

    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;

    const passwordIsValid = newPassword.length >= 8 &&
                            newPassword.length <= 20 &&
                            /\d/.test(newPassword);

    if (!passwordIsValid) {
      document.getElementById('changeMessage').innerText =
        'Ny adgangskode skal være 8-20 tegn og indeholde mindst ét tal.';
      return;
    }

    try {
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loggedInUser,
          oldPassword,
          newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        document.getElementById('changeMessage').innerText = data.message || 'Adgangskode opdateret.';
      } else {
        document.getElementById('changeMessage').innerText = data.error || 'Fejl ved opdatering.';
      }
    } catch (err) {
      console.error('Fejl i skift adgangskode:', err);
      document.getElementById('changeMessage').innerText = 'Serverfejl under opdatering.';
    }
  });
}

