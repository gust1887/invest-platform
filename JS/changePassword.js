// Henter formularen med id="changePasswordForm" fra DOM'en
const changePasswordForm = document.getElementById('changePasswordForm');

// Tjekker om formularen eksisterer på siden, før der tilføjes eventlistener
if (changePasswordForm) {
  
  // Lytter efter 'submit'-event, når brugeren forsøger at ændre adgangskode
  changePasswordForm.addEventListener('submit', async function (e) {
    e.preventDefault(); // Forhindrer siden i at reloade ved formular-submit

    // Henter og trimmer værdier fra inputfelterne
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const newPassword = document.getElementById('newPassword').value;

    // Elementet hvor feedback (fejl/succes) vises til brugeren
    const messageEl = document.getElementById('changeMessage');

    // Validerer den nye adgangskode: 8-20 tegn og mindst et tal
    const passwordIsValid = newPassword.length >= 8 &&
                            newPassword.length <= 20 &&
                            /\d/.test(newPassword); 
    
    // Hvis adgangskoden ikke opfylder kravene, vises fejlbesked og funktionen afsluttes
    if (!passwordIsValid) {
      messageEl.textContent = 'Ny adgangskode skal være 8-20 tegn og indeholde mindst ét tal.';
      return;
    }

    try {
      // Sender POST-request til backend-API for at opdatere adgangskoden
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, newPassword }) // sender data som JSON
      });

      const result = await response.json(); // Fortolker svaret som JSON

      if (response.ok) {
        // Hvis opdateringen lykkedes: vis succesbesked i grøn
        messageEl.style.color = 'green';
        messageEl.textContent = result.message || 'Adgangskode opdateret.';
      } else {
        // Hvis serveren returnerer en fejl: vis fejlbesked i rød
        messageEl.style.color = 'red';
        messageEl.textContent = result.error || 'Fejl ved opdatering.';
      }
    } catch (err) {
      // Hvis fetch fejler (f.eks. server nede): log og vis serverfejl
      console.error('Fejl i skift adgangskode:', err);
      messageEl.style.color = 'red';
      messageEl.textContent = 'Serverfejl under opdatering.';
    }
  });
}

