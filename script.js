const GROUP_SIZE = 3;
let allQuestions = [];
let currentQuestionIndex = 0;
let currentQuestions = [];
let isProcessing = false;
const IDLE_MS = 60000; // 60 seconds
const DEBUG_IDLE = false;
let idleTimer = null;
let screensaverVisible = false;
let previousState = { logoVisible: true, questionVisible: false };
let resetToStart = false;

// Screensaver animation state (pixels/sec)
let ssX = 0, ssY = 0, ssVX = 0, ssVY = 0;
let ssRAF = null;
let ssLastTime = 0;
// Rare configuration (for EXTRAS & BONUS entries in questions.json)
const RARE_PROBABILITY = 0.12; // 12% chance per question slot to be a 'rare' question
const BONUS_CHANCE = 0.10; // 10% chance per round to swap in a gold (bonus) question

// Fetch questions from JSON
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        const data = await response.json();
        allQuestions = data.questions;
    } catch (error) {
        console.error('Error loading questions:', error);
    }
}

// Get random questions (group size configurable)
function getRandomQuestions(count = GROUP_SIZE) {
    // We pick count questions without replacement and with a bias that makes
    // questions marked with {rare: true} less likely to be chosen.
    const normalPool = allQuestions.filter(q => !q.rare).slice();
    const rarePool = allQuestions.filter(q => q.rare).slice();
    const chosen = [];

    while (chosen.length < count && (normalPool.length > 0 || rarePool.length > 0)) {
        const pickRare = Math.random() < RARE_PROBABILITY;
        let pool = pickRare ? rarePool : normalPool;
        // if selected pool is empty, fallback
        if (pool.length === 0) pool = pickRare ? normalPool : rarePool;
        if (pool.length === 0) break; // no more questions anywhere
        const idx = Math.floor(Math.random() * pool.length);
        const item = pool.splice(idx, 1)[0];
        // ensure we never pick the same id twice
        if (!chosen.find(c => c.id === item.id)) {
            chosen.push(item);
        }
    }
    // If we still don't have enough (e.g. because we ran out of normal/rare), fill with leftovers
    const leftovers = [...normalPool, ...rarePool];
    while (chosen.length < count && leftovers.length > 0) {
        const idx = Math.floor(Math.random() * leftovers.length);
        chosen.push(leftovers.splice(idx, 1)[0]);
    }

    return chosen;
}

// Show current question
function showQuestion() {
    if (currentQuestions.length === 0) return;

    const question = currentQuestions[currentQuestionIndex];
    const qEl = document.getElementById('questionText');
    qEl.textContent = question.question;
    // Apply flashy gold class to bonus questions
    if (question.isBonus) {
        qEl.classList.add('flashy');
    } else {
        qEl.classList.remove('flashy');
    }
    isProcessing = false;
    resetIdleTimer();
}

// Go to next question
function nextQuestion() {
    if (isProcessing) return;
    isProcessing = true;

    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        showQuestion();
    } else {
        // After finishing the group, go back to logo
        goBackToLogo();
    }
}

// Start the app
function startApp() {
    document.getElementById('logoScreen').style.display = 'flex';
    document.getElementById('questionScreen').classList.add('hidden');
    isProcessing = false;
}

// Navigate to questions
function goToQuestions() {
    if (isProcessing) return;
    isProcessing = true;
    
    // If flagged to reset to start, pick the first GROUP_SIZE questions in order
    if (resetToStart && allQuestions.length >= GROUP_SIZE) {
        currentQuestions = allQuestions.slice(0, GROUP_SIZE);
        resetToStart = false;
    } else {
        currentQuestions = getRandomQuestions(GROUP_SIZE);
    }
    // Occasionally, include a bonus (gold) question from the question list
    if (Math.random() < BONUS_CHANCE) {
        const bonusPool = allQuestions.filter(q => q.isBonus && !currentQuestions.find(c => c.id === q.id));
        if (bonusPool.length > 0) {
            const replaceIndex = Math.floor(Math.random() * currentQuestions.length);
            const bonus = bonusPool[Math.floor(Math.random() * bonusPool.length)];
            currentQuestions[replaceIndex] = bonus;
        }
    }
    currentQuestionIndex = 0;
    document.getElementById('logoScreen').style.display = 'none';
    document.getElementById('questionScreen').classList.remove('hidden');
    showQuestion();
}

// Go back to logo
function goBackToLogo() {
    document.getElementById('logoScreen').style.display = 'flex';
    document.getElementById('questionScreen').classList.add('hidden');
    isProcessing = false;
    resetIdleTimer();
}

// Event listeners
const logoScreen = document.getElementById('logoScreen');
const questionScreen = document.getElementById('questionScreen');

logoScreen.addEventListener('click', () => {
    if (isProcessing) return;
    goToQuestions();
}, true);

questionScreen.addEventListener('click', () => {
    if (isProcessing) return;
    nextQuestion();
}, true);

// Screensaver element
const screensaver = document.getElementById('screensaver');

function showScreensaver() {
    if (screensaverVisible) return;
    if (DEBUG_IDLE) console.debug('[screensaver] showScreensaver() called');
    // remember previous state
    previousState.logoVisible = (document.getElementById('logoScreen').style.display !== 'none');
    previousState.questionVisible = !document.getElementById('questionScreen').classList.contains('hidden');

    // hide other screens
    document.getElementById('logoScreen').style.display = 'none';
    document.getElementById('questionScreen').classList.add('hidden');

    screensaver.classList.remove('hidden');
    screensaverVisible = true;

    // start JS-based bounce animation
    const logo = document.getElementById('screensaverLogo');
    if (logo) {
        // place in center using computed sizes
        const w = logo.offsetWidth;
        const h = logo.offsetHeight;
        ssX = Math.max(0, Math.floor((window.innerWidth - w) / 2));
        ssY = Math.max(0, Math.floor((window.innerHeight - h) / 2));

        // DVD-style diagonal start speed (same magnitude on X and Y)
        const baseSpeed = 170 + Math.random() * 60; // px/s
        const signX = Math.random() > 0.5 ? 1 : -1;
        const signY = Math.random() > 0.5 ? 1 : -1;
        ssVX = signX * baseSpeed;
        ssVY = signY * baseSpeed;

        ssLastTime = performance.now();
        if (ssRAF) cancelAnimationFrame(ssRAF);
        ssRAF = requestAnimationFrame(ssAnimate);
    }
}

function hideScreensaver() {
    if (!screensaverVisible) return;
    if (DEBUG_IDLE) console.debug('[screensaver] hideScreensaver() called');
    screensaver.classList.add('hidden');
    screensaverVisible = false;

    // stop animation
    if (ssRAF) {
        cancelAnimationFrame(ssRAF);
        ssRAF = null;
    }

    // restore previous state
    if (previousState.questionVisible) {
        // restore questions screen and reset to group 1 immediately
        document.getElementById('logoScreen').style.display = 'none';
        document.getElementById('questionScreen').classList.remove('hidden');
        if (allQuestions.length >= GROUP_SIZE) {
            currentQuestions = allQuestions.slice(0, GROUP_SIZE);
            currentQuestionIndex = 0;
            showQuestion();
        }
        resetToStart = false; // already applied
    } else if (previousState.logoVisible) {
        document.getElementById('logoScreen').style.display = 'flex';
        document.getElementById('questionScreen').classList.add('hidden');
        // when returning to logo, ensure next round will start at group 1
        resetToStart = true;
    }
    resetIdleTimer();
}

function ssAnimate(now) {
    if (!screensaverVisible) return;
    const logo = document.getElementById('screensaverLogo');
    if (!logo) return;
    const dt = Math.min(0.05, (now - ssLastTime) / 1000); // clamp dt to avoid jumps
    ssLastTime = now;

    ssX += ssVX * dt;
    ssY += ssVY * dt;

    const w = logo.offsetWidth;
    const h = logo.offsetHeight;
    // bounce on edges by reversing velocity
    let hitX = false;
    let hitY = false;
    if (ssX <= 0) {
        ssX = 0;
        ssVX = Math.abs(ssVX);
        hitX = true;
    } else if (ssX + w >= window.innerWidth) {
        ssX = window.innerWidth - w;
        ssVX = -Math.abs(ssVX);
        hitX = true;
    }
    if (ssY <= 0) {
        ssY = 0;
        ssVY = Math.abs(ssVY);
        hitY = true;
    } else if (ssY + h >= window.innerHeight) {
        ssY = window.innerHeight - h;
        ssVY = -Math.abs(ssVY);
        hitY = true;
    }

    // If both axes hit simultaneously -> corner hit: change logo hue (classic DVD effect)
    if (hitX && hitY) {
        const hue = Math.floor(Math.random() * 360);
        logo.style.filter = `hue-rotate(${hue}deg) saturate(1.2)`;
    }

    // use translate3d to avoid layout and be GPU-friendly
    logo.style.transform = `translate3d(${ssX}px, ${ssY}px, 0)`;
    ssRAF = requestAnimationFrame(ssAnimate);
}

// Keep logo within bounds on resize and adapt velocities if necessary
window.addEventListener('resize', () => {
    const logo = document.getElementById('screensaverLogo');
    if (!logo) return;
    const w = logo.offsetWidth;
    const h = logo.offsetHeight;
    const maxX = Math.max(0, window.innerWidth - w);
    const maxY = Math.max(0, window.innerHeight - h);
    // clamp position
    ssX = Math.min(Math.max(0, ssX), maxX);
    ssY = Math.min(Math.max(0, ssY), maxY);
    logo.style.transform = `translate3d(${ssX}px, ${ssY}px, 0)`;
});

function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer);
    if (DEBUG_IDLE) console.debug('[screensaver] resetIdleTimer() — waiting', IDLE_MS, 'ms');
    idleTimer = setTimeout(() => {
        if (DEBUG_IDLE) console.debug('[screensaver] idle timeout reached — showing screensaver');
        showScreensaver();
    }, IDLE_MS);
}

// Activity listeners to reset idle timer and hide screensaver
['click', 'mousemove', 'keydown', 'touchstart'].forEach(evt => {
    document.addEventListener(evt, (e) => {
        // If screensaver visible, hide on any activity
        if (screensaverVisible) {
            hideScreensaver();
            return;
        }
        resetIdleTimer();
    }, { capture: true, passive: true });
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    // Logo screen - Enter to start
    if (!document.getElementById('questionScreen').classList.contains('hidden')) {
        // Question screen - any key advances
        if (isProcessing) return;
        e.preventDefault();
        nextQuestion();
    } else if (document.getElementById('logoScreen').style.display === 'flex') {
        // Logo screen - Enter to start
        if (e.key === 'Enter') {
            if (isProcessing) return;
            e.preventDefault();
            goToQuestions();
        }
    }
}, true);

// Load questions when page loads
window.addEventListener('DOMContentLoaded', () => {
    loadQuestions().then(() => {
        startApp();
        resetIdleTimer();
    });
});
