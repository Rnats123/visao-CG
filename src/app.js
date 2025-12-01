import { CanvasController } from "./core/canvasController.js";
import { initTabs } from "./ui/tabs.js";
import { initSliders } from "./ui/sliders.js";
import { initTableManager } from "./ui/tableManager.js";
import { initExport } from "./ui/exportJson.js";


export const state = {
  mode: "bezier",
  bezierPoints: [],
  splinePoints: [],
  selectedIndex: null,
  bezierStep: 0.01,
  splineStep: 0.01,
  splineDegree: 3
};


document.getElementById("app-root").innerHTML = `
  <div class="app">
    <header class="app-header">
      <h1>Curvas Paramétricas: Bézier & B-Spline</h1>
      <span class="subtitle">Clique no canvas para criar e mover pontos.</span>
    </header>

    <main class="app-main">
      <section class="canvas-section">
        <canvas id="curveCanvas" width="800" height="600"></canvas>
        <div class="canvas-hint">
          Clique para criar ponto • Arraste para mover • Edite na tabela
        </div>
      </section>

      <section class="side-panel">
        <div class="tabs">
          <button class="tab-button active" data-tab="bezier">Bézier</button>
          <button class="tab-button" data-tab="spline">Spline</button>
        </div>

        <div id="panel-bezier" class="config-panel active">
          <h2>Configuração Bézier</h2>
          <label>Passo (t): <span id="labelBezierStep"></span></label>
          <input id="inputBezierStep" type="range" min="0.002" max="0.05" step="0.002" value="0.01">
          <button id="clearBezier" class="btn btn-danger">Limpar Bézier</button>
        </div>

        <div id="panel-spline" class="config-panel">
          <h2>Configuração Spline</h2>

          <label>Grau: <span id="labelSplineDegree"></span></label>
          <input id="inputSplineDegree" type="range" min="2" max="5" step="1" value="3">

          <label>Passo (t): <span id="labelSplineStep"></span></label>
          <input id="inputSplineStep" type="range" min="0.002" max="0.05" step="0.002" value="0.01">

          <button id="copyToSpline" class="btn">Copiar Bézier → Spline</button>
          <button id="clearSpline" class="btn btn-danger">Limpar Spline</button>
        </div>

        <h2>Pontos</h2>
        <table class="points-table">
          <thead>
            <tr><th>#</th><th>X</th><th>Y</th><th>Peso</th><th></th></tr>
          </thead>
          <tbody id="pointsTable"></tbody>
        </table>

        <button id="btnExportJson" class="btn btn-primary">Exportar JSON</button>
        <textarea id="jsonOutput" readonly></textarea>
      </section>
    </main>
  </div>
`;


const canvas = document.getElementById("curveCanvas");
export const canvasController = new CanvasController(canvas);


initTabs();
initSliders();
initTableManager();
initExport();
