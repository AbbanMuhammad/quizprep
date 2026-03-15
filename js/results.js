// =============================================
//  QUIZPREP — Results Logic
//  Stage 4
// =============================================

// ─────────────────────────────────────────────
//  1. LOAD RESULTS FROM SESSIONSTORAGE
// ─────────────────────────────────────────────

// Read the results object that quiz.js saved on submit
const stored = sessionStorage.getItem('quizResults');

// If nothing is stored the user navigated here directly —
// send them back to the selection screen
if (!stored) {
  window.location.href = 'quiz-select.html';
}

// JSON.parse converts the stored string back into a JS object
const results = JSON.parse(stored);

// Destructure for easier access throughout the file
const { subject, questions, userAnswers, score, total, timeTaken } = results;


// ─────────────────────────────────────────────
//  2. HELPER — Format seconds as m:ss
// ─────────────────────────────────────────────

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}


// ─────────────────────────────────────────────
//  3. SCORE HERO — Ring + message
// ─────────────────────────────────────────────

const percentage = Math.round((score / total) * 100);

// ── Animated ring ──
// The ring's circumference is 2πr = 2 × π × 52 ≈ 327
// stroke-dashoffset controls how much of the ring is visible:
//   327 = fully hidden (0%)
//   0   = fully visible (100%)
const CIRCUMFERENCE = 327;
const offset = CIRCUMFERENCE - (percentage / 100) * CIRCUMFERENCE;

const ringFill  = document.getElementById('ringFill');
const scoreRing = document.getElementById('scoreRing');

// Use a tiny timeout so the CSS transition actually animates
// (if we set it immediately it won't animate from 0)
setTimeout(() => {
  ringFill.style.strokeDashoffset = offset;
}, 100);

// Colour the ring based on the score band
if (percentage >= 80) {
  scoreRing.classList.add('excellent');
} else if (percentage >= 50) {
  scoreRing.classList.add('good');
} else {
  scoreRing.classList.add('poor');
}

// ── Score numbers ──
document.getElementById('scorePct').textContent = percentage + '%';
document.getElementById('scoreRaw').textContent = `${score} / ${total}`;

// ── Subject label ──
document.getElementById('resultSubject').textContent =
  subject.charAt(0).toUpperCase() + subject.slice(1);

// ── Performance message ──
let message;
if (percentage >= 80) {
  message = 'Excellent! You\'re well prepared.';
} else if (percentage >= 50) {
  message = 'Good effort! Keep practising.';
} else {
  message = 'Keep going! Consistent practice leads to success.';
}
document.getElementById('resultMessage').textContent = message;

// ── Time taken ──
document.getElementById('resultTime').textContent =
  `Time taken: ${formatTime(timeTaken)}`;


// ─────────────────────────────────────────────
//  4. STATS BAR
// ─────────────────────────────────────────────

// Count wrong and skipped separately
let wrong   = 0;
let skipped = 0;

questions.forEach((q, i) => {
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


// ─────────────────────────────────────────────
//  5. BUILD REVIEW CARDS
// ─────────────────────────────────────────────

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

function getQuestionResult(i) {
  if (userAnswers[i] === null)          return 'skipped';
  if (userAnswers[i] === questions[i].answer) return 'correct';
  return 'wrong';
}

function buildReviewCards(filter = 'all') {
  const reviewList = document.getElementById('reviewList');
  let html = '';

  questions.forEach((q, i) => {
    const result     = getQuestionResult(i);
    const userAnswer = userAnswers[i];

    // Apply filter — skip cards that don't match
    if (filter !== 'all' && result !== filter) return;

    // Build the options HTML
    let optionsHtml = '';
    q.options.forEach((optText, optIndex) => {
      const isCorrect  = optIndex === q.answer;
      const isUserPick = optIndex === userAnswer;
      const isWrong    = isUserPick && !isCorrect;

      // Decide which classes and tags to apply
      let optClass = 'review-option';
      let tag      = '';

      if (isCorrect) {
        optClass += ' is-correct';
        tag = '<span class="review-option__tag">Correct answer</span>';
      }
      if (isWrong) {
        optClass += ' user-wrong';
        tag = '<span class="review-option__tag">Your answer</span>';
      }

      optionsHtml += `
        <div class="${optClass}">
          <span class="review-option__letter">${OPTION_LETTERS[optIndex]}</span>
          <span>${optText}</span>
          ${tag}
        </div>`;
    });

    // Badge text
    const badgeText = result === 'correct' ? '✓ Correct'
                    : result === 'wrong'   ? '✗ Wrong'
                    : '— Skipped';

    // Skipped: show which was correct in the header
    const skippedNote = result === 'skipped'
      ? `<p style="margin-top:0.75rem;font-size:var(--fs-sm);
                   color:var(--color-text-muted);">
           You did not answer this question.
           The correct answer was
           <strong>${q.options[q.answer]}</strong>.
         </p>`
      : '';

    html += `
      <div class="review-card ${result}" data-result="${result}">

        <div class="review-card__header"
             onclick="toggleReviewCard(this)">
          <div class="review-card__meta">
            <span class="review-card__num">Q${i + 1}</span>
            <span class="review-card__question">${q.question}</span>
          </div>
          <span class="review-badge ${result}">${badgeText}</span>
          <span class="review-card__chevron">&#9660;</span>
        </div>

        <div class="review-card__body">
          <div class="review-options">${optionsHtml}</div>
          ${skippedNote}
        </div>

      </div>`;
  });

  // If nothing matched the filter show a message
  if (html === '') {
    html = `<p style="text-align:center;color:var(--color-text-muted);
                      padding:var(--space-xl) 0;">
              No questions in this category.
            </p>`;
  }

  reviewList.innerHTML = html;
}

// Build the full list on page load
buildReviewCards('all');


// ─────────────────────────────────────────────
//  6. TOGGLE INDIVIDUAL REVIEW CARDS
// ─────────────────────────────────────────────

// We use a global function here because the cards are
// created dynamically — we can't attach event listeners
// before they exist. onclick="toggleReviewCard(this)"
// calls this function from inside the generated HTML.
function toggleReviewCard(header) {
  const body    = header.nextElementSibling;
  const chevron = header.querySelector('.review-card__chevron');

  body.classList.toggle('open');
  chevron.classList.toggle('open');
}


// ─────────────────────────────────────────────
//  7. REVIEW FILTERS
// ─────────────────────────────────────────────

const filterBtns = document.querySelectorAll('.review-filter');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // Update active state
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Rebuild cards with the new filter
    buildReviewCards(btn.dataset.filter);
  });
});


// ─────────────────────────────────────────────
//  8. RETAKE QUIZ
// ─────────────────────────────────────────────

document.getElementById('retakeBtn').addEventListener('click', () => {
  // The subject is still in sessionStorage from the original selection.
  // We just navigate back to quiz.html — it reads the subject and
  // starts fresh with a new shuffle automatically.
  window.location.href = 'quiz.html';
});