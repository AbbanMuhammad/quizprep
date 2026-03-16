// =============================================
//  QUIZPREP — Shared App Utilities
// =============================================

// ─────────────────────────────────────────────
//  DARK MODE
// ─────────────────────────────────────────────

function getSystemPreference() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark' : 'light';
}

function getSavedTheme() {
  return localStorage.getItem('qp_theme');
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

function getCurrentTheme() {
  return getSavedTheme() || getSystemPreference();
}

function toggleTheme() {
  var next = getCurrentTheme() === 'dark' ? 'light' : 'dark';
  localStorage.setItem('qp_theme', next);
  applyTheme(next);
  updateToggleIcons(next);
}

function updateToggleIcons(theme) {
  document.querySelectorAll('.theme-toggle').forEach(function(btn) {
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    btn.setAttribute('aria-label',
      theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  });
}

// Apply theme immediately — prevents flash on load
applyTheme(getCurrentTheme());


// ─────────────────────────────────────────────
//  NAV
// ─────────────────────────────────────────────

function updateNav() {
  var navInner = document.querySelector('.nav__inner');
  if (!navInner) return;

  // Remove existing right-side nav items
  var existing = navInner.querySelector(
    '.btn--outline, .nav__user, .theme-toggle'
  );
  while (existing) {
    existing.remove();
    existing = navInner.querySelector(
      '.btn--outline, .nav__user, .theme-toggle'
    );
  }

  // Theme toggle button
  var toggleBtn = document.createElement('button');
  toggleBtn.className   = 'theme-toggle';
  toggleBtn.onclick     = toggleTheme;
  var theme = getCurrentTheme();
  toggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
  toggleBtn.setAttribute('aria-label',
    theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');

  // My Results link
  var resultsLink = document.createElement('a');
  resultsLink.href      = 'history.html';
  resultsLink.style.cssText =
    'color:rgba(255,255,255,0.85);font-size:var(--fs-sm);' +
    'font-weight:600;text-decoration:none;margin-right:var(--space-sm);';
  resultsLink.textContent = 'My Results';

  navInner.appendChild(toggleBtn);
  navInner.appendChild(resultsLink);
}


// ─────────────────────────────────────────────
//  FOOTER YEAR
// ─────────────────────────────────────────────

function updateFooterYear() {
  var els = document.querySelectorAll('#footerYear');
  els.forEach(function(el) {
    el.textContent = new Date().getFullYear();
  });
}


// ─────────────────────────────────────────────
//  SYSTEM THEME CHANGE LISTENER
//  Follows OS theme if user hasn't set a manual
//  preference
// ─────────────────────────────────────────────

window.matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', function(e) {
    if (!getSavedTheme()) {
      var t = e.matches ? 'dark' : 'light';
      applyTheme(t);
      updateToggleIcons(t);
    }
  });


// ─────────────────────────────────────────────
//  INIT — runs on every page load
// ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function() {
  updateNav();
  updateFooterYear();
});


// ─────────────────────────────────────────────
//  SERVICE WORKER
// ─────────────────────────────────────────────

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('./sw.js')
      .then(function(reg) {
        reg.addEventListener('updatefound', function() {
          var newSW = reg.installing;
          newSW.addEventListener('statechange', function() {
            if (newSW.state === 'installed' &&
                navigator.serviceWorker.controller) {
              showUpdateBanner();
            }
          });
        });
      })
      .catch(function(err) {
        console.error('[App] SW registration failed:', err);
      });
  });
}

function showUpdateBanner() {
  if (document.getElementById('update-banner')) return;
  var banner = document.createElement('div');
  banner.id = 'update-banner';
  banner.style.cssText =
    'position:fixed;bottom:1rem;left:50%;transform:translateX(-50%);' +
    'background:#1A5E3A;color:#fff;padding:0.75rem 1.5rem;' +
    'border-radius:10px;font-family:system-ui,sans-serif;font-size:14px;' +
    'font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,0.3);z-index:9999;' +
    'display:flex;align-items:center;gap:1rem;white-space:nowrap;';
  banner.innerHTML =
    '<span>🎉 A new version is available!</span>' +
    '<button onclick="location.reload()" style="background:#F5A623;' +
    'color:#1A5E3A;border:none;padding:0.4rem 1rem;border-radius:6px;' +
    'font-weight:700;cursor:pointer;font-size:13px;">Update</button>' +
    '<button onclick="this.parentElement.remove()" style="background:none;' +
    'border:none;color:rgba(255,255,255,0.7);cursor:pointer;' +
    'font-size:1rem;padding:0;">✕</button>';
  document.body.appendChild(banner);
}