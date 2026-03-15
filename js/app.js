// =============================================
//  QUIZPREP — Shared App Utilities
//  Stage 7: Dark mode added
// =============================================

// ─────────────────────────────────────────────
//  STORAGE KEYS
// ─────────────────────────────────────────────

const KEYS = {
  users:   'qp_users',
  current: 'qp_current',
  theme:   'qp_theme'    // "dark" | "light" | null (use system)
};


// ─────────────────────────────────────────────
//  1. THEME — Apply before page renders
//  This runs immediately (not inside DOMContentLoaded)
//  to prevent a flash of the wrong theme
// ─────────────────────────────────────────────

function getSystemPreference() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function getSavedTheme() {
  return localStorage.getItem(KEYS.theme); // "dark" | "light" | null
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

function getCurrentTheme() {
  // Saved preference wins; fall back to system preference
  return getSavedTheme() || getSystemPreference();
}

function toggleTheme() {
  const current  = getCurrentTheme();
  const next     = current === 'dark' ? 'light' : 'dark';

  // Save the user's explicit choice
  localStorage.setItem(KEYS.theme, next);

  // Apply immediately
  applyTheme(next);

  // Update every toggle button icon on the page
  updateToggleIcons(next);
}

function updateToggleIcons(theme) {
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    btn.setAttribute('aria-label',
      theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
    );
  });
}

// ── Apply theme immediately on script load ──
// This line runs before DOMContentLoaded so there is no flash
applyTheme(getCurrentTheme());


// ─────────────────────────────────────────────
//  2. AUTH HELPERS
// ─────────────────────────────────────────────

function getCurrentUser() {
  return JSON.parse(localStorage.getItem(KEYS.current) || 'null');
}

function logout() {
  localStorage.removeItem(KEYS.current);
  window.location.href = 'login.html';
}


// ─────────────────────────────────────────────
//  3. NAV — User info + dark mode toggle
// ─────────────────────────────────────────────

function updateNav() {
  const user     = getCurrentUser();
  const navInner = document.querySelector('.nav__inner');
  if (!navInner) return;

  // Remove any previously inserted nav items to avoid duplicates
  const existing = navInner.querySelector('.btn--outline, .nav__user');
  if (existing) existing.remove();

  // Remove existing toggle button if present
  const existingToggle = navInner.querySelector('.theme-toggle');
  if (existingToggle) existingToggle.remove();

  // ── Always add the theme toggle ──
  const toggleBtn = document.createElement('button');
  toggleBtn.className   = 'theme-toggle';
  toggleBtn.onclick     = toggleTheme;
  const theme = getCurrentTheme();
  toggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
  toggleBtn.setAttribute('aria-label',
    theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
  );

  if (user) {
    // ── Logged in: My Results + username + logout + toggle ──
    const userEl = document.createElement('div');
    userEl.className = 'nav__user';
    userEl.innerHTML = `
      <a href="history.html"
         style="color:rgba(255,255,255,0.85);
                font-size:var(--fs-sm);
                font-weight:600;
                text-decoration:none;
                margin-right:var(--space-sm);">
        My Results
      </a>
      <span class="nav__username">
        Hi, <span>${user.name.split(' ')[0]}</span>
      </span>
      <button class="btn btn--outline" onclick="logout()">
        Log Out
      </button>`;

    navInner.appendChild(toggleBtn);
    navInner.appendChild(userEl);
  } else {
    // ── Logged out: Get Started + toggle ──
    const link = document.createElement('a');
    link.href        = 'login.html';
    link.className   = 'btn btn--outline';
    link.textContent = 'Get Started';

    navInner.appendChild(toggleBtn);
    navInner.appendChild(link);
  }
}


// ─────────────────────────────────────────────
//  4. SYSTEM THEME CHANGE LISTENER
//  If the user changes their OS theme while the
//  app is open AND they haven't set a manual
//  preference, follow the system change
// ─────────────────────────────────────────────

window.matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', e => {
    // Only follow system if no manual override saved
    if (!getSavedTheme()) {
      const newTheme = e.matches ? 'dark' : 'light';
      applyTheme(newTheme);
      updateToggleIcons(newTheme);
    }
  });


// ─────────────────────────────────────────────
//  5. RUN ON EVERY PAGE LOAD
// ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', updateNav);