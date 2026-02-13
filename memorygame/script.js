let gameActive = false;
let cardsFlipped = [];
let matchesFound = 0;
let totalMatches = 0;
let flipCount = 0;
let startTime = null;
let timerInterval = null;
let currentLevel = 0;

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

const symbols = ['🌟', '🪐', '🌙', '☄️', '🛸', '👽', '🚀', '🌠', '⭐', '🌌', 
                 '🔮', '💫', '🌃', '🎆', '✨', '🌈', '☀️', '🌍', '🌕', '🌑'];

function init() {
    createStars();
    setupEventListeners();
}

function createStars() {
    const starsContainer = document.getElementById('stars');
    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.width = Math.random() * 3 + 1 + 'px';
        star.style.height = star.style.width;
        star.style.animationDelay = Math.random() * 3 + 's';
        starsContainer.appendChild(star);
    }
}

function setupEventListeners() {
    const levelButtons = document.querySelectorAll('.difficulty-btn');
    levelButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const cardCount = parseInt(btn.dataset.cards);
            startGame(cardCount);
        });
    });
    
    const newGameBtn = document.getElementById('newGameBtn');
    const changeLevelBtn = document.getElementById('changeLevelBtn');
    const playAgainBtn = document.getElementById('playAgainBtn');
    const newChallengeBtn = document.getElementById('newChallengeBtn');
    
    if (newGameBtn) newGameBtn.addEventListener('click', resetGame);
    if (changeLevelBtn) changeLevelBtn.addEventListener('click', backToLevels);
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
            const victoryModal = document.getElementById('victoryModal');
            victoryModal.classList.remove('active');
            victoryModal.classList.add('hidden');
            resetGame();
        });
    }
    if (newChallengeBtn) {
        newChallengeBtn.addEventListener('click', () => {
            const victoryModal = document.getElementById('victoryModal');
            victoryModal.classList.remove('active');
            victoryModal.classList.add('hidden');
            backToLevels();
        });
    }
}

function startGame(cardCount) {
    currentLevel = cardCount;
    totalMatches = cardCount / 2;
    
    playBgMusic();
    
    gameActive = true;
    cardsFlipped = [];
    matchesFound = 0;
    flipCount = 0;
    startTime = Date.now();
    
    const levelScreen = document.getElementById('levelScreen');
    const gameScreen = document.getElementById('gameScreen');
    const flipsCount = document.getElementById('flipsCount');
    const matchesCount = document.getElementById('matchesCount');
    const timeCount = document.getElementById('timeCount');
    
    levelScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    flipsCount.textContent = '0';
    matchesCount.textContent = '0';
    timeCount.textContent = '0s';
    
    loadRecord();
    
    createGameGrid(cardCount);
    
    startTimer();
}

function createGameGrid(cardCount) {
    const gameGrid = document.getElementById('gameGrid');
    gameGrid.innerHTML = '';
    
    gameGrid.className = 'game-board';
    if (cardCount === 12) {
        gameGrid.classList.add('easy');
    } else if (cardCount === 16) {
        gameGrid.classList.add('medium');
    } else {
        gameGrid.classList.add('hard');
    }
    
    const pairs = cardCount / 2;
    const selectedSymbols = symbols.slice(0, pairs);
    const cardSymbols = [...selectedSymbols, ...selectedSymbols];
    
    shuffleArray(cardSymbols);
    
    cardSymbols.forEach((symbol, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.symbol = symbol;
        card.dataset.index = index;
        
        const cardFront = document.createElement('div');
        cardFront.className = 'card-face card-front';
        
        const cardBack = document.createElement('div');
        cardBack.className = 'card-face card-back';
        
        const emojiSpan = document.createElement('span');
        emojiSpan.textContent = symbol;
        
        cardBack.appendChild(emojiSpan);
        card.appendChild(cardFront);
        card.appendChild(cardBack);
        
        card.addEventListener('click', () => flipCard(card));
        gameGrid.appendChild(card);
    });
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function flipCard(card) {
    if (!gameActive || 
        card.classList.contains('flipped') || 
        card.classList.contains('matched') || 
        cardsFlipped.length >= 2) {
        return;
    }
    
    card.classList.add('flipped');
    cardsFlipped.push(card);
    
    if (cardsFlipped.length === 1) {
        flipCount++;
        const flipsCount = document.getElementById('flipsCount');
        flipsCount.textContent = flipCount;
    }
    
    if (cardsFlipped.length === 2) {
        checkMatch();
    }
}

function checkMatch() {
    const [card1, card2] = cardsFlipped;
    const symbol1 = card1.dataset.symbol;
    const symbol2 = card2.dataset.symbol;
    
    if (symbol1 === symbol2) {
        setTimeout(() => {
            card1.classList.add('matched');
            card2.classList.add('matched');
            
            matchesFound++;
            const matchesCount = document.getElementById('matchesCount');
            matchesCount.textContent = matchesFound;
            
            cardsFlipped = [];
            
            if (matchesFound === totalMatches) {
                setTimeout(() => showVictory(), 500);
            }
        }, 400);
    } else {
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            cardsFlipped = [];
        }, 1000);
    }
}

function startTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const timeCount = document.getElementById('timeCount');
        timeCount.textContent = elapsed + 's';
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function showVictory() {
    gameActive = false;
    stopTimer();
    
    setTimeout(() => {
        playSound('win');
        stopBgMusic();
    }, 300);
    
    const finalTimeValue = Math.floor((Date.now() - startTime) / 1000);
    
    const finalFlips = document.getElementById('finalFlips');
    const finalTime = document.getElementById('finalTime');
    const recordBadge = document.getElementById('recordBadge');
    const victoryModal = document.getElementById('victoryModal');
    
    finalFlips.textContent = flipCount;
    finalTime.textContent = finalTimeValue + 's';
    
    const recordKey = `cosmic_record_${currentLevel}`;
    const currentRecord = localStorage.getItem(recordKey);
    
    if (!currentRecord || flipCount < parseInt(currentRecord)) {
        localStorage.setItem(recordKey, flipCount);
        recordBadge.classList.remove('hidden');
        loadRecord(); 
    } else {
        recordBadge.classList.add('hidden');
    }
    
    victoryModal.classList.remove('hidden');
    victoryModal.classList.add('active');
}

function loadRecord() {
    const recordKey = `cosmic_record_${currentLevel}`;
    const record = localStorage.getItem(recordKey);
    const recordCount = document.getElementById('recordCount');
    recordCount.textContent = record || '--';
}

function resetGame() {
    if (currentLevel > 0) {
        stopTimer();
        startGame(currentLevel);
    }
}

function backToLevels() {
    gameActive = false;
    stopTimer();
    stopBgMusic();
    
    const gameScreen = document.getElementById('gameScreen');
    const levelScreen = document.getElementById('levelScreen');
    
    gameScreen.classList.add('hidden');
    levelScreen.classList.remove('hidden');
    currentLevel = 0;
}

document.addEventListener('DOMContentLoaded', init);