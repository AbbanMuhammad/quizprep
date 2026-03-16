// =============================================
//  QUIZPREP — Score History Logic
// =============================================

const HISTORY_KEY = 'qp_history';

const SUBJECT_NAMES = {
  mathematics: 'Mathematics',
  english:     'English Language',
  biology:     'Biology',
  chemistry:   'Chemistry',
  physics:     'Physics',
  government:  'Government',
  literature:  'Literature in English',
  economics:   'Economics'
};

function formatTime(seconds) {
  var m = Math.floor(seconds / 60);
  var s = seconds % 60;
  return m + ':' + String(s).padStart(2, '0');
}

function formatDate(iso) {
  var d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  }) + ', ' + d.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit'
  });
}

function getBand(pct) {
  if (pct >= 80) return { label: 'Excellent', cls: 'excellent' };
  if (pct >= 50) return { label: 'Good',      cls: 'good' };
  return               { label: 'Poor',       cls: 'poor' };
}

function getAllHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch(e) { return []; }
}

// ── Summary stats ─────────────────────────────
function renderStats(records) {
  document.getElementById('hsTotalQuizzes').textContent = records.length;

  if (records.length === 0) {
    document.getElementById('hsAvgScore').textContent   = '—';
    document.getElementById('hsBestScore').textContent  = '—';
    document.getElementById('hsFavSubject').textContent = '—';
    return;
  }

  var avg = Math.round(
    records.reduce(function(sum, r) { return sum + r.percent; }, 0) /
    records.length
  );
  document.getElementById('hsAvgScore').textContent =  avg + '%';

  var best = Math.max.apply(null, records.map(function(r) { return r.percent; }));
  document.getElementById('hsBestScore').textContent = best + '%';

  var counts = {};
  records.forEach(function(r) {
    counts[r.subject] = (counts[r.subject] || 0) + 1;
  });
  var fav = Object.keys(counts).sort(function(a, b) {
    return counts[b] - counts[a];
  })[0];
  document.getElementById('hsFavSubject').textContent =
    SUBJECT_NAMES[fav] || fav;
}

// ── Render table ──────────────────────────────
function renderTable(records) {
  var tbody     = document.getElementById('historyBody');
  var emptyEl   = document.getElementById('historyEmpty');
  var tableWrap = document.querySelector('.history-table-wrap');

  if (records.length === 0) {
    tableWrap.classList.add('hidden');
    emptyEl.classList.remove('hidden');
    return;
  }

  tableWrap.classList.remove('hidden');
  emptyEl.classList.add('hidden');

  var html = '';
  records.forEach(function(r, i) {
    var band    = getBand(r.percent);
    var subject = SUBJECT_NAMES[r.subject] || r.subject;

    html +=
      '<tr>' +
      '<td>' + (i + 1) + '</td>' +
      '<td class="td-subject">' + subject + '</td>' +
      '<td class="td-score">' + r.score + ' / ' + r.total + '</td>' +
      '<td><span class="result-badge ' + band.cls + '">' +
        r.percent + '% — ' + band.label +
      '</span></td>' +
      '<td>' + formatTime(r.timeTaken) + '</td>' +
      '<td>' + formatDate(r.date) + '</td>' +
      '<td><button class="retake-link" onclick="retakeSubject(\'' +
        r.subject + '\')">Retake</button></td>' +
      '</tr>';
  });

  tbody.innerHTML = html;
}

// ── Filters ───────────────────────────────────
function applyFilters() {
  var subjectVal = document.getElementById('subjectFilter').value;
  var sortVal    = document.getElementById('sortOrder').value;
  var records    = getAllHistory();

  if (subjectVal !== 'all') {
    records = records.filter(function(r) { return r.subject === subjectVal; });
  }

  switch (sortVal) {
    case 'newest':
      records.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
      break;
    case 'oldest':
      records.sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
      break;
    case 'highest':
      records.sort(function(a, b) { return b.percent - a.percent; });
      break;
    case 'lowest':
      records.sort(function(a, b) { return a.percent - b.percent; });
      break;
  }

  renderTable(records);
}

// ── Retake ────────────────────────────────────
function retakeSubject(subject) {
  sessionStorage.setItem('selectedSubject', subject);
  window.location.href = 'quiz.html';
}

// ── Clear history ─────────────────────────────
document.getElementById('clearBtn').addEventListener('click', function() {
  if (!confirm('Are you sure you want to delete all quiz history? This cannot be undone.')) return;
  localStorage.removeItem(HISTORY_KEY);
  init();
});

document.getElementById('subjectFilter').addEventListener('change', applyFilters);
document.getElementById('sortOrder').addEventListener('change', applyFilters);

// ── Init ─────────────────────────────────────
function init() {
  var all = getAllHistory();
  document.getElementById('historySubtitle').textContent =
    all.length === 0
      ? 'You have not completed any quizzes yet.'
      : 'You have completed ' + all.length + ' quiz' +
        (all.length > 1 ? 'zes' : '') + '.';
  renderStats(all);
  applyFilters();
}

init();