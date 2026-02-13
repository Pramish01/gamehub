const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const WIDTH = 1080;
const HEIGHT = 720;

canvas.width = WIDTH;
canvas.height = HEIGHT;

// ============ SOUND SETUP ============
const sounds = {
    wing: new Audio('wing.mp3'),
    die: new Audio('die.mp3')
};

// Set volume levels
sounds.wing.volume = 0.5;
sounds.die.volume = 0.6;

// Helper function to play sounds
function playSound(soundName) {
    const sound = sounds[soundName];
    if (sound) {
        sound.currentTime = 0; // Reset to start
        sound.play().catch(e => console.log('Sound play failed:', e));
    }
}
// ====================================

const images = {};
const imageFiles = ["bird.png", "pipe.png", "background.png", "ground.png"];

let imagesLoaded = 0;
imageFiles.forEach(src => {
    const img = new Image();
    img.onload = () => { imagesLoaded++; };
    img.onerror = () => { console.warn("Could not load image:", src); imagesLoaded++; };
    img.src = src;
    images[src] = img;
});

const DIFFICULTY = {
    easy: { gap: 200, speed: 2, gravity: 0.5, freq: 150 },
    medium: { gap: 180, speed: 3, gravity: 0.3, freq: 90 },
    hard: { gap: 120, speed: 4, gravity: 1, freq: 70 }
};

let gameState = "home";
let difficulty = "easy";
let bird, pipes, score, bestScore, frames, running;

const screenHome = document.getElementById("screen-home");
const screenOver = document.getElementById("screen-over");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const uiScore = document.getElementById("ui-score");
const uiBest = document.getElementById("ui-best");
const uiLevel = document.getElementById("ui-level");
const overScore = document.getElementById("over-score");
const overBest = document.getElementById("over-best");
const newBestRow = document.getElementById("new-best-row");
const homeBtn = document.getElementById("home-btn");
const diffButtons = document.querySelectorAll(".diff-btn");

bestScore = 0;

class Bird {
    constructor() {
        this.x = 80;
        this.y = 250;
        this.w = 50;
        this.h = 50;
        this.vel = 0;
        this.jumpPower = -9;
    }

    jump() {
        this.vel = this.jumpPower;
        playSound('wing'); // Play wing sound when jumping
    }

    update(gravity) {
        this.vel += gravity;
        this.y += this.vel;
        if (this.y < 0) this.y = 0;
        if (this.y + this.h > HEIGHT - 100) {
            this.y = HEIGHT - 100 - this.h;
            return true;
        }
        return false;
    }

    draw() {
        const angle = Math.min(Math.max(this.vel * 3, -30), 90) * (Math.PI / 180);
        ctx.save();
        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
        ctx.rotate(angle);
        ctx.drawImage(images["bird.png"], -this.w / 2, -this.h / 2, this.w, this.h);
        ctx.restore();
    }

    rect() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
}

class Pipe {
    constructor(x, gap) {
        this.x = x;
        this.w = 70;
        this.gap = gap;

        const min = 80;
        const max = HEIGHT - gap - 200;
        this.topH = Math.random() * (max - min) + min;
        this.bottomY = this.topH + gap;
        this.scored = false;
    }

    update(speed) { this.x -= speed; }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.w / 2, this.topH);
        ctx.scale(1, -1);
        ctx.drawImage(images["pipe.png"], -this.w / 2, 0, this.w, 400);
        ctx.restore();

        ctx.drawImage(images["pipe.png"], this.x, this.bottomY, this.w, 400);
    }

    offscreen() { return this.x + this.w < 0; }

    hit(bird) {
        const r = bird.rect();
        return (
            collide(r, { x: this.x, y: 0, w: this.w, h: this.topH }) ||
            collide(r, { x: this.x, y: this.bottomY, w: this.w, h: HEIGHT - this.bottomY })
        );
    }
}

function collide(a, b) {
    return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
    );
}

function resetGame() {
    bird = new Bird();
    pipes = [];
    score = 0;
    frames = 0;
    running = false;
    updateUI();
}

function startGame() {
    resetGame();
    gameState = "playing";
    hideOverlays();
}

function gameOver() {
    playSound('die'); // Play die sound on game over

    gameState = "over";
    running = false;

    const isNewBest = score > bestScore;
    if (isNewBest) bestScore = score;
    updateUI();

    overScore.textContent = score;
    overBest.textContent = bestScore;
    newBestRow.classList.toggle("show", isNewBest);

    screenOver.classList.add("active");
}

function goHome() {
    resetGame();
    gameState = "home";
    screenHome.classList.add("active");
    screenOver.classList.remove("active");
}

function updateUI() {
    uiScore.textContent = score;
    uiBest.textContent = bestScore;
    uiLevel.textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

function hideOverlays() {
    screenHome.classList.remove("active");
    screenOver.classList.remove("active");
}

function drawBackground() {
    if (images["background.png"].complete) {
        ctx.drawImage(images["background.png"], 0, 0, WIDTH, HEIGHT);
    } else {
        const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
        grad.addColorStop(0, "#87CEEB");
        grad.addColorStop(0.7, "#E0F0FF");
        grad.addColorStop(1, "#c8b896");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }

    if (images["ground.png"].complete) {
        ctx.drawImage(images["ground.png"], 0, HEIGHT - 100, WIDTH, 100);
    } else {
        ctx.fillStyle = "#8B7355";
        ctx.fillRect(0, HEIGHT - 100, WIDTH, 100);
    }
}

function drawScoreOnCanvas() {
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 6;
    ctx.font = "bold 64px 'Bangers', cursive, Arial";
    ctx.textAlign = "center";
    ctx.strokeText(score, WIDTH / 2, 75);
    ctx.fillText(score, WIDTH / 2, 75);
}

function updatePlaying() {
    if (!running) return;

    const s = DIFFICULTY[difficulty];

    if (bird.update(s.gravity)) {
        gameOver();
        return;
    }

    frames++;
    if (frames % s.freq === 0) {
        pipes.push(new Pipe(WIDTH, s.gap));
    }

    pipes.forEach(p => {
        p.update(s.speed);
        if (p.hit(bird)) { gameOver(); return; }
        if (!p.scored && p.x + p.w < bird.x) {
            p.scored = true;
            score++;
            updateUI();
        }
    });

    pipes = pipes.filter(p => !p.offscreen());
}

function loop() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    drawBackground();

    if (gameState === "home") {
        if (bird) bird.draw();

    } else if (gameState === "playing") {
        pipes.forEach(p => p.draw());
        bird.draw();
        drawScoreOnCanvas();

        if (!running) {
            ctx.fillStyle = "rgba(255,255,255,0.85)";
            ctx.font = "bold 30px 'Nunito', sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("TAP OR PRESS SPACE TO FLAP", WIDTH / 2, HEIGHT / 2);
        }

        updatePlaying();

    } else if (gameState === "over") {
        pipes.forEach(p => p.draw());
        bird.draw();
        drawScoreOnCanvas();
    }

    requestAnimationFrame(loop);
}

// Event Listeners
canvas.addEventListener("mousedown", e => {
    if (gameState === "playing") {
        running = true;
        bird.jump();
    }
});

canvas.addEventListener("touchstart", e => {
    e.preventDefault();
    if (gameState === "playing") {
        running = true;
        bird.jump();
    }
}, { passive: false });

document.addEventListener("keydown", e => {
    if (e.code === "Space") {
        e.preventDefault();
        if (gameState === "playing") {
            running = true;
            bird.jump();
        }
    }
});

startBtn.addEventListener("click", () => { startGame(); });

restartBtn.addEventListener("click", () => { startGame(); });

homeBtn.addEventListener("click", () => { goHome(); });

diffButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        diffButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        difficulty = btn.dataset.diff;
        updateUI();
    });
});

resetGame();
loop();