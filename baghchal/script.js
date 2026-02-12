// Game State
const GameState = {
    PLACEMENT: 'placement',
    MOVEMENT: 'movement',
    GAME_OVER: 'gameOver'
};

const PieceType = {
    EMPTY: 'empty',
    TIGER: 'tiger',
    GOAT: 'goat'
};

class BaghChal {
    constructor() {
        this.canvas = document.getElementById('gameBoard');
        this.ctx = this.canvas.getContext('2d');
        this.boardSize = 5;
        this.points = [];
        this.connections = [];
        this.board = [];
        this.gameState = GameState.PLACEMENT;
        this.currentPlayer = PieceType.GOAT; // Goats start first
        this.goatsPlaced = 0;
        this.totalGoats = 20;
        this.capturedGoats = 0;
        this.selectedPiece = null;
        this.moveHistory = [];
        this.tigerImage = new Image();
        this.goatImage = new Image();
        this.boardImage = new Image();
        this.goatSound = new Audio('goat.mp3');
        this.tigerSound = new Audio('tiger.mp3'); // Using lion.mp3 for tiger sound
        
        this.initializeBoard();
        this.loadImages();
        this.setupEventListeners();
        this.updateUI();
    }

    initializeBoard() {
        // Create 5x5 grid points - 25 intersection points total
        const padding = 60;
        const cellSize = (this.canvas.width - 2 * padding) / (this.boardSize - 1);

        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                this.points.push({
                    x: padding + col * cellSize,
                    y: padding + row * cellSize,
                    row: row,
                    col: col,
                    piece: PieceType.EMPTY
                });
            }
        }

        // Place tigers at the 4 corners ONLY (as shown in image 2)
        this.points[0].piece = PieceType.TIGER; // Top-left corner
        this.points[4].piece = PieceType.TIGER; // Top-right corner
        this.points[20].piece = PieceType.TIGER; // Bottom-left corner
        this.points[24].piece = PieceType.TIGER; // Bottom-right corner

        // Create connections
        this.createConnections();
    }

    createConnections() {
        // Horizontal and vertical connections
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const index = row * this.boardSize + col;
                
                // Right connection
                if (col < this.boardSize - 1) {
                    this.connections.push([index, index + 1]);
                }
                
                // Down connection
                if (row < this.boardSize - 1) {
                    this.connections.push([index, index + this.boardSize]);
                }
            }
        }

        // Diagonal connections
        // Main diagonals (top-left to bottom-right)
        for (let row = 0; row < this.boardSize - 1; row++) {
            for (let col = 0; col < this.boardSize - 1; col++) {
                const index = row * this.boardSize + col;
                this.connections.push([index, index + this.boardSize + 1]);
            }
        }

        // Anti-diagonals (top-right to bottom-left)
        for (let row = 0; row < this.boardSize - 1; row++) {
            for (let col = 1; col < this.boardSize; col++) {
                const index = row * this.boardSize + col;
                this.connections.push([index, index + this.boardSize - 1]);
            }
        }
    }

    loadImages() {
        this.boardImage.onload = () => this.draw();
        this.boardImage.src = 'bagchal.jpg';
        
        this.tigerImage.src = 'tiger.jpg';
        this.goatImage.src = 'goat.png';
        
        // Redraw when images load
        this.tigerImage.onload = () => this.draw();
        this.goatImage.onload = () => this.draw();
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        
        document.getElementById('newGameBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('playAgainBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('rulesBtn').addEventListener('click', () => this.showRules());
        document.getElementById('undoBtn').addEventListener('click', () => this.undoMove());
        
        // Close modals
        document.querySelector('.close').addEventListener('click', () => {
            document.getElementById('rulesModal').style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
            const rulesModal = document.getElementById('rulesModal');
            const gameOverModal = document.getElementById('gameOverModal');
            if (e.target === rulesModal) {
                rulesModal.style.display = 'none';
            }
            if (e.target === gameOverModal) {
                gameOverModal.style.display = 'none';
            }
        });
    }

    handleClick(event) {
        if (this.gameState === GameState.GAME_OVER) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const clickedPoint = this.getPointAtPosition(x, y);
        
        if (!clickedPoint) return;

        if (this.gameState === GameState.PLACEMENT) {
            // During placement: goats place, tigers move
            if (this.currentPlayer === PieceType.GOAT) {
                this.placeGoat(clickedPoint);
            } else {
                // Tiger's turn during placement - allow movement
                this.handleMovement(clickedPoint);
            }
        } else if (this.gameState === GameState.MOVEMENT) {
            this.handleMovement(clickedPoint);
        }
    }

    getPointAtPosition(x, y) {
        const threshold = 25; // Larger threshold for easier clicking
        return this.points.find(point => {
            const distance = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
            return distance < threshold;
        });
    }

    placeGoat(point) {
        if (point.piece !== PieceType.EMPTY) return;

        point.piece = PieceType.GOAT;
        this.goatsPlaced++;
        
        this.moveHistory.push({
            type: 'place',
            point: point,
            player: PieceType.GOAT
        });

        this.playSound(this.goatSound);
        this.draw();
        this.updateUI();

        if (this.goatsPlaced === this.totalGoats) {
            this.gameState = GameState.MOVEMENT;
            this.currentPlayer = PieceType.GOAT; // Goats start movement phase
        } else {
            // Switch to tiger's turn after goat places
            this.switchPlayer();
        }
    }

    handleMovement(clickedPoint) {
        if (this.selectedPiece === null) {
            // Select a piece
            if (clickedPoint.piece === this.currentPlayer) {
                this.selectedPiece = clickedPoint;
                this.draw();
            }
        } else {
            // Try to move or capture
            if (clickedPoint === this.selectedPiece) {
                // Deselect
                this.selectedPiece = null;
                this.draw();
            } else if (this.isValidMove(this.selectedPiece, clickedPoint)) {
                this.makeMove(this.selectedPiece, clickedPoint);
            } else {
                // Select different piece of same type
                if (clickedPoint.piece === this.currentPlayer) {
                    this.selectedPiece = clickedPoint;
                    this.draw();
                }
            }
        }
    }

    isValidMove(from, to) {
        if (to.piece !== PieceType.EMPTY) return false;

        const fromIndex = this.points.indexOf(from);
        const toIndex = this.points.indexOf(to);

        // Check if connected
        const isConnected = this.connections.some(conn => 
            (conn[0] === fromIndex && conn[1] === toIndex) ||
            (conn[1] === fromIndex && conn[0] === toIndex)
        );

        if (from.piece === PieceType.GOAT) {
            return isConnected;
        } else if (from.piece === PieceType.TIGER) {
            if (isConnected) {
                return true;
            }
            
            // Check for capture move
            return this.isValidCapture(from, to);
        }

        return false;
    }

    isValidCapture(from, to) {
        const fromIndex = this.points.indexOf(from);
        const toIndex = this.points.indexOf(to);
        
        // Calculate direction
        const rowDiff = to.row - from.row;
        const colDiff = to.col - from.col;
        
        // Must be in a straight line (horizontal, vertical, or diagonal)
        if (Math.abs(rowDiff) !== Math.abs(colDiff) && rowDiff !== 0 && colDiff !== 0) {
            return false;
        }
        
        // Must be exactly 2 steps away
        if (Math.abs(rowDiff) !== 2 && Math.abs(colDiff) !== 2) {
            return false;
        }
        
        // Find middle point
        const midRow = from.row + rowDiff / 2;
        const midCol = from.col + colDiff / 2;
        const midIndex = midRow * this.boardSize + midCol;
        const midPoint = this.points[midIndex];
        
        // Middle point must have a goat
        if (midPoint.piece !== PieceType.GOAT) {
            return false;
        }
        
        // Check if path is connected
        const firstConnected = this.connections.some(conn => 
            (conn[0] === fromIndex && conn[1] === midIndex) ||
            (conn[1] === fromIndex && conn[0] === midIndex)
        );
        
        const secondConnected = this.connections.some(conn => 
            (conn[0] === midIndex && conn[1] === toIndex) ||
            (conn[1] === midIndex && conn[0] === toIndex)
        );
        
        return firstConnected && secondConnected;
    }

    makeMove(from, to) {
        const capturedGoat = this.getCapturedGoat(from, to);
        
        const moveData = {
            type: 'move',
            from: from,
            to: to,
            player: this.currentPlayer,
            fromPiece: from.piece,
            capturedGoat: capturedGoat
        };

        to.piece = from.piece;
        from.piece = PieceType.EMPTY;

        if (capturedGoat) {
            capturedGoat.piece = PieceType.EMPTY;
            this.capturedGoats++;
            this.playSound(this.tigerSound);
        } else {
            this.playSound(this.currentPlayer === PieceType.TIGER ? this.tigerSound : this.goatSound);
        }

        this.moveHistory.push(moveData);
        this.selectedPiece = null;
        this.draw();
        this.updateUI();

        if (this.checkWinCondition()) {
            return;
        }

        this.switchPlayer();
    }

    getCapturedGoat(from, to) {
        if (from.piece !== PieceType.TIGER) return null;

        const rowDiff = to.row - from.row;
        const colDiff = to.col - from.col;

        if (Math.abs(rowDiff) === 2 || Math.abs(colDiff) === 2) {
            const midRow = from.row + rowDiff / 2;
            const midCol = from.col + colDiff / 2;
            const midIndex = midRow * this.boardSize + midCol;
            const midPoint = this.points[midIndex];

            if (midPoint.piece === PieceType.GOAT) {
                return midPoint;
            }
        }

        return null;
    }

    switchPlayer() {
        if (this.gameState === GameState.PLACEMENT) {
            this.currentPlayer = this.currentPlayer === PieceType.GOAT ? PieceType.TIGER : PieceType.GOAT;
        } else {
            this.currentPlayer = this.currentPlayer === PieceType.GOAT ? PieceType.TIGER : PieceType.GOAT;
        }
        this.updateUI();
    }

    checkWinCondition() {
        // Tigers win if they captured 5 goats
        if (this.capturedGoats >= 5) {
            this.endGame(PieceType.TIGER);
            return true;
        }

        // Goats win if all tigers are trapped (only check during goat's turn in movement phase)
        if (this.gameState === GameState.MOVEMENT && this.currentPlayer === PieceType.TIGER) {
            const tigers = this.points.filter(p => p.piece === PieceType.TIGER);
            const allTrapped = tigers.every(tiger => !this.hasValidMove(tiger));
            
            if (allTrapped) {
                this.endGame(PieceType.GOAT);
                return true;
            }
        }

        return false;
    }

    hasValidMove(point) {
        const pointIndex = this.points.indexOf(point);
        
        // Check regular moves
        for (const conn of this.connections) {
            if (conn[0] === pointIndex || conn[1] === pointIndex) {
                const otherIndex = conn[0] === pointIndex ? conn[1] : conn[0];
                const otherPoint = this.points[otherIndex];
                
                if (otherPoint.piece === PieceType.EMPTY) {
                    return true;
                }
            }
        }
        
        // Check capture moves for tigers
        if (point.piece === PieceType.TIGER) {
            for (const target of this.points) {
                if (target.piece === PieceType.EMPTY && this.isValidCapture(point, target)) {
                    return true;
                }
            }
        }
        
        return false;
    }

    endGame(winner) {
        this.gameState = GameState.GAME_OVER;
        
        const modal = document.getElementById('gameOverModal');
        const winnerText = document.getElementById('winnerText');
        const winMessage = document.getElementById('winMessage');
        
        if (winner === PieceType.TIGER) {
            winnerText.textContent = '🐅 Tigers Win! 🐅';
            winMessage.textContent = `Tigers captured ${this.capturedGoats} goats and won the game!`;
        } else {
            winnerText.textContent = '🐐 Goats Win! 🐐';
            winMessage.textContent = 'All tigers are trapped! Goats win the game!';
        }
        
        modal.style.display = 'block';
    }

    undoMove() {
        if (this.moveHistory.length === 0) return;

        const lastMove = this.moveHistory.pop();

        if (lastMove.type === 'place') {
            lastMove.point.piece = PieceType.EMPTY;
            this.goatsPlaced--;
            if (this.gameState === GameState.MOVEMENT) {
                this.gameState = GameState.PLACEMENT;
            }
        } else if (lastMove.type === 'move') {
            lastMove.from.piece = lastMove.fromPiece;
            lastMove.to.piece = PieceType.EMPTY;
            
            if (lastMove.capturedGoat) {
                lastMove.capturedGoat.piece = PieceType.GOAT;
                this.capturedGoats--;
            }
        }

        this.currentPlayer = lastMove.player;
        this.selectedPiece = null;
        this.draw();
        this.updateUI();
    }

    updateUI() {
        document.getElementById('capturedGoats').textContent = this.capturedGoats;
        document.getElementById('remainingGoats').textContent = this.totalGoats - this.goatsPlaced;
        
        const turnText = document.getElementById('turnText');
        const phaseText = document.getElementById('phaseText');
        
        if (this.gameState === GameState.PLACEMENT) {
            if (this.currentPlayer === PieceType.GOAT) {
                turnText.textContent = "🐐 Goat's Turn - Place a Goat";
            } else {
                turnText.textContent = "🐅 Tiger's Turn - Move a Tiger";
            }
            phaseText.textContent = `Placement Phase (${this.goatsPlaced}/${this.totalGoats} goats placed)`;
        } else if (this.gameState === GameState.MOVEMENT) {
            if (this.currentPlayer === PieceType.GOAT) {
                turnText.textContent = "🐐 Goat's Turn - Move a Goat";
            } else {
                turnText.textContent = "🐅 Tiger's Turn - Move or Capture";
            }
            phaseText.textContent = 'Movement Phase';
        } else {
            turnText.textContent = "Game Over";
            phaseText.textContent = '';
        }

        document.getElementById('undoBtn').disabled = this.moveHistory.length === 0;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw board background if image is loaded
        if (this.boardImage.complete) {
            this.ctx.drawImage(this.boardImage, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = '#f5f5dc';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Draw connections (lines on the board)
        this.ctx.strokeStyle = 'rgba(139, 69, 19, 0.4)'; // Brown color for lines
        this.ctx.lineWidth = 2;
        
        for (const conn of this.connections) {
            const p1 = this.points[conn[0]];
            const p2 = this.points[conn[1]];
            
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.stroke();
        }

        // Draw valid moves if a piece is selected
        if (this.selectedPiece) {
            this.drawValidMoves(this.selectedPiece);
        }

        // Draw pieces (tigers and goats)
        for (const point of this.points) {
            if (point.piece === PieceType.TIGER) {
                this.drawPiece(point.x, point.y, PieceType.TIGER, point === this.selectedPiece);
            } else if (point.piece === PieceType.GOAT) {
                this.drawPiece(point.x, point.y, PieceType.GOAT, point === this.selectedPiece);
            } else {
                // Draw empty intersection points (small dots)
                this.ctx.fillStyle = '#654321';
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
                this.ctx.fill();
            }
        }
    }

    drawValidMoves(from) {
        this.ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
        this.ctx.strokeStyle = 'rgba(76, 175, 80, 0.8)';
        this.ctx.lineWidth = 2;

        for (const point of this.points) {
            if (this.isValidMove(from, point)) {
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, 15, 0, 2 * Math.PI);
                this.ctx.fill();
                this.ctx.stroke();
            }
        }
    }

    drawPiece(x, y, type, isSelected) {
        const radius = 30; // Larger pieces for better visibility

        if (isSelected) {
            this.ctx.fillStyle = 'rgba(255, 235, 59, 0.6)';
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius + 12, 0, 2 * Math.PI);
            this.ctx.fill();
        }

        if (type === PieceType.TIGER) {
            if (this.tigerImage.complete && this.tigerImage.width > 0) {
                this.ctx.save();
                this.ctx.beginPath();
                this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
                this.ctx.clip();
                this.ctx.drawImage(this.tigerImage, x - radius, y - radius, radius * 2, radius * 2);
                this.ctx.restore();
            } else {
                // Fallback: orange circle with tiger emoji
                this.ctx.fillStyle = '#FF6600';
                this.ctx.beginPath();
                this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
                this.ctx.fill();
                this.ctx.fillStyle = 'white';
                this.ctx.font = 'bold 30px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('🐅', x, y);
            }
            // Border for tiger
            this.ctx.strokeStyle = isSelected ? '#FFD700' : '#CC5200';
            this.ctx.lineWidth = isSelected ? 4 : 3;
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
            this.ctx.stroke();
        } else if (type === PieceType.GOAT) {
            if (this.goatImage.complete && this.goatImage.width > 0) {
                this.ctx.save();
                this.ctx.beginPath();
                this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
                this.ctx.clip();
                this.ctx.drawImage(this.goatImage, x - radius, y - radius, radius * 2, radius * 2);
                this.ctx.restore();
            } else {
                // Fallback: light brown circle with goat emoji
                this.ctx.fillStyle = '#D2B48C';
                this.ctx.beginPath();
                this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
                this.ctx.fill();
                this.ctx.fillStyle = '#654321';
                this.ctx.font = 'bold 30px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('🐐', x, y);
            }
            // Border for goat
            this.ctx.strokeStyle = isSelected ? '#FFD700' : '#8B4513';
            this.ctx.lineWidth = isSelected ? 4 : 3;
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
            this.ctx.stroke();
        }
    }

    playSound(audio) {
        audio.currentTime = 0;
        audio.play().catch(err => console.log('Audio play failed:', err));
    }

    showRules() {
        document.getElementById('rulesModal').style.display = 'block';
    }

    resetGame() {
        // Reset all game state
        this.points.forEach(point => point.piece = PieceType.EMPTY);
        
        // Place tigers at the 4 corners ONLY
        this.points[0].piece = PieceType.TIGER;   // Top-left corner (row 0, col 0)
        this.points[4].piece = PieceType.TIGER;   // Top-right corner (row 0, col 4)
        this.points[20].piece = PieceType.TIGER;  // Bottom-left corner (row 4, col 0)
        this.points[24].piece = PieceType.TIGER;  // Bottom-right corner (row 4, col 4)
        
        this.gameState = GameState.PLACEMENT;
        this.currentPlayer = PieceType.GOAT;
        this.goatsPlaced = 0;
        this.capturedGoats = 0;
        this.selectedPiece = null;
        this.moveHistory = [];
        
        document.getElementById('gameOverModal').style.display = 'none';
        
        this.draw();
        this.updateUI();
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new BaghChal();
});