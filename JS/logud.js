function logout() {
    // Fjerner brugernavnet fra sessionStorage
    sessionStorage.removeItem('loggedInUser');
    // Giver brugeren en besked om, at de er blevet logget ud
    alert('Du er logget ud.');
    window.location.href = 'login.html';
  }
  
