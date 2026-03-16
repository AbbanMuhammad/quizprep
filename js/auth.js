// =============================================
//  QUIZPREP — Authentication Logic
// =============================================

// ─────────────────────────────────────────────
//  STORAGE — self-contained, no app.js needed
// ─────────────────────────────────────────────

const AUTH_KEYS = {
  users:   'qp_users',
  current: 'qp_current'
};

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEYS.users) || '[]');
  } catch(e) { return []; }
}

function saveUsers(users) {
  localStorage.setItem(AUTH_KEYS.users, JSON.stringify(users));
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEYS.current) || 'null');
  } catch(e) { return null; }
}

function setCurrentUser(user) {
  localStorage.setItem(AUTH_KEYS.current, JSON.stringify(user));
}


// ─────────────────────────────────────────────
//  VALIDATION
// ─────────────────────────────────────────────

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return password.length >= 6;
}


// ─────────────────────────────────────────────
//  UI HELPERS
// ─────────────────────────────────────────────

function showError(id, msg) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = '⚠ ' + msg;
  el.className = el.className.replace(' hidden', '').replace('hidden', '');
}

function hideError(id) {
  var el = document.getElementById(id);
  if (!el) return;
  if (el.className.indexOf('hidden') === -1) el.className += ' hidden';
}

function showSuccess(id, msg) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = '✓ ' + msg;
  el.className = el.className.replace(' hidden', '').replace('hidden', '');
}

function setInputError(id, hasError) {
  var el = document.getElementById(id);
  if (!el) return;
  if (hasError) {
    if (el.className.indexOf('error') === -1) el.className += ' error';
  } else {
    el.className = el.className.replace(' error', '').replace('error', '');
  }
}


// ─────────────────────────────────────────────
//  PASSWORD STRENGTH
// ─────────────────────────────────────────────

function checkStrength(pw) {
  var score = 0;
  if (pw.length >= 6)          score++;
  if (pw.length >= 10)         score++;
  if (/[A-Z]/.test(pw))        score++;
  if (/[0-9]/.test(pw))        score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

function updateStrengthUI(pw) {
  var fill  = document.getElementById('strengthFill');
  var label = document.getElementById('strengthLabel');
  if (!fill || !label) return;

  var levels = [
    { pct: 0,   color: '',        text: '' },
    { pct: 20,  color: '#ef4444', text: 'Very weak' },
    { pct: 40,  color: '#f97316', text: 'Weak' },
    { pct: 60,  color: '#eab308', text: 'Fair' },
    { pct: 80,  color: '#22c55e', text: 'Strong' },
    { pct: 100, color: '#15803d', text: 'Very strong' }
  ];

  var level         = levels[checkStrength(pw)];
  fill.style.width      = level.pct + '%';
  fill.style.background = level.color;
  label.textContent     = level.text;
  label.style.color     = level.color;
}


// ─────────────────────────────────────────────
//  PASSWORD TOGGLE
// ─────────────────────────────────────────────

function setupToggle(btnId, inputId) {
  var btn   = document.getElementById(btnId);
  var input = document.getElementById(inputId);
  if (!btn || !input) return;

  btn.addEventListener('click', function() {
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
//  LOGIN
// ─────────────────────────────────────────────

function initLogin() {
  // Already logged in — skip login page
  if (getCurrentUser()) {
    window.location.href = 'quiz-select.html';
    return;
  }

  var emailInput    = document.getElementById('loginEmail');
  var passwordInput = document.getElementById('loginPassword');
  var loginBtn      = document.getElementById('loginBtn');

  if (!loginBtn) return;

  setupToggle('toggleLoginPassword', 'loginPassword');

  emailInput.addEventListener('input', function() {
    setInputError('loginEmail', false);
    hideError('loginError');
  });

  passwordInput.addEventListener('input', function() {
    setInputError('loginPassword', false);
    hideError('loginError');
  });

  emailInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') loginBtn.click();
  });

  passwordInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') loginBtn.click();
  });

  loginBtn.addEventListener('click', function() {
    var email    = emailInput.value.trim().toLowerCase();
    var password = passwordInput.value;

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

    var users = getUsers();
    var user  = null;

    for (var i = 0; i < users.length; i++) {
      if (users[i].email === email && users[i].password === password) {
        user = users[i];
        break;
      }
    }

    if (!user) {
      showError('loginError', 'Incorrect email or password. Please try again.');
      setInputError('loginEmail', true);
      setInputError('loginPassword', true);
      return;
    }

    setCurrentUser(user);

    var redirect = sessionStorage.getItem('redirectAfterLogin') || 'quiz-select.html';
    sessionStorage.removeItem('redirectAfterLogin');
    window.location.href = redirect;
  });
}


// ─────────────────────────────────────────────
//  REGISTER
// ─────────────────────────────────────────────

function initRegister() {
  var nameInput     = document.getElementById('regName');
  var emailInput    = document.getElementById('regEmail');
  var passwordInput = document.getElementById('regPassword');
  var confirmInput  = document.getElementById('regConfirm');
  var registerBtn   = document.getElementById('registerBtn');

  if (!registerBtn) return;

  setupToggle('toggleRegPassword', 'regPassword');
  setupToggle('toggleRegConfirm',  'regConfirm');

  passwordInput.addEventListener('input', function() {
    updateStrengthUI(passwordInput.value);
    setInputError('regPassword', false);
    hideError('registerError');
  });

  nameInput.addEventListener('input', function() {
    setInputError('regName', false);
    hideError('registerError');
  });

  emailInput.addEventListener('input', function() {
    setInputError('regEmail', false);
    hideError('registerError');
  });

  confirmInput.addEventListener('input', function() {
    setInputError('regConfirm', false);
    hideError('registerError');
  });

  registerBtn.addEventListener('click', function() {
    var name     = nameInput.value.trim();
    var email    = emailInput.value.trim().toLowerCase();
    var password = passwordInput.value;
    var confirm  = confirmInput.value;

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

    var users  = getUsers();
    var exists = false;

    for (var i = 0; i < users.length; i++) {
      if (users[i].email === email) { exists = true; break; }
    }

    if (exists) {
      showError('registerError', 'An account with this email already exists. Please log in.');
      setInputError('regEmail', true);
      return;
    }

    var newUser = {
      id:        Date.now(),
      name:      name,
      email:     email,
      password:  password,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);
    setCurrentUser(newUser);

    showSuccess('registerSuccess', 'Account created! Redirecting you to the quiz...');
    hideError('registerError');

    setTimeout(function() {
      var redirect = sessionStorage.getItem('redirectAfterLogin') || 'quiz-select.html';
      sessionStorage.removeItem('redirectAfterLogin');
      window.location.href = redirect;
    }, 1200);
  });
}


// ─────────────────────────────────────────────
//  INIT — runs when DOM is ready
// ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('loginBtn'))    initLogin();
  if (document.getElementById('registerBtn')) initRegister();
});