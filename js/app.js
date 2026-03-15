// =============================================
//  QUIZPREP — Shared App Utilities
//  Loaded on every page
// =============================================

const KEYS = {
  users:   'qp_users',
  current: 'qp_current'
};

function getCurrentUser() {
  return JSON.parse(localStorage.getItem(KEYS.current) || 'null');
}

function logout() {
  localStorage.removeItem(KEYS.current);
  window.location.href = 'login.html';
}

function updateNav() {
  const user     = getCurrentUser();
  const navInner = document.querySelector('.nav__inner');
  if (!navInner) return;

  const existing = navInner.querySelector('.btn--outline, .nav__user');
  if (existing) existing.remove();

  if (user) {
    // Logged in — show name and logout button
    const userEl = document.createElement('div');
    userEl.className = 'nav__user';
    userEl.innerHTML = `
      <span class="nav__username">
        Hi, <span>${user.name.split(' ')[0]}</span>
      </span>
      <button class="btn btn--outline" onclick="logout()">
        Log Out
      </button>`;
    navInner.appendChild(userEl);
  } else {
    // Not logged in — show Get Started
    const link = document.createElement('a');
    link.href      = 'login.html';
    link.className = 'btn btn--outline';
    link.textContent = 'Get Started';
    navInner.appendChild(link);
  }
}

// Run on every page load
document.addEventListener('DOMContentLoaded', updateNav);