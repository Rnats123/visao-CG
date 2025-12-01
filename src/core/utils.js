

export function getActivePoints(state) {
  return state.mode === "bezier"
    ? state.bezierPoints
    : state.splinePoints;
}

export function setActivePoints(state, pts) {
  if (state.mode === "bezier") {
    state.bezierPoints = pts;
  } else {
    state.splinePoints = pts;
  }
}

export function clonePoint(p) {
  return { x: p.x, y: p.y, w: p.w };
}
