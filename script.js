let allQuestions = [];
let currentQuestionIndex = 0;
let currentQuestions = [];

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
    document.getElementById('answerText').classList.add('hidden');
}

// Go to next question
function nextQuestion() {
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
}

// Navigate to questions
function goToQuestions() {
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
}

// Event listeners
document.getElementById('logoScreen').addEventListener('click', goToQuestions);
document.getElementById('questionScreen').addEventListener('click', nextQuestion);

// Keyboard navigation - any key advances
document.addEventListener('keydown', (e) => {
    if (document.getElementById('questionScreen').classList.contains('hidden')) return;
    
    nextQuestion();
});

// Load questions when page loads
window.addEventListener('DOMContentLoaded', () => {
    loadQuestions().then(() => {
        startApp();
    });
});
