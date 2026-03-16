// =============================================
//  QUIZPREP — Quiz Selection Logic
// =============================================

const subjectCards = document.querySelectorAll(".subject-card");
const filterBtns = document.querySelectorAll(".filter-btn");
const startBtns = document.querySelectorAll(".subject-card__btn");
const emptyMsg = document.getElementById("emptyMsg");

// ── Filter ───────────────────────────────────
filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
        filterBtns.forEach(function (b) {
            b.classList.remove("active");
        });
        btn.classList.add("active");

        var filter = btn.dataset.filter;
        var count = 0;

        subjectCards.forEach(function (card) {
            if (filter === "all" || card.dataset.category === filter) {
                card.classList.remove("filtered");
                count++;
            } else {
                card.classList.add("filtered");
            }
        });

        if (count === 0) {
            emptyMsg.classList.remove("hidden");
        } else {
            emptyMsg.classList.add("hidden");
        }
    });
});

// ── Navigate to quiz ─────────────────────────
startBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
        sessionStorage.setItem("selectedSubject", btn.dataset.subject);
        window.location.href = "quiz.html";
    });
});
