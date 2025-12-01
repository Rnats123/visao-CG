/* ====================================================================
   JAVASCRIPT - PROJETO ALUS
   Lógica da Aplicação e Renderização 3D
   ==================================================================== */

/* ====================================================================
   1. CONSTANTES E VARIÁVEIS GLOBAIS
   ==================================================================== */

// Proporção Áurea (Golden Ratio)
// φ = (1 + √5) / 2 ≈ 1.618033988749895
// Usada para criar crescimento natural da espiral
const PHI = 1.618033988749895;

// Variáveis de configuração do voo
let numCycles = 75;           // Número de ciclos completos da espiral (50-100)
let maxHeight = 50;           // Altura máxima atingida no meio do voo
let animationSpeed = 1.0;     // Multiplicador de velocidade (0.1-3.0)
let direction = -1;           // Direção do giro: -1 = esquerda, 1 = direita

/* ====================================================================
   2. CONFIGURAÇÃO DA CENA THREE.JS
   ==================================================================== */

// Criar cena 3D (container para todos os objetos)
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e); // Fundo azul escuro
scene.fog = new THREE.Fog(0x1a1a2e, 50, 200); // Névoa para profundidade

// Configurar câmera perspectiva
// Parâmetros: FOV (60°), aspect ratio, near plane (0.1), far plane (1000)
const camera = new THREE.PerspectiveCamera(
    60, 
    window.innerWidth / window.innerHeight, 
    0.1, 
    1000
);
camera.position.set(50, 40, 50); // Posição inicial da câmera
camera.lookAt(0, 25, 0);         // Olha para o centro da trajetória

// Criar renderizador WebGL
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

/* ====================================================================
   3. SISTEMA DE ILUMINAÇÃO
   ==================================================================== */

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

/* ====================================================================
   4. VARIÁVEIS DE CONTROLE DA ANIMAÇÃO
   ==================================================================== */

let trajectoryLine;        // Objeto Three.js com a linha da trajetória
let alusBird;             // Modelo 3D do pássaro Alus
let trajectoryPoints = []; // Array de pontos da espiral
let currentPosition = 0;   // Posição atual na trajetória (distância percorrida)
let isPlaying = true;     // Estado da animação (pausado/rodando)
let totalDistance = 0;    // Distância total da trajetória
let distances = [];       // Array de distâncias acumuladas (para velocidade constante)

/* ====================================================================
   5. FUNÇÃO: CRIAR TRAJETÓRIA DA ESPIRAL DE FIBONACCI
   ==================================================================== */

