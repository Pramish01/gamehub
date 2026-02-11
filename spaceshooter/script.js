const config = {
    canvas: null,
    ctx: null,
    width: 500,
    height: 800,
    gameRunning: false,
    score: 0,
    best: parseInt(localStorage.getItem('bestSpaceShooter')) || 0,
    lives: 3,
    level: 1,
    keys: {},
    gameLoop: null,
    imagesLoaded: false
};

// Sound System
const sounds = {
    gunfire: new Audio('gunfire.mp3'),
    end: new Audio('end.mp3')
};

sounds.gunfire.volume = 0.4;
sounds.end.volume = 0.5;

function playSound(soundName) {
    if (sounds[soundName]) {
        sounds[soundName].currentTime = 0;
        sounds[soundName].play().catch(e => console.log('Audio play failed:', e));
    }
}

// Image assets
const images = {
    player: new Image(),
    rock1: new Image(),
    rock2: new Image(),
    rock3: new Image(),
    rocks: []
};

const player = {
    x: 250,
    y: 720,
    width: 60,
    height: 60,
    speed: 6,
    color: '#00d4ff'
};

let bullets = [];
let enemies = [];
let particles = [];
let powerups = [];

let lastEnemySpawn = 0;
let enemySpawnRate = 1500;
let lastShot = 0;
let shootCooldown = 250;
let lastLevel = 1;

function loadImages() {
    return new Promise((resolve) => {
        let loadedCount = 0;
        const totalImages = 4;

        function imageLoaded() {
            loadedCount++;
            if (loadedCount === totalImages) {
                images.rocks = [images.rock1, images.rock2, images.rock3];
                config.imagesLoaded = true;
                resolve();
            }
        }

        images.player.onload = imageLoaded;
        images.rock1.onload = imageLoaded;
        images.rock2.onload = imageLoaded;
        images.rock3.onload = imageLoaded;

        // Set image sources
        images.player.src = 'aircraft.png';
        images.rock1.src = '1.png';
        images.rock2.src = '2.png';
        images.rock3.src = '3.png';

        // Fallback in case images fail to load
        setTimeout(() => {
            if (!config.imagesLoaded) {
                console.warn('Some images failed to load, using fallback graphics');
                config.imagesLoaded = true;
                resolve();
            }
        }, 5000);
    });
}

function init() {
    config.canvas = document.getElementById('game-canvas');
    config.ctx = config.canvas.getContext('2d');

    const container = document.getElementById('game-container');
    config.canvas.width = container.clientWidth;
    config.canvas.height = container.clientHeight;
    config.width = config.canvas.width;
    config.height = config.canvas.height;

    player.y = config.height - 80;
    player.x = config.width / 2 - player.width / 2;

    document.getElementById('best').textContent = config.best;

    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('restart-btn').addEventListener('click', startGame);

    document.addEventListener('keydown', (e) => {
        config.keys[e.key] = true;
        if (e.key === ' ') {
            e.preventDefault();
        }
    });

    document.addEventListener('keyup', (e) => {
        config.keys[e.key] = false;
    });

    setupMobileControls();

    if (window.innerWidth <= 768) {
        document.getElementById('mobile-controls').classList.add('show');
    }

    // Load images
    loadImages();
}

function setupMobileControls() {
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');

    btnLeft.addEventListener('touchstart', (e) => {
        e.preventDefault();
        config.keys['ArrowLeft'] = true;
    });

    btnLeft.addEventListener('touchend', (e) => {
        e.preventDefault();
        config.keys['ArrowLeft'] = false;
    });

    btnRight.addEventListener('touchstart', (e) => {
        e.preventDefault();
        config.keys['ArrowRight'] = true;
    });

    btnRight.addEventListener('touchend', (e) => {
        e.preventDefault();
        config.keys['ArrowRight'] = false;
    });

    // Shooting is now automatic, no need for shoot button handler
}

function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-message').classList.remove('show');

    config.gameRunning = true;
    config.score = 0;
    config.lives = 3;
    config.level = 1;
    lastLevel = 1;
    bullets = [];
    enemies = [];
    particles = [];
    powerups = [];
    lastEnemySpawn = 0;
    enemySpawnRate = 1500;

    player.x = config.width / 2 - player.width / 2;
    player.y = config.height - 80;

    updateScore();
    updateLives();
    updateLevel();

    if (config.gameLoop) {
        cancelAnimationFrame(config.gameLoop);
    }
    gameLoop();
}

