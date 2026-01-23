/* script.js - LIQUID GLASS EDITION */

// HTML Sanitization Helper
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

window.addEventListener('firebase-ready', () => { initApp(); });
document.addEventListener('DOMContentLoaded', () => { initApp(); });

const QUIZ_DATA = [
    { q: "Agenda 2030 is regarded as the global treaty of the future because the 17 goals ensure that:", options: ["The world is becoming suitable for grandchildren", "Climate change is stopped", "People are living in peace"], ans: 0, exp: "The goals ensure resources are preserved so the world remains suitable for future generations (grandchildren)." },
    { q: "193 states have signed Agenda 2030. What about the other states (e.g., Kosovo)?", options: ["They are against it", "Their status is controversial/Not recognized by UN", "They don't want to join"], ans: 1, exp: "Some states like Kosovo have controversial status and are not recognized by the UN as independent states." },
    { q: "Which SDG is considered the greatest global challenge?", options: ["Global energy transformation", "Eradicate poverty worldwide", "Education for all"], ans: 1, exp: "SDG 1: No Poverty is widely considered the primary and greatest global challenge." },
    { q: "The Sustainable Development Goals (SDGs) relate to:", options: ["All countries", "Rich countries", "Poor countries"], ans: 0, exp: "SDGs apply to all countries universally, regardless of their economic status." },
    { q: "How many Sustainable Development Goals are there?", options: ["9", "17", "23"], ans: 1, exp: "There are 17 goals adopted by the UN in 2015 to be achieved by 2030." },
    { q: "The three pillars of sustainable development are:", options: ["Love, peace, joy", "Stock market, banks, companies", "Society, economy, environment"], ans: 2, exp: "Sustainability relies on the balance of Social, Economic, and Environmental factors (The Triple Bottom Line)." },
    { q: "What year has the UN set for achieving the SDGs?", options: ["2015", "2030", "2050"], ans: 1, exp: "The agenda is explicitly titled 'Agenda 2030'." },
    { q: "What can you do to consume more responsibly (SDG12)?", options: ["Buy new clothes every season", "Repair appliances that no longer work", "Throw away unused things"], ans: 1, exp: "Repairing reduces waste and consumption, which aligns with SDG 12: Responsible Consumption and Production." },
    { q: "Which of these is NOT an SDG?", options: ["Decent work and economic growth", "Profit maximization and cheap labor", "Industry, innovation and infrastructure"], ans: 1, exp: "Profit maximization at the cost of cheap labor violates the principles of decent work and equality." },
    { q: "What is sustainable development?", options: ["Meeting present needs without compromising future", "Conserving resources", "Eco-friendly models", "All of the above"], ans: 3, exp: "It encompasses all these aspects: intergenerational equity, resource conservation, and eco-friendly practices." },
    { q: "Social + Economic Sustainability =", options: ["Equitable", "Bearable", "Viable", "None"], ans: 0, exp: "When something is socially and economically sound, it is considered 'Equitable'." },
    { q: "Sustainability refers to a process that can be maintained indefinitely.", options: ["True", "False"], ans: 0, exp: "Sustainability literally means the ability to be maintained at a certain rate or level." },
    { q: "Which is NOT an objective of sustainable development?", options: ["Family planning", "Balance of arable land", "Catastrophic transformation of environment"], ans: 2, exp: "Sustainable development aims to prevent catastrophic damage, not cause it." },
    { q: "Primary Goals of Sustainability include:", options: ["End of poverty", "Gender equality", "Sustainable economic growth", "All of the above"], ans: 3, exp: "These are all core components of the 17 SDGs." },
    { q: "In which year did the term 'Sustainable Development' come into existence?", options: ["1987", "1980", "1992"], ans: 1, exp: "The term was popularized in 1980 (World Conservation Strategy) and later defined in the Brundtland Report (1987)." },
    { q: "The UN Commission on Sustainable Development (CSD) was established in:", options: ["1992", "1993", "1995"], ans: 0, exp: "It was established by the UN General Assembly in 1992." },
    { q: "Which commission reviews Agenda 21 progress?", options: ["UN Disarmament Commission", "UN Statistical Commission", "UN CSD"], ans: 2, exp: "The CSD was specifically created to monitor Agenda 21." },
    { q: "Parameters of sustainable development help to:", options: ["Understand the concept", "Point out problems", "Take policy measures", "All of the above"], ans: 3, exp: "Parameters provide the metrics needed to understand, identify issues, and create policy." },
    { q: "Which is included in parameters of sustainable development?", options: ["Carrying capacity", "Inter-generation equity", "Gender disparity", "All of the above"], ans: 3, exp: "All these factors are critical measures of a sustainable society." },
    { q: "What is the 'triple bottom line'?", options: ["Profit, product, people", "Economic, environmental, social factors", "Business, government, community"], ans: 1, exp: "TBL is defined as People (Social), Planet (Environmental), and Profit (Economic)." }
];

let currentQuestionIndex = 0;
let currentScore = 0;
let currentUserRoll = "";
let isLocked = false;
let userDepartment = "";
let userFullName = "";

function initApp() {
    // Only run if we are on the quiz page
    if (document.getElementById('question-text')) {
        // Setup initial UI states
        const deptSelect = document.getElementById('departmentSelect');
        if (deptSelect) {
            setupDeptSelection();
        }
    }
}

// Called from form.html auth check
window.initQuiz = function (rollNumber) {
    currentUserRoll = rollNumber;
    // Don't auto-load here if we want to ensure dept selection first.
    // The loadQuestion(0) will check dept selection visibility.
    loadQuestion(0);
};

// --- QUIZ LOGIC ---

function setupDeptSelection() {
    const select = document.getElementById('departmentSelect');
    const btn = document.getElementById('startQuizBtn');

    if (!select || !btn) return;

    // Prevent double initialization
    if (select.dataset.initialized === 'true') return;
    select.dataset.initialized = 'true';

    // Check initial state (browser refresh might keep value)
    if (select.value) {
        btn.disabled = false;
    }

    // Robust listener
    select.addEventListener('change', () => {
        if (select.value) btn.disabled = false;
    });

    // Start Button
    btn.onclick = () => {
        if (!select.value) return;

        userDepartment = select.value;
        const overlay = document.getElementById('dept-selection');

        // Fetch user context
        if (window.firebase?.auth && window.firebase.auth().currentUser) {
            userFullName = window.firebase.auth().currentUser.displayName || "";
        }

        // Hide overlay with fade
        if (overlay) {
            overlay.style.transition = 'opacity 0.5s ease';
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 500);
        }

        // Ensure we load Q0 properly
        loadQuestion(0);
    };
}

function loadQuestion(index) {
    if (index === 0 && !userDepartment) {
        const overlay = document.getElementById('dept-selection');
        if (overlay) overlay.style.display = 'flex';
        return;
    }

    const q = QUIZ_DATA[index];
    currentQuestionIndex = index;
    isLocked = false;

    // UI Updates
    document.getElementById('question-text').textContent = q.q;
    document.getElementById('q-current').textContent = index + 1;
    document.getElementById('explanation-text').textContent = q.exp;

    // Reset Insight Panel
    const insightPanel = document.getElementById('insight-panel');
    if (insightPanel) {
        insightPanel.classList.remove('open');
        insightPanel.style.maxHeight = '0';
    }

    // Reset Buttons/Actions
    document.getElementById('viewExplBtn').style.display = 'none';
    document.getElementById('nextBtn').style.display = 'none';
    document.getElementById('skipBtn').style.display = 'block';

    // Build Options
    const optsContainer = document.getElementById('options-container');
    optsContainer.innerHTML = '';

    q.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = `<span>${String.fromCharCode(65 + i)}.</span> <span style="margin-left:8px">${opt}</span>`;
        btn.onclick = () => handleAnswer(i, index, btn);
        optsContainer.appendChild(btn);
    });

    // Handle "Next" or "Submit" logic
    const nextBtn = document.getElementById('nextBtn');
    nextBtn.textContent = (index === QUIZ_DATA.length - 1) ? 'Submit Quiz' : 'Next';
    nextBtn.onclick = () => {
        if (index < QUIZ_DATA.length - 1) loadQuestion(index + 1);
        else finishQuiz();
    };

    // View Explanation Logic
    document.getElementById('viewExplBtn').onclick = () => {
        toggleExplanation();
    };

    // Skip Logic
    document.getElementById('skipBtn').onclick = () => {
        handleAnswer(-1, index, null);
    };
}

function toggleExplanation() {
    const p = document.getElementById('insight-panel');
    p.classList.toggle('open');
}

function handleAnswer(selectedIndex, qIndex, btn) {
    if (isLocked) return;
    isLocked = true;

    const correctIndex = QUIZ_DATA[qIndex].ans;
    const opts = document.getElementById('options-container').children;

    // 1. Scoring & Styling
    if (selectedIndex === -1) {
        // SKIP
        showToast("Skipped (0)", "popup-skip");
        opts[correctIndex].classList.add('correct'); // Reveal correct
    } else if (selectedIndex === correctIndex) {
        // CORRECT
        currentScore += 5;
        btn.classList.add('correct');
        showToast("Correct! +5", "popup-correct");
    } else {
        // WRONG
        currentScore -= 1;
        btn.classList.add('wrong');
        opts[correctIndex].classList.add('correct'); // Reveal correct
        showToast("Incorrect! -1", "popup-wrong");
    }

    // 2. Update Score UI
    document.getElementById('current-score').textContent = currentScore;

    // 3. Disable all options
    Array.from(opts).forEach(o => o.disabled = true);

    // 4. Show Footer Actions
    document.getElementById('skipBtn').style.display = 'none';
    document.getElementById('nextBtn').style.display = 'block';

    // Always allow viewing explanation after answer
    document.getElementById('viewExplBtn').style.display = 'block';
}

function showToast(msg, className) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = msg;
    toast.className = `popup-toast show ${className}`;

    // Remove classes after animation to reset
    setTimeout(() => {
        toast.className = 'popup-toast';
    }, 2000);
}

// --- SUBMISSION LOGIC ---

let isSubmitting = false;

async function finishQuiz() {
    if (isSubmitting) return;
    isSubmitting = true;

    const user = window.firebase?.auth()?.currentUser;
    if (!user) {
        showErrorToast('You must be logged in to submit.');
        isSubmitting = false;
        return;
    }

    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) loadingOverlay.style.display = 'flex';

    const submissionData = {
        userId: user.uid,
        uid: user.uid,
        roll: currentUserRoll,
        fullName: userFullName || user.displayName || "Anonymous",
        department: userDepartment || "General",
        score: currentScore,
        totalQuizScore: QUIZ_DATA.length * 5,
        pledge: `Final Score: ${currentScore}`,
        status: 'submitted',
        payload: {
            questionsAnswered: QUIZ_DATA.length,
            score: currentScore,
            maxScore: QUIZ_DATA.length * 5,
            department: userDepartment
        },
        createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        if (!window.db) throw new Error('Database not initialized');
        await window.db.collection('pledges').add(submissionData);

        if (loadingOverlay) loadingOverlay.style.display = 'none';
        showSuccessScreen(currentScore, QUIZ_DATA.length * 5);

    } catch (error) {
        console.error('Submission error:', error);
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        showErrorToast('Failed to save score. Please try again.');
        isSubmitting = false;
    }
}

function showSuccessScreen(score, maxScore) {
    const successScreen = document.getElementById('success-screen');
    const finalScoreEl = document.getElementById('finalScore');
    const maxScoreEl = document.getElementById('maxScore');
    const retakeBtn = document.getElementById('retakeQuizBtn');

    if (finalScoreEl) finalScoreEl.textContent = score;
    if (maxScoreEl) maxScoreEl.textContent = maxScore;
    if (successScreen) successScreen.style.display = 'flex';

    if (retakeBtn) {
        retakeBtn.onclick = resetQuiz;
    }
}

function resetQuiz() {
    document.getElementById('success-screen').style.display = 'none';
    currentQuestionIndex = 0;
    currentScore = 0;
    isSubmitting = false;
    isLocked = false;
    userDepartment = "";

    document.getElementById('current-score').textContent = '0';

    // Show Dept Selection Again
    const overlay = document.getElementById('dept-selection');
    if (overlay) {
        overlay.style.display = 'flex';
        overlay.style.opacity = '1';
    }
    document.getElementById('departmentSelect').value = ""; // Reset dropdown
    document.getElementById('startQuizBtn').disabled = true;

    loadQuestion(0);
}

function showErrorToast(message) {
    const errorToast = document.getElementById('error-toast');
    if (errorToast) {
        document.getElementById('error-message').textContent = message;
        errorToast.style.display = 'block';
        setTimeout(() => { errorToast.style.display = 'none'; }, 4000);
    }
}

// Deprecated or Unused
function setupAuthPage() { }
function setupLiveDashboard() { } // Handled in dashboard.js

window.logout = function () {
    if (window.firebase?.auth) {
        window.firebase.auth().signOut().then(() => window.location.href = 'index.html');
    } else {
        window.location.href = 'index.html';
    }
};