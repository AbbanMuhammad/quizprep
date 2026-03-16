// =============================================
//  QUIZPREP — Authentication Logic
//  Self-contained, no external dependencies
// =============================================

// ─────────────────────────────────────────────
//  STORAGE
// ─────────────────────────────────────────────

function getUsers() {
  try { return JSON.parse(localStorage.getItem('qp_users') || '[]'); }
  catch(e) { return []; }
}

function saveUsers(u) {
  localStorage.setItem('qp_users', JSON.stringify(u));
}

function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem('qp_current') || 'null'); }
  catch(e) { return null; }
}

function setCurrentUser(u) {
  localStorage.setItem('qp_current', JSON.stringify(u));
}


// ─────────────────────────────────────────────
//  UI HELPERS
// ─────────────────────────────────────────────

function showEl(id) {
  var el = document.getElementById(id);
  if (el) el.style.display = 'block';
}

function hideEl(id) {
  var el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

function setText(id, msg) {
  var el = document.getElementById(id);
  if (el) el.textContent = msg;
}

function showError(id, msg) {
  setText(id, '⚠ ' + msg);
  showEl(id);
}

function hideError(id) {
  hideEl(id);
}

function showSuccess(id, msg) {
  setText(id, '✓ ' + msg);
  showEl(id);
}

function markError(id) {
  var el = document.getElementById(id);
  if (el) el.style.borderColor = '#ef4444';
}

function clearError(id) {
  var el = document.getElementById(id);
  if (el) el.style.borderColor = '';
}


// ─────────────────────────────────────────────
//  PASSWORD STRENGTH
// ─────────────────────────────────────────────

function updateStrengthUI(pw) {
  var fill  = document.getElementById('strengthFill');
  var label = document.getElementById('strengthLabel');
  if (!fill || !label) return;

  var score = 0;
  if (pw.length >= 6)          score++;
  if (pw.length >= 10)         score++;
  if (/[A-Z]/.test(pw))        score++;
  if (/[0-9]/.test(pw))        score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  var levels = [
    { pct: 0,   color: '',        text: '' },
    { pct: 20,  color: '#ef4444', text: 'Very weak' },
    { pct: 40,  color: '#f97316', text: 'Weak' },
    { pct: 60,  color: '#eab308', text: 'Fair' },
    { pct: 80,  color: '#22c55e', text: 'Strong' },
    { pct: 100, color: '#15803d', text: 'Very strong' }
  ];

  fill.style.width      = levels[score].pct + '%';
  fill.style.background = levels[score].color;
  label.textContent     = levels[score].text;
  label.style.color     = levels[score].color;
}


// ─────────────────────────────────────────────
//  PASSWORD TOGGLE
// ─────────────────────────────────────────────

function setupToggle(btnId, inputId) {
  var btn   = document.getElementById(btnId);
  var input = document.getElementById(inputId);
  if (!btn || !input) return;

  btn.onclick = function() {
    if (input.type === 'password') {
      input.type      = 'text';
      btn.textContent = '🙈';
    } else {
      input.type      = 'password';
      btn.textContent = '👁';
    }
  };
}


// ─────────────────────────────────────────────
//  REGISTER
// ─────────────────────────────────────────────

function initRegister() {
  var registerBtn = document.getElementById('registerBtn');
  if (!registerBtn) return;

  // Hide error/success banners initially using style
  hideEl('registerError');
  hideEl('registerSuccess');

  // Wire up toggles
  setupToggle('toggleRegPassword', 'regPassword');
  setupToggle('toggleRegConfirm',  'regConfirm');

  // Strength meter
  var pwInput = document.getElementById('regPassword');
  if (pwInput) {
    pwInput.oninput = function() {
      updateStrengthUI(pwInput.value);
      clearError('regPassword');
      hideError('registerError');
    };
  }

  // Submit
  registerBtn.onclick = function() {

    var name     = (document.getElementById('regName').value     || '').trim();
    var email    = (document.getElementById('regEmail').value    || '').trim().toLowerCase();
    var password = (document.getElementById('regPassword').value || '');
    var confirm  = (document.getElementById('regConfirm').value  || '');

    // Clear previous errors
    ['regName','regEmail','regPassword','regConfirm'].forEach(clearError);
    hideError('registerError');

    // Validate
    if (!name) {
      showError('registerError', 'Please enter your full name.');
      markError('regName');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('registerError', 'Please enter a valid email address.');
      markError('regEmail');
      return;
    }

    if (password.length < 6) {
      showError('registerError', 'Password must be at least 6 characters.');
      markError('regPassword');
      return;
    }

    if (password !== confirm) {
      showError('registerError', 'Passwords do not match.');
      markError('regConfirm');
      return;
    }

    // Check duplicate
    var users  = getUsers();
    var exists = false;
    for (var i = 0; i < users.length; i++) {
      if (users[i].email === email) { exists = true; break; }
    }

    if (exists) {
      showError('registerError',
        'An account with this email already exists. Please log in.');
      markError('regEmail');
      return;
    }

    // Save
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

    showSuccess('registerSuccess',
      'Account created! Redirecting...');

    setTimeout(function() {
      window.location.href = 'quiz-select.html';
    }, 1200);
  };
}


// ─────────────────────────────────────────────
//  LOGIN
// ─────────────────────────────────────────────

function initLogin() {
  // Already logged in
  if (getCurrentUser()) {
    window.location.href = 'quiz-select.html';
    return;
  }

  var loginBtn = document.getElementById('loginBtn');
  if (!loginBtn) return;

  // Hide error banner initially
  hideEl('loginError');

  // Wire toggle
  setupToggle('toggleLoginPassword', 'loginPassword');

  // Submit
  loginBtn.onclick = function() {

    var email    = (document.getElementById('loginEmail').value    || '').trim().toLowerCase();
    var password = (document.getElementById('loginPassword').value || '');

    // Clear previous errors
    clearError('loginEmail');
    clearError('loginPassword');
    hideError('loginError');

    if (!email) {
      showError('loginError', 'Please enter your email address.');
      markError('loginEmail');
      return;
    }

    if (!password) {
      showError('loginError', 'Please enter your password.');
      markError('loginPassword');
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
      showError('loginError',
        'Incorrect email or password. Please try again.');
      markError('loginEmail');
      markError('loginPassword');
      return;
    }

    setCurrentUser(user);
    window.location.href = 'quiz-select.html';
  };
}


// ─────────────────────────────────────────────
//  BOOT — detect page and initialise
// ─────────────────────────────────────────────

(function boot() {
  var isReady = document.readyState === 'complete' ||
                document.readyState === 'interactive';

  if (isReady) {
    run();
  } else {
    document.addEventListener('DOMContentLoaded', run);
  }

  function run() {
    if (document.getElementById('registerBtn')) initRegister();
    if (document.getElementById('loginBtn'))    initLogin();
  }
})();