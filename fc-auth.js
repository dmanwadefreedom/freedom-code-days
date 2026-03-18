/* ============================================================
   FREEDOM CODE — Access Gate
   Simple access code check. Stores in localStorage.
   Set the code below. Buyer gets it after purchase.
   ============================================================ */

(function() {
  const ACCESS_CODE = 'FREEDOM2026';
  const STORAGE_KEY = 'fc_access';
  const isLoginPage = window.location.pathname.endsWith('/login.html') || window.location.pathname.endsWith('/login');

  // Already authenticated
  if (localStorage.getItem(STORAGE_KEY) === ACCESS_CODE) {
    if (isLoginPage) window.location.href = './';
    return;
  }

  // Not authenticated — redirect to login (unless already there)
  if (!isLoginPage) {
    const base = window.location.pathname.includes('/day-') ? '../login.html' : './login.html';
    window.location.href = base;
  }
})();
