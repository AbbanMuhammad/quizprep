// =============================================
// QUIZPREP — Quiz Engine (CORRECTED)
// Fixes: All code wrapped in DOMContentLoaded,
//        auth guard moved inside listener,
//        absolute redirect paths
// =============================================
// ── Shuffle helper (Fisher-Yates) ──────────────
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function prepareQuestions(rawQuestions) {
  const shuffled = shuffleArray(rawQuestions);
  return shuffled.map(q => {
    const correctText = q.options[q.answer];
    const shuffledOptions = shuffleArray(q.options);
    return {
      question: q.question,
      options: shuffledOptions,
      answer: shuffledOptions.indexOf(correctText)
    };
  });
}
// ─────────────────────────────────────────────
// FIX: Everything that touches the DOM or calls
// functions from app.js is wrapped in
// DOMContentLoaded so it runs AFTER app.js loads
// and after the DOM is ready.
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  // ─── 1. AUTH GUARD ───
  // FIX: getCurrentUser() is defined in app.js which
  // loads before this file. Calling it inside
  // DOMContentLoaded ensures app.js has executed.
  const currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.href = '/login.html';  // FIX: absolute path
    return;
  }
  // updateNav() is defined in app.js and already called
  // by app.js's own DOMContentLoaded listener, but calling
  // it again here is harmless thanks to the querySelectorAll fix.
  updateNav();
  // ─── 2. READ SELECTED SUBJECT ───
  const subject = sessionStorage.getItem('selectedSubject');
  if (!subject || !QUESTIONS[subject]) {
    window.location.href = '/quiz-select.html';  // FIX: absolute path
    return;
  }
  // ─── 3. PREPARE QUESTIONS ───
  const questions = prepareQuestions(QUESTIONS[subject]);
  const QUIZ_DURATION = 60 * 60; // 60 minutes in seconds
  let currentIndex = 0;
  let userAnswers = new Array(questions.length).fill(null);
  let timeLeft = QUIZ_DURATION;
  let timerInterval = null;
  // ─── 4. GRAB DOM ELEMENTS ───
  // FIX: These are now inside DOMContentLoaded so
  // getElementById won't return null
  const subjectLabel     = document.getElementById('subjectLabel');
  const timerDisplay     = document.getElementById('timerDisplay');
  const timerEl          = document.getElementById('timer');
  const progressFill     = document.getElementById('progressFill');
  const questionCounter  = document.getElementById('questionCounter');
  const questionText     = document.getElementById('questionText');
  const optionsContainer = document.getElementById('optionsContainer');
  const prevBtn          = document.getElementById('prevBtn');
  const nextBtn          = document.getElementById('nextBtn');
  const quitBtn          = document.getElementById('quitBtn');
  const modalOverlay     = document.getElementById('modalOverlay');
  const modalText        = document.getElementById('modalText');
  const modalCancel      = document.getElementById('modalCancel');
  const modalConfirm     = document.getElementById('modalConfirm');
  // ─── 5. TIMER ───
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  function startTimer() {
    timerDisplay.textContent = formatTime(timeLeft);
    timerInterval = setInterval(() => {
      timeLeft--;
      timerDisplay.textContent = formatTime(timeLeft);
      if (timeLeft <= 300) {
        timerEl.classList.add('danger');
      }
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        submitQuiz();
      }
    }, 1000);
  }
  // ─── 6. RENDER QUESTION ───
  const OPTION_LETTERS = ['A', 'B', 'C', 'D'];
  function renderQuestion() {
    const q = questions[currentIndex];
    questionCounter.textContent =
      `Question ${currentIndex + 1} of ${questions.length}`;
    questionText.textContent = q.question;
    const progress = ((currentIndex + 1) / questions.length) * 100;
    progressFill.style.width = progress + '%';
    optionsContainer.innerHTML = '';
    q.options.forEach((optionText, index) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.dataset.index = index;
      if (userAnswers[currentIndex] === index) {
        btn.classList.add('selected');
      }
      btn.innerHTML = `
        <span class="option-letter">${OPTION_LETTERS[index]}</span>
        <span class="option-text">${optionText}</span>
      `;
      btn.setAttribute('aria-pressed',
        userAnswers[currentIndex] === index ? 'true' : 'false');
      btn.addEventListener('click', () => selectOption(index));
      optionsContainer.appendChild(btn);
    });
    prevBtn.disabled = currentIndex === 0;
    if (currentIndex === questions.length - 1) {
      nextBtn.textContent = 'Submit Quiz';
      nextBtn.classList.add('btn--submit');
    } else {
      nextBtn.textContent = 'Next →';
      nextBtn.classList.remove('btn--submit');
    }
  }
  // ─── 7. HANDLE ANSWER SELECTION ───
  function selectOption(selectedIndex) {
    userAnswers[currentIndex] = selectedIndex;
    const allOptions = optionsContainer.querySelectorAll('.option-btn');
    allOptions.forEach((btn, i) => {
      btn.classList.toggle('selected', i === selectedIndex);
      btn.setAttribute('aria-pressed', i === selectedIndex ? 'true' : 'false');
    });
  }
  // ─── 8. NAVIGATION ───
  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      renderQuestion();
    }
  });
  nextBtn.addEventListener('click', () => {
    if (currentIndex < questions.length - 1) {
      currentIndex++;
      renderQuestion();
    } else {
      showModal();
    }
  });
// ─── 9. SUBMIT MODAL ───
  function showModal() {
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
  // ─── 10. QUIT ───
  quitBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to quit? Your progress will be lost.')) {
      clearInterval(timerInterval);
      window.location.href = '/quiz-select.html';  // FIX: absolute path
    }
  });
  // ─── 11. SUBMIT ───
  function submitQuiz() {
    let score = 0;
    questions.forEach((q, i) => {
      if (userAnswers[i] === q.answer) {
        score++;
      }
    });
const results = {
      subject,
      questions,
      userAnswers,
      score,
      total: questions.length,
      timeTaken: QUIZ_DURATION - timeLeft
    };
    sessionStorage.setItem('quizResults', JSON.stringify(results));
    window.location.href = '/results.html';  // FIX: absolute path
  }
  // ─── 12. INITIALISE ───
  subjectLabel.textContent = subject;
  renderQuestion();
  startTimer();
});