import { state } from "../app.js";

export function initSliders() {
  const lblB = document.getElementById("labelBezierStep");
  const inB = document.getElementById("inputBezierStep");

  const lblS = document.getElementById("labelSplineStep");
  const inS = document.getElementById("inputSplineStep");

  const lblD = document.getElementById("labelSplineDegree");
  const inD = document.getElementById("inputSplineDegree");

  inB.addEventListener("input", () => {
    state.bezierStep = parseFloat(inB.value);
    lblB.textContent = state.bezierStep.toFixed(3);
  });

  inS.addEventListener("input", () => {
    state.splineStep = parseFloat(inS.value);
    lblS.textContent = state.splineStep.toFixed(3);
  });

  inD.addEventListener("input", () => {
    state.splineDegree = parseInt(inD.value, 10);
    lblD.textContent = state.splineDegree;
  });

  lblB.textContent = state.bezierStep;
  lblS.textContent = state.splineStep;
  lblD.textContent = state.splineDegree;

  document.getElementById("clearBezier").onclick = () => {
    state.bezierPoints = [];
    state.selectedIndex = null;
  };

  document.getElementById("clearSpline").onclick = () => {
    state.splinePoints = [];
    state.selectedIndex = null;
  };

  document.getElementById("copyToSpline").onclick = () => {
    state.splinePoints = state.bezierPoints.map(p => ({...p}));
  };
}
