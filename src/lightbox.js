"use strict";

let setIcon;
let Notice;
try {
  const obsidian = require("obsidian");
  setIcon = obsidian.setIcon;
  Notice = obsidian.Notice;
} catch (_err) {
  setIcon = () => {};
  Notice = class {};
}
const { extractSvgNaturalSize } = require("./sizing.js");
const { THEMES, nextThemeKey } = require("./themes.js");
const { beautifySvgDom } = require("./beautify.js");

function openFullscreenLightbox(sourceSvg, diagramMeta, options = {}) {
  const {
    settings = {},
    saveSettings = async () => {},
    exportSvgAsPng = async () => {},
    cycleTheme,
    onClose,
  } = options;

  const nat = extractSvgNaturalSize(sourceSvg) || { width: 640, height: 420 };
  const overlay = document.createElement("div");
  overlay.className = "mb-lightbox-overlay";

  const header = document.createElement("div");
  header.className = "mb-lightbox-header";

  const titleEl = document.createElement("div");
  titleEl.className = "mb-lightbox-title";
  titleEl.textContent = `${diagramMeta.label} — Fullscreen (Wheel: Zoom · Drag: Pan · Esc: Close)`;
  header.appendChild(titleEl);

  const actions = document.createElement("div");
  actions.className = "mb-lightbox-actions";

  const scaleReadout = document.createElement("span");
  scaleReadout.className = "mb-lightbox-scale";
  scaleReadout.textContent = "100%";

  const state = {
    scale: 1,
    tx: 0,
    ty: 0,
    dragging: false,
    startX: 0,
    startY: 0,
  };

  const viewport = document.createElement("div");
  viewport.className = "mb-lightbox-viewport";

  const stage = document.createElement("div");
  stage.className = "mb-lightbox-stage";

  const svgClone = sourceSvg.cloneNode(true);
  svgClone.style.setProperty("width", `${nat.width}px`, "important");
  svgClone.style.setProperty("height", `${nat.height}px`, "important");
  svgClone.style.setProperty("max-width", "none", "important");
  stage.appendChild(svgClone);
  viewport.appendChild(stage);

  const syncTransform = () => {
    stage.style.transform = `translate(${state.tx}px, ${state.ty}px) scale(${state.scale})`;
    scaleReadout.textContent = `${Math.round(state.scale * 100)}%`;
  };

  const fitToScreen = () => {
    const vw = viewport.clientWidth || window.innerWidth - 80;
    const vh = viewport.clientHeight || window.innerHeight - 140;
    const pad = 64;
    const fitScale = Math.min(
      (vw - pad) / Math.max(1, nat.width),
      (vh - pad) / Math.max(1, nat.height),
      1.6
    );
    state.scale = Math.max(0.25, Number(fitScale.toFixed(3)));
    state.tx = Math.round((vw - nat.width * state.scale) / 2);
    state.ty = Math.round((vh - nat.height * state.scale) / 2);
    syncTransform();
  };

  const zoomAt = (factor, cx, cy) => {
    const next = Math.max(0.15, Math.min(5.0, state.scale * factor));
    const ratio = next / state.scale;
    state.tx = cx - (cx - state.tx) * ratio;
    state.ty = cy - (cy - state.ty) * ratio;
    state.scale = next;
    syncTransform();
  };

  const makeBtn = (icon, label, cb, extraCls = "") => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `mb-icon-btn ${extraCls}`;
    b.title = label;
    setIcon(b, icon);
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      cb();
    });
    actions.appendChild(b);
  };

  const themeBtn = document.createElement("button");
  themeBtn.type = "button";
  themeBtn.className = "mb-lightbox-theme-btn";
  const updateThemeBtnText = () => {
    const activeTheme = THEMES[settings.theme] || THEMES["claude-anthropic"] || THEMES.claude;
    themeBtn.textContent = `🎨 ${activeTheme.name}`;
    themeBtn.title = "Click to switch theme live (T)";
  };
  updateThemeBtnText();
  themeBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    let nextKey;
    if (typeof cycleTheme === "function") {
      nextKey = await cycleTheme();
    } else {
      nextKey = nextThemeKey(settings.theme);
      settings.theme = nextKey;
      if (THEMES[nextKey] && Number.isFinite(THEMES[nextKey].defaultRadius)) {
        settings.nodeRadius = THEMES[nextKey].defaultRadius;
      }
      await saveSettings();
      new Notice(`Theme: ${THEMES[nextKey].name}`);
    }
    const isDark =
      typeof document !== "undefined" &&
      document.body &&
      document.body.classList.contains("theme-dark");
    beautifySvgDom(svgClone, settings, isDark);
    updateThemeBtnText();
  });
  actions.appendChild(themeBtn);

  makeBtn("minus", "Zoom Out (-)", () =>
    zoomAt(0.82, viewport.clientWidth / 2, viewport.clientHeight / 2)
  );
  actions.appendChild(scaleReadout);
  makeBtn("plus", "Zoom In (+)", () =>
    zoomAt(1.22, viewport.clientWidth / 2, viewport.clientHeight / 2)
  );
  makeBtn("rotate-ccw", "Fit to Screen (0)", fitToScreen);
  makeBtn("camera", "Copy HD PNG", () => exportSvgAsPng(svgClone));

  let closed = false;
  const closeLightbox = () => {
    if (closed) return;
    closed = true;
    window.removeEventListener("keydown", onKeyDown);
    overlay.remove();
    if (typeof onClose === "function") {
      onClose();
    }
  };

  makeBtn("x", "Close (Esc)", closeLightbox, "mb-close-btn");

  header.appendChild(actions);
  overlay.appendChild(header);
  overlay.appendChild(viewport);
  document.body.appendChild(overlay);

  viewport.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.12 : 0.89;
      zoomAt(factor, mx, my);
    },
    { passive: false }
  );

  viewport.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    state.dragging = true;
    state.startX = e.clientX - state.tx;
    state.startY = e.clientY - state.ty;
    viewport.setPointerCapture(e.pointerId);
    viewport.classList.add("is-dragging");
  });

  viewport.addEventListener("pointermove", (e) => {
    if (!state.dragging) return;
    state.tx = e.clientX - state.startX;
    state.ty = e.clientY - state.startY;
    syncTransform();
  });

  const stopDrag = () => {
    state.dragging = false;
    viewport.classList.remove("is-dragging");
  };
  viewport.addEventListener("pointerup", stopDrag);
  viewport.addEventListener("pointercancel", stopDrag);

  const onKeyDown = (e) => {
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "+" || e.key === "=")
      zoomAt(1.2, viewport.clientWidth / 2, viewport.clientHeight / 2);
    else if (e.key === "-" || e.key === "_")
      zoomAt(0.82, viewport.clientWidth / 2, viewport.clientHeight / 2);
    else if (e.key === "0") fitToScreen();
  };
  window.addEventListener("keydown", onKeyDown);

  window.requestAnimationFrame(fitToScreen);
  return closeLightbox;
}

module.exports = {
  openFullscreenLightbox,
};
