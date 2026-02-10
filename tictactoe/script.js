(function () {
    let board = Array(9).fill(null);
    let currentPlayer = 'X';
    let gameActive = true;
    let scores = { X: 0, O: 0 };
    let moveHistory = []; // Track moves in order [{ player, index }]

    const WIN_COMBOS = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6]              // diagonals
    ];

    const cells = document.querySelectorAll('.cell');
    const currentTurnEl = document.getElementById('current-turn');
    const scoreX = document.getElementById('score-x');
    const scoreO = document.getElementById('score-o');
    const winnerMessage = document.getElementById('winner-message');
    const winnerText = document.getElementById('winner-text');
    const winnerCombo = document.getElementById('winner-combo');
    const playAgainBtn = document.getElementById('play-again-btn');
    const resetBtn = document.getElementById('reset-btn');
    const resetScoresBtn = document.getElementById('reset-scores-btn');
    const startScreen = document.getElementById('start-screen');
    const startBtn = document.getElementById('start-btn');

    function setTurnUI(player) {
        currentTurnEl.textContent = `Player ${player}'s Turn`;
        currentTurnEl.className = player === 'X' ? 'x-turn' : 'o-turn';
    }

    function renderBoard() {
        cells.forEach((cell, i) => {
            cell.textContent = board[i] === 'X' ? '❌' : board[i] === 'O' ? '⭕' : '';
            cell.className = 'cell' + (board[i] ? ' taken ' + board[i].toLowerCase() : '');
        });
    }

    function checkWin() {
        for (const combo of WIN_COMBOS) {
            const [a, b, c] = combo;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return { winner: board[a], combo };
            }
        }
        return null;
    }

    function highlightWin(combo) {
        combo.forEach(i => cells[i].classList.add('win'));
    }

    function showWinner(winner, combo) {
        gameActive = false;
        highlightWin(combo);

        scores[winner]++;
        (winner === 'X' ? scoreX : scoreO).textContent = scores[winner];

        winnerText.textContent = `Player ${winner} Wins!`;
        winnerText.className = winner === 'X' ? 'x-win' : 'o-win';
        winnerCombo.textContent = `Winning combo: cells ${combo.map(i => i + 1).join(', ')}`;

        setTimeout(() => { winnerMessage.classList.add('show'); }, 420);
    }

    function removeOldestMove() {
        if (moveHistory.length === 0) return;

        // Find the oldest move for the current player
        const oldestMoveIndex = moveHistory.findIndex(move => move.player === currentPlayer);
        
        if (oldestMoveIndex !== -1) {
            const oldMove = moveHistory[oldestMoveIndex];
            const cellIndex = oldMove.index;

            // Add fading animation
            cells[cellIndex].classList.add('fading');
            
            // Remove from board and history after animation
            setTimeout(() => {
                board[cellIndex] = null;
                moveHistory.splice(oldestMoveIndex, 1);
                renderBoard();
            }, 300);
        }
    }

    function resetGame() {
        board = Array(9).fill(null);
        currentPlayer = 'X';
        gameActive = true;
        moveHistory = [];
        winnerMessage.classList.remove('show');
        setTurnUI('X');
        renderBoard();
    }

    function resetScores() {
        scores = { X: 0, O: 0 };
        scoreX.textContent = 0;
        scoreO.textContent = 0;
        resetGame();
    }

    cells.forEach(cell => {
        cell.addEventListener('click', () => {
            const idx = parseInt(cell.dataset.index);
            if (!gameActive || board[idx]) return;

            // Check if player has 3 moves already
            const playerMoves = moveHistory.filter(move => move.player === currentPlayer);
            if (playerMoves.length >= 3) {
                removeOldestMove();
                
                // Wait for fade animation before placing new move
                setTimeout(() => {
                    placeMove(idx);
                }, 350);
            } else {
                placeMove(idx);
            }
        });
    });

    function placeMove(idx) {
        board[idx] = currentPlayer;
        moveHistory.push({ player: currentPlayer, index: idx });
        renderBoard();

        const result = checkWin();
        if (result) {
            showWinner(result.winner, result.combo);
            return;
        }

        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        setTurnUI(currentPlayer);
    }

    resetBtn.addEventListener('click', resetGame);
    resetScoresBtn.addEventListener('click', resetScores);
    playAgainBtn.addEventListener('click', resetGame);

    startBtn.addEventListener('click', () => {
        startScreen.classList.remove('show');
        resetGame();
    });

    renderBoard();
    setTurnUI('X');
})();