let filteredQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let detailedResults = []; // Store answers and correctness

// Initialize the application after DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
    const skipButton = document.getElementById('skip-button');
    const nextButton = document.getElementById('next-button');

    if (startButton) startButton.addEventListener('click', startTest);
    if (skipButton) skipButton.addEventListener('click', skipQuestion);
    if (nextButton) nextButton.addEventListener('click', handleNext);
});

function startTest() {
    const questionCountInput = document.getElementById('question-count-input');
    const questionCount = parseInt(questionCountInput.value) || originalQuestions.length;

    // Prepare questions
    filteredQuestions = shuffleArray(repeatQuestions(originalQuestions, questionCount));
    currentQuestionIndex = 0;
    score = 0;
    detailedResults = [];

    // Display the test interface
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

    document.getElementById('next-button').style.display = 'none';
}

function handleAnswer(selectedIndex) {
    const question = filteredQuestions[currentQuestionIndex];
    const answersContainer = document.getElementById('answers-container');
    const nextButton = document.getElementById('next-button');

    // Highlight correct and incorrect answers
    answersContainer.childNodes.forEach((button, index) => {
        if (index === question.correct) {
            button.style.backgroundColor = 'green'; // Correct answer
        } else if (index === selectedIndex) {
            button.style.backgroundColor = 'red'; // Incorrect answer
        }
        button.disabled = true; // Disable all buttons after answering
    });

    // Record result
    detailedResults.push({
        question: question.question,
        answers: question.answers,
        correct: question.correct,
        selected: selectedIndex,
        isCorrect: selectedIndex === question.correct,
    });

    if (selectedIndex === question.correct) {
        score++;
    }

    nextButton.style.display = 'inline-block'; // Show "Next" button
}

function skipQuestion() {
    const question = filteredQuestions[currentQuestionIndex];

    // Record skipped question
    detailedResults.push({
        question: question.question,
        answers: question.answers,
        correct: question.correct,
        selected: null,
        isCorrect: false,
    });

    currentQuestionIndex++;
    showNextQuestion();
}

function handleNext() {
    currentQuestionIndex++;
    showNextQuestion();
}

function showSummary() {
    document.getElementById('test-container').style.display = 'none';

    const summaryContainer = document.getElementById('summary-container');
    const detailedSummary = document.getElementById('detailed-summary');

    summaryContainer.style.display = 'block';
    detailedSummary.innerHTML = '';

    // Generate summary content
    let summaryHTML = `<h2>Summary of Results</h2>`;
    for (let i = 0; i < detailedResults.length; i++) {
        const result = detailedResults[i];
        let answersHTML = '';

        for (let j = 0; j < result.answers.length; j++) {
            const answer = result.answers[j];
            let color = 'black';

            if (j === result.correct) {
                color = 'green'; // Highlight correct answer
            } else if (j === result.selected) {
                color = 'red'; // Highlight incorrect answer
            }

            answersHTML += `<li style="color: ${color};">${answer}</li>`;
        }

        summaryHTML += `
            <div class="result-item">
                <h3>Question ${i + 1}: ${result.question}</h3>
                <ul>${answersHTML}</ul>
                <p><strong>Your Answer:</strong> ${
                    result.selected !== null
                        ? result.answers[result.selected]
                        : 'Skipped'
                }</p>
                <p style="color: ${
                    result.isCorrect ? 'green' : 'red'
                }; font-weight: bold;">${result.isCorrect ? 'Correct' : 'Incorrect'}</p>
            </div>
        `;
    }

    summaryHTML += `<p><strong>Final Score:</strong> ${score}/${filteredQuestions.length}</p>`;
    summaryHTML += `<button class="button" onclick="location.reload()">Restart</button>`;

    detailedSummary.innerHTML = summaryHTML;
}