function gameLoop() {
    if (!config.gameRunning) return;

    update();
    draw();

    config.gameLoop = requestAnimationFrame(gameLoop);
}

function update() {
    if (config.keys['ArrowLeft'] || config.keys['a'] || config.keys['A']) {
        player.x = Math.max(0, player.x - player.speed);
    }
    if (config.keys['ArrowRight'] || config.keys['d'] || config.keys['D']) {
        player.x = Math.min(config.width - player.width, player.x + player.speed);
    }

    // Automatic continuous shooting
    shoot();

    const now = Date.now();
    if (now - lastEnemySpawn > enemySpawnRate) {
        spawnEnemy();
        lastEnemySpawn = now;
    }

    bullets = bullets.filter(bullet => {
        bullet.y -= bullet.speed;
        return bullet.y > -bullet.height;
    });

    enemies = enemies.filter(enemy => {
        enemy.y += enemy.speed;
        
        // Rotate the rock
        enemy.rotation += enemy.rotationSpeed;

        if (checkCollision(player, enemy)) {
            createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#fc8181');
            
            loseLife();
            return false;
        }

        return enemy.y < config.height + enemy.height;
    });

    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (checkCollision(bullets[i], enemies[j])) {
                createExplosion(enemies[j].x + enemies[j].width / 2,
                    enemies[j].y + enemies[j].height / 2,
                    enemies[j].color);
                
                

                config.score += enemies[j].points;
                updateScore();
                animateScoreChange();

                if (Math.random() < 0.15) {
                    spawnPowerup(enemies[j].x + enemies[j].width / 2, enemies[j].y);
                }

                bullets.splice(i, 1);
                enemies.splice(j, 1);
                break;
            }
        }
    }

    powerups = powerups.filter(powerup => {
        powerup.y += 2;

        if (checkCollision(player, powerup)) {
            
            config.score += 50;
            updateScore();
            createExplosion(powerup.x, powerup.y, '#ffd700');
            return false;
        }

        return powerup.y < config.height;
    });

    particles = particles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        return particle.life > 0;
    });

    if (config.score > config.level * 500) {
        config.level++;
        if (config.level > lastLevel) {
            
            lastLevel = config.level;
        }
        updateLevel();
        enemySpawnRate = Math.max(500, enemySpawnRate - 100);
    }
}

function draw() {
    config.ctx.fillStyle = 'rgba(10, 14, 39, 0.3)';
    config.ctx.fillRect(0, 0, config.width, config.height);

    drawStars();

    drawPlayer();

    bullets.forEach(bullet => {
        config.ctx.fillStyle = bullet.color;
        config.ctx.shadowBlur = 10;
        config.ctx.shadowColor = bullet.color;
        config.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        config.ctx.shadowBlur = 0;
    });

    enemies.forEach(enemy => {
        config.ctx.save();
        config.ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
        config.ctx.rotate(enemy.rotation);
        
        if (enemy.image && enemy.image.complete && enemy.image.naturalWidth > 0) {
            // Draw the rock image
            config.ctx.shadowBlur = 15;
            config.ctx.shadowColor = enemy.color;
            config.ctx.drawImage(enemy.image, -enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);
            config.ctx.shadowBlur = 0;
        } else {
            // Fallback: draw triangle shape
            config.ctx.fillStyle = enemy.color;
            config.ctx.shadowBlur = 15;
            config.ctx.shadowColor = enemy.color;
            config.ctx.beginPath();
            config.ctx.moveTo(0, -enemy.height / 2);
            config.ctx.lineTo(-enemy.width / 2, enemy.height / 2);
            config.ctx.lineTo(enemy.width / 2, enemy.height / 2);
            config.ctx.closePath();
            config.ctx.fill();
            config.ctx.shadowBlur = 0;
        }
        
        config.ctx.restore();
    });

    powerups.forEach(powerup => {
        config.ctx.fillStyle = powerup.color;
        config.ctx.shadowBlur = 15;
        config.ctx.shadowColor = powerup.color;
        config.ctx.beginPath();
        config.ctx.arc(powerup.x, powerup.y, powerup.size, 0, Math.PI * 2);
        config.ctx.fill();
        config.ctx.shadowBlur = 0;
    });

    particles.forEach(particle => {
        config.ctx.fillStyle = particle.color;
        config.ctx.globalAlpha = particle.life / 30;
        config.ctx.beginPath();
        config.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        config.ctx.fill();
        config.ctx.globalAlpha = 1;
    });
}

function drawPlayer() {
    if (images.player.complete && images.player.naturalWidth > 0) {
        // Draw the aircraft image
        config.ctx.save();
        config.ctx.shadowBlur = 20;
        config.ctx.shadowColor = player.color;
        config.ctx.drawImage(images.player, player.x, player.y, player.width, player.height);
        config.ctx.shadowBlur = 0;
        config.ctx.restore();
    } else {
        // Fallback: draw triangle shape
        config.ctx.fillStyle = player.color;
        config.ctx.shadowBlur = 20;
        config.ctx.shadowColor = player.color;

        config.ctx.beginPath();
        config.ctx.moveTo(player.x + player.width / 2, player.y);
        config.ctx.lineTo(player.x, player.y + player.height);
        config.ctx.lineTo(player.x + player.width / 2, player.y + player.height - 10);
        config.ctx.lineTo(player.x + player.width, player.y + player.height);
        config.ctx.closePath();
        config.ctx.fill();

        config.ctx.shadowBlur = 0;
    }
}

function drawStars() {
    config.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 50; i++) {
        const x = (i * 37) % config.width;
        const y = ((i * 73 + Date.now() * 0.05) % config.height);
        config.ctx.fillRect(x, y, 1, 1);
    }
}

function shoot() {
    const now = Date.now();
    if (now - lastShot < shootCooldown) return;

    playSound('gunfire');
    bullets.push({
        x: player.x + player.width / 2 - 2,
        y: player.y,
        width: 4,
        height: 15,
        speed: 10,
        color: '#00d4ff'
    });

    lastShot = now;
}

function spawnEnemy() {
    const types = [
        { color: '#fc8181', speed: 2, points: 10, size: 40, imageIndex: 0 },
        { color: '#f687b3', speed: 2.5, points: 15, size: 35, imageIndex: 1 },
        { color: '#9f7aea', speed: 3, points: 20, size: 35, imageIndex: 2 },
    ];

    const type = types[Math.floor(Math.random() * types.length)];
    const rockImage = images.rocks[type.imageIndex];

    enemies.push({
        x: Math.random() * (config.width - type.size),
        y: -type.size,
        width: type.size,
        height: type.size,
        speed: type.speed + (config.level * 0.2),
        color: type.color,
        points: type.points,
        image: rockImage,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1
    });
}

function spawnPowerup(x, y) {
    powerups.push({
        x: x,
        y: y,
        size: 10,
        color: '#ffd700'
    });
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 20; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            size: Math.random() * 3 + 1,
            life: 30,
            color: color
        });
    }
}

function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.height &&
        obj1.y + obj1.height > obj2.y;
}

function loseLife() {
    config.lives--;
    updateLives();

    if (config.lives <= 0) {
        gameOver();
    }
}

function gameOver() {
    config.gameRunning = false;
    playSound('end');

    const isNewHighScore = config.score > config.best;
    if (isNewHighScore) {
        config.best = config.score;
        localStorage.setItem('bestSpaceShooter', config.best);
        document.getElementById('best').textContent = config.best;
        document.getElementById('high-score-message').textContent = '🎉 New High Score! 🎉';
    } else {
        document.getElementById('high-score-message').textContent = '';
    }

    document.getElementById('final-score').textContent = `Score: ${config.score}`;
    document.getElementById('game-message').classList.add('show');
}

function updateScore() {
    document.getElementById('score').textContent = config.score;
}

function updateLives() {
    document.getElementById('lives').textContent = config.lives;
}

function updateLevel() {
    document.getElementById('level').textContent = config.level;
}

function animateScoreChange() {
    const scoreElement = document.getElementById('score');
    scoreElement.style.transform = 'scale(1.2)';
    setTimeout(() => {
        scoreElement.style.transform = 'scale(1)';
    }, 200);
}

window.addEventListener('resize', () => {
    if (config.canvas) {
        const container = document.getElementById('game-container');
        const oldWidth = config.canvas.width;
        const oldHeight = config.canvas.height;

        config.canvas.width = container.clientWidth;
        config.canvas.height = container.clientHeight;
        config.width = config.canvas.width;
        config.height = config.canvas.height;

        if (oldWidth !== config.width || oldHeight !== config.height) {
            player.x = Math.min(player.x, config.width - player.width);
            player.y = config.height - 80;
        }

        if (window.innerWidth <= 768) {
            document.getElementById('mobile-controls').classList.add('show');
        } else {
            document.getElementById('mobile-controls').classList.remove('show');
        }
    }
});

window.addEventListener('load', init);