let filteredQuestions = [];
let currentQuestionIndex = 0;
let score = 0;

document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
    const skipButton = document.getElementById('skip-button');

    startButton.addEventListener('click', startTest);
    skipButton.addEventListener('click', skipQuestion);
});

function startTest() {
    const questionCountInput = document.getElementById('question-count-input');
    const questionCount = parseInt(questionCountInput.value) || originalQuestions.length;

    filteredQuestions = repeatQuestions(originalQuestions, questionCount);
    filteredQuestions = shuffleArray(filteredQuestions);

    document.getElementById('welcome-screen').style.display = 'none';
    document.getElementById('test-container').style.display = 'block';

    showNextQuestion();
}

function repeatQuestions(questions, count) {
    const repeated = [];
    while (repeated.length < count) {
        repeated.push(...questions);
    }
    return repeated.slice(0, count);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function showNextQuestion() {
    if (currentQuestionIndex >= filteredQuestions.length) {
        showSummary();
        return;
    }

    const question = filteredQuestions[currentQuestionIndex];
    document.getElementById('question-text').innerText = question.question;

    const answersContainer = document.getElementById('answers-container');
    answersContainer.innerHTML = '';

    question.answers.forEach((answer, index) => {
        const button = document.createElement('button');
        button.className = 'button';
        button.innerText = answer;
        button.addEventListener('click', () => handleAnswer(index));
        answersContainer.appendChild(button);
    });
}

function handleAnswer(selectedIndex) {
    const question = filteredQuestions[currentQuestionIndex];
    if (selectedIndex === question.correct) {
        score++;
    }
    currentQuestionIndex++;
    showNextQuestion();
}

function skipQuestion() {
    currentQuestionIndex++;
    showNextQuestion();
}

function showSummary() {
    document.getElementById('test-container').style.display = 'none';

    const summaryContainer = document.getElementById('summary-container');
    summaryContainer.style.display = 'block';
    summaryContainer.innerHTML = `
        <h2>Summary</h2>
        <p>Your score: ${score}/${filteredQuestions.length}</p>
        <button class="button" onclick="location.reload()">Restart</button>
    `;
}
