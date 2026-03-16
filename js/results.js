// =============================================
//  QUIZPREP — Results Logic
// =============================================

const stored = sessionStorage.getItem('quizResults');
if (!stored) { window.location.href = 'quiz-select.html'; }

const results = JSON.parse(stored);
const { subject, questions, userAnswers, score, total, timeTaken } = results;

// ── Save to history ───────────────────────────
(function saveToHistory() {
  var record = {
    subject:   subject,
    score:     score,
    total:     total,
    percent:   Math.round((score / total) * 100),
    timeTaken: timeTaken,
    date:      new Date().toISOString()
  };
  var all = JSON.parse(localStorage.getItem('qp_history') || '[]');
  all.push(record);
  localStorage.setItem('qp_history', JSON.stringify(all));
})();


// ── Helpers ───────────────────────────────────
function formatTime(seconds) {
  var m = Math.floor(seconds / 60);
  var s = seconds % 60;
  return m + ':' + String(s).padStart(2, '0');
}

const percentage    = Math.round((score / total) * 100);
const CIRCUMFERENCE = 327;
const offset        = CIRCUMFERENCE - (percentage / 100) * CIRCUMFERENCE;

const ringFill  = document.getElementById('ringFill');
const scoreRing = document.getElementById('scoreRing');

setTimeout(function() {
  ringFill.style.strokeDashoffset = offset;
}, 100);

if (percentage >= 80) {
  scoreRing.classList.add('excellent');
} else if (percentage >= 50) {
  scoreRing.classList.add('good');
} else {
  scoreRing.classList.add('poor');
}

document.getElementById('scorePct').textContent = percentage + '%';
document.getElementById('scoreRaw').textContent = score + ' / ' + total;
document.getElementById('resultSubject').textContent =
  subject.charAt(0).toUpperCase() + subject.slice(1);

var message;
if (percentage >= 80) {
  message = 'Excellent! You\'re well prepared.';
} else if (percentage >= 50) {
  message = 'Good effort! Keep practising.';
} else {
  message = 'Keep going! Consistent practice leads to success.';
}
document.getElementById('resultMessage').textContent = message;
document.getElementById('resultTime').textContent =
  'Time taken: ' + formatTime(timeTaken);

// ── Stats bar ─────────────────────────────────
var wrong   = 0;
var skipped = 0;

questions.forEach(function(q, i) {
  if (userAnswers[i] === null) {
    skipped++;
  } else if (userAnswers[i] !== q.answer) {
    wrong++;
  }
});

document.getElementById('statCorrect').textContent = score;
document.getElementById('statWrong').textContent   = wrong;
document.getElementById('statSkipped').textContent = skipped;
document.getElementById('statTime').textContent    = formatTime(timeTaken);


// ── Review cards ─────────────────────────────
const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

function getQuestionResult(i) {
  if (userAnswers[i] === null)               return 'skipped';
  if (userAnswers[i] === questions[i].answer) return 'correct';
  return 'wrong';
}

function buildReviewCards(filter) {
  filter = filter || 'all';
  var html = '';

  questions.forEach(function(q, i) {
    var result     = getQuestionResult(i);
    var userAnswer = userAnswers[i];

    if (filter !== 'all' && result !== filter) return;

    var optionsHtml = '';
    q.options.forEach(function(optText, optIndex) {
      var isCorrect  = optIndex === q.answer;
      var isUserPick = optIndex === userAnswer;
      var isWrong    = isUserPick && !isCorrect;

      var cls = 'review-option';
      var tag = '';

      if (isCorrect) {
        cls += ' is-correct';
        tag  = '<span class="review-option__tag">Correct answer</span>';
      }
      if (isWrong) {
        cls += ' user-wrong';
        tag  = '<span class="review-option__tag">Your answer</span>';
      }

      optionsHtml +=
        '<div class="' + cls + '">' +
        '<span class="review-option__letter">' + OPTION_LETTERS[optIndex] + '</span>' +
        '<span>' + optText + '</span>' +
        tag +
        '</div>';
    });

    var badgeText = result === 'correct' ? '✓ Correct'
                  : result === 'wrong'   ? '✗ Wrong'
                  : '— Skipped';

    var skippedNote = result === 'skipped'
      ? '<p style="margin-top:0.75rem;font-size:var(--fs-sm);color:var(--color-text-muted);">You did not answer this question. The correct answer was <strong>' + q.options[q.answer] + '</strong>.</p>'
      : '';

    html +=
      '<div class="review-card ' + result + '" data-result="' + result + '">' +
      '<div class="review-card__header" onclick="toggleReviewCard(this)">' +
      '<div class="review-card__meta">' +
      '<span class="review-card__num">Q' + (i + 1) + '</span>' +
      '<span class="review-card__question">' + q.question + '</span>' +
      '</div>' +
      '<span class="review-badge ' + result + '">' + badgeText + '</span>' +
      '<span class="review-card__chevron">&#9660;</span>' +
      '</div>' +
      '<div class="review-card__body">' +
      '<div class="review-options">' + optionsHtml + '</div>' +
      skippedNote +
      '</div>' +
      '</div>';
  });

  if (!html) {
    html = '<p style="text-align:center;color:var(--color-text-muted);padding:var(--space-xl) 0;">No questions in this category.</p>';
  }

  document.getElementById('reviewList').innerHTML = html;
}

function toggleReviewCard(header) {
  var body    = header.nextElementSibling;
  var chevron = header.querySelector('.review-card__chevron');
  body.classList.toggle('open');
  chevron.classList.toggle('open');
}

// ── Filter tabs ───────────────────────────────
document.querySelectorAll('.review-filter').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.review-filter')
      .forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    buildReviewCards(btn.dataset.filter);
  });
});

// ── Retake ────────────────────────────────────
document.getElementById('retakeBtn').addEventListener('click', function() {
  window.location.href = 'quiz.html';
});

// ── Init ─────────────────────────────────────
buildReviewCards('all');