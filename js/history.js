// =============================================
//  QUIZPREP — Score History Logic
//  Stage 6
// =============================================

// ─────────────────────────────────────────────
//  1. AUTH GUARD
// ─────────────────────────────────────────────

const currentUser = JSON.parse(
  localStorage.getItem('qp_current') || 'null'
);

if (!currentUser) {
  sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
  window.location.href = 'login.html';
}


// ─────────────────────────────────────────────
//  2. CONSTANTS & HELPERS
// ─────────────────────────────────────────────

const HISTORY_KEY = 'qp_history';

// Friendly subject display names
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
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDate(isoString) {
  const d = new Date(isoString);
  // e.g. "01 Jun 2025, 21:34"
  return d.toLocaleDateString('en-GB', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric'
  }) + ', ' + d.toLocaleTimeString('en-GB', {
    hour:   '2-digit',
    minute: '2-digit'
  });
}

function getPerformanceBand(percent) {
  if (percent >= 80) return { label: 'Excellent', cls: 'excellent' };
  if (percent >= 50) return { label: 'Good',      cls: 'good' };
  return               { label: 'Poor',      cls: 'poor' };
}

// Read all history records for the current user
function getUserHistory() {
  const all = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  return all.filter(r => r.userId === currentUser.id);
}


// ─────────────────────────────────────────────
//  3. SAVE A RESULT (called from results.js)
//  We expose this as a global so results.js can call it
// ─────────────────────────────────────────────

function saveResult(subject, score, total, timeTaken) {
  const percent = Math.round((score / total) * 100);

  const record = {
    userId:    currentUser.id,
    subject,
    score,
    total,
    percent,
    timeTaken,
    date: new Date().toISOString()
  };

  const all = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  all.push(record);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(all));
}


// ─────────────────────────────────────────────
//  4. SUMMARY STATS
// ─────────────────────────────────────────────

function renderStats(records) {
  const total = records.length;

  document.getElementById('hsTotalQuizzes').textContent = total;

  if (total === 0) {
    document.getElementById('hsAvgScore').textContent  = '—';
    document.getElementById('hsBestScore').textContent = '—';
    document.getElementById('hsFavSubject').textContent = '—';
    return;
  }

  // Average score
  const avg = Math.round(
    records.reduce((sum, r) => sum + r.percent, 0) / total
  );
  document.getElementById('hsAvgScore').textContent = avg + '%';

  // Best score
  const best = Math.max(...records.map(r => r.percent));
  document.getElementById('hsBestScore').textContent = best + '%';

  // Most practised subject
  // Count how many times each subject appears
  const counts = {};
  records.forEach(r => {
    counts[r.subject] = (counts[r.subject] || 0) + 1;
  });

  // Find the subject with the highest count
  const favourite = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])[0][0];

  document.getElementById('hsFavSubject').textContent =
    SUBJECT_NAMES[favourite] || favourite;
}


// ─────────────────────────────────────────────
//  5. RENDER TABLE ROWS
// ─────────────────────────────────────────────

function renderTable(records) {
  const tbody      = document.getElementById('historyBody');
  const emptyState = document.getElementById('historyEmpty');
  const tableWrap  = document.querySelector('.history-table-wrap');

  if (records.length === 0) {
    tableWrap.classList.add('hidden');
    emptyState.classList.remove('hidden');
    return;
  }

  tableWrap.classList.remove('hidden');
  emptyState.classList.add('hidden');

  let html = '';

  records.forEach((r, i) => {
    const band    = getPerformanceBand(r.percent);
    const subject = SUBJECT_NAMES[r.subject] || r.subject;

    html += `
      <tr>
        <td>${i + 1}</td>
        <td class="td-subject">${subject}</td>
        <td class="td-score">${r.score} / ${r.total}</td>
        <td>
          <span class="result-badge ${band.cls}">
            ${r.percent}% — ${band.label}
          </span>
        </td>
        <td>${formatTime(r.timeTaken)}</td>
        <td>${formatDate(r.date)}</td>
        <td>
          <button class="retake-link"
                  onclick="retakeSubject('${r.subject}')">
            Retake
          </button>
        </td>
      </tr>`;
  });

  tbody.innerHTML = html;
}


// ─────────────────────────────────────────────
//  6. APPLY FILTERS AND SORT
// ─────────────────────────────────────────────

function applyFilters() {
  const subjectVal = document.getElementById('subjectFilter').value;
  const sortVal    = document.getElementById('sortOrder').value;

  // Start with this user's full history
  let records = getUserHistory();

  // Filter by subject
  if (subjectVal !== 'all') {
    records = records.filter(r => r.subject === subjectVal);
  }

  // Sort
  switch (sortVal) {
    case 'newest':
      records.sort((a, b) => new Date(b.date) - new Date(a.date));
      break;
    case 'oldest':
      records.sort((a, b) => new Date(a.date) - new Date(b.date));
      break;
    case 'highest':
      records.sort((a, b) => b.percent - a.percent);
      break;
    case 'lowest':
      records.sort((a, b) => a.percent - b.percent);
      break;
  }

  renderTable(records);
}


// ─────────────────────────────────────────────
//  7. RETAKE A SUBJECT FROM HISTORY
// ─────────────────────────────────────────────

function retakeSubject(subject) {
  sessionStorage.setItem('selectedSubject', subject);
  window.location.href = 'quiz.html';
}


// ─────────────────────────────────────────────
//  8. CLEAR HISTORY
// ─────────────────────────────────────────────

document.getElementById('clearBtn').addEventListener('click', () => {
  if (!confirm(
    'Are you sure you want to delete all your quiz history? This cannot be undone.'
  )) return;

  // Remove only this user's records — keep other users' data intact
  const all     = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  const others  = all.filter(r => r.userId !== currentUser.id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(others));

  // Re-render the page
  init();
});


// ─────────────────────────────────────────────
//  9. FILTER & SORT LISTENERS
// ─────────────────────────────────────────────

document.getElementById('subjectFilter')
  .addEventListener('change', applyFilters);

document.getElementById('sortOrder')
  .addEventListener('change', applyFilters);


// ─────────────────────────────────────────────
//  10. INITIALISE
// ─────────────────────────────────────────────

function init() {
  const allRecords = getUserHistory();

  // Update subtitle
  document.getElementById('historySubtitle').textContent =
    allRecords.length === 0
      ? 'You have not completed any quizzes yet.'
      : `You have completed ${allRecords.length} quiz${allRecords.length > 1 ? 'zes' : ''}.`;

  // Render summary stats using the full unfiltered data
  renderStats(allRecords);

  // Render the table (sorted newest first by default)
  applyFilters();
}

init();