

export class UIController {
    constructor(canvas2d, state, callbacks) {
        this.canvas = canvas2d;
        this.ctx = canvas2d.getContext('2d');
        this.state = state;
        this.callbacks = callbacks;
        
        this.draggingPoint = null;
        this.hoveredPoint = null;
        
        this.initEventListeners();
    }

   
    initEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());
    }

    
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        
        for (let i = 0; i < this.state.controlPoints.length; i++) {
            const point = this.state.controlPoints[i];
            const dist = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
            if (dist < 10) {
                this.draggingPoint = i;
                return;
            }
        }

        
        this.state.controlPoints.push({ x, y });
        this.callbacks.onPointsChanged();
    }

  
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.draggingPoint !== null) {
           
            this.state.controlPoints[this.draggingPoint] = { x, y };
            this.callbacks.onPointsChanged();
        } else {
            
            let hovered = null;
            for (let i = 0; i < this.state.controlPoints.length; i++) {
                const point = this.state.controlPoints[i];
                const dist = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
                if (dist < 10) {
                    hovered = i;
                    break;
                }
            }
            
            if (hovered !== this.hoveredPoint) {
                this.hoveredPoint = hovered;
                this.callbacks.onHoverChanged();
            }
        }
    }

    
    handleMouseUp() {
        this.draggingPoint = null;
    }

   
    render(curve) {
        const width = this.canvas.width;
        const height = this.canvas.height;

   
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, width, height);

       
        this.drawGrid(width, height);

       
        this.drawAxis(width, height);

   
        this.drawCurve(curve);

     
        this.drawControlLine();

    
        this.drawControlPoints();
    }

   
    drawGrid(width, height) {
        this.ctx.strokeStyle = '#2a2a3e';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i < width; i += 20) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, height);
            this.ctx.stroke();
        }
        
        for (let i = 0; i < height; i += 20) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(width, i);
            this.ctx.stroke();
        }
    }

   
    drawAxis(width, height) {
        this.ctx.strokeStyle = '#ff6b6b';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();

        if (this.state.axis === 'y') {
        
            this.ctx.moveTo(width / 2, 0);
            this.ctx.lineTo(width / 2, height);
        } else if (this.state.axis === 'x') {
           
            this.ctx.moveTo(0, height / 2);
            this.ctx.lineTo(width, height / 2);
        } else {
       
            this.ctx.moveTo(width / 2, 0);
            this.ctx.lineTo(width / 2, height);
        }

        this.ctx.stroke();
        this.ctx.setLineDash([]);

   
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.font = 'bold 14px monospace';
        this.ctx.fillText(`Eixo ${this.state.axis.toUpperCase()}`, 10, 20);
    }

   
    drawCurve(curve) {
        if (!curve || curve.length === 0) return;

        this.ctx.strokeStyle = '#00d9ff';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        
        curve.forEach((point, i) => {
            if (i === 0) this.ctx.moveTo(point.x, point.y);
            else this.ctx.lineTo(point.x, point.y);
        });
        
        this.ctx.stroke();
    }

    drawControlLine() {
        if (this.state.controlPoints.length < 2) return;

        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        
        this.state.controlPoints.forEach((point, i) => {
            if (i === 0) this.ctx.moveTo(point.x, point.y);
            else this.ctx.lineTo(point.x, point.y);
        });
        
        this.ctx.stroke();
    }

  
    drawControlPoints() {
        this.state.controlPoints.forEach((point, i) => {
       
            this.ctx.fillStyle = this.hoveredPoint === i ? '#ffeb3b' : '#ff6b6b';
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
            this.ctx.fill();
            
        
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

        
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px monospace';
            this.ctx.fillText(i + 1, point.x + 10, point.y - 10);
        });
    }
}