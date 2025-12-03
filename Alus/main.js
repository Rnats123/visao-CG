const PHI = 1.618033988749895;

// Variáveis de configuração do voo
let numCycles = 75;
let maxHeight = 50;
let animationSpeed = 1.0;
let direction = -1;

// Criar cena 3D (container para todos os objetos)
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);
scene.fog = new THREE.Fog(0x1a1a2e, 50, 200);

// Configurar câmera perspectiva
const camera = new THREE.PerspectiveCamera(
    60, 
    window.innerWidth / window.innerHeight, 
    0.1, 
    1000
);
camera.position.set(50, 40, 50);
camera.lookAt(0, 25, 0);

// Criar renderizador WebGL
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Luz ambiente - ilumina todos os objetos uniformemente
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

// Luz direcional - simula luz solar
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(50, 100, 50);
scene.add(directionalLight);

// Luz pontual - cria destaque no centro
const pointLight = new THREE.PointLight(0x667eea, 1, 100);
pointLight.position.set(0, 50, 0);
scene.add(pointLight);

let trajectoryLine;
let alusBird;
let trajectoryPoints = [];
let currentPosition = 0;
let isPlaying = true;
let totalDistance = 0;
let distances = [];

function createTrajectory() {
    // Resetar arrays
    trajectoryPoints = [];
    distances = [];
    totalDistance = 0;
    
    const points = [];
    let prevPoint = null;
    
    // Gerar pontos da espiral
    for (let i = 0; i <= numCycles; i++) {
        // Parâmetro normalizado: t ∈ [0, 1]
        const t = i / numCycles;
        const fibIndex = Math.floor(t * 20);
        const radius = (PHI ** (fibIndex / 5)) * 2;
        const angle = direction * (2 * Math.PI * PHI * i);

        let height;
        if (t <= 0.5) {
            // Fase de subida: y = 2t * h_max
            height = (t * 2) * maxHeight;
        } else {
            // Fase de descida: y = (2 - 2t) * h_max
            height = (2 - t * 2) * maxHeight;
        }

        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        const y = height;
        
        const point = new THREE.Vector3(x, y, z);
        points.push(point);

        if (prevPoint) {
            const dist = prevPoint.distanceTo(point);
            totalDistance += dist;
            distances.push(totalDistance);
        } else {
            distances.push(0);
        }
        prevPoint = point;
    }
    
    trajectoryPoints = points;

    const curve = new THREE.CatmullRomCurve3(points);
    curve.tension = 0.5;

    const curvePoints = curve.getPoints(numCycles * 10);

    const colors = [];
    const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    
    for (let i = 0; i < curvePoints.length; i++) {
        const t = i / curvePoints.length;
        const color = new THREE.Color();

        color.setHSL(0.6 - t * 0.3, 1.0, 0.5 + t * 0.2);
        colors.push(color.r, color.g, color.b);
    }
    
    // Adicionar cores como atributo da geometria
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    // Material que usa cores por vértice
    const material = new THREE.LineBasicMaterial({
        vertexColors: true,
        linewidth: 2
    });
    
    // Remover linha antiga se existir
    if (trajectoryLine) scene.remove(trajectoryLine);
    
    // Criar e adicionar nova linha à cena
    trajectoryLine = new THREE.Line(geometry, material);
    scene.add(trajectoryLine);
    
    return curve;
}

function createAlus() {
    const birdGroup = new THREE.Group();

    const bodyGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    bodyGeometry.scale(1, 0.8, 1.2);
    const bodyMaterial = new THREE.MeshPhongMaterial({
        color: 0xffd700,
        shininess: 100
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    birdGroup.add(body);
    
    const headGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0, 0.5, 0.8);
    birdGroup.add(head);

    const beakGeometry = new THREE.ConeGeometry(0.15, 0.4, 8);
    const beakMaterial = new THREE.MeshPhongMaterial({ color: 0xff6600 });
    const beak = new THREE.Mesh(beakGeometry, beakMaterial);
    beak.position.set(0, 0.5, 1.2);
    beak.rotation.x = Math.PI / 2;
    birdGroup.add(beak);

    const wingGeometry = new THREE.SphereGeometry(0.6, 16, 16);
    wingGeometry.scale(2, 0.2, 1);
    const wingMaterial = new THREE.MeshPhongMaterial({
        color: 0xffec8b,
        shininess: 80
    });
    
    // Asa esquerda
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-1, 0, 0);
    leftWing.rotation.z = -0.3;
    birdGroup.add(leftWing);
    
    // Asa direita
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(1, 0, 0);
    rightWing.rotation.z = 0.3;
    birdGroup.add(rightWing);

    const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.2, 0.6, 1.1);
    birdGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.2, 0.6, 1.1);
    birdGroup.add(rightEye);

    const birdLight = new THREE.PointLight(0xffd700, 1, 10);
    birdGroup.add(birdLight);
    
    return birdGroup;
}

// Criar trajetória inicial
let curve = createTrajectory();

// Criar e adicionar Alus à cena
alusBird = createAlus();
scene.add(alusBird);

// Adicionar grade de referência no chão
// Parâmetros: tamanho (150), divisões (30), cor central, cor da grade
const gridHelper = new THREE.GridHelper(150, 30, 0x444444, 0x222222);
scene.add(gridHelper);

document.getElementById('cycles').addEventListener('input', (e) => {
    numCycles = parseInt(e.target.value);
    document.getElementById('cyclesValue').textContent = numCycles;
    curve = createTrajectory();
    currentPosition = 0;
});

document.getElementById('speed').addEventListener('input', (e) => {
    animationSpeed = parseFloat(e.target.value);
    document.getElementById('speedValue').textContent = animationSpeed.toFixed(1) + 'x';
});

document.getElementById('maxHeight').addEventListener('input', (e) => {
    maxHeight = parseFloat(e.target.value);
    document.getElementById('heightValue').textContent = maxHeight;
    curve = createTrajectory();
    currentPosition = 0;
});

document.getElementById('leftBtn').addEventListener('click', () => {
    direction = -1;
    document.getElementById('leftBtn').classList.add('btn-active');
    document.getElementById('rightBtn').classList.remove('btn-active');
    curve = createTrajectory();
    currentPosition = 0;
});

document.getElementById('rightBtn').addEventListener('click', () => {
    direction = 1;
    document.getElementById('rightBtn').classList.add('btn-active');
    document.getElementById('leftBtn').classList.remove('btn-active');
    curve = createTrajectory();
    currentPosition = 0;
});

document.getElementById('playPause').addEventListener('click', () => {
    isPlaying = !isPlaying;
    document.getElementById('playPause').textContent = isPlaying ? '⏸️ Pausar' : '▶️ Continuar';
});

document.getElementById('reset').addEventListener('click', () => {
    currentPosition = 0;
    isPlaying = true;
    document.getElementById('playPause').textContent = '⏸️ Pausar';
});

function animate() {
    requestAnimationFrame(animate); // Agendar próximo frame
    
    if (isPlaying) {

        const increment = (0.002 * animationSpeed * totalDistance) / numCycles;
        currentPosition += increment;
        
        // Loop: volta ao início quando completa trajetória
        if (currentPosition >= totalDistance) {
            currentPosition = 0;
        }

        let targetIndex = 0;
        for (let i = 0; i < distances.length - 1; i++) {
            if (currentPosition >= distances[i] && currentPosition < distances[i + 1]) {
                targetIndex = i;
                break;
            }
        }
        
        // Converter índice para parâmetro t da curva
        const t = targetIndex / (trajectoryPoints.length - 1);
        
        // Obter posição 3D na curva
        const position = curve.getPoint(t);
        alusBird.position.copy(position);

        const tangent = curve.getTangent(t);
        const lookAtPos = position.clone().add(tangent);
        alusBird.lookAt(lookAtPos);

        const wingFlap = Math.sin(Date.now() * 0.01) * 0.3;
        alusBird.children[3].rotation.z = -0.3 + wingFlap;
        alusBird.children[4].rotation.z = 0.3 - wingFlap;

        document.getElementById('altitude').textContent = position.y.toFixed(1);
        document.getElementById('progress').textContent = Math.round((currentPosition / totalDistance) * 100);
        
        const radius = Math.sqrt(position.x ** 2 + position.z ** 2);
        document.getElementById('radius').textContent = radius.toFixed(1);
    }

    const time = Date.now() * 0.0001;
    camera.position.x = Math.cos(time) * 60;
    camera.position.z = Math.sin(time) * 60;
    camera.lookAt(0, 25, 0); // Sempre olha para centro vertical
    
    // RENDERIZAR FRAME
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix(); // Recalcular matriz de projeção
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate(); // Kickstart do loop de animação
