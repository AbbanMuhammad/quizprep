// =============================================
//  QUIZPREP — Quiz Selection Logic
//  Stage 2
// =============================================

// ── 1. Grab elements we need ──────────────────

// Protect this page — redirect to login if not authenticated
const currentUser = JSON.parse(localStorage.getItem('qp_current') || 'null');
if (!currentUser) { window.location.href = 'login.html'; }
updateNav();

// All the subject cards on the page
const subjectCards = document.querySelectorAll('.subject-card');

// All the filter buttons (All, Science, Arts, Commercial)
const filterBtns = document.querySelectorAll('.filter-btn');

// The "Start Quiz" buttons inside each card
const startBtns = document.querySelectorAll('.subject-card__btn');

// The empty-state message shown when no cards match a filter
const emptyMsg = document.getElementById('emptyMsg');


// ── 2. Filter Logic ───────────────────────────

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {

    // Step 1: Remove "active" from every filter button
    filterBtns.forEach(b => b.classList.remove('active'));

    // Step 2: Mark the clicked button as active
    btn.classList.add('active');

    // Step 3: Read which filter was clicked
    const filter = btn.dataset.filter; // "all" | "science" | "arts" | "commercial"

    // Step 4: Show or hide each card based on its category
    let visibleCount = 0;

    subjectCards.forEach(card => {
      const category = card.dataset.category; // e.g. "science"

      // Show the card if filter is "all" OR if the category matches
      if (filter === 'all' || category === filter) {
        card.classList.remove('filtered'); // show
        visibleCount++;
      } else {
        card.classList.add('filtered');    // hide
      }
    });

    // Step 5: Show or hide the empty-state message
    if (visibleCount === 0) {
      emptyMsg.classList.remove('hidden');
    } else {
      emptyMsg.classList.add('hidden');
    }

  });
});


// ── 3. Navigate to Quiz ───────────────────────

startBtns.forEach(btn => {
  btn.addEventListener('click', () => {

    // Read the subject from data-subject attribute
    const subject = btn.dataset.subject; // e.g. "mathematics"

    // Save it to sessionStorage so quiz.html can read it
    // sessionStorage lasts only for the current browser tab
    sessionStorage.setItem('selectedSubject', subject);

    // Navigate to the quiz page
    window.location.href = 'quiz.html';

  });
});