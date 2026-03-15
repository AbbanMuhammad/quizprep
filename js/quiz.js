// =============================================
//  QUIZPREP — Quiz Engine
//  Stage 3
// =============================================

// ─────────────────────────────────────────────
//  1. SETUP — Read state from sessionStorage
// ─────────────────────────────────────────────

const currentUser = JSON.parse(localStorage.getItem('qp_current') || 'null');
if (!currentUser) { window.location.href = 'login.html'; }
updateNav();

// Read which subject the user picked on the selection screen
const subject = sessionStorage.getItem('selectedSubject');

// If no subject is saved (e.g. someone navigated directly to quiz.html),
// send them back to the selection screen
if (!subject || !QUESTIONS[subject]) {
  window.location.href = 'quiz-select.html';
}

// ── Shuffle helper (Fisher-Yates) ──────────────
// We shuffle a deep copy so the original QUESTIONS object is never mutated.
// Each question's options are also shuffled, and the answer index is updated
// to point to the correct option in its new position.
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function prepareQuestions(rawQuestions) {
  // Step 1: shuffle the order of questions
  const shuffled = shuffleArray(rawQuestions);

  // Step 2: for each question, shuffle its options
  // and update the answer index to match the new option order
  return shuffled.map(q => {
    const correctText = q.options[q.answer]; // remember the correct answer text

    const shuffledOptions = shuffleArray(q.options);

    return {
      question: q.question,
      options: shuffledOptions,
      answer: shuffledOptions.indexOf(correctText) // new index of the correct answer
    };
  });
}

// Get the question array for this subject — shuffled fresh every quiz
const questions = prepareQuestions(QUESTIONS[subject]);

// Total quiz duration in seconds: 30 minutes
const QUIZ_DURATION = 60 * 60;

// Track current question index (0-based)
let currentIndex = 0;

// Store user's answer for each question
// null means unanswered, a number means the option they chose
let userAnswers = new Array(questions.length).fill(null);

// Timer state
let timeLeft = QUIZ_DURATION;
let timerInterval = null;


// ─────────────────────────────────────────────
//  2. GRAB DOM ELEMENTS
// ─────────────────────────────────────────────

const subjectLabel    = document.getElementById('subjectLabel');
const timerDisplay    = document.getElementById('timerDisplay');
const timerEl         = document.getElementById('timer');
const progressFill    = document.getElementById('progressFill');
const questionCounter = document.getElementById('questionCounter');
const questionText    = document.getElementById('questionText');
const optionsContainer= document.getElementById('optionsContainer');
const prevBtn         = document.getElementById('prevBtn');
const nextBtn         = document.getElementById('nextBtn');
const quitBtn         = document.getElementById('quitBtn');
const modalOverlay    = document.getElementById('modalOverlay');
const modalText       = document.getElementById('modalText');
const modalCancel     = document.getElementById('modalCancel');
const modalConfirm    = document.getElementById('modalConfirm');


// ─────────────────────────────────────────────
//  3. TIMER
// ─────────────────────────────────────────────

function formatTime(seconds) {
  // Convert total seconds into mm:ss format
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  // padStart(2, '0') makes sure single digits show as "05" not "5"
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function startTimer() {
  // Update the display immediately so it shows 30:00, not a blank
  timerDisplay.textContent = formatTime(timeLeft);

  timerInterval = setInterval(() => {
    timeLeft--;

    // Update the display every second
    timerDisplay.textContent = formatTime(timeLeft);

    // Turn the timer red when less than 5 minutes remain
    if (timeLeft <= 300) {
      timerEl.classList.add('danger');
    }

    // Time is up — auto-submit the quiz
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      submitQuiz();
    }

  }, 1000);
}


// ─────────────────────────────────────────────
//  4. RENDER QUESTION
// ─────────────────────────────────────────────

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

function renderQuestion() {
  const q = questions[currentIndex];

  // ── Update counter and question text ──
  questionCounter.textContent =
    `Question ${currentIndex + 1} of ${questions.length}`;
  questionText.textContent = q.question;

  // ── Update progress bar ──
  // Percentage of questions visited (not necessarily answered)
  const progress = ((currentIndex + 1) / questions.length) * 100;
  progressFill.style.width = progress + '%';

  // ── Render answer options ──
  optionsContainer.innerHTML = ''; // clear previous options

  q.options.forEach((optionText, index) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.dataset.index = index; // store option index on the element

    // If user already answered this question, restore their selection
    if (userAnswers[currentIndex] === index) {
      btn.classList.add('selected');
    }

    // Build inner HTML: letter badge + option text
    btn.innerHTML = `
  <span class="option-label">${OPTION_LETTERS[index]}</span>
  <span>${optionText}</span>
`;
btn.setAttribute('aria-pressed',
  userAnswers[currentIndex] === index ? 'true' : 'false');

    btn.addEventListener('click', () => selectOption(index));
    optionsContainer.appendChild(btn);
  });

  // ── Update navigation buttons ──
  prevBtn.disabled = currentIndex === 0;

  // Last question: change Next to Submit
  if (currentIndex === questions.length - 1) {
    nextBtn.textContent = 'Submit Quiz';
    nextBtn.classList.add('btn--submit');
  } else {
    nextBtn.textContent = 'Next →';
    nextBtn.classList.remove('btn--submit');
  }
}


// ─────────────────────────────────────────────
//  5. HANDLE ANSWER SELECTION
// ─────────────────────────────────────────────

function selectOption(selectedIndex) {
  userAnswers[currentIndex] = selectedIndex;

  const allOptions = optionsContainer.querySelectorAll('.option-btn');
  allOptions.forEach((btn, i) => {
    btn.classList.toggle('selected', i === selectedIndex);
    btn.setAttribute('aria-pressed', i === selectedIndex ? 'true' : 'false');
  });
}


// ─────────────────────────────────────────────
//  6. NAVIGATION
// ─────────────────────────────────────────────

prevBtn.addEventListener('click', () => {
  if (currentIndex > 0) {
    currentIndex--;
    renderQuestion();
  }
});

nextBtn.addEventListener('click', () => {
  if (currentIndex < questions.length - 1) {
    // Not last question — go to next
    currentIndex++;
    renderQuestion();
  } else {
    // Last question — show submit modal
    showModal();
  }
});


// ─────────────────────────────────────────────
//  7. SUBMIT MODAL
// ─────────────────────────────────────────────

function showModal() {
  // Count unanswered questions
  const unanswered = userAnswers.filter(a => a === null).length;

  if (unanswered > 0) {
    modalText.textContent =
      `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}.
       You can still submit — unanswered questions will be marked wrong.`;
  } else {
    modalText.textContent =
      'You have answered all questions. Ready to see your score?';
  }

  modalOverlay.classList.remove('hidden');
}

modalCancel.addEventListener('click', () => {
  modalOverlay.classList.add('hidden');
});

modalConfirm.addEventListener('click', () => {
  clearInterval(timerInterval);
  submitQuiz();
});


// ─────────────────────────────────────────────
//  8. QUIT
// ─────────────────────────────────────────────

quitBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to quit? Your progress will be lost.')) {
    clearInterval(timerInterval);
    window.location.href = 'quiz-select.html';
  }
});


// ─────────────────────────────────────────────
//  9. SUBMIT — Save results and go to results page
// ─────────────────────────────────────────────

function submitQuiz() {
  // Calculate score
  let score = 0;
  questions.forEach((q, i) => {
    if (userAnswers[i] === q.answer) {
      score++;
    }
  });

  // Bundle everything results.js will need
  const results = {
    subject,
    questions,
    userAnswers,
    score,
    total: questions.length,
    timeTaken: QUIZ_DURATION - timeLeft  // seconds the user actually used
  };

  // Save to sessionStorage — results.html will read this
  sessionStorage.setItem('quizResults', JSON.stringify(results));

  // Navigate to results page
  window.location.href = 'results.html';
}


// ─────────────────────────────────────────────
//  10. INITIALISE
// ─────────────────────────────────────────────

// Set the subject label in the top bar
subjectLabel.textContent = subject;

// Render the first question
renderQuestion();

// Start the countdown timer
startTimer();