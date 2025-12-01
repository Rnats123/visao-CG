

import { CurveGenerator } from './CurveGenerator.js';
import { RevolutionSurface } from './RevolutionSurface.js';
import { Renderer3D } from './renderer3d.js';
import { UIController } from './UIController.js';

class Application {
    constructor() {
        
        this.state = {
            controlPoints: [
                { x: 150, y: 50 },
                { x: 200, y: 100 },
                { x: 150, y: 200 },
                { x: 100, y: 250 }
            ],
            curveType: 'bezier',
            axis: 'y',
            angle: 360,
            angularDivisions: 32,
            profileSubdivisions: 50,
            degree: 3,
            viewMode: 'solid'
        };

        this.geometry = null;
        this.init();
    }

    
    init() {
        
        const checkThree = setInterval(() => {
            if (window.THREE) {
                clearInterval(checkThree);
                this.setup();
            }
        }, 100);
    }

   
    setup() {
        
        const canvas2d = document.getElementById('canvas2d');
        this.uiController = new UIController(canvas2d, this.state, {
            onPointsChanged: () => this.updateAll(),
            onHoverChanged: () => this.render2D()
        });

       
        const canvas3d = document.getElementById('canvas3d');
        this.renderer3D = new Renderer3D(canvas3d);

        
        this.initControls();

        
        this.updateAll();
    }

    
    initControls() {
        
        document.getElementById('bezierBtn').addEventListener('click', () => {
            this.state.curveType = 'bezier';
            this.toggleCurveType();
            this.updateAll();
        });

        document.getElementById('bsplineBtn').addEventListener('click', () => {
            this.state.curveType = 'bspline';
            this.toggleCurveType();
            this.updateAll();
        });

       
        const degreeSlider = document.getElementById('degreeSlider');
        const degreeValue = document.getElementById('degreeValue');
        degreeSlider.addEventListener('input', (e) => {
            this.state.degree = parseInt(e.target.value);
            degreeValue.textContent = this.state.degree;
            this.updateAll();
        });

        
        document.getElementById('axisX').addEventListener('click', () => {
            this.state.axis = 'x';
            this.toggleAxis();
            this.updateAll();
        });

        document.getElementById('axisY').addEventListener('click', () => {
            this.state.axis = 'y';
            this.toggleAxis();
            this.updateAll();
        });

        document.getElementById('axisZ').addEventListener('click', () => {
            this.state.axis = 'z';
            this.toggleAxis();
            this.updateAll();
        });

        
        const angleSlider = document.getElementById('angleSlider');
        const angleValue = document.getElementById('angleValue');
        angleSlider.addEventListener('input', (e) => {
            this.state.angle = parseInt(e.target.value);
            angleValue.textContent = this.state.angle;
            this.updateGeometry();
        });

        
        const angularDivSlider = document.getElementById('angularDivSlider');
        const angularDivValue = document.getElementById('angularDivValue');
        angularDivSlider.addEventListener('input', (e) => {
            this.state.angularDivisions = parseInt(e.target.value);
            angularDivValue.textContent = this.state.angularDivisions;
            this.updateGeometry();
        });

       
        const profileDivSlider = document.getElementById('profileDivSlider');
        const profileDivValue = document.getElementById('profileDivValue');
        profileDivSlider.addEventListener('input', (e) => {
            this.state.profileSubdivisions = parseInt(e.target.value);
            profileDivValue.textContent = this.state.profileSubdivisions;
            this.updateAll();
        });

        
        document.getElementById('wireframeBtn').addEventListener('click', () => {
            this.state.viewMode = 'wireframe';
            this.toggleViewMode();
            this.update3D();
        });

        document.getElementById('solidBtn').addEventListener('click', () => {
            this.state.viewMode = 'solid';
            this.toggleViewMode();
            this.update3D();
        });

        document.getElementById('smoothBtn').addEventListener('click', () => {
            this.state.viewMode = 'smooth';
            this.toggleViewMode();
            this.update3D();
        });

        
        document.getElementById('exportOBJ').addEventListener('click', () => {
            this.export('obj');
        });

        document.getElementById('exportSTL').addEventListener('click', () => {
            this.export('stl');
        });

        document.getElementById('exportJSON').addEventListener('click', () => {
            this.export('json');
        });

        
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.state.controlPoints = [
                { x: 150, y: 50 },
                { x: 200, y: 100 },
                { x: 150, y: 200 },
                { x: 100, y: 250 }
            ];
            this.updateAll();
        });
    }

   
    toggleCurveType() {
        document.getElementById('bezierBtn').classList.toggle('active', this.state.curveType === 'bezier');
        document.getElementById('bsplineBtn').classList.toggle('active', this.state.curveType === 'bspline');
        document.getElementById('degreeControl').style.display = 
            this.state.curveType === 'bspline' ? 'block' : 'none';
    }

    
    toggleAxis() {
        document.getElementById('axisX').classList.toggle('active', this.state.axis === 'x');
        document.getElementById('axisY').classList.toggle('active', this.state.axis === 'y');
        document.getElementById('axisZ').classList.toggle('active', this.state.axis === 'z');
    }

    
    toggleViewMode() {
        document.getElementById('wireframeBtn').classList.toggle('active', this.state.viewMode === 'wireframe');
        document.getElementById('solidBtn').classList.toggle('active', this.state.viewMode === 'solid');
        document.getElementById('smoothBtn').classList.toggle('active', this.state.viewMode === 'smooth');
    }

    
    generateCurve() {
        if (this.state.curveType === 'bezier') {
            return CurveGenerator.generateBezier(
                this.state.controlPoints,
                this.state.profileSubdivisions
            );
        } else {
            return CurveGenerator.generateBSpline(
                this.state.controlPoints,
                this.state.degree,
                this.state.profileSubdivisions
            );
        }
    }

   
    updateGeometry() {
        const curve = this.generateCurve();

        
        const normalizedCurve = curve.map(p => ({
            x: (p.x - 150) / 100,
            y: -(p.y - 150) / 100
        }));

        this.geometry = RevolutionSurface.generate(
            normalizedCurve,
            this.state.axis,
            this.state.angle,
            this.state.angularDivisions
        );

        this.update3D();
        this.updateInfo();
    }

   
    render2D() {
        const curve = this.generateCurve();
        this.uiController.render(curve);
    }

   
    update3D() {
        if (this.geometry) {
            this.renderer3D.updateGeometry(this.geometry, this.state.viewMode);
        }
    }

    
    updateAll() {
        this.render2D();
        this.updateGeometry();
    }

   
    updateInfo() {
        document.getElementById('pointsCount').textContent = this.state.controlPoints.length;
        if (this.geometry) {
            document.getElementById('verticesCount').textContent = this.geometry.vertices.length;
            document.getElementById('facesCount').textContent = this.geometry.faces.length;
        }
    }

    
    export(format) {
        if (!this.geometry) return;

        let content, filename;

        if (format === 'obj') {
            content = RevolutionSurface.exportOBJ(this.geometry);
            filename = 'surface.obj';
        } else if (format === 'stl') {
            content = RevolutionSurface.exportSTL(this.geometry);
            filename = 'surface.stl';
        } else {
            content = JSON.stringify({
                controlPoints: this.state.controlPoints,
                parameters: {
                    curveType: this.state.curveType,
                    axis: this.state.axis,
                    angle: this.state.angle,
                    angularDivisions: this.state.angularDivisions,
                    profileSubdivisions: this.state.profileSubdivisions,
                    degree: this.state.degree
                },
                geometry: this.geometry
            }, null, 2);
            filename = 'surface.json';
        }

        this.downloadFile(content, filename);
    }

  
    downloadFile(content, filename) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    new Application();
});