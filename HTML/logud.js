function logout() {
    sessionStorage.removeItem('loggedInUser');
    alert('Du er logget ud.');
    window.location.href = 'login.html';
  }
  
