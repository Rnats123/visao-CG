import { state } from "../app.js";

export function initTabs() {
  const btns = document.querySelectorAll(".tab-button");

  btns.forEach(btn => {
    btn.addEventListener("click", () => {
      btns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const mode = btn.dataset.tab;
      state.mode = mode;

      document.querySelectorAll(".config-panel")
        .forEach(p => p.classList.remove("active"));

      document.getElementById(`panel-${mode}`).classList.add("active");
    });
  });
}
