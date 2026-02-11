const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const timerLabel = document.getElementById("timer");
const bestLabel = document.getElementById("best");
const restartBtn = document.getElementById("restartBtn");
const difficultySelect = document.getElementById("difficulty");
const shapeSelect = document.getElementById("shape");
const jumpscareOverlay = document.getElementById("jumpscareOverlay");
const volumeSlider = document.getElementById("volume");

const audioFiles = {
	walk: "sounds/walk.mp3",
	teleport: "sounds/teleport.mp3",
	win: "sounds/win.mp3",
	lose: "sounds/lose.mp3",
	bgm: "sounds/bgm.mp3",
	jumpscare: "sounds/jumpscare.mp3"
};

// Load Dora image
const doraImage = new Image();
doraImage.src = "dora.jpg";

let width = 0;
let height = 0;
let cellSize = 30;
let cols = 0;
let rows = 0;
let worldWidth = 0;
let worldHeight = 0;

const maze = [];
const input = {
	left: false,
	right: false,
	up: false,
	down: false
};

const player = {
	x: 0,
	y: 0,
	speed: 3.2,
	radius: 12
};

const camera = {
	x: 0,
	y: 0
};

const exitCell = { col: 0, row: 0 };

let startTime = 0;
let elapsedTime = 0;
let timeLimitSeconds = 0;
let finished = false;
let timeUp = false;
let hasHitQuestion = false;
let questionCooldown = 0;
let walkPlaying = false;
let jumpscareTimeout = 0;
let shakeTimeout = 0;
let currentTime = 0;

const bestTimes = {};
const questionTiles = [];
const questionTileMap = new Map();

const audio = {};
let bgmStarted = false;
let masterVolume = 1;

const baseVolumes = {
	walk: 0.3,
	teleport: 0.5,
	win: 0.6,
	lose: 0.5,
	bgm: 0.35,
	jumpscare: 1
};

const jumpscareConfig = {
	chance: 0.3,
	flashMs: 300,
	shakeMs: 8000
};

function loadAudio() {
	Object.entries(audioFiles).forEach(([key, src]) => {
		const sound = new Audio(src);
		sound.preload = "auto";
		if (key === "walk" || key === "bgm") {
			sound.loop = true;
		}
		audio[key] = sound;
	});
}

function playSound(name, { restart = true, volume = 1 } = {}) {
	const sound = audio[name];
	if (!sound) {
		return;
	}
	const isJumpscare = name === "jumpscare";
	const finalVolume = isJumpscare ? 1 : volume * masterVolume;
	if (sound.loop) {
		sound.volume = finalVolume;
		if (restart) {
			sound.currentTime = 0;
		}
		sound.play().catch(() => {});
		return;
	}
	sound.volume = finalVolume;
	if (restart) {
		sound.currentTime = 0;
	}
	sound.play().catch(() => {});
}

function stopSound(name) {
	const sound = audio[name];
	if (!sound) {
		return;
	}
	sound.pause();
	if (sound.loop) {
		sound.currentTime = 0;
	}
}

function triggerJumpscare() {
	if (!jumpscareOverlay) {
		return;
	}
	if (jumpscareTimeout) {
		clearTimeout(jumpscareTimeout);
	}
	if (shakeTimeout) {
		clearTimeout(shakeTimeout);
	}
	jumpscareOverlay.classList.add("show");
	document.body.classList.add("shake");
	playSound("jumpscare", { restart: true, volume: 1 });
	jumpscareTimeout = window.setTimeout(() => {
		jumpscareOverlay.classList.remove("show");
	}, jumpscareConfig.flashMs);
	shakeTimeout = window.setTimeout(() => {
		document.body.classList.remove("shake");
	}, jumpscareConfig.shakeMs);
}

function ensureBgm() {
	if (bgmStarted) {
		return;
	}
	bgmStarted = true;
	playSound("bgm", { restart: false, volume: baseVolumes.bgm });
}

const palette = {
	grassDark: "#1b2a1d",
	bushDark: "#0f2a17",
	bushLight: "#1f3b25",
	stoneDark: "#505355",
	stoneMid: "#6a6e71",
	stoneLight: "#8a8f92",
	path: "#c2b8a3",
	player: "#f4f0e6",
	exit: "#d4b649"
};

const difficultyPresets = {
	easy: { size: 31, cell: 32, speed: 3.6, timeLimit: 60 },
	normal: { size: 41, cell: 30, speed: 3.3, timeLimit: 120 },
	hard: { size: 61, cell: 28, speed: 3.1, timeLimit: 240 },
	expert: { size: 81, cell: 26, speed: 2.9, timeLimit: 480 },
	impossible: { size: 201, cell: 22, speed: 2.5, timeLimit: 1500 }
};

function formatTime(totalSeconds) {
	const clamped = Math.max(0, totalSeconds);
	const minutes = Math.floor(clamped / 60);
	const seconds = Math.floor(clamped % 60);
	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function resizeCanvas() {
	const rect = canvas.getBoundingClientRect();
	canvas.width = Math.floor(rect.width * window.devicePixelRatio);
	canvas.height = Math.floor(rect.height * window.devicePixelRatio);
	width = canvas.width / window.devicePixelRatio;
	height = canvas.height / window.devicePixelRatio;
	ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
}

function getSettingsKey() {
	return `${difficultySelect.value}:${shapeSelect.value}`;
}

function setupMazeSize() {
	const preset = difficultyPresets[difficultySelect.value];
	cellSize = preset.cell;
	player.speed = preset.speed;
	timeLimitSeconds = preset.timeLimit;

	let baseCols = preset.size;
	let baseRows = preset.size;

	if (shapeSelect.value === "wide") {
		baseCols = Math.floor(preset.size * 1.6);
	}
	if (shapeSelect.value === "tall") {
		baseRows = Math.floor(preset.size * 1.6);
	}

	cols = baseCols % 2 === 0 ? baseCols - 1 : baseCols;
	rows = baseRows % 2 === 0 ? baseRows - 1 : baseRows;

	worldWidth = cols * cellSize;
	worldHeight = rows * cellSize;
}

function isCellInShape(col, row) {
	if (shapeSelect.value !== "diamond") {
		return true;
	}

	const centerCol = (cols - 1) / 2;
	const centerRow = (rows - 1) / 2;
	const maxDist = Math.min(centerCol, centerRow) - 1;
	const dist = Math.abs(col - centerCol) + Math.abs(row - centerRow);
	return dist <= maxDist;
}

function createGrid() {
	maze.length = 0;
	for (let r = 0; r < rows; r++) {
		const row = [];
		for (let c = 0; c < cols; c++) {
			row.push(1);
		}
		maze.push(row);
	}
}

function findStartCell() {
	for (let r = 1; r < rows - 1; r += 2) {
		for (let c = 1; c < cols - 1; c += 2) {
			if (isCellInShape(c, r)) {
				return { col: c, row: r };
			}
		}
	}
	return { col: 1, row: 1 };
}

function findExitCell() {
	for (let r = rows - 2; r >= 1; r -= 2) {
		for (let c = cols - 2; c >= 1; c -= 2) {
			if (isCellInShape(c, r)) {
				return { col: c, row: r };
			}
		}
	}
	return { col: cols - 2, row: rows - 2 };
}

function carveMaze(startCol, startRow) {
	const stack = [{ col: startCol, row: startRow }];
	maze[startRow][startCol] = 0;

	const directions = [
		{ dc: 0, dr: -2 },
		{ dc: 2, dr: 0 },
		{ dc: 0, dr: 2 },
		{ dc: -2, dr: 0 }
	];

	while (stack.length) {
		const current = stack[stack.length - 1];
		const shuffled = directions
			.map((dir) => ({ ...dir, order: Math.random() }))
			.sort((a, b) => a.order - b.order);

		let carved = false;
		for (const dir of shuffled) {
			const nc = current.col + dir.dc;
			const nr = current.row + dir.dr;
			const mc = current.col + dir.dc / 2;
			const mr = current.row + dir.dr / 2;

			if (nr > 0 && nr < rows - 1 && nc > 0 && nc < cols - 1) {
				if (isCellInShape(nc, nr) && isCellInShape(mc, mr) && maze[nr][nc] === 1) {
					maze[mr][mc] = 0;
					maze[nr][nc] = 0;
					stack.push({ col: nc, row: nr });
					carved = true;
					break;
				}
			}
		}

		if (!carved) {
			stack.pop();
		}
	}
}

function placeExit() {
	const target = findExitCell();
	exitCell.col = target.col;
	exitCell.row = target.row;
	maze[exitCell.row][exitCell.col] = 0;
}

function getRandomPathCell(excludeKeys) {
	for (let attempt = 0; attempt < 2000; attempt++) {
		const col = 1 + Math.floor(Math.random() * (cols - 2));
		const row = 1 + Math.floor(Math.random() * (rows - 2));
		const key = `${col},${row}`;
		if (excludeKeys.has(key)) {
			continue;
		}
		if (maze[row][col] === 0 && isCellInShape(col, row)) {
			return { col, row };
		}
	}

	return { col: 1, row: 1 };
}

function placeQuestionTiles() {
	questionTiles.length = 0;
	questionTileMap.clear();

	const difficultyCounts = {
		easy: 4,
		normal: 8,
		hard: 16,
		expert: 28,
		impossible: 50
	};
	const maxPossible = Math.max(3, Math.floor((cols * rows) / 12));
	const targetCount = Math.min(difficultyCounts[difficultySelect.value] || 8, maxPossible);
	const exclude = new Set([
		"1,1",
		`${exitCell.col},${exitCell.row}`
	]);

	for (let i = 0; i < targetCount; i++) {
		const cell = getRandomPathCell(exclude);
		const key = `${cell.col},${cell.row}`;
		exclude.add(key);
		const type = Math.random() < 0.55 ? "reset" : "teleport";
		const tile = { col: cell.col, row: cell.row, type };
		questionTiles.push(tile);
		questionTileMap.set(key, tile);
	}
}

function resetPlayer() {
	const start = findStartCell();
	player.x = start.col * cellSize + cellSize * 0.5;
	player.y = start.row * cellSize + cellSize * 0.5;
}

function buildMaze() {
	setupMazeSize();
	createGrid();
	const start = findStartCell();
	carveMaze(start.col, start.row);
	placeExit();
	placeQuestionTiles();
	resetPlayer();
	startTime = performance.now();
	elapsedTime = 0;
	finished = false;
	timeUp = false;
	hasHitQuestion = false;
	questionCooldown = 0;
	walkPlaying = false;
	stopSound("walk");
	updateCamera();
}

function updateTimer(now) {
	if (!finished) {
		elapsedTime = (now - startTime) / 1000;
	}

	if (!finished && elapsedTime >= timeLimitSeconds) {
		elapsedTime = timeLimitSeconds;
		finished = true;
		timeUp = true;
		playSound("lose", { restart: false, volume: baseVolumes.lose });
	}

	const remaining = timeLimitSeconds - elapsedTime;
	timerLabel.textContent = formatTime(remaining);

	const key = getSettingsKey();
	if (bestTimes[key] !== undefined) {
		bestLabel.textContent = bestTimes[key].toFixed(1);
	} else {
		bestLabel.textContent = "--";
	}
}

function isWall(col, row) {
	if (col < 0 || row < 0 || col >= cols || row >= rows) {
		return true;
	}
	return maze[row][col] === 1;
}

function tryMove(dx, dy) {
	if (finished) {
		return;
	}

	const nextX = player.x + dx * player.speed;
	const nextY = player.y + dy * player.speed;
	const radius = player.radius;

	const left = Math.floor((nextX - radius) / cellSize);
	const right = Math.floor((nextX + radius) / cellSize);
	const top = Math.floor((nextY - radius) / cellSize);
	const bottom = Math.floor((nextY + radius) / cellSize);

	if (!isWall(left, top) && !isWall(right, top) && !isWall(left, bottom) && !isWall(right, bottom)) {
		player.x = nextX;
		player.y = nextY;
	}
}

function updatePlayer() {
	const diag = input.left || input.right ? (input.up || input.down ? 0.71 : 1) : 1;
	const wasMoving = input.left || input.right || input.up || input.down;
	player.isMoving = !finished && wasMoving;
	if (input.left) {
		tryMove(-1 * diag, 0);
	}
	if (input.right) {
		tryMove(1 * diag, 0);
	}
	if (input.up) {
		tryMove(0, -1 * diag);
	}
	if (input.down) {
		tryMove(0, 1 * diag);
	}

	if (!finished && wasMoving) {
		if (!walkPlaying) {
			walkPlaying = true;
			playSound("walk", { volume: baseVolumes.walk });
		}
	} else if (walkPlaying) {
		walkPlaying = false;
		stopSound("walk");
	}

	const col = Math.floor(player.x / cellSize);
	const row = Math.floor(player.y / cellSize);
	const key = `${col},${row}`;
	if (questionCooldown <= 0 && questionTileMap.has(key)) {
		const tile = questionTileMap.get(key);
		hasHitQuestion = true;
		questionCooldown = 20;
		questionTileMap.delete(key);
		const tileIndex = questionTiles.findIndex((item) => item.col === tile.col && item.row === tile.row);
		if (tileIndex !== -1) {
			questionTiles.splice(tileIndex, 1);
		}
		const didJumpscare = Math.random() < jumpscareConfig.chance;
		if (didJumpscare) {
			triggerJumpscare();
		} else {
			playSound("teleport", { restart: true, volume: baseVolumes.teleport });
			if (tile.type === "reset") {
				resetPlayer();
			} else {
				const exclude = new Set(["1,1", `${exitCell.col},${exitCell.row}`]);
				const target = getRandomPathCell(exclude);
				player.x = target.col * cellSize + cellSize * 0.5;
				player.y = target.row * cellSize + cellSize * 0.5;
			}
		}
	}

	if (!finished && hasHitQuestion && col === exitCell.col && row === exitCell.row) {
		finished = true;
		playSound("win", { restart: false, volume: baseVolumes.win });
		const bestKey = getSettingsKey();
		if (bestTimes[bestKey] === undefined || elapsedTime < bestTimes[bestKey]) {
			bestTimes[bestKey] = elapsedTime;
		}
	}
}

function updateCamera() {
	const targetX = player.x - width * 0.5;
	const targetY = player.y - height * 0.5;
	const maxX = Math.max(0, worldWidth - width);
	const maxY = Math.max(0, worldHeight - height);

	camera.x = Math.min(Math.max(targetX, 0), maxX);
	camera.y = Math.min(Math.max(targetY, 0), maxY);
}

function drawBackground() {
	ctx.fillStyle = palette.grassDark;
	ctx.fillRect(0, 0, width, height);
}

function drawMaze() {
	const startCol = Math.max(0, Math.floor(camera.x / cellSize) - 1);
	const endCol = Math.min(cols - 1, Math.floor((camera.x + width) / cellSize) + 1);
	const startRow = Math.max(0, Math.floor(camera.y / cellSize) - 1);
	const endRow = Math.min(rows - 1, Math.floor((camera.y + height) / cellSize) + 1);

	for (let r = startRow; r <= endRow; r++) {
		for (let c = startCol; c <= endCol; c++) {
			const x = c * cellSize - camera.x;
			const y = r * cellSize - camera.y;

			if (maze[r][c] === 1) {
				const shade = (r + c) % 3;
				ctx.fillStyle = shade === 0 ? palette.bushDark : shade === 1 ? palette.bushLight : palette.stoneDark;
				ctx.fillRect(x, y, cellSize, cellSize);
				if (shade === 2) {
					ctx.fillStyle = palette.stoneMid;
					ctx.fillRect(x + 3, y + 3, cellSize - 6, cellSize - 6);
					ctx.fillStyle = palette.stoneLight;
					ctx.fillRect(x + 7, y + 7, cellSize - 14, cellSize - 14);
				}
			} else {
				ctx.fillStyle = palette.path;
				ctx.fillRect(x, y, cellSize, cellSize);
			}
		}
	}

	ctx.font = "700 16px Segoe UI";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	for (const tile of questionTiles) {
		if (tile.col < startCol || tile.col > endCol || tile.row < startRow || tile.row > endRow) {
			continue;
		}
		const x = tile.col * cellSize - camera.x;
		const y = tile.row * cellSize - camera.y;
		ctx.fillStyle = "#050505";
		ctx.fillRect(x + 3, y + 3, cellSize - 6, cellSize - 6);
		ctx.fillStyle = "#f4f0e6";
		ctx.fillText("?", x + cellSize / 2, y + cellSize / 2 + 1);
	}
}

function drawExit() {
	const x = exitCell.col * cellSize - camera.x;
	const y = exitCell.row * cellSize - camera.y;
	ctx.fillStyle = palette.exit;
	ctx.fillRect(x + 4, y + 4, cellSize - 8, cellSize - 8);
}

function drawPlayer() {
	const px = player.x - camera.x;
	const py = player.y - camera.y;
	
	// Draw Dora image only (no fallback ball)
	ctx.save();
	
	// Draw circular clipped Dora image
	ctx.beginPath();
	ctx.arc(px, py, player.radius, 0, Math.PI * 2);
	ctx.closePath();
	ctx.clip();
	
	// Draw the image centered
	const imgSize = player.radius * 2;
	ctx.drawImage(doraImage, px - player.radius, py - player.radius, imgSize, imgSize);
	
	ctx.restore();
}

function drawOverlay() {
	if (!finished) {
		return;
	}

	ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
	ctx.fillRect(0, 0, width, height);
	ctx.fillStyle = "#f5f2e8";
	ctx.font = "600 24px Segoe UI";
	ctx.textAlign = "center";
	ctx.fillText(timeUp ? "Time's up!" : "Maze cleared!", width / 2, height / 2 - 12);
	ctx.font = "400 16px Segoe UI";
	ctx.fillText("Press New Maze to play again", width / 2, height / 2 + 16);
}

function gameLoop(now) {
	currentTime = now;
	if (questionCooldown > 0) {
		questionCooldown -= 1;
	}
	updatePlayer();
	updateCamera();
	updateTimer(now);

	drawBackground();
	drawMaze();
	drawExit();
	drawPlayer();
	drawOverlay();

	requestAnimationFrame(gameLoop);
}

function resetGame() {
	buildMaze();
}

window.addEventListener("resize", () => {
	resizeCanvas();
	buildMaze();
});

window.addEventListener("keydown", (event) => {
	ensureBgm();
	if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "a", "d", "w", "s", "A", "D", "W", "S"].includes(event.key)) {
		event.preventDefault();
	}
	if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
		input.left = true;
	}
	if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
		input.right = true;
	}
	if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") {
		input.up = true;
	}
	if (event.key === "ArrowDown" || event.key === "s" || event.key === "S") {
		input.down = true;
	}
});

window.addEventListener("keyup", (event) => {
	if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "a", "d", "w", "s", "A", "D", "W", "S"].includes(event.key)) {
		event.preventDefault();
	}
	if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
		input.left = false;
	}
	if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
		input.right = false;
	}
	if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") {
		input.up = false;
	}
	if (event.key === "ArrowDown" || event.key === "s" || event.key === "S") {
		input.down = false;
	}
});

volumeSlider.addEventListener("input", () => {
	masterVolume = Number.parseFloat(volumeSlider.value);
	if (audio.bgm) {
		audio.bgm.volume = baseVolumes.bgm * masterVolume;
	}
	if (audio.walk && walkPlaying) {
		audio.walk.volume = baseVolumes.walk * masterVolume;
	}
});

difficultySelect.addEventListener("change", () => {
	resetGame();
});

shapeSelect.addEventListener("change", () => {
	resetGame();
});

restartBtn.addEventListener("click", () => {
	ensureBgm();
	resetGame();
});

resizeCanvas();
loadAudio();
masterVolume = Number.parseFloat(volumeSlider.value);
buildMaze();
gameLoop(performance.now());