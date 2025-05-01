// Dummy-brugere (kan senere erstattes af databaseopslag)
const users = [ // En liste (array) med fiktive brugere og deres adgangskoder
    {
      username: 'testbruger', // Brugernavn
      password: 'tester1234'  // Tilhørende adgangskode
    },
    {
      username: 'admin',
      password: 'admin123'
    }
  ];
  
  // Loginfunktion
  document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault(); // Forhindrer at siden genindlæses ved formularens standard-handling
  
    const inputUsername = document.getElementById('username').value;
    const inputPassword = document.getElementById('password').value;
  
    // Valider adgangskodens længde og om den indeholder mindst ét tal
    const passwordIsValid = inputPassword.length >= 8 &&
                            inputPassword.length <= 20 &&
                            /\d/.test(inputPassword); // Tjekker om der er mindst ét tal
  
    if (!passwordIsValid) {
      document.getElementById('message').innerText = 'Adgangskoden skal være mellem 8 og 20 tegn og indeholde mindst ét tal.';
      return; // Stop funktionen her, hvis adgangskoden ikke er gyldig
    }
  
    // Søger i users-arrayet efter en bruger med matchende brugernavn og adgangskode
    const user = users.find(u => u.username === inputUsername && u.password === inputPassword);
  
    if (user) {
      sessionStorage.setItem('loggedInUser', inputUsername);
      document.getElementById('message').innerText = 'Du er nu logget ind.';
      // window.location.href = "dashboard.html";
    } else {
      document.getElementById('message').innerText = 'Forkert brugernavn eller adgangskode.';
    }
  });
  
    // Skift adgangskode-funktion
  // Lyt efter submit på skift adgangskode-formular
  document.getElementById('changePasswordForm').addEventListener('submit', function (e) {
    e.preventDefault(); // Forhindrer standard handling (side reload)
  
    // Henter brugernavn på den aktuelle bruger fra sessionStorage
    const loggedInUser = sessionStorage.getItem('loggedInUser');
  
    // Tjekker om der er en bruger logget ind
    if (!loggedInUser) {
      document.getElementById('changeMessage').innerText = 'Du skal være logget ind for at ændre adgangskode.';
      return;
    }
  
    // Henter gamle og nye adgangskoder fra formularfelterne
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
  
    // Validerer den nye adgangskode: 8-20 tegn og mindst ét tal
    const passwordIsValid = newPassword.length >= 8 &&
                            newPassword.length <= 20 &&
                            /\d/.test(newPassword); // Tjekker om adgangskoden indeholder mindst ét tal
  
    if (!passwordIsValid) {
      document.getElementById('changeMessage').innerText =
        'Ny adgangskode skal være 8-20 tegn og indeholde mindst ét tal.';
      return;
    }
  
    // Finder brugeren i arrayet og tjekker om nuværende adgangskode er korrekt
    const user = users.find(u => u.username === loggedInUser && u.password === oldPassword);
  
    if (user) {
      // Opdaterer adgangskoden
      user.password = newPassword;
      document.getElementById('changeMessage').innerText = 'Adgangskoden er opdateret.';
    } else {
      // Fejl hvis den gamle adgangskode ikke matcher
      document.getElementById('changeMessage').innerText = 'Nuværende adgangskode er forkert.';
    }
  });

  /*Ændringer i html login
  <body>
  <!-- Login -->
  <form id="loginForm" method="POST">
    <div class="textbox">
      <input type="text" id="username" name="username" placeholder="Brugernavn" required>
    </div>
    <div class="textbox">
      <input type="password" id="password" name="password" placeholder="Adgangskode" required>
    </div>
    <input type="submit" value="Log ind" class="btn-login">
  </form>
  <div id="message"></div>

  <!-- Skift adgangskode -->
  <div class="form-box">
    <h2>Skift adgangskode</h2>
    <form id="changePasswordForm">
      <div class="textbox">
        <input type="password" id="oldPassword" placeholder="Nuværende adgangskode" required>
      </div>
      <div class="textbox">
        <input type="password" id="newPassword" placeholder="Ny adgangskode" required>
      </div>
      <input type="submit" value="Skift adgangskode" class="btn-login">
    </form>
    <div id="changeMessage"></div>
  </div>

  <!-- Script -->
  <script src="js/login.js"></script>
</body>*/
