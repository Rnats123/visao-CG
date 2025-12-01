import { state } from "../app.js";
import { getActivePoints, setActivePoints } from "./utils.js";
import { deCasteljau } from "./bezier.js";
import { openUniformKnot, deBoor } from "./spline.js";

export class CanvasController {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    this.dragging = false;
    this.dragIndex = null;

    this.pointRadius = 6;
    this.hitRadiusSq = 14 * 14;

    this.setupEvents();
    this.loop();
  }

  setupEvents() {
    this.canvas.addEventListener("mousedown", (e) => this.mouseDown(e));
    this.canvas.addEventListener("mousemove", (e) => this.mouseMove(e));
    window.addEventListener("mouseup", () => this.mouseUp());
  }

  getMousePos(evt) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = this.canvas.width / rect.width;
    const sy = this.canvas.height / rect.height;
    return {
      x: (evt.clientX - rect.left) * sx,
      y: (evt.clientY - rect.top) * sy
    };
  }

  hitTest(pos) {
    const pts = getActivePoints(state);
    for (let i = 0; i < pts.length; i++) {
      const dx = pos.x - pts[i].x;
      const dy = pos.y - pts[i].y;
      if (dx * dx + dy * dy <= this.hitRadiusSq) return i;
    }
    return null;
  }

  mouseDown(evt) {
    const pos = this.getMousePos(evt);
    const idx = this.hitTest(pos);

    if (idx != null) {
      this.dragging = true;
      this.dragIndex = idx;
      state.selectedIndex = idx;
    } else {
      const pts = getActivePoints(state);
      pts.push({ x: pos.x, y: pos.y, w: 1 });
      setActivePoints(state, pts);
      state.selectedIndex = pts.length - 1;
    }
  }

  mouseMove(evt) {
    if (!this.dragging || this.dragIndex == null) return;
    const pos = this.getMousePos(evt);
    const pts = getActivePoints(state);
    pts[this.dragIndex].x = pos.x;
    pts[this.dragIndex].y = pos.y;
  }

  mouseUp() {
    this.dragging = false;
    this.dragIndex = null;
  }

  loop() {
    this.draw();
    requestAnimationFrame(() => this.loop());
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawBackground();
    this.drawControlPolygon(); 
    this.drawCurve();
    this.drawControlPoints();
  }

  
  drawBackground() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1;

    const step = 50;
    ctx.beginPath();
    for (let x = 0; x <= w; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = 0; y <= h; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();
  }

  drawControlPolygon() {
    const ctx = this.ctx;
    const pts = getActivePoints(state);
    if (pts.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.strokeStyle = "#4b5563";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  drawControlPoints() {
    const ctx = this.ctx;
    const pts = getActivePoints(state);

    pts.forEach((p, i) => {
      const selected = i === state.selectedIndex;

      ctx.beginPath();
      ctx.arc(p.x, p.y, this.pointRadius + 2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(15,23,42,0.9)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p.x, p.y, this.pointRadius, 0, Math.PI * 2);
      ctx.fillStyle = selected ? "#facc15" : "#22c55e";
      ctx.fill();

      ctx.fillStyle = "#e5e7eb";
      ctx.font = "10px system-ui";
      ctx.fillText(String(i), p.x + 8, p.y - 8);
    });
  }

  drawCurve() {
    const ctx = this.ctx;
    const pts = getActivePoints(state);

    // Bézier
    if (state.mode === "bezier" && pts.length >= 2) {
      ctx.beginPath();
      let first = true;
      for (let t = 0; t <= 1 + 1e-8; t += state.bezierStep) {
        const P = deCasteljau(pts, t);
        if (!P) continue;
        if (first) {
          ctx.moveTo(P.x, P.y);
          first = false;
        } else {
          ctx.lineTo(P.x, P.y);
        }
      }
      ctx.strokeStyle = "#60a5fa";
      ctx.lineWidth = 2;
      ctx.stroke();
    }


    if (state.mode === "spline" && pts.length >= state.splineDegree + 1) {
      const p = state.splineDegree;
      const U = openUniformKnot(pts.length, p);

      ctx.beginPath();
      let first = true;
      for (let t = 0; t <= 1 + 1e-8; t += state.splineStep) {
        const P = deBoor(pts, p, U, t);
        if (!P) continue;
        if (first) {
          ctx.moveTo(P.x, P.y);
          first = false;
        } else {
          ctx.lineTo(P.x, P.y);
        }
      }
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}
