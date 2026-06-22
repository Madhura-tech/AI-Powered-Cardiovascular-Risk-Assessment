// Add logged-in class when user is authenticated
(function() {
  const token = localStorage.getItem('authToken');
  if (token) {
    document.body.classList.add('logged-in');
  }
  
  // Watch for login/logout
  window.addEventListener('storage', function(e) {
    if (e.key === 'authToken') {
      if (e.newValue) {
        document.body.classList.add('logged-in');
      } else {
        document.body.classList.remove('logged-in');
      }
    }
  });
})();
