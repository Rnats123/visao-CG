import { state } from "../app.js";

export function initExport() {
  const btn = document.getElementById("btnExportJson");
  const out = document.getElementById("jsonOutput");

  btn.onclick = () => {
    const data = JSON.stringify(state, null, 2);
    out.value = data;

    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "curvas.json";
    a.click();
    URL.revokeObjectURL(url);
  };
}
