import { state } from "../app.js";
import { getActivePoints, setActivePoints } from "../core/utils.js";

export function initTableManager() {
  const tbody = document.getElementById("pointsTable");

  function rebuild() {
    tbody.innerHTML = "";

    const pts = getActivePoints(state);

    pts.forEach((p, i) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${i}</td>
        <td><input data-i="${i}" data-f="x" type="number" value="${p.x.toFixed(1)}"></td>
        <td><input data-i="${i}" data-f="y" type="number" value="${p.y.toFixed(1)}"></td>
        <td><input data-i="${i}" data-f="w" type="number" value="${p.w.toFixed(2)}"></td>
        <td><button data-del="${i}" class="btn btn-danger">×</button></td>
      `;

      tr.onclick = () => {
        state.selectedIndex = i;
      };

      tbody.appendChild(tr);
    });

   
    tbody.querySelectorAll("input").forEach(inp => {
      inp.onchange = () => {
        const idx = parseInt(inp.dataset.i);
        const field = inp.dataset.f;
        const val = parseFloat(inp.value);
        const pts = getActivePoints(state);
        pts[idx][field] = val;
      };
    });

   
    tbody.querySelectorAll("[data-del]").forEach(btn => {
      btn.onclick = e => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.del);
        const pts = getActivePoints(state);
        pts.splice(idx, 1);
        setActivePoints(state, pts);
        state.selectedIndex = null;
      };
    });
  }

  setInterval(rebuild, 100); 
}
