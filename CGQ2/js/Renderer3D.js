

export class Renderer3D {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.mesh = null;
        this.animationId = null;
        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };
        
        this.initScene();
        this.initControls();
    }

    
    initScene() {
        const THREE = window.THREE;
        if (!THREE) {
            console.error('Three.js não carregado');
            return;
        }

    
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);

      
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.canvas.width / this.canvas.height,
            0.1,
            1000
        );
        this.camera.position.set(5, 3, 5);
        this.camera.lookAt(0, 0, 0);

     
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            antialias: true 
        });
        this.renderer.setSize(this.canvas.width, this.canvas.height);

       
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight1.position.set(5, 5, 5);
        this.scene.add(directionalLight1);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
        directionalLight2.position.set(-5, -5, -5);
        this.scene.add(directionalLight2);

     
        const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
        this.scene.add(gridHelper);

        const axesHelper = new THREE.AxesHelper(3);
        this.scene.add(axesHelper);

      
        this.animate();
    }

 
    initControls() {
       
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;

            const deltaX = e.clientX - this.previousMousePosition.x;
            const deltaY = e.clientY - this.previousMousePosition.y;

            this.rotateCamera(deltaX, deltaY);

            this.previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
        });

        
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.zoomCamera(e.deltaY);
        }, { passive: false });
    }

  
    rotateCamera(deltaX, deltaY) {
        const rotationSpeed = 0.005;
        const radius = Math.sqrt(
            this.camera.position.x ** 2 +
            this.camera.position.y ** 2 +
            this.camera.position.z ** 2
        );

        
        let theta = Math.atan2(this.camera.position.x, this.camera.position.z);
        let phi = Math.acos(this.camera.position.y / radius);

        theta -= deltaX * rotationSpeed;
        phi -= deltaY * rotationSpeed;

        
        phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi));

        
        this.camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
        this.camera.position.y = radius * Math.cos(phi);
        this.camera.position.z = radius * Math.sin(phi) * Math.cos(theta);

        this.camera.lookAt(0, 0, 0);
    }

    
    zoomCamera(delta) {
        const zoomSpeed = 0.1;
        const direction = delta > 0 ? 1 : -1;

        const distance = Math.sqrt(
            this.camera.position.x ** 2 +
            this.camera.position.y ** 2 +
            this.camera.position.z ** 2
        );

        const newDistance = Math.max(2, Math.min(20, distance + direction * zoomSpeed));
        const scale = newDistance / distance;

        this.camera.position.x *= scale;
        this.camera.position.y *= scale;
        this.camera.position.z *= scale;
    }

   
    updateGeometry(geometry, viewMode) {
        const THREE = window.THREE;
        if (!THREE) return;

      
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }

        
        const threeGeometry = new THREE.BufferGeometry();

        const vertices = new Float32Array(geometry.vertices.flat());
        threeGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

        const indices = new Uint32Array(geometry.faces.flat());
        threeGeometry.setIndex(new THREE.BufferAttribute(indices, 1));

        threeGeometry.computeVertexNormals();

       
        let material;
        if (viewMode === 'wireframe') {
            material = new THREE.MeshBasicMaterial({
                color: 0x00d9ff,
                wireframe: true
            });
        } else {
            material = new THREE.MeshPhongMaterial({
                color: 0x00d9ff,
                flatShading: viewMode === 'solid',
                side: THREE.DoubleSide
            });
        }

        this.mesh = new THREE.Mesh(threeGeometry, material);
        this.scene.add(this.mesh);
    }

    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }

    
    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}