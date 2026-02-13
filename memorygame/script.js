const CARD_EMOJIS = ['🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎬', '🎸', '🎹', '🎺', '🎻', '🎤', '🏀', '⚽', '🏈', '⚾', '🎾', '🏐', '🏓', '🥊'];

const sounds = {
    bg: new Audio('bg.mp3'),
    win: new Audio('win.mp3')
};

sounds.bg.loop = true;
sounds.bg.volume = 0.3;

function playSound(soundName) {
    if (sounds[soundName]) {
        sounds[soundName].currentTime = 0;
        sounds[soundName].play().catch(e => console.log('Audio play failed:', e));
    }
}

function playBgMusic() {
    sounds.bg.play().catch(e => console.log('Background music play failed:', e));
}

function stopBgMusic() {
    sounds.bg.pause();
    sounds.bg.currentTime = 0;
}

let gameState = {
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    moves: 0,
    seconds: 0,
    timerInterval: null,
    gameStarted: false,
    difficulty: null,
    totalPairs: 0
};

const gameBoard = document.getElementById('gameBoard');
const movesEl = document.getElementById('moves');
const timerEl = document.getElementById('timer');
const bestScoreEl = document.getElementById('bestScore');
const newGameBtn = document.getElementById('newGameBtn');
const resetBtn = document.getElementById('resetBtn');
const winModal = document.getElementById('winModal');
const finalMovesEl = document.getElementById('finalMoves');
const finalTimeEl = document.getElementById('finalTime');
const playAgainBtn = document.getElementById('playAgainBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const newRecordEl = document.getElementById('newRecord');
const difficultySelector = document.getElementById('difficultySelector');
const difficultyBtns = document.querySelectorAll('.difficulty-btn');

function init() {
    loadBestScore();
    setupEventListeners();
}

function setupEventListeners() {
    newGameBtn.addEventListener('click', () => {
        playBgMusic();
        showDifficultySelector();
    });
    resetBtn.addEventListener('click', () => {
        resetGame();
    });
    playAgainBtn.addEventListener('click', () => {
        hideModal();
        showDifficultySelector();
    });
    closeModalBtn.addEventListener('click', () => {
        hideModal();
    });

    difficultyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const pairs = parseInt(btn.dataset.pairs);
            startNewGame(pairs);
        });
    });
}

function showDifficultySelector() {
    difficultySelector.classList.remove('hidden');
    gameBoard.innerHTML = '';
    gameBoard.className = 'game-board';
    stopTimer();
}

function startNewGame(pairs) {
    difficultySelector.classList.add('hidden');

    gameState.totalPairs = pairs;
    gameState.difficulty = pairs === 6 ? 'easy' : pairs === 8 ? 'medium' : 'hard';

    gameBoard.className = `game-board ${gameState.difficulty}`;

    gameState.flippedCards = [];
    gameState.matchedPairs = 0;
    gameState.moves = 0;
    gameState.seconds = 0;
    gameState.gameStarted = false;

    updateMoves();
    updateTimer();
    stopTimer();
    loadBestScore();

    createCards(pairs);
    renderCards();
}

function resetGame() {
    if (gameState.totalPairs) {
        startNewGame(gameState.totalPairs);
    }
}

function createCards(pairs) {
    const selectedEmojis = CARD_EMOJIS.slice(0, pairs);
    const cardPairs = [...selectedEmojis, ...selectedEmojis];
    gameState.cards = shuffle(cardPairs).map((emoji, index) => ({
        id: index,
        emoji: emoji,
        flipped: false,
        matched: false
    }));
}

function shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function renderCards() {
    gameBoard.innerHTML = '';
    gameState.cards.forEach(card => {
        const cardEl = createCardElement(card);
        gameBoard.appendChild(cardEl);
    });
}

function createCardElement(card) {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    cardEl.dataset.id = card.id;

    if (card.flipped) {
        cardEl.classList.add('flipped');
    }

    if (card.matched) {
        cardEl.classList.add('matched');
    }

    cardEl.innerHTML = `
        <div class="card-face card-front"></div>
        <div class="card-face card-back">${card.emoji}</div>
    `;

    cardEl.addEventListener('click', () => handleCardClick(card.id));

    return cardEl;
}

function handleCardClick(cardId) {
    const card = gameState.cards.find(c => c.id === cardId);

    if (card.flipped || card.matched || gameState.flippedCards.length === 2) {
        return;
    }

    if (!gameState.gameStarted) {
        startTimer();
        gameState.gameStarted = true;
    }

    card.flipped = true;
    gameState.flippedCards.push(card);
    updateCard(cardId);

    if (gameState.flippedCards.length === 2) {
        gameState.moves++;
        updateMoves();
        checkMatch();
    }
}

function updateCard(cardId) {
    const cardEl = document.querySelector(`[data-id="${cardId}"]`);
    const card = gameState.cards.find(c => c.id === cardId);

    if (card.flipped) {
        cardEl.classList.add('flipped');
    }

    if (card.matched) {
        cardEl.classList.add('matched');
    }
}

function checkMatch() {
    const [card1, card2] = gameState.flippedCards;

    if (card1.emoji === card2.emoji) {
        card1.matched = true;
        card2.matched = true;
        gameState.matchedPairs++;

        updateCard(card1.id);
        updateCard(card2.id);

        gameState.flippedCards = [];

        if (gameState.matchedPairs === gameState.totalPairs) {
            setTimeout(() => {
                playSound('win');
                stopBgMusic();
                winGame();
            }, 500);
        }
    } else {
        setTimeout(() => {
            card1.flipped = false;
            card2.flipped = false;

            const cardEl1 = document.querySelector(`[data-id="${card1.id}"]`);
            const cardEl2 = document.querySelector(`[data-id="${card2.id}"]`);

            cardEl1.classList.remove('flipped');
            cardEl2.classList.remove('flipped');

            gameState.flippedCards = [];
        }, 1000);
    }
}

function startTimer() {
    gameState.timerInterval = setInterval(() => {
        gameState.seconds++;
        updateTimer();
    }, 1000);
}

function stopTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

function updateTimer() {
    const minutes = Math.floor(gameState.seconds / 60);
    const seconds = gameState.seconds % 60;
    timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function updateMoves() {
    movesEl.textContent = gameState.moves;
}

function winGame() {
    stopTimer();

    finalMovesEl.textContent = gameState.moves;
    finalTimeEl.textContent = timerEl.textContent;

    const currentScore = gameState.moves;
    const bestScore = getBestScore(gameState.difficulty);

    if (bestScore === null || currentScore < bestScore) {
        saveBestScore(gameState.difficulty, currentScore);
        loadBestScore();
        newRecordEl.classList.remove('hidden');
    } else {
        newRecordEl.classList.add('hidden');
    }

    showModal();
}

function showModal() {
    winModal.classList.remove('hidden');
}

function hideModal() {
    winModal.classList.add('hidden');
}

function getBestScore(difficulty) {
    const scores = JSON.parse(localStorage.getItem('memoryGameBestScores') || '{}');
    return scores[difficulty] || null;
}

function saveBestScore(difficulty, score) {
    const scores = JSON.parse(localStorage.getItem('memoryGameBestScores') || '{}');
    scores[difficulty] = score;
    localStorage.setItem('memoryGameBestScores', JSON.stringify(scores));
}

function loadBestScore() {
    if (gameState.difficulty) {
        const bestScore = getBestScore(gameState.difficulty);
        bestScoreEl.textContent = bestScore !== null ? bestScore : '--';
    } else {
        bestScoreEl.textContent = '--';
    }
}

init();