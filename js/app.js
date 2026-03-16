// =============================================
// QUIZPREP — Shared App Utilities (CORRECTED)
// Fixes: updateNav duplicate cleanup, absolute paths, auth guard support
// =============================================
// ─────────────────────────────────────────────
// STORAGE KEYS
// ─────────────────────────────────────────────
const KEYS = {
    users: "qp_users",
    current: "qp_current",
    theme: "qp_theme" // "dark" | "light" | null (use system)
};
// ─────────────────────────────────────────────
// 1. THEME — Apply before page renders
// ─────────────────────────────────────────────
function getSystemPreference() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
}
function getSavedTheme() {
    return localStorage.getItem(KEYS.theme);
}
function applyTheme(theme) {
    if (theme === "dark") {
        document.documentElement.classList.add("dark");
    } else {
        document.documentElement.classList.remove("dark");
    }
}
function getCurrentTheme() {
    return getSavedTheme() || getSystemPreference();
}
function toggleTheme() {
    const current = getCurrentTheme();
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem(KEYS.theme, next);
    applyTheme(next);
    updateToggleIcons(next);
}

function updateToggleIcons(theme) {
    document.querySelectorAll(".theme-toggle").forEach(btn => {
        btn.textContent = theme === "dark" ? "☀️" : "🌙";
        btn.setAttribute(
            "aria-label",
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
        );
    });
}
// ── Apply theme immediately on script load ──
applyTheme(getCurrentTheme());
// ─────────────────────────────────────────────
// 2. AUTH HELPERS
// ─────────────────────────────────────────────
function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem(KEYS.current) || "null");
    } catch (e) {
        return null;
    }
}
function setCurrentUser(u) {
    localStorage.setItem(KEYS.current, JSON.stringify(u));
}
function logout() {
    localStorage.removeItem(KEYS.current);
    window.location.href = "/login.html";
}
// ─────────────────────────────────────────────
// 3. NAV — User info + dark mode toggle
// FIX: Use querySelectorAll to remove ALL existing
//      nav items, preventing duplicate elements
// ─────────────────────────────────────────────
function updateNav() {
    const user = getCurrentUser();
    const navInner = document.querySelector(".nav__inner");
    if (!navInner) return;
    // FIX: Remove ALL previously inserted nav items (not just the first one)
    navInner
        .querySelectorAll(".btn--outline, .nav__user")
        .forEach(el => el.remove());
    navInner.querySelectorAll(".theme-toggle").forEach(el => el.remove());
    // ── Always add the theme toggle ──
    const toggleBtn = document.createElement("button");
    toggleBtn.className = "theme-toggle";
    toggleBtn.onclick = toggleTheme;
    const theme = getCurrentTheme();
    toggleBtn.textContent = theme === "dark" ? "☀️" : "🌙";
    toggleBtn.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
    );
    if (user) {
        // ── Logged in: My Results + username + logout + toggle ──
        const userEl = document.createElement("div");
        userEl.className = "nav__user";
        userEl.innerHTML = `
      <a href="/history.html" class="nav__results-link">My Results</a>
      <span class="nav__greeting">Hi, ${user.name.split(" ")[0]}</span>
      <button class="btn btn--outline btn--sm" onclick="logout()">Log Out</button>
    `;
        navInner.appendChild(toggleBtn);
        navInner.appendChild(userEl);
    } else {
        // ── Logged out: Get Started + toggle ──
        const link = document.createElement("a");
        link.href = "/login.html";
        link.className = "btn btn--outline";
        link.textContent = "Get Started";
        navInner.appendChild(toggleBtn);
        navInner.appendChild(link);
    }
}

// ─────────────────────────────────────────────
// 4. SYSTEM THEME CHANGE LISTENER
// ─────────────────────────────────────────────
window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", e => {
        if (!getSavedTheme()) {
            const newTheme = e.matches ? "dark" : "light";
            applyTheme(newTheme);
            updateToggleIcons(newTheme);
        }
    });
// ─────────────────────────────────────────────
// 5. AUTH GUARD — Protect pages that require login
// Add data-auth-required="true" to the <body> tag
// of any page that should redirect to /login.html
// when the user is not logged in.
// ─────────────────────────────────────────────
function checkAuthGuard() {
    if (document.body && document.body.dataset.authRequired === "true") {
        if (!getCurrentUser()) {
            window.location.href = "/login.html";
        }
    }
}
// ─────────────────────────────────────────────
// 6. RUN ON EVERY PAGE LOAD
// ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function () {
    checkAuthGuard();
    updateNav();
});
// ─────────────────────────────────────────────
// SERVICE WORKER REGISTRATION
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
    🎉 A new version is available!
    <button onclick="location.reload()" style="background:#fff;color:#1A5E3A;border:none;padding:0.3rem 0.8rem;border-radius:6px;cursor:pointer;font-weight:600;">Update</button>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;color:#fff;cursor:pointer;font-size:18px;">✕</button>
  `;
  document.body.appendChild(banner);
}