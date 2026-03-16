// =============================================
//  QUIZPREP — Authentication Logic
// =============================================

// ─────────────────────────────────────────────
//  1. STORAGE HELPERS
//  KEYS, getCurrentUser and logout live in
//  app.js — we only define what's unique here
// ─────────────────────────────────────────────

function getUsers() {
  return JSON.parse(localStorage.getItem('qp_users') || '[]');
}

function saveUsers(users) {
  localStorage.setItem('qp_users', JSON.stringify(users));
}

function setCurrentUser(user) {
  localStorage.setItem('qp_current', JSON.stringify(user));
}


// ─────────────────────────────────────────────
//  2. VALIDATION HELPERS
// ─────────────────────────────────────────────

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return password.length >= 6;
}

function showError(elementId, message) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = '⚠ ' + message;
  el.classList.remove('hidden');
}

function hideError(elementId) {
  const el = document.getElementById(elementId);
  if (el) el.classList.add('hidden');
}

function showSuccess(elementId, message) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = '✓ ' + message;
  el.classList.remove('hidden');
}

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
//  3. PASSWORD STRENGTH METER
// ─────────────────────────────────────────────

function checkStrength(password) {
  let score = 0;
  if (password.length >= 6)          score++;
  if (password.length >= 10)         score++;
  if (/[A-Z]/.test(password))        score++;
  if (/[0-9]/.test(password))        score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

function updateStrengthUI(password) {
  const fill  = document.getElementById('strengthFill');
  const label = document.getElementById('strengthLabel');
  if (!fill || !label) return;

  const score  = checkStrength(password);
  const levels = [
    { pct: 0,   color: '',        text: '' },
    { pct: 20,  color: '#ef4444', text: 'Very weak' },
    { pct: 40,  color: '#f97316', text: 'Weak' },
    { pct: 60,  color: '#eab308', text: 'Fair' },
    { pct: 80,  color: '#22c55e', text: 'Strong' },
    { pct: 100, color: '#15803d', text: 'Very strong' },
  ];

  const level       = levels[score];
  fill.style.width      = level.pct + '%';
  fill.style.background = level.color;
  label.textContent     = level.text;
  label.style.color     = level.color;
}


// ─────────────────────────────────────────────
//  4. PASSWORD VISIBILITY TOGGLE
// ─────────────────────────────────────────────

function setupToggle(btnId, inputId) {
  const btn   = document.getElementById(btnId);
  const input = document.getElementById(inputId);
  if (!btn || !input) return;

  btn.addEventListener('click', function () {
    if (input.type === 'password') {
      input.type      = 'text';
      btn.textContent = '🙈';
    } else {
      input.type      = 'password';
      btn.textContent = '👁';
    }
  });
}


// ─────────────────────────────────────────────
//  5. REGISTER LOGIC
// ─────────────────────────────────────────────

function initRegister() {
  const nameInput     = document.getElementById('regName');
  const emailInput    = document.getElementById('regEmail');
  const passwordInput = document.getElementById('regPassword');
  const confirmInput  = document.getElementById('regConfirm');
  const registerBtn   = document.getElementById('registerBtn');

  if (!registerBtn) return;

  // Password toggles
  setupToggle('toggleRegPassword', 'regPassword');
  setupToggle('toggleRegConfirm',  'regConfirm');

  // Live strength meter
  passwordInput.addEventListener('input', () => {
    updateStrengthUI(passwordInput.value);
    setInputError('regPassword', false);
    hideError('registerError');
  });

  // Clear errors on input
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

    const users  = getUsers();
    const exists = users.find(u => u.email === email);

    if (exists) {
      showError('registerError',
        'An account with this email already exists. Please log in.');
      setInputError('regEmail', true);
      return;
    }

    const newUser = {
      id:        Date.now(),
      name,
      email,
      password,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);
    setCurrentUser(newUser);

    showSuccess('registerSuccess',
      'Account created! Redirecting you to the quiz...');
    hideError('registerError');

    setTimeout(() => {
      const redirect =
        sessionStorage.getItem('redirectAfterLogin') || 'quiz-select.html';
      sessionStorage.removeItem('redirectAfterLogin');
      window.location.href = redirect;
    }, 1200);
  });
}


// ─────────────────────────────────────────────
//  6. LOGIN LOGIC
// ─────────────────────────────────────────────

function initLogin() {
  if (JSON.parse(localStorage.getItem('qp_current') || 'null')) {
    window.location.href = 'quiz-select.html';
    return;
  }

  const emailInput    = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');
  const loginBtn      = document.getElementById('loginBtn');

  if (!loginBtn) return;

  // Password toggle
  setupToggle('toggleLoginPassword', 'loginPassword');

  // Clear errors on input
  [emailInput, passwordInput].forEach(input => {
    input.addEventListener('input', () => {
      setInputError(input.id, false);
      hideError('loginError');
    });
  });

  // Enter key submits
  [emailInput, passwordInput].forEach(input => {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') loginBtn.click();
    });
  });

  // Submit
  loginBtn.addEventListener('click', () => {
    const email    = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

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

    setCurrentUser(user);

    const redirect =
      sessionStorage.getItem('redirectAfterLogin') || 'quiz-select.html';
    sessionStorage.removeItem('redirectAfterLogin');
    window.location.href = redirect;
  });
}


// ─────────────────────────────────────────────
//  7. AUTO-INITIALISE
// ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('loginBtn'))    initLogin();
  if (document.getElementById('registerBtn')) initRegister();
});