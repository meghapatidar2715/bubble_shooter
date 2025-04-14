const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const BUBBLE_RADIUS = 15;
const COLORS = ["red", "green", "blue", "yellow", "purple"];
let bubbles = [];
let shooter;
let currentBubble;
let score = 0;
let highScore = localStorage.getItem("bubbleHighScore") || 0;
let level = 1;
let isShooting = false;

document.getElementById("highScore").textContent = highScore;

function resetGame() {
  level = 1;
  score = 0;
  updateUI();
  initLevel();
}

function updateUI() {
  document.getElementById("score").textContent = score;
  document.getElementById("level").textContent = level;
  document.getElementById("highScore").textContent = highScore;
}

function getRandomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function createShooter() {
  return {
    x: canvas.width / 2,
    y: canvas.height - 30,
    color: getRandomColor()
  };
}

function shootBubble(x, y) {
  if (isShooting) return;

  const dx = x - shooter.x;
  const dy = y - shooter.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  currentBubble = {
    x: shooter.x,
    y: shooter.y,
    vx: (dx / dist) * 5,
    vy: (dy / dist) * 5,
    color: shooter.color
  };
  isShooting = true;
  shooter.color = getRandomColor();
}

function drawBubble(b) {
  ctx.beginPath();
  ctx.arc(b.x, b.y, BUBBLE_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = b.color;
  ctx.fill();
  ctx.closePath();
}

function drawShooter() {
  drawBubble(shooter);
}

function drawBubbles() {
  for (let b of bubbles) {
    drawBubble(b);
  }
}

function updateBubble() {
  if (!currentBubble) return;

  currentBubble.x += currentBubble.vx;
  currentBubble.y += currentBubble.vy;
  if (currentBubble.x <= BUBBLE_RADIUS || currentBubble.x >= canvas.width - BUBBLE_RADIUS) {
    currentBubble.vx *= -1;
  }
  if (currentBubble.y <= BUBBLE_RADIUS || checkCollision(currentBubble)) {
    snapToGrid(currentBubble);
    bubbles.push({ ...currentBubble });
    checkMatches(currentBubble);
    currentBubble = null;
    isShooting = false;
    checkLevelProgression();
  }
}

function snapToGrid(b) {
  b.x = Math.round(b.x / (BUBBLE_RADIUS * 2)) * BUBBLE_RADIUS * 2;
  b.y = Math.round(b.y / (BUBBLE_RADIUS * 2)) * BUBBLE_RADIUS * 2;
}

function checkCollision(b) {
  for (let other of bubbles) {
    const dx = b.x - other.x;
    const dy = b.y - other.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < BUBBLE_RADIUS * 2 - 2) return true;
  }
  return false;
}

function checkMatches(base) {
  let matched = [base];
  let visited = new Set();
  visited.add(base);

  function dfs(b) {
    for (let other of bubbles) {
      if (visited.has(other) || other.color !== base.color) continue;
      const dx = b.x - other.x;
      const dy = b.y - other.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < BUBBLE_RADIUS * 2 + 2) {
        matched.push(other);
        visited.add(other);
        dfs(other);
      }
    }
  }

  dfs(base);

  if (matched.length >= 3) {
    score += matched.length * 10;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("bubbleHighScore", highScore);
    }
    bubbles = bubbles.filter(b => !matched.includes(b));
    updateUI();
  }
}

function checkLevelProgression() {
  if (bubbles.length <= 5) {
    if (level < 3) {
      level++;
      updateUI();
      initLevel();
    } else {
      alert("You won the game! Final Score: " + score);
      resetGame();
    }
  } else if (bubbles.some(b => b.y >= canvas.height - 100)) {
    alert("Game Over! Restarting from Level 1.");
    resetGame();
  }
}

function initLevel() {
  bubbles = [];
  shooter = createShooter();
  for (let i = 0; i < level * 10; i++) {
    let bubble = {
      x: Math.random() * (canvas.width - BUBBLE_RADIUS * 2) + BUBBLE_RADIUS,
      y: Math.random() * 200 + BUBBLE_RADIUS,
      color: getRandomColor()
    };
    bubbles.push(bubble);
  }
}

canvas.addEventListener("click", e => {
  const rect = canvas.getBoundingClientRect();
  shootBubble(e.clientX - rect.left, e.clientY - rect.top);
});

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBubbles();
  drawShooter();
  if (currentBubble) {
    drawBubble(currentBubble);
    updateBubble();
  }
  requestAnimationFrame(gameLoop);
}

resetGame();
gameLoop();
