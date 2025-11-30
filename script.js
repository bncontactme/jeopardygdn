let allQuestions = [];
let currentQuestionIndex = 0;
let currentQuestions = [];
let isProcessing = false;

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

// Get 5 random questions
function getRandomQuestions(count = 5) {
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Show current question
function showQuestion() {
    if (currentQuestions.length === 0) return;

    const question = currentQuestions[currentQuestionIndex];
    document.getElementById('questionText').textContent = question.question;
    isProcessing = false;
}

// Go to next question
function nextQuestion() {
    if (isProcessing) return;
    isProcessing = true;

    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        showQuestion();
    } else {
        // After 5 questions, go back to logo
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
    
    currentQuestions = getRandomQuestions(5);
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
    });
});
