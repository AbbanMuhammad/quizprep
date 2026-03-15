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

// ─────────────────────────────────────────────
//  SERVICE WORKER REGISTRATION
// ─────────────────────────────────────────────

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then(reg => {
        console.log('[App] SW registered:', reg.scope);

        reg.addEventListener('updatefound', () => {
          const newSW = reg.installing;
          newSW.addEventListener('statechange', () => {
            if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateBanner();
            }
          });
        });
      })
      .catch(err => console.error('[App] SW registration failed:', err));
  });
}

function showUpdateBanner() {
  if (document.getElementById('update-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'update-banner';
  banner.style.cssText = `
    position: fixed;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    background: #1A5E3A;
    color: #fff;
    padding: 0.75rem 1.5rem;
    border-radius: 10px;
    font-family: system-ui, sans-serif;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 1rem;
    white-space: nowrap;
  `;
  banner.innerHTML = `
    <span>🎉 A new version is available!</span>
    <button onclick="location.reload()" style="
      background: #F5A623;
      color: #1A5E3A;
      border: none;
      padding: 0.4rem 1rem;
      border-radius: 6px;
      font-weight: 700;
      cursor: pointer;
      font-size: 13px;
    ">Update</button>
    <button onclick="this.parentElement.remove()" style="
      background: none;
      border: none;
      color: rgba(255,255,255,0.7);
      cursor: pointer;
      font-size: 1rem;
      padding: 0;
    ">✕</button>
  `;
  document.body.appendChild(banner);
}