
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Dimensões do mundo virtual (2x maior que o canvas)
const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 1200;
const VIEWPORT_WIDTH = 800;
const VIEWPORT_HEIGHT = 600;

let gameRunning = false;
let gameTime = 0;
let attempts = 0;
let captures = 0;
let followMode = false;
let paused = false;


const camera = {
    x: 0,
    y: 0,
    speed: 8,
    smoothing: 0.1,
    targetX: 0,
    targetY: 0,

    update() {
        this.x += (this.targetX - this.x) * this.smoothing;
        this.y += (this.targetY - this.y) * this.smoothing;

        // Limites do mundo
        this.x = Math.max(0, Math.min(WORLD_WIDTH - VIEWPORT_WIDTH, this.x));
        this.y = Math.max(0, Math.min(WORLD_HEIGHT - VIEWPORT_HEIGHT, this.y));
    },

    worldToScreen(x, y) {
        return {
            x: x - this.x,
            y: y - this.y
        };
    },

    screenToWorld(x, y) {
        return {
            x: x + this.x,
            y: y + this.y
        };
    },

    follow(target) {
        this.targetX = target.x - VIEWPORT_WIDTH / 2;
        this.targetY = target.y - VIEWPORT_HEIGHT / 2;
    }
};

const light = {
    direction: { x: -1, y: -1, z: -1 },
    color: { r: 255, g: 255, b: 200 },
    intensity: 0.8,
    ambientStrength: 0.3,
    diffuseStrength: 0.7,
    specularStrength: 0.5,
    shininess: 32,


    lastAmbient: 0,
    lastDiffuse: 0,
    lastSpecular: 0,

    normalize(vec) {
        const len = Math.sqrt(vec.x ** 2 + vec.y ** 2 + vec.z ** 2);
        return {
            x: vec.x / len,
            y: vec.y / len,
            z: vec.z / len
        };
    },

    applyToColor(baseColor, normal, viewPos = {x: 0, y: 0, z: 1}) {
        const lightDir = this.normalize(this.direction);
        const viewDir = this.normalize(viewPos);
        
     
        const ambient = this.ambientStrength;
        this.lastAmbient = ambient;

     
        const normalN = this.normalize(normal);
        const dotProduct = Math.max(0, 
            -(normalN.x * lightDir.x + normalN.y * lightDir.y + normalN.z * lightDir.z)
        );
        const diffuse = dotProduct * this.diffuseStrength;
        this.lastDiffuse = diffuse;


        const reflectX = 2 * dotProduct * normalN.x + lightDir.x;
        const reflectY = 2 * dotProduct * normalN.y + lightDir.y;
        const reflectZ = 2 * dotProduct * normalN.z + lightDir.z;
        
        const reflectDot = Math.max(0, 
            reflectX * viewDir.x + reflectY * viewDir.y + reflectZ * viewDir.z
        );
        const specular = Math.pow(reflectDot, this.shininess) * this.specularStrength;
        this.lastSpecular = specular;

 
        const totalLight = (ambient + diffuse) * this.intensity + specular;

        return {
            r: Math.min(255, baseColor.r * totalLight),
            g: Math.min(255, baseColor.g * totalLight),
            b: Math.min(255, baseColor.b * totalLight),
            specular: specular
        };
    }
};


const ligeirinho = {
    x: 400,
    y: 300,
    z: 5,
    baseSize: 20,
    size: 20,
    speed: 5,
    minSpeed: 2,
    maxSpeed: 10,
    acceleration: 0.05,
    deceleration: 0.03,
    targetSpeed: 5,
    angle: 0,
    targetX: 400,
    targetY: 300,
    scale: 1.0,
    color: { r: 255, g: 107, b: 107 },
    trailPositions: [],
    obstacles: [],

    setObstacles(obs) {
        this.obstacles = obs;
    },

    checkCollision(newX, newY) {
        for (let obs of this.obstacles) {
            if (newX > obs.x - this.size && 
                newX < obs.x + obs.w + this.size &&
                newY > obs.y - this.size && 
                newY < obs.y + obs.h + this.size) {
                return true;
            }
        }
        return false;
    },

    update() {
     
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // velocidade alvo
        if (dist < 100) {
            this.targetSpeed = this.minSpeed;
        } else if (dist > 300) {
            this.targetSpeed = this.maxSpeed;
        } else {
            this.targetSpeed = (this.minSpeed + this.maxSpeed) / 2;
        }

        // 
        if (this.speed < this.targetSpeed) {
            this.speed = Math.min(this.targetSpeed, this.speed + this.acceleration);
        } else if (this.speed > this.targetSpeed) {
            this.speed = Math.max(this.targetSpeed, this.speed - this.deceleration);
        }

     e
        this.scale = 1.0;
        this.size = this.baseSize;

      
        this.z = 5 + Math.sin(gameTime * 5) * 0.5;

     
        if (dist < 50) {
            let newTargetX, newTargetY;
            let attempts = 0;
            do {
                newTargetX = Math.random() * (WORLD_WIDTH - 100) + 50;
                newTargetY = Math.random() * (WORLD_HEIGHT - 100) + 50;
                attempts++;
            } while (this.checkCollision(newTargetX, newTargetY) && attempts < 10);
            
            this.targetX = newTargetX;
            this.targetY = newTargetY;
        }

        
        this.angle = Math.atan2(dy, dx);
        
        
        const newX = this.x + Math.cos(this.angle) * this.speed;
        const newY = this.y + Math.sin(this.angle) * this.speed;

        if (!this.checkCollision(newX, newY)) {
            this.x = newX;
            this.y = newY;
        } else {
            this.targetX = Math.random() * (WORLD_WIDTH - 100) + 50;
            this.targetY = Math.random() * (WORLD_HEIGHT - 100) + 50;
        }

        // Rastro
        this.trailPositions.push({ x: this.x, y: this.y });
        if (this.trailPositions.length > 20) {
            this.trailPositions.shift();
        }
    },

    draw() {
        const screenPos = camera.worldToScreen(this.x, this.y);

        // Rastro
        ctx.strokeStyle = 'rgba(255, 107, 107, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        this.trailPositions.forEach((pos, i) => {
            const sp = camera.worldToScreen(pos.x, pos.y);
            if (i === 0) ctx.moveTo(sp.x, sp.y);
            else ctx.lineTo(sp.x, sp.y);
        });
        ctx.stroke();

    
        const normal = { x: 0, y: 0, z: 1 };
        const litColor = light.applyToColor(this.color, normal);

        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);
        ctx.scale(this.scale, this.scale);
        ctx.rotate(this.angle);

 
        ctx.fillStyle = `rgb(${litColor.r}, ${litColor.g}, ${litColor.b})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.baseSize, this.baseSize * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

     
        if (litColor.specular > 0.1) {
            ctx.fillStyle = `rgba(255, 255, 255, ${litColor.specular})`;
            ctx.beginPath();
            ctx.arc(this.baseSize * 0.3, -this.baseSize * 0.2, this.baseSize * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }

  
        ctx.fillStyle = `rgb(${litColor.r * 0.8}, ${litColor.g * 0.8}, ${litColor.b * 0.8})`;
        ctx.beginPath();
        ctx.arc(-this.baseSize * 0.6, -this.baseSize * 0.6, this.baseSize * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-this.baseSize * 0.6, this.baseSize * 0.6, this.baseSize * 0.4, 0, Math.PI * 2);
        ctx.fill();

       
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.baseSize * 0.3, 0, this.baseSize * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.baseSize * 0.35, 0, this.baseSize * 0.15, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    },

    contains(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        return Math.sqrt(dx * dx + dy * dy) < this.size * 1.5;
    }
};


const frajola = {
    x: 200,
    y: 200,
    z: 5,
    size: 25,
    speed: 3,
    angle: 0,
    color: { r: 78, g: 205, b: 196 },
    captureRadius: 40,

    update() {
        const dx = ligeirinho.x - this.x;
        const dy = ligeirinho.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Verificar captura (considerando Z-buffer)
        const zDiff = Math.abs(this.z - ligeirinho.z);
        if (dist < this.captureRadius && zDiff < 2) {
            captures++;
            ligeirinho.x = Math.random() * (WORLD_WIDTH - 100) + 50;
            ligeirinho.y = Math.random() * (WORLD_HEIGHT - 100) + 50;
            ligeirinho.trailPositions = [];
            
            this.x = Math.random() * (WORLD_WIDTH - 100) + 50;
            this.y = Math.random() * (WORLD_HEIGHT - 100) + 50;
            
            updateStats();
            return;
        }

        if (dist > 50) {
            this.angle = Math.atan2(dy, dx);
            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed;
        }
    },

    draw() {
        const screenPos = camera.worldToScreen(this.x, this.y);
        const normal = { x: 0, y: 0, z: 1 };
        const litColor = light.applyToColor(this.color, normal);

        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);
        ctx.rotate(this.angle);

        
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.captureRadius, 0, Math.PI * 2);
        ctx.stroke();

        
        ctx.fillStyle = `rgb(${litColor.r}, ${litColor.g}, ${litColor.b})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size, this.size * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        
        if (litColor.specular > 0.1) {
            ctx.fillStyle = `rgba(255, 255, 255, ${litColor.specular * 0.7})`;
            ctx.beginPath();
            ctx.arc(this.size * 0.3, -this.size * 0.3, this.size * 0.2, 0, Math.PI * 2);
            ctx.fill();
        }

      
        ctx.beginPath();
        ctx.moveTo(-this.size * 0.5, -this.size * 0.8);
        ctx.lineTo(-this.size * 0.7, -this.size * 1.3);
        ctx.lineTo(-this.size * 0.3, -this.size * 0.8);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(this.size * 0.5, -this.size * 0.8);
        ctx.lineTo(this.size * 0.7, -this.size * 1.3);
        ctx.lineTo(this.size * 0.3, -this.size * 0.8);
        ctx.fill();

        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(this.size * 0.3, -this.size * 0.2, this.size * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.size * 0.35, -this.size * 0.2, this.size * 0.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
};


const worldObstacles = [
    { x: 300, y: 400, w: 35, h: 80, z: 3, type: 'cactus' },
    { x: 900, y: 200, w: 35, h: 80, z: 3, type: 'cactus' },
    { x: 1300, y: 600, w: 35, h: 80, z: 3, type: 'cactus' },
    { x: 1100, y: 450, w: 35, h: 80, z: 3, type: 'cactus' },
    { x: 1400, y: 300, w: 35, h: 80, z: 3, type: 'cactus' },
    { x: 600, y: 800, w: 80, h: 50, z: 2, type: 'rock' },
    { x: 450, y: 650, w: 80, h: 50, z: 2, type: 'rock' },
    { x: 200, y: 900, w: 80, h: 50, z: 2, type: 'rock' },
];

ligeirinho.setObstacles(worldObstacles);

function drawBackground() {
  
    const gradient = ctx.createLinearGradient(0, 0, 0, VIEWPORT_HEIGHT);
    gradient.addColorStop(0, '#8B7355');
    gradient.addColorStop(0.6, '#6B543E');
    gradient.addColorStop(1, '#4A3728');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

   
    ctx.fillStyle = 'rgba(139, 115, 85, 0.1)';
    for (let i = 0; i < 100; i++) {
        const x = (camera.x * 0.1 + i * 123) % WORLD_WIDTH;
        const y = (camera.y * 0.1 + i * 456) % WORLD_HEIGHT;
        const screenPos = camera.worldToScreen(x, y);
        if (screenPos.x > 0 && screenPos.x < VIEWPORT_WIDTH && 
            screenPos.y > 0 && screenPos.y < VIEWPORT_HEIGHT) {
            ctx.fillRect(screenPos.x, screenPos.y, 2, 2);
        }
    }

 
    ctx.strokeStyle = 'rgba(74, 55, 40, 0.3)';
    ctx.lineWidth = 2;
    [150, 300, 450].forEach(yPos => {
        const screenY = yPos - camera.y;
        if (screenY > 0 && screenY < VIEWPORT_HEIGHT) {
            ctx.beginPath();
            ctx.moveTo(0, screenY);
            ctx.lineTo(VIEWPORT_WIDTH, screenY);
            ctx.stroke();
        }
    });
}

function drawObstacle(obs) {
    const screenPos = camera.worldToScreen(obs.x, obs.y);
    
    if (screenPos.x > -100 && screenPos.x < VIEWPORT_WIDTH + 100 &&
        screenPos.y > -100 && screenPos.y < VIEWPORT_HEIGHT + 100) {
        
        const normal = { x: 0, y: 0.3, z: 0.95 };
        
        if (obs.type === 'cactus') {
            const baseColor = { r: 45, g: 74, b: 43 };
            const litColor = light.applyToColor(baseColor, normal);
            
            ctx.fillStyle = `rgb(${litColor.r}, ${litColor.g}, ${litColor.b})`;
            ctx.fillRect(screenPos.x, screenPos.y, 20, 80);
            ctx.fillRect(screenPos.x - 15, screenPos.y + 30, 15, 30);
            ctx.fillRect(screenPos.x + 20, screenPos.y + 40, 15, 25);
            
            if (litColor.specular > 0.1) {
                ctx.fillStyle = `rgba(150, 200, 150, ${litColor.specular * 0.5})`;
                ctx.fillRect(screenPos.x + 5, screenPos.y + 10, 8, 15);
            }
            
            ctx.strokeStyle = '#1a2a1a';
            ctx.lineWidth = 1;
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.moveTo(screenPos.x + 5, screenPos.y + 10 + i * 15);
                ctx.lineTo(screenPos.x, screenPos.y + 10 + i * 15);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(screenPos.x + 15, screenPos.y + 10 + i * 15);
                ctx.lineTo(screenPos.x + 20, screenPos.y + 10 + i * 15);
                ctx.stroke();
            }
        } else if (obs.type === 'rock') {
            const baseColor = { r: 90, g: 74, b: 58 };
            const litColor = light.applyToColor(baseColor, normal);
            
            ctx.fillStyle = `rgb(${litColor.r}, ${litColor.g}, ${litColor.b})`;
            ctx.beginPath();
            ctx.ellipse(screenPos.x + 40, screenPos.y + 25, 40, 25, 0, 0, Math.PI * 2);
            ctx.fill();
            
            const darkColor = light.applyToColor({ r: 74, g: 58, b: 42 }, normal);
            ctx.fillStyle = `rgb(${darkColor.r}, ${darkColor.g}, ${darkColor.b})`;
            ctx.beginPath();
            ctx.ellipse(screenPos.x + 50, screenPos.y + 20, 25, 15, 0, 0, Math.PI * 2);
            ctx.fill();
            
            if (litColor.specular > 0.15) {
                ctx.fillStyle = `rgba(200, 180, 150, ${litColor.specular * 0.6})`;
                ctx.beginPath();
                ctx.ellipse(screenPos.x + 45, screenPos.y + 18, 12, 8, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.ellipse(screenPos.x + 40, screenPos.y + 45, 35, 10, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}


function renderScene() {
    drawBackground();
    
 
    const renderQueue = [
        { z: ligeirinho.z, draw: () => ligeirinho.draw() },
        { z: frajola.z, draw: () => frajola.draw() }
    ];

 
    worldObstacles.forEach(obs => {
        renderQueue.push({
            z: obs.z,
            draw: () => drawObstacle(obs)
        });
    });

   
    renderQueue.sort((a, b) => a.z - b.z);

    // Desenhar na ordem
    renderQueue.forEach(item => item.draw());
}


const keys = {};

document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === ' ') {
        paused = !paused;
        e.preventDefault();
    }
});

document.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('click', e => {
    if (!gameRunning) return;
    
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const worldPos = camera.screenToWorld(clickX, clickY);

    attempts++;
    
    if (ligeirinho.contains(worldPos.x, worldPos.y)) {
        captures++;
        
        ctx.save();
        const screenPos = camera.worldToScreen(ligeirinho.x, ligeirinho.y);
        ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, 50, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        ligeirinho.x = Math.random() * (WORLD_WIDTH - 100) + 50;
        ligeirinho.y = Math.random() * (WORLD_HEIGHT - 100) + 50;
        ligeirinho.trailPositions = [];
    }
    updateStats();
});

function handleCameraInput() {
    if (followMode) {
        camera.follow(ligeirinho);
    } else {
        if (keys['w'] || keys['arrowup']) camera.targetY -= camera.speed;
        if (keys['s'] || keys['arrowdown']) camera.targetY += camera.speed;
        if (keys['a'] || keys['arrowleft']) camera.targetX -= camera.speed;
        if (keys['d'] || keys['arrowright']) camera.targetX += camera.speed;
    }
}


function updateStats() {
    document.getElementById('timeValue').textContent = gameTime.toFixed(1) + 's';
    document.getElementById('attemptsValue').textContent = attempts;
    document.getElementById('capturesValue').textContent = captures;
    const successRate = attempts > 0 ? (captures / attempts * 100).toFixed(1) : 0;
    document.getElementById('successValue').textContent = successRate + '%';
    document.getElementById('speedValue').textContent = ligeirinho.speed.toFixed(1);
    document.getElementById('scaleValue').textContent = ligeirinho.scale.toFixed(2) + 'x';
    
    // Iluminação Phong
    document.getElementById('lightIntensity').textContent = light.intensity.toFixed(1);
    document.getElementById('ambientComp').textContent = light.lastAmbient.toFixed(2);
    document.getElementById('diffuseComp').textContent = light.lastDiffuse.toFixed(2);
    document.getElementById('specularComp').textContent = light.lastSpecular.toFixed(2);
    document.getElementById('lightDir').textContent = 
        `(${light.direction.x.toFixed(1)}, ${light.direction.y.toFixed(1)}, ${light.direction.z.toFixed(1)})`;
}


function gameLoop() {
    if (gameRunning && !paused) {
        gameTime += 1/60;
        ligeirinho.update();
        frajola.update();
        handleCameraInput();
        camera.update();
        updateStats();
    }

    renderScene();
    requestAnimationFrame(gameLoop);
}


document.getElementById('startBtn').addEventListener('click', () => {
    gameRunning = !gameRunning;
    document.getElementById('startBtn').innerHTML = gameRunning ? '⏸ Pausar' : '▶ Iniciar';
});

document.getElementById('resetBtn').addEventListener('click', () => {
    ligeirinho.x = 400;
    ligeirinho.y = 300;
    ligeirinho.speed = 5;
    ligeirinho.scale = 1.0;
    frajola.x = 200;
    frajola.y = 200;
    camera.x = 0;
    camera.y = 0;
    camera.targetX = 0;
    camera.targetY = 0;
    gameTime = 0;
    attempts = 0;
    captures = 0;
    updateStats();
});

document.getElementById('followBtn').addEventListener('click', () => {
    followMode = !followMode;
    const btn = document.getElementById('followBtn');
    btn.innerHTML = followMode ? '🎥 Modo Livre' : '📹 Seguir Ligeirinho';
});

updateStats();
gameLoop();