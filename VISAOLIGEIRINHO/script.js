
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const playBtn = document.getElementById('playBtn');
const resetBtn = document.getElementById('resetBtn');
const configBtn = document.getElementById('configBtn');
const configPanel = document.getElementById('configPanel');


const currentTimeEl = document.getElementById('currentTime');
const attemptsEl = document.getElementById('attempts');
const capturesEl = document.getElementById('captures');
const successRateEl = document.getElementById('successRate');
const avgTimeEl = document.getElementById('avgTime');
const avgTimeContainer = document.getElementById('avgTimeContainer');
const currentStrategyEl = document.getElementById('currentStrategy');

const speedySpeedInput = document.getElementById('speedySpeed');
const sylvesterSpeedInput = document.getElementById('sylvesterSpeed');
const captureDistanceInput = document.getElementById('captureDistance');
const strategySelect = document.getElementById('strategySelect');

const speedySpeedLabel = document.getElementById('speedySpeedLabel');
const sylvesterSpeedLabel = document.getElementById('sylvesterSpeedLabel');
const captureDistanceLabel = document.getElementById('captureDistanceLabel');

const speedySpeedDisplay = document.getElementById('speedySpeedDisplay');
const sylvesterSpeedDisplay = document.getElementById('sylvesterSpeedDisplay');

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const SPEEDY_SIZE = 20;
const SYLVESTER_SIZE = 45;

let isRunning = false;
let showConfig = false;
let animationId = null;

let config = {
    speedySpeed: 10,
    sylvesterSpeed: 7,
    captureDistance: 25,
    strategy: 'direct'
};


let stats = {
    attempts: 0,
    captures: 0,
    totalTime: 0,
    currentTime: 0,
    successRate: 0
};


let gameState = {
    speedy: { x: 0, y: 0, vx: 0, vy: 0, active: false },
    sylvester: { x: 400, y: 300 },
    frameCount: 0
};


function spawnSpeedy() {
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    
    const angle = Math.random() * Math.PI / 3 - Math.PI / 6; // ±30 graus
    const speed = config.speedySpeed;
    
    switch(side) {
        case 0: 
            x = Math.random() * CANVAS_WIDTH;
            y = 0;
            vx = speed * Math.sin(angle);
            vy = speed * Math.cos(angle);
            break;
        case 1: 
            x = CANVAS_WIDTH;
            y = Math.random() * CANVAS_HEIGHT;
            vx = -speed * Math.cos(angle);
            vy = speed * Math.sin(angle);
            break;
        case 2: 
            x = Math.random() * CANVAS_WIDTH;
            y = CANVAS_HEIGHT;
            vx = speed * Math.sin(angle);
            vy = -speed * Math.cos(angle);
            break;
        default: 
            x = 0;
            y = Math.random() * CANVAS_HEIGHT;
            vx = speed * Math.cos(angle);
            vy = speed * Math.sin(angle);
    }
    
    gameState.speedy = { x, y, vx, vy, active: true };
}


const chaseStrategies = {
   
    direct: (sylvester, speedy) => {
        const dx = speedy.x - sylvester.x;
        const dy = speedy.y - sylvester.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            return {
                x: sylvester.x + (dx / dist) * config.sylvesterSpeed,
                y: sylvester.y + (dy / dist) * config.sylvesterSpeed
            };
        }
        return sylvester;
    },
    
   
    predict: (sylvester, speedy) => {
        const lookahead = 3;
        const targetX = speedy.x + speedy.vx * lookahead;
        const targetY = speedy.y + speedy.vy * lookahead;
        
        const dx = targetX - sylvester.x;
        const dy = targetY - sylvester.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            return {
                x: sylvester.x + (dx / dist) * config.sylvesterSpeed,
                y: sylvester.y + (dy / dist) * config.sylvesterSpeed
            };
        }
        return sylvester;
    },
    
   
    patrol: (sylvester, speedy) => {
        const dx = speedy.x - sylvester.x;
        const dy = speedy.y - sylvester.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
       
        if (dist < 300) {
            if (dist > 0) {
                return {
                    x: sylvester.x + (dx / dist) * config.sylvesterSpeed,
                    y: sylvester.y + (dy / dist) * config.sylvesterSpeed
                };
            }
        } else {
            
            const centerX = CANVAS_WIDTH / 2;
            const centerY = CANVAS_HEIGHT / 2;
            const angle = gameState.frameCount * 0.05;
            const radius = 150;
            
            return {
                x: sylvester.x + (centerX + Math.cos(angle) * radius - sylvester.x) * 0.1,
                y: sylvester.y + (centerY + Math.sin(angle) * radius - sylvester.y) * 0.1
            };
        }
        return sylvester;
    }
};


function updateStatsDisplay() {
    currentTimeEl.textContent = stats.currentTime.toFixed(1) + 's';
    attemptsEl.textContent = stats.attempts;
    capturesEl.textContent = stats.captures;
    successRateEl.textContent = stats.successRate.toFixed(1) + '%';
    
    if (stats.captures > 0) {
        avgTimeContainer.style.display = 'block';
        avgTimeEl.textContent = (stats.totalTime / stats.captures).toFixed(1) + 's';
    } else {
        avgTimeContainer.style.display = 'none';
    }
    
    currentStrategyEl.textContent = config.strategy;
}


function gameLoop() {
    
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    
    if (!gameState.speedy.active) {
        spawnSpeedy();
        gameState.frameCount = 0;
        stats.attempts++;
        stats.currentTime = 0;
        updateStatsDisplay();
    }
    
 
    if (gameState.speedy.active) {
        gameState.speedy.x += gameState.speedy.vx;
        gameState.speedy.y += gameState.speedy.vy;
        
        
        if (gameState.speedy.x < -50 || gameState.speedy.x > CANVAS_WIDTH + 50 ||
            gameState.speedy.y < -50 || gameState.speedy.y > CANVAS_HEIGHT + 50) {
            gameState.speedy.active = false;
        }
    }
    
  
    if (gameState.speedy.active) {
        const newPos = chaseStrategies[config.strategy](gameState.sylvester, gameState.speedy);
        gameState.sylvester.x = newPos.x;
        gameState.sylvester.y = newPos.y;
    }
    
    
    const dx = gameState.speedy.x - gameState.sylvester.x;
    const dy = gameState.speedy.y - gameState.sylvester.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < config.captureDistance && gameState.speedy.active) {
        gameState.speedy.active = false;
        const captureTime = gameState.frameCount / 60;
        
        stats.captures++;
        stats.totalTime += captureTime;
        stats.successRate = (stats.captures / stats.attempts) * 100;
        updateStatsDisplay();
    }
    
    
    if (gameState.speedy.active) {
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.arc(gameState.speedy.x, gameState.speedy.y, SPEEDY_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
        
        
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(gameState.speedy.x, gameState.speedy.y);
        ctx.lineTo(gameState.speedy.x + gameState.speedy.vx * 2, gameState.speedy.y + gameState.speedy.vy * 2);
        ctx.stroke();
    }
    
    // Desenha Frajola
    ctx.fillStyle = '#4ecdc4';
    ctx.beginPath();
    ctx.arc(gameState.sylvester.x, gameState.sylvester.y, SYLVESTER_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    
  
    if (gameState.speedy.active) {
        ctx.strokeStyle = 'rgba(78, 205, 196, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(gameState.sylvester.x, gameState.sylvester.y);
        ctx.lineTo(gameState.speedy.x, gameState.speedy.y);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    
    gameState.frameCount++;
    stats.currentTime = gameState.frameCount / 60;
    currentTimeEl.textContent = stats.currentTime.toFixed(1) + 's';
    
    if (isRunning) {
        animationId = requestAnimationFrame(gameLoop);
    }
}


function togglePlay() {
    isRunning = !isRunning;
    
    if (isRunning) {
        playBtn.innerHTML = '<span class="icon">⏸</span> Pausar';
        gameLoop();
    } else {
        playBtn.innerHTML = '<span class="icon">▶</span> Iniciar';
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
    }
}


function resetSimulation() {
    isRunning = false;
    playBtn.innerHTML = '<span class="icon">▶</span> Iniciar';
    
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    gameState = {
        speedy: { x: 0, y: 0, vx: 0, vy: 0, active: false },
        sylvester: { x: 400, y: 300 },
        frameCount: 0
    };
    
    stats = {
        attempts: 0,
        captures: 0,
        totalTime: 0,
        currentTime: 0,
        successRate: 0
    };
    
    updateStatsDisplay();
    
    
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}


function toggleConfig() {
    showConfig = !showConfig;
    configPanel.style.display = showConfig ? 'block' : 'none';
    configBtn.innerHTML = showConfig ? '<span class="icon">⚙</span> Fechar' : '<span class="icon">⚙</span> Config';
    
    if (showConfig) {
        isRunning = false;
        playBtn.innerHTML = '<span class="icon">▶</span> Iniciar';
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
    }
}


playBtn.addEventListener('click', togglePlay);
resetBtn.addEventListener('click', resetSimulation);
configBtn.addEventListener('click', toggleConfig);


speedySpeedInput.addEventListener('input', (e) => {
    config.speedySpeed = parseInt(e.target.value);
    speedySpeedLabel.textContent = config.speedySpeed;
    speedySpeedDisplay.textContent = config.speedySpeed;
});

sylvesterSpeedInput.addEventListener('input', (e) => {
    config.sylvesterSpeed = parseInt(e.target.value);
    sylvesterSpeedLabel.textContent = config.sylvesterSpeed;
    sylvesterSpeedDisplay.textContent = config.sylvesterSpeed;
});

captureDistanceInput.addEventListener('input', (e) => {
    config.captureDistance = parseInt(e.target.value);
    captureDistanceLabel.textContent = config.captureDistance;
});

strategySelect.addEventListener('change', (e) => {
    config.strategy = e.target.value;
    updateStatsDisplay();
});


updateStatsDisplay();
ctx.fillStyle = '#1a1a2e';
ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);