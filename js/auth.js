// =============================================
//  QUIZPREP — Authentication Logic
//  Stage 5
// =============================================

// ─────────────────────────────────────────────
//  STORAGE KEYS
//  Centralise key names so a typo in one place
//  doesn't silently break another
// ─────────────────────────────────────────────

const KEYS = {
  users:   'qp_users',    // array of all registered users
  current: 'qp_current'  // the currently logged-in user object
};


// ─────────────────────────────────────────────
//  1. LOW-LEVEL HELPERS
// ─────────────────────────────────────────────

// Get all registered users from localStorage
// Returns an empty array if none exist yet
function getUsers() {
  return JSON.parse(localStorage.getItem(KEYS.users) || '[]');
}

// Save the full users array back to localStorage
function saveUsers(users) {
  localStorage.setItem(KEYS.users, JSON.stringify(users));
}

// Get the currently logged-in user (or null)
function getCurrentUser() {
  return JSON.parse(localStorage.getItem(KEYS.current) || 'null');
}

// Log a user in by saving them as the current user
function setCurrentUser(user) {
  localStorage.setItem(KEYS.current, JSON.stringify(user));
}

// Log out — remove the current user from localStorage
function logout() {
  localStorage.removeItem(KEYS.current);
  window.location.href = 'login.html';
}


// ─────────────────────────────────────────────
//  2. ROUTE PROTECTION
//  Call this at the top of any page that requires login
// ─────────────────────────────────────────────

function requireAuth() {
  const user = getCurrentUser();
  if (!user) {
    // Save the page they tried to visit so we can
    // redirect back after login
    sessionStorage.setItem('redirectAfterLogin',
                           window.location.pathname);
    window.location.href = 'login.html';
  }
  return user;
}


// ─────────────────────────────────────────────
//  3. NAV BAR — Show username when logged in
//  Call this on every protected page
// ─────────────────────────────────────────────

function updateNav() {
  const user    = getCurrentUser();
  const navInner = document.querySelector('.nav__inner');
  if (!navInner || !user) return;

  // Replace the "Get Started" button with username + logout
  const existing = navInner.querySelector('.btn--outline, .nav__user');
  if (existing) existing.remove();

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
}


// ─────────────────────────────────────────────
//  4. VALIDATION HELPERS
// ─────────────────────────────────────────────

function validateEmail(email) {
  // Basic email pattern — has text, @, domain, dot, extension
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return password.length >= 6;
}

// Show an error banner
function showError(elementId, message) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = '⚠ ' + message;
  el.classList.remove('hidden');
}

// Hide an error banner
function hideError(elementId) {
  const el = document.getElementById(elementId);
  if (el) el.classList.add('hidden');
}

// Show a success banner
function showSuccess(elementId, message) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = '✓ ' + message;
  el.classList.remove('hidden');
}

// Mark an input as having an error (red border)
function setInputError(inputId, hasError) {
  const el = document.getElementById(inputId);
  if (!el) return;
  if (hasError) {
    el.classList.add('error');
  } else {
    el.classList.remove('error');
  }
}


// ─────────────────────────────────────────────
//  5. PASSWORD STRENGTH METER
// ─────────────────────────────────────────────

function checkStrength(password) {
  let score = 0;

  if (password.length >= 6)  score++;   // minimum length
  if (password.length >= 10) score++;   // good length
  if (/[A-Z]/.test(password)) score++; // has uppercase
  if (/[0-9]/.test(password)) score++; // has number
  if (/[^A-Za-z0-9]/.test(password)) score++; // has symbol

  return score; // 0–5
}

function updateStrengthUI(password) {
  const fill  = document.getElementById('strengthFill');
  const label = document.getElementById('strengthLabel');
  if (!fill || !label) return;

  const score = checkStrength(password);

  const levels = [
    { pct: 0,   color: '',        text: '' },
    { pct: 20,  color: '#ef4444', text: 'Very weak' },
    { pct: 40,  color: '#f97316', text: 'Weak' },
    { pct: 60,  color: '#eab308', text: 'Fair' },
    { pct: 80,  color: '#22c55e', text: 'Strong' },
    { pct: 100, color: '#15803d', text: 'Very strong' },
  ];

  const level = levels[score];
  fill.style.width      = level.pct + '%';
  fill.style.background = level.color;
  label.textContent     = level.text;
  label.style.color     = level.color;
}


// ─────────────────────────────────────────────
//  6. PASSWORD VISIBILITY TOGGLE
// ─────────────────────────────────────────────

function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;

  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁';
  }
}


// ─────────────────────────────────────────────
//  7. REGISTER LOGIC
// ─────────────────────────────────────────────

function initRegister() {
  const nameInput     = document.getElementById('regName');
  const emailInput    = document.getElementById('regEmail');
  const passwordInput = document.getElementById('regPassword');
  const confirmInput  = document.getElementById('regConfirm');
  const registerBtn   = document.getElementById('registerBtn');

  if (!registerBtn) return; // not on register page

  // Live password strength as user types
  passwordInput.addEventListener('input', () => {
    updateStrengthUI(passwordInput.value);
    setInputError('regPassword', false);
    hideError('registerError');
  });

  // Clear error styling on input
  [nameInput, emailInput, confirmInput].forEach(input => {
    input.addEventListener('input', () => {
      setInputError(input.id, false);
      hideError('registerError');
    });
  });

  // Submit
  registerBtn.addEventListener('click', () => {
    const name     = nameInput.value.trim();
    const email    = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    const confirm  = confirmInput.value;

    // ── Validate ──
    if (!name) {
      showError('registerError', 'Please enter your full name.');
      setInputError('regName', true);
      return;
    }

    if (!validateEmail(email)) {
      showError('registerError', 'Please enter a valid email address.');
      setInputError('regEmail', true);
      return;
    }

    if (!validatePassword(password)) {
      showError('registerError', 'Password must be at least 6 characters.');
      setInputError('regPassword', true);
      return;
    }

    if (password !== confirm) {
      showError('registerError', 'Passwords do not match.');
      setInputError('regConfirm', true);
      return;
    }

    // ── Check for existing account ──
    const users = getUsers();
    const exists = users.find(u => u.email === email);

    if (exists) {
      showError('registerError',
        'An account with this email already exists. Please log in.');
      setInputError('regEmail', true);
      return;
    }

    // ── Save new user ──
    const newUser = {
      id:        Date.now(), // simple unique ID
      name,
      email,
      password,  // NOTE: plaintext is fine for a localStorage demo.
                 // In a real app you would hash this server-side.
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    // ── Auto-login and redirect ──
    setCurrentUser(newUser);

    showSuccess('registerSuccess',
      'Account created! Redirecting you to the quiz...');
    hideError('registerError');

    // Brief pause so the user can read the success message
    setTimeout(() => {
      const redirect =
        sessionStorage.getItem('redirectAfterLogin') || 'quiz-select.html';
      sessionStorage.removeItem('redirectAfterLogin');
      window.location.href = redirect;
    }, 1200);
  });
}


// ─────────────────────────────────────────────
//  8. LOGIN LOGIC
// ─────────────────────────────────────────────

function initLogin() {
  // If the user is already logged in, skip the login page
  if (getCurrentUser()) {
    window.location.href = 'quiz-select.html';
    return;
  }

  const emailInput    = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');
  const loginBtn      = document.getElementById('loginBtn');

  if (!loginBtn) return; // not on login page

  // Clear errors on input
  [emailInput, passwordInput].forEach(input => {
    input.addEventListener('input', () => {
      setInputError(input.id, false);
      hideError('loginError');
    });
  });

  // Allow Enter key to submit
  [emailInput, passwordInput].forEach(input => {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') loginBtn.click();
    });
  });

  // Submit
  loginBtn.addEventListener('click', () => {
    const email    = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    // ── Validate fields are not empty ──
    if (!email) {
      showError('loginError', 'Please enter your email address.');
      setInputError('loginEmail', true);
      return;
    }

    if (!password) {
      showError('loginError', 'Please enter your password.');
      setInputError('loginPassword', true);
      return;
    }

    // ── Find matching user ──
    const users = getUsers();
    const user  = users.find(
      u => u.email === email && u.password === password
    );

    if (!user) {
      showError('loginError',
        'Incorrect email or password. Please try again.');
      setInputError('loginEmail', true);
      setInputError('loginPassword', true);
      return;
    }

    // ── Log in and redirect ──
    setCurrentUser(user);

    const redirect =
      sessionStorage.getItem('redirectAfterLogin') || 'quiz-select.html';
    sessionStorage.removeItem('redirectAfterLogin');
    window.location.href = redirect;
  });
}