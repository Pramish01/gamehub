(function () {
    let board         = Array(9).fill(null);
    let currentPlayer = 'X';
    let gameActive    = true;
    let scores        = { X: 0, O: 0, draw: 0 };

    const WIN_COMBOS = [
        [0,1,2], [3,4,5], [6,7,8], 
        [0,3,6], [1,4,7], [2,5,8], 
        [0,4,8], [2,4,6]           
    ];

    const cells          = document.querySelectorAll('.cell');
    const currentTurnEl  = document.getElementById('current-turn');
    const scoreX         = document.getElementById('score-x');
    const scoreO         = document.getElementById('score-o');
    const scoreDraw      = document.getElementById('score-draw');
    const winnerMessage  = document.getElementById('winner-message');
    const winnerText     = document.getElementById('winner-text');
    const winnerCombo    = document.getElementById('winner-combo');
    const playAgainBtn   = document.getElementById('play-again-btn');
    const resetBtn       = document.getElementById('reset-btn');
    const resetScoresBtn = document.getElementById('reset-scores-btn');
    const startScreen    = document.getElementById('start-screen');
    const startBtn       = document.getElementById('start-btn');

    function setTurnUI(player) {
        currentTurnEl.textContent = `Player ${player}'s Turn`;
        currentTurnEl.className   = player === 'X' ? 'x-turn' : 'o-turn';
    }

    function renderBoard() {
        cells.forEach((cell, i) => {
            cell.textContent = board[i] === 'X' ? '❌' : board[i] === 'O' ? '⭕' : '';
            cell.className   = 'cell' + (board[i] ? ' taken ' + board[i].toLowerCase() : '');
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

        winnerText.textContent  = `Player ${winner} Wins!`;
        winnerText.className    = winner === 'X' ? 'x-win' : 'o-win';
        winnerCombo.textContent = `Winning combo: cells ${combo.map(i => i + 1).join(', ')}`;

        setTimeout(() => { winnerMessage.classList.add('show'); }, 420);
    }

    function showDraw() {
        gameActive = false;
        scores.draw++;
        scoreDraw.textContent = scores.draw;

        winnerText.textContent  = "It's a Draw!";
        winnerText.className    = 'draw';
        winnerCombo.textContent = 'Better luck next time!';

        setTimeout(() => { winnerMessage.classList.add('show'); }, 350);
    }

    function resetGame() {
        board         = Array(9).fill(null);
        currentPlayer = 'X';
        gameActive    = true;
        winnerMessage.classList.remove('show');
        setTurnUI('X');
        renderBoard();
    }

    function resetScores() {
        scores = { X: 0, O: 0, draw: 0 };
        scoreX.textContent    = 0;
        scoreO.textContent    = 0;
        scoreDraw.textContent = 0;
        resetGame();
    }

    cells.forEach(cell => {
        cell.addEventListener('click', () => {
            const idx = parseInt(cell.dataset.index);
            if (!gameActive || board[idx]) return;

            board[idx] = currentPlayer;
            renderBoard();

            const result = checkWin();
            if (result) {
                showWinner(result.winner, result.combo);
                return;
            }

            if (board.every(Boolean)) {
                showDraw();
                return;
            }

            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            setTurnUI(currentPlayer);
        });
    });

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