/**
 * Gera a trajetória 3D de Alus baseada na sequência de Fibonacci
 * e na proporção áurea. Retorna uma curva suave CatmullRom.
 * 
 * Algoritmo:
 * 1. Gera pontos discretos seguindo espiral de Fibonacci
 * 2. Calcula distâncias acumuladas entre pontos
 * 3. Cria curva suave interpolada (C² contínua)
 * 4. Aplica gradiente de cores baseado na altura
 * 
 * @returns {THREE.CatmullRomCurve3} Curva suave da trajetória
 */
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
        
        /* RAIO: Crescimento baseado em Fibonacci
         * - fibIndex mapeia progresso para índice discreto (0-20)
         * - φ^(fibIndex/5) cria crescimento exponencial suavizado
         * - Divisão por 5 desacelera crescimento
         * - Multiplicação por 2 ajusta escala visual
         */
        const fibIndex = Math.floor(t * 20);
        const radius = (PHI ** (fibIndex / 5)) * 2;
        
        /* ÂNGULO: Incremento proporcional à proporção áurea
         * - 2π * φ * i cria padrão não-periódico
         * - direction (-1 ou 1) inverte sentido do giro
         * - Cada ciclo gira aproximadamente 2π * 1.618 ≈ 10.16 radianos
         */
        const angle = direction * (2 * Math.PI * PHI * i);
        
        /* ALTURA: Perfil de subida e descida linear
         * - Primeira metade (t ≤ 0.5): subida linear até maxHeight
         * - Segunda metade (t > 0.5): descida linear até 0
         * - Taxa de subida/descida constante = maxHeight / (numCycles/2)
         */
        let height;
        if (t <= 0.5) {
            // Fase de subida: y = 2t * h_max
            height = (t * 2) * maxHeight;
        } else {
            // Fase de descida: y = (2 - 2t) * h_max
            height = (2 - t * 2) * maxHeight;
        }
        
        /* CONVERSÃO: Coordenadas cilíndricas → cartesianas
         * Cilíndricas: (r, θ, y)
         * Cartesianas: (x, y, z)
         * x = r * cos(θ)
         * z = r * sin(θ)
         * y = y (altura se mantém)
         */
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        const y = height;
        
        const point = new THREE.Vector3(x, y, z);
        points.push(point);
        
        /* CÁLCULO DE DISTÂNCIAS ACUMULADAS
         * Necessário para movimento com velocidade constante.
         * Armazena distância total percorrida até cada ponto.
         */
        if (prevPoint) {
            const dist = prevPoint.distanceTo(point);
            totalDistance += dist;
            distances.push(totalDistance);
        } else {
            distances.push(0); // Primeiro ponto: distância = 0
        }
        prevPoint = point;
    }
    
    trajectoryPoints = points;
    
    /* CRIAR CURVA SUAVE (CATMULL-ROM SPLINE)
     * - Passa por todos os pontos de controle
     * - Garante continuidade C² (curvatura contínua)
     * - Tension = 0.5 balanceia suavidade e fidelidade aos pontos
     */
    const curve = new THREE.CatmullRomCurve3(points);
    curve.tension = 0.5;
    
    /* INTERPOLAÇÃO PARA RENDERIZAÇÃO SUAVE
     * Gera 10x mais pontos que ciclos originais para linha suave
     * numCycles * 10 pontos evita segmentos visíveis na linha
     */
    const curvePoints = curve.getPoints(numCycles * 10);
    
    /* APLICAR GRADIENTE DE COR
     * Cores variam do início (azul) ao fim (verde)
     * Representa progresso e altitude visualmente
     */
    const colors = [];
    const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    
    for (let i = 0; i < curvePoints.length; i++) {
        const t = i / curvePoints.length;
        const color = new THREE.Color();
        
        // HSL: Hue varia de 0.6 (azul) a 0.3 (verde)
        // Saturation = 1.0 (cores vivas)
        // Lightness aumenta levemente no final
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

/* ====================================================================
   6. FUNÇÃO: CRIAR MODELO 3D DE ALUS
   ==================================================================== */

/**
 * Constrói o modelo 3D do pássaro Alus usando geometrias primitivas.
 * Componentes: corpo, cabeça, bico, asas, olhos e luz.
 * 
 * @returns {THREE.Group} Grupo contendo todos os componentes do pássaro
 */
function createAlus() {
    const birdGroup = new THREE.Group();
    
    /* CORPO: Esfera achatada (elipsoide)
     * Scale: (1, 0.8, 1.2) → achatado verticalmente, alongado no eixo Z
     */
    const bodyGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    bodyGeometry.scale(1, 0.8, 1.2);
    const bodyMaterial = new THREE.MeshPhongMaterial({
        color: 0xffd700,  // Dourado
        shininess: 100    // Brilho especular
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    birdGroup.add(body);
    
    /* CABEÇA: Esfera menor posicionada à frente
     * Offset: (0, 0.5, 0.8) → acima e à frente do corpo
     */
    const headGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0, 0.5, 0.8);
    birdGroup.add(head);
    
    /* BICO: Cone rotacionado
     * Rotation.x = π/2 → aponta para frente (direção +Z)
     */
    const beakGeometry = new THREE.ConeGeometry(0.15, 0.4, 8);
    const beakMaterial = new THREE.MeshPhongMaterial({ color: 0xff6600 });
    const beak = new THREE.Mesh(beakGeometry, beakMaterial);
    beak.position.set(0, 0.5, 1.2);
    beak.rotation.x = Math.PI / 2;
    birdGroup.add(beak);
    
    /* ASAS: Esferas achatadas e rotacionadas
     * Scale: (2, 0.2, 1) → muito alongadas lateralmente, finas
     * Rotação.z: ±0.3 rad → ligeiramente para cima
     */
    const wingGeometry = new THREE.SphereGeometry(0.6, 16, 16);
    wingGeometry.scale(2, 0.2, 1);
    const wingMaterial = new THREE.MeshPhongMaterial({
        color: 0xffec8b,  // Dourado claro
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
    
    /* OLHOS: Pequenas esferas pretas
     * Posicionados simetricamente na cabeça
     */
    const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.2, 0.6, 1.1);
    birdGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.2, 0.6, 1.1);
    birdGroup.add(rightEye);
    
    /* LUZ PONTUAL: Ilumina área ao redor de Alus
     * Cria efeito de "aura" dourada seguindo o pássaro
     */
    const birdLight = new THREE.PointLight(0xffd700, 1, 10);
    birdGroup.add(birdLight);
    
    return birdGroup;
}

/* ====================================================================
   7. INICIALIZAÇÃO
   ==================================================================== */

// Criar trajetória inicial
let curve = createTrajectory();

// Criar e adicionar Alus à cena
alusBird = createAlus();
scene.add(alusBird);

// Adicionar grade de referência no chão
// Parâmetros: tamanho (150), divisões (30), cor central, cor da grade
const gridHelper = new THREE.GridHelper(150, 30, 0x444444, 0x222222);
scene.add(gridHelper);

/* ====================================================================
   8. EVENT LISTENERS - CONTROLES INTERATIVOS
   ==================================================================== */

/**
 * Controle: Número de ciclos de Fibonacci
 * Regenera trajetória quando alterado
 */
document.getElementById('cycles').addEventListener('input', (e) => {
    numCycles = parseInt(e.target.value);
    document.getElementById('cyclesValue').textContent = numCycles;
    curve = createTrajectory(); // Recalcular trajetória
    currentPosition = 0;        // Resetar posição
});

/**
 * Controle: Velocidade da animação
 * Atualiza multiplicador sem regenerar trajetória
 */
document.getElementById('speed').addEventListener('input', (e) => {
    animationSpeed = parseFloat(e.target.value);
    document.getElementById('speedValue').textContent = animationSpeed.toFixed(1) + 'x';
});

/**
 * Controle: Altura máxima do voo
 * Regenera trajetória com novo perfil vertical
 */
document.getElementById('maxHeight').addEventListener('input', (e) => {
    maxHeight = parseFloat(e.target.value);
    document.getElementById('heightValue').textContent = maxHeight;
    curve = createTrajectory();
    currentPosition = 0;
});

/**
 * Controle: Direção esquerda
 * Define direction = -1 e regenera trajetória espelhada
 */
document.getElementById('leftBtn').addEventListener('click', () => {
    direction = -1;
    document.getElementById('leftBtn').classList.add('btn-active');
    document.getElementById('rightBtn').classList.remove('btn-active');
    curve = createTrajectory();
    currentPosition = 0;
});

/**
 * Controle: Direção direita
 * Define direction = 1 e regenera trajetória espelhada
 */
document.getElementById('rightBtn').addEventListener('click', () => {
    direction = 1;
    document.getElementById('rightBtn').classList.add('btn-active');
    document.getElementById('leftBtn').classList.remove('btn-active');
    curve = createTrajectory();
    currentPosition = 0;
});

/**
 * Controle: Play/Pause
 * Alterna estado da animação sem perder progresso
 */
document.getElementById('playPause').addEventListener('click', () => {
    isPlaying = !isPlaying;
    document.getElementById('playPause').textContent = isPlaying ? '⏸️ Pausar' : '▶️ Continuar';
});

/**
 * Controle: Reset
 * Reinicia animação do início
 */
document.getElementById('reset').addEventListener('click', () => {
    currentPosition = 0;
    isPlaying = true;
    document.getElementById('playPause').textContent = '⏸️ Pausar';
});

/* ====================================================================
   9. LOOP DE ANIMAÇÃO PRINCIPAL
   ==================================================================== */

/**
 * Função de animação executada a ~60 FPS (via requestAnimationFrame)
 * 
 * Responsabilidades:
 * 1. Atualizar posição de Alus com velocidade constante
 * 2. Orientar Alus na direção do movimento
 * 3. Animar asas batendo
 * 4. Atualizar display de informações
 * 5. Rotacionar câmera automaticamente
 * 6. Renderizar frame
 */
function animate() {
    requestAnimationFrame(animate); // Agendar próximo frame
    
    if (isPlaying) {
        /* MOVIMENTO COM VELOCIDADE CONSTANTE
         * Incremento baseado em distância, não em parâmetro t
         * Fórmula: Δs = (0.002 * speed * L_total) / n_cycles
         * 
         * - 0.002: Constante de calibração (ajustada empiricamente)
         * - animationSpeed: Multiplicador do usuário (0.1-3.0)
         * - totalDistance: Comprimento total da curva
         * - numCycles: Normaliza por número de voltas
         */
        const increment = (0.002 * animationSpeed * totalDistance) / numCycles;
        currentPosition += increment;
        
        // Loop: volta ao início quando completa trajetória
        if (currentPosition >= totalDistance) {
            currentPosition = 0;
        }
        
        /* ENCONTRAR ÍNDICE NA TRAJETÓRIA
         * Busca linear: qual segmento contém currentPosition?
         * distances[i] ≤ currentPosition < distances[i+1]
         */
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
        
        /* ORIENTAR ALUS NA DIREÇÃO DO MOVIMENTO
         * getTangent(t): vetor direção da curva no ponto t
         * lookAt(): rotaciona objeto para olhar em direção ao ponto
         */
        const tangent = curve.getTangent(t);
        const lookAtPos = position.clone().add(tangent);
        alusBird.lookAt(lookAtPos);
        
        /* ANIMAR BATER DE ASAS
         * Movimento senoidal: sen(ωt) com ω = 0.01 rad/ms
         * Amplitude: ±0.3 radianos (≈ ±17°)
         * children[3] e [4] são as asas (índices fixos)
         */
        const wingFlap = Math.sin(Date.now() * 0.01) * 0.3;
        alusBird.children[3].rotation.z = -0.3 + wingFlap; // Asa esquerda
        alusBird.children[4].rotation.z = 0.3 - wingFlap;  // Asa direita
        
        /* ATUALIZAR DISPLAY DE INFORMAÇÕES
         * - Altitude: posição Y atual
         * - Progresso: % da distância total percorrida
         * - Raio: distância ao eixo Y (√(x² + z²))
         */
        document.getElementById('altitude').textContent = position.y.toFixed(1);
        document.getElementById('progress').textContent = Math.round((currentPosition / totalDistance) * 100);
        
        const radius = Math.sqrt(position.x ** 2 + position.z ** 2);
        document.getElementById('radius').textContent = radius.toFixed(1);
    }
    
    /* ROTAÇÃO AUTOMÁTICA DA CÂMERA
     * Movimento circular em torno do centro
     * Velocidade: 0.0001 rad/ms (um ciclo completo em ~10 minutos)
     * Raio: 60 unidades, altura fixa Y=40
     */
    const time = Date.now() * 0.0001;
    camera.position.x = Math.cos(time) * 60;
    camera.position.z = Math.sin(time) * 60;
    camera.lookAt(0, 25, 0); // Sempre olha para centro vertical
    
    // RENDERIZAR FRAME
    renderer.render(scene, camera);
}

/* ====================================================================
   10. RESPONSIVIDADE
   ==================================================================== */

/**
 * Atualiza aspect ratio e dimensões do canvas quando janela é redimensionada
 */
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix(); // Recalcular matriz de projeção
    renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ====================================================================
   11. INICIAR ANIMAÇÃO
   ==================================================================== */

animate(); // Kickstart do loop de animação