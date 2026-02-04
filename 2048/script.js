const game = {
    board: [],
    score: 0,
    best: localStorage.getItem('best2048') || 0,
    previousBoard: null,
    gameStarted: false,

    startGame() {
        document.getElementById('start-screen').classList.add('hidden');
        this.gameStarted = true;
        this.init();
    },

    init() {
        this.board = [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ];
        this.score = 0;
        this.updateScore();
        this.hideMessage();
        this.addRandomTile();
        this.addRandomTile();
        this.renderBoard();
    },

    addRandomTile() {
        const emptyCells = [];
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (this.board[r][c] === 0) {
                    emptyCells.push({ r, c });
                }
            }
        }

        if (emptyCells.length > 0) {
            const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.board[r][c] = Math.random() < 0.9 ? 2 : 4;
            return { r, c };
        }
        return null;
    },

    renderBoard(newTile = null) {
        const boardElement = document.getElementById('game-board');
        const existingTiles = boardElement.querySelectorAll('.tile');
        existingTiles.forEach(tile => tile.remove());

        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const value = this.board[r][c];
                if (value !== 0) {
                    const tile = document.createElement('div');
                    const tileClass = value > 2048 ? 'super' : value;
                    tile.className = `tile tile-${tileClass}`;

                    if (newTile && newTile.r === r && newTile.c === c) {
                        tile.classList.add('tile-new');
                    }

                    tile.textContent = value;
                    tile.style.left = `${20 + c * 133}px`;
                    tile.style.top = `${20 + r * 133}px`;
                    boardElement.appendChild(tile);
                }
            }
        }
    },

    move(direction) {
        this.previousBoard = JSON.parse(JSON.stringify(this.board));
        let moved = false;

        if (direction === 'left') {
            moved = this.moveLeft();
        } else if (direction === 'right') {
            moved = this.moveRight();
        } else if (direction === 'up') {
            moved = this.moveUp();
        } else if (direction === 'down') {
            moved = this.moveDown();
        }

        if (moved) {
            const newTile = this.addRandomTile();
            this.renderBoard(newTile);
            this.updateScore();
            this.animateScoreChange();

            setTimeout(() => {
                if (this.checkWin()) {
                    this.showMessage('You Win! 🎉');
                } else if (this.isGameOver()) {
                    this.showMessage('Game Over!');
                }
            }, 200);
        }
    },

    moveLeft() {
        let moved = false;
        for (let r = 0; r < 4; r++) {
            const row = this.board[r].filter(val => val !== 0);
            const merged = [];

            for (let i = 0; i < row.length; i++) {
                if (i < row.length - 1 && row[i] === row[i + 1]) {
                    merged.push(row[i] * 2);
                    this.score += row[i] * 2;
                    i++;
                } else {
                    merged.push(row[i]);
                }
            }

            while (merged.length < 4) {
                merged.push(0);
            }

            if (JSON.stringify(this.board[r]) !== JSON.stringify(merged)) {
                moved = true;
            }
            this.board[r] = merged;
        }
        return moved;
    },

    moveRight() {
        let moved = false;
        for (let r = 0; r < 4; r++) {
            const row = this.board[r].filter(val => val !== 0);
            const merged = [];

            for (let i = row.length - 1; i >= 0; i--) {
                if (i > 0 && row[i] === row[i - 1]) {
                    merged.unshift(row[i] * 2);
                    this.score += row[i] * 2;
                    i--;
                } else {
                    merged.unshift(row[i]);
                }
            }

            while (merged.length < 4) {
                merged.unshift(0);
            }

            if (JSON.stringify(this.board[r]) !== JSON.stringify(merged)) {
                moved = true;
            }
            this.board[r] = merged;
        }
        return moved;
    },

    moveUp() {
        let moved = false;
        for (let c = 0; c < 4; c++) {
            const column = [];
            for (let r = 0; r < 4; r++) {
                if (this.board[r][c] !== 0) {
                    column.push(this.board[r][c]);
                }
            }

            const merged = [];
            for (let i = 0; i < column.length; i++) {
                if (i < column.length - 1 && column[i] === column[i + 1]) {
                    merged.push(column[i] * 2);
                    this.score += column[i] * 2;
                    i++;
                } else {
                    merged.push(column[i]);
                }
            }

            while (merged.length < 4) {
                merged.push(0);
            }

            for (let r = 0; r < 4; r++) {
                if (this.board[r][c] !== merged[r]) {
                    moved = true;
                }
                this.board[r][c] = merged[r];
            }
        }
        return moved;
    },

    moveDown() {
        let moved = false;
        for (let c = 0; c < 4; c++) {
            const column = [];
            for (let r = 0; r < 4; r++) {
                if (this.board[r][c] !== 0) {
                    column.push(this.board[r][c]);
                }
            }

            const merged = [];
            for (let i = column.length - 1; i >= 0; i--) {
                if (i > 0 && column[i] === column[i - 1]) {
                    merged.unshift(column[i] * 2);
                    this.score += column[i] * 2;
                    i--;
                } else {
                    merged.unshift(column[i]);
                }
            }

            while (merged.length < 4) {
                merged.unshift(0);
            }

            for (let r = 0; r < 4; r++) {
                if (this.board[r][c] !== merged[r]) {
                    moved = true;
                }
                this.board[r][c] = merged[r];
            }
        }
        return moved;
    },

    isGameOver() {
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (this.board[r][c] === 0) {
                    return false;
                }
            }
        }

        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const current = this.board[r][c];
                if (
                    (c < 3 && current === this.board[r][c + 1]) ||
                    (r < 3 && current === this.board[r + 1][c])
                ) {
                    return false;
                }
            }
        }

        return true;
    },

    checkWin() {
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (this.board[r][c] === 2048) {
                    return true;
                }
            }
        }
        return false;
    },

    updateScore() {
        document.getElementById('score').textContent = this.score;
        if (this.score > this.best) {
            this.best = this.score;
            localStorage.setItem('best2048', this.best);
        }
        document.getElementById('best').textContent = this.best;
    },

    animateScoreChange() {
        const scoreElement = document.getElementById('score');
        scoreElement.style.transform = 'scale(1.2)';
        setTimeout(() => {
            scoreElement.style.transform = 'scale(1)';
        }, 200);
    },

    showMessage(text) {
        document.getElementById('message-text').textContent = text;
        document.getElementById('game-message').classList.add('show');
    },

    hideMessage() {
        document.getElementById('game-message').classList.remove('show');
    }
};

document.addEventListener('keydown', (e) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        const direction = e.key.replace('Arrow', '').toLowerCase();
        game.move(direction);
    }
});

let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

document.addEventListener('touchend', (e) => {
    if (!touchStartX || !touchStartY) {
        return;
    }

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;

    const minSwipeDistance = 30;

    if (Math.abs(diffX) > minSwipeDistance || Math.abs(diffY) > minSwipeDistance) {
        if (Math.abs(diffX) > Math.abs(diffY)) {
            game.move(diffX > 0 ? 'left' : 'right');
        } else {
            game.move(diffY > 0 ? 'up' : 'down');
        }
    }

    touchStartX = 0;
    touchStartY = 0;
});

document.getElementById('best').textContent = game.best;

document.getElementById('score').style.transition = 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)';