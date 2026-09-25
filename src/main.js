"use strict";

const { Plugin, Notice, setIcon } = require("obsidian");
const { SIZE_PRESETS, DEFAULT_SETTINGS, MermaidBoostSettingTab } = require("./settings.js");
const {
  extractSvgNaturalSize,
  detectDiagramType,
  tightenPieViewBox,
  computeSmartDiagramSize,
} = require("./sizing.js");
const { THEMES, resolveThemeSpec } = require("./themes.js");
const { beautifySvgDom } = require("./beautify.js");
const { resolveLiveCssColor, exportSvgAsPng } = require("./export.js");
const { openFullscreenLightbox } = require("./lightbox.js");

class MermaidBoostPlugin extends Plugin {
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new MermaidBoostSettingTab(this.app, this));
    this.applyGlobalThemeVariables();

    this.setupMutationObserver();

    this.app.workspace.onLayoutReady(() => {
      this.refreshAllMermaidBlocks();
    });

    this.registerEvent(
      this.app.workspace.on("layout-change", () => this.refreshAllMermaidBlocks())
    );
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => this.refreshAllMermaidBlocks())
    );
    this.registerEvent(
      this.app.workspace.on("file-open", () => {
        window.setTimeout(() => this.refreshAllMermaidBlocks(), 120);
      })
    );
    this.registerEvent(
      this.app.workspace.on("css-change", () => {
        this.applyGlobalThemeVariables();
        this.refreshAllMermaidBlocks(true);
      })
    );

    this._onResize = () => {
      if (this._resizeTimer) window.clearTimeout(this._resizeTimer);
      this._resizeTimer = window.setTimeout(() => this.refreshAllMermaidBlocks(), 150);
    };
    window.addEventListener("resize", this._onResize);

    this.addCommand({
      id: "cycle-theme",
      name: "Cycle Theme Palette",
      callback: async () => {
        const keys = Object.keys(THEMES);
        const idx = keys.indexOf(this.settings.theme);
        const nextKey = keys[(idx + 1) % keys.length];
        this.settings.theme = nextKey;
        if (THEMES[nextKey] && Number.isFinite(THEMES[nextKey].defaultRadius)) {
          this.settings.nodeRadius = THEMES[nextKey].defaultRadius;
        }
        await this.saveSettings();
        new Notice(`Mermaid Boost theme: ${THEMES[nextKey].name}`);
      },
    });

    this.addCommand({
      id: "refresh-all-mermaid",
      name: "Refresh All Diagrams",
      callback: () => {
        this.refreshAllMermaidBlocks(true);
        new Notice("Mermaid diagrams refreshed");
      },
    });
  }

  onunload() {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
    if (this._flushTimer) {
      window.clearTimeout(this._flushTimer);
    }
    if (this._onCalloutClick) {
      document.removeEventListener("click", this._onCalloutClick, true);
    }
    if (this._onResize) {
      window.removeEventListener("resize", this._onResize);
    }
    if (this._resizeTimer) {
      window.clearTimeout(this._resizeTimer);
    }
    document.body.classList.remove("mermaid-boost-enabled", "mermaid-boost-dot-grid");
    const blocks = document.querySelectorAll(".mermaid-boost-card");
    blocks.forEach((block) => {
      block.classList.remove(
        "mermaid-boost-card",
        "is-mb-collapsible",
        "is-mb-expanded"
      );
      const toolbar = block.querySelector(":scope > .mb-toolbar");
      if (toolbar) toolbar.remove();
      const expandBar = block.querySelector(":scope > .mb-expand-bar");
      if (expandBar) expandBar.remove();
      const svg = block.querySelector("svg");
      if (svg) {
        if (svg.dataset.mbOrigViewBox) {
          svg.setAttribute("viewBox", svg.dataset.mbOrigViewBox);
        }
        svg.style.removeProperty("width");
        svg.style.removeProperty("height");
        svg.style.removeProperty("max-width");
      }
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    const LEGACY_MAP = {
      "claude-anthropic": "claude",
      "notion-pastel": "notion",
      "github-tailwind": "github-light",
      "excalidraw-sketch": "handcrafted",
      "swiss-mono": "high-contrast",
      "custom-obsidian": "claude",
    };
    if (LEGACY_MAP[this.settings.theme]) {
      this.settings.theme = LEGACY_MAP[this.settings.theme];
    }
    if (!THEMES[this.settings.theme]) {
      this.settings.theme = "claude";
      this.settings.nodeRadius = THEMES.claude.defaultRadius;
    }
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.applyGlobalThemeVariables();
    this.refreshAllMermaidBlocks(true);
  }

  isDarkMode() {
    return document.body.classList.contains("theme-dark");
  }

  applyGlobalThemeVariables() {
    const isDark = this.isDarkMode();
    const { themeKey, themeObj, palette } = resolveThemeSpec(this.settings, isDark);

    document.body.classList.add("mermaid-boost-enabled");
    if (document.body.dataset) {
      document.body.dataset.mbTheme = themeKey;
      document.body.dataset.mbHasPattern =
        themeObj.cardBgImage && themeObj.cardBgImage !== "none" ? "true" : "false";
    }
    document.body.classList.toggle("mermaid-boost-dot-grid", Boolean(this.settings.showDotGrid));
    document.body.classList.toggle("mermaid-boost-frame", Boolean(this.settings.showCardFrame));

    const style = document.body.style;
    style.setProperty("--mb-card-bg", palette.cardBg);
    style.setProperty("--mb-card-fg", palette.cardFg || palette.rootNode.text);
    style.setProperty("--mb-card-bg-image", themeObj.cardBgImage || "none");
    style.setProperty("--mb-card-bg-size", themeObj.cardBgSize || "auto");
    style.setProperty("--mb-svg-filter", themeObj.svgFilter || "none");
    style.setProperty("--mb-card-border", palette.cardBorder);
    style.setProperty("--mb-grid-dot", palette.gridDot);
    style.setProperty("--mb-edge-stroke", palette.edge.stroke);
    style.setProperty("--mb-node-radius", `${this.settings.nodeRadius}px`);
    style.setProperty(
      "--mb-font-family",
      themeObj.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif'
    );
  }

  setupMutationObserver() {
    this._pendingBlocks = new Set();
    this._flushTimer = null;
    this._isDecorating = false;

    const scheduleFlush = () => {
      if (this._flushTimer) return;
      this._flushTimer = window.setTimeout(() => {
        this._flushTimer = null;
        if (this._isDecorating || this._pendingBlocks.size === 0) return;
        this._isDecorating = true;
        try {
          const batch = Array.from(this._pendingBlocks);
          this._pendingBlocks.clear();
          for (const b of batch) {
            if (b && b.isConnected) {
              this.decorateMermaidBlock(b, false);
            }
          }
        } finally {
          this._isDecorating = false;
        }
      }, 50);
    };

    this.mutationObserver = new MutationObserver((mutations) => {
      if (this._isDecorating) return;
      let addedAny = false;

      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement || node instanceof SVGElement)) continue;
          // Ignore any nodes added inside our own UI controls or defs
          if (
            node.closest &&
            node.closest(".mb-toolbar, .mb-expand-bar, .mb-lightbox-overlay, .mermaid-zoom-inline-controls, defs")
          ) {
            continue;
          }

          if (node instanceof HTMLElement && node.classList.contains("mermaid")) {
            const svg = node.querySelector("svg");
            if (svg && svg.dataset.mbInitialized !== "true") {
              this._pendingBlocks.add(node);
              addedAny = true;
            }
          } else {
            const parentMermaid = node.closest && node.closest(".mermaid");
            if (parentMermaid) {
              const svg = parentMermaid.querySelector("svg");
              if (svg && svg.dataset.mbInitialized !== "true") {
                this._pendingBlocks.add(parentMermaid);
                addedAny = true;
              }
            } else if (node.querySelectorAll) {
              const mermaids = node.querySelectorAll(".mermaid");
              for (let i = 0; i < mermaids.length; i++) {
                const m = mermaids[i];
                const svg = m.querySelector("svg");
                if (svg && svg.dataset.mbInitialized !== "true") {
                  this._pendingBlocks.add(m);
                  addedAny = true;
                }
              }
            }
          }
        }
      }

      if (addedAny) {
        scheduleFlush();
      }
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Lightweight listener for unfolding callouts or <details>
    this._onCalloutClick = (e) => {
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        target.closest(".callout-title, .callout-fold, summary")
      ) {
        window.setTimeout(() => this.refreshAllMermaidBlocks(false), 120);
      }
    };
    document.addEventListener("click", this._onCalloutClick, true);
  }

  refreshAllMermaidBlocks(forceRestyle = false) {
    if (this._isDecorating) return;
    this._isDecorating = true;
    try {
      const blocks = document.querySelectorAll(".mermaid");
      blocks.forEach((block) => {
        this.decorateMermaidBlock(block, forceRestyle);
      });
    } finally {
      this._isDecorating = false;
    }
  }

  decorateMermaidBlock(block, forceRestyle = false) {
    const svg = block.querySelector("svg");
    if (!svg) return;

    if (!block.classList.contains("mermaid-boost-card")) {
      block.classList.add("mermaid-boost-card");
    }

    // Cache original pristine viewBox and dimensions once per rendered SVG element
    if (!svg.dataset.mbInitialized) {
      const currentVb = svg.getAttribute("viewBox");
      if (currentVb) {
        svg.dataset.mbOrigViewBox = currentVb;
      }
      const nat = extractSvgNaturalSize(svg);
      if (nat) {
        svg.dataset.mbNaturalX = String(nat.x);
        svg.dataset.mbNaturalY = String(nat.y);
        svg.dataset.mbNaturalWidth = String(nat.width);
        svg.dataset.mbNaturalHeight = String(nat.height);
      }
      svg.dataset.mbInitialized = "true";
    }

    const origNat = extractSvgNaturalSize(svg);
    if (!origNat) return;

    const diagramMeta = detectDiagramType(svg, origNat);
    block.dataset.mbDiagramType = diagramMeta.type;
    block.dataset.mbOrientation = diagramMeta.orientation;

    // Apply or restore Pie chart viewBox tightening
    let effectiveNat = origNat;
    if (diagramMeta.type === "pie") {
      if (this.settings.trimPiePadding) {
        effectiveNat = tightenPieViewBox(svg, origNat);
      } else if (svg.dataset.mbOrigViewBox) {
        svg.setAttribute("viewBox", svg.dataset.mbOrigViewBox);
      }
    }

    // Apply SVG DOM Beautification (colors, rounded corners, arrowheads, shadows)
    if (forceRestyle || svg.dataset.mbStyledTheme !== `${this.settings.theme}-${this.isDarkMode()}-${this.settings.multiToneNodes}-${this.settings.nodeRadius}`) {
      beautifySvgDom(svg, this.settings, this.isDarkMode());
      svg.dataset.mbStyledTheme = `${this.settings.theme}-${this.isDarkMode()}-${this.settings.multiToneNodes}-${this.settings.nodeRadius}`;
    }

    // Determine effective size settings (respecting per-card preset override & manual zoom)
    const cardPresetKey = block.dataset.mbPresetOverride || this.settings.sizePreset;
    const cardPreset = SIZE_PRESETS[cardPresetKey] || SIZE_PRESETS.compact;
    const effectiveSettings = Object.assign({}, this.settings, {
      sizePreset: cardPresetKey,
      baseScale: block.dataset.mbPresetOverride ? cardPreset.baseScale : this.settings.baseScale,
      maxHeight: block.dataset.mbPresetOverride ? cardPreset.maxHeight : this.settings.maxHeight,
      maxWidth: block.dataset.mbPresetOverride ? cardPreset.maxWidth : this.settings.maxWidth,
      minReadableScale: block.dataset.mbPresetOverride
        ? cardPreset.minReadableScale
        : this.settings.minReadableScale,
    });

    const hostContainer =
      block.closest(".markdown-preview-sizer, .cm-content, .callout-content") ||
      block.parentElement;
    const containerWidth =
      (hostContainer && hostContainer.clientWidth) || block.clientWidth || 640;

    const sizing = computeSmartDiagramSize(
      effectiveNat,
      diagramMeta,
      effectiveSettings,
      containerWidth
    );

    const userZoomFactor = parseFloat(block.dataset.mbZoomFactor || "1") || 1;
    const finalWidth = Math.max(48, Math.round(sizing.width * userZoomFactor));
    const finalHeight = Math.max(36, Math.round(sizing.height * userZoomFactor));
    const displayPercent = Math.round(sizing.scale * userZoomFactor * 100);

    // Apply crisp explicit dimensions so SVG is never stretched to 100% width or giant height
    svg.style.setProperty("width", `${finalWidth}px`, "important");
    svg.style.setProperty("height", `${finalHeight}px`, "important");
    svg.style.setProperty("max-width", "none", "important");
    block.classList.toggle("is-mb-user-zoomed", Math.abs(userZoomFactor - 1) > 0.01);

    // Handle ultra-tall diagram height collapse & expand bar
    const shouldCollapse = sizing.needsHeightCollapse && userZoomFactor <= 1.05;
    block.classList.toggle("is-mb-collapsible", shouldCollapse);
    if (shouldCollapse) {
      block.style.setProperty("--mb-collapsed-height", `${sizing.collapsedHeight}px`);
      this.ensureExpandBar(block, finalHeight, sizing.collapsedHeight);
    } else {
      block.classList.remove("is-mb-expanded");
      const oldBar = block.querySelector(":scope > .mb-expand-bar");
      if (oldBar) oldBar.remove();
    }

    // Ensure floating micro-toolbar
    this.ensureToolbar(block, svg, diagramMeta, displayPercent, cardPresetKey);

    // Attach double-click fullscreen listener once
    if (!svg.dataset.mbDblClickBound) {
      svg.dataset.mbDblClickBound = "true";
      svg.addEventListener("dblclick", (e) => {
        if (!this.settings.doubleClickFullscreen) return;
        e.preventDefault();
        e.stopPropagation();
        this.openFullscreenLightbox(svg, diagramMeta);
      });
    }
  }

  ensureExpandBar(block, fullHeight, collapsedHeight) {
    let bar = block.querySelector(":scope > .mb-expand-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "mb-expand-bar";
      block.appendChild(bar);
    }
    const isExpanded = block.classList.contains("is-mb-expanded");
    bar.innerHTML = "";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mb-expand-btn";
    btn.textContent = isExpanded
      ? `\u25B2 Collapse (${collapsedHeight}px)`
      : `\u25BC Expand Full (${fullHeight}px)`;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      block.classList.toggle("is-mb-expanded");
      this.ensureExpandBar(block, fullHeight, collapsedHeight);
    });
    bar.appendChild(btn);
  }

  ensureToolbar(block, svg, diagramMeta, displayPercent) {
    const renderKey = `${diagramMeta.type}-${displayPercent}`;
    let toolbar = block.querySelector(":scope > .mb-toolbar");
    if (toolbar && toolbar.dataset && toolbar.dataset.mbRenderKey === renderKey) {
      return;
    }
    if (!toolbar) {
      toolbar = document.createElement("div");
      toolbar.className = "mb-toolbar";
      block.appendChild(toolbar);
    }
    if (toolbar.dataset) {
      toolbar.dataset.mbRenderKey = renderKey;
    }

    toolbar.innerHTML = "";

    // 1. Diagram Type & Scale Badge
    const badge = document.createElement("span");
    badge.className = "mb-badge";
    badge.textContent = `${diagramMeta.label.split(" ")[0]} \u00B7 ${displayPercent}%`;
    badge.title = "Current scale (Double-click diagram for fullscreen)";
    toolbar.appendChild(badge);

    // 2. Zoom Out / Reset / Zoom In Buttons
    const addIconBtn = (iconName, title, onClick) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mb-icon-btn";
      btn.title = title;
      btn.setAttribute("aria-label", title);
      setIcon(btn, iconName);
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        onClick(e);
      });
      toolbar.appendChild(btn);
      return btn;
    };

    addIconBtn("minus", "Zoom Out", () => {
      const cur = parseFloat(block.dataset.mbZoomFactor || "1") || 1;
      block.dataset.mbZoomFactor = String(Math.max(0.4, Number((cur * 0.85).toFixed(2))));
      this.decorateMermaidBlock(block);
    });

    addIconBtn("plus", "Zoom In", () => {
      const cur = parseFloat(block.dataset.mbZoomFactor || "1") || 1;
      block.dataset.mbZoomFactor = String(Math.min(2.5, Number((cur * 1.18).toFixed(2))));
      this.decorateMermaidBlock(block);
    });

    addIconBtn("rotate-ccw", "Reset Size", () => {
      delete block.dataset.mbZoomFactor;
      delete block.dataset.mbPresetOverride;
      this.decorateMermaidBlock(block);
    });

    // 4. Theme Quick Switcher
    addIconBtn("palette", "Switch Theme", async () => {
      const keys = Object.keys(THEMES);
      const nextKey = keys[(keys.indexOf(this.settings.theme) + 1) % keys.length];
      this.settings.theme = nextKey;
      if (THEMES[nextKey] && Number.isFinite(THEMES[nextKey].defaultRadius)) {
        this.settings.nodeRadius = THEMES[nextKey].defaultRadius;
      }
      await this.saveSettings();
      new Notice(`Theme: ${THEMES[nextKey].name}`);
    });

    // 5. Copy / Export PNG
    addIconBtn("camera", "Copy HD PNG", () => {
      this.exportSvgAsPng(svg);
    });

    // 6. Fullscreen Lightbox
    addIconBtn("maximize-2", "Fullscreen Viewer", () => {
      this.openFullscreenLightbox(svg, diagramMeta);
    });
  }

  resolveLiveCssColor(val, fallback = "#ffffff") {
    return resolveLiveCssColor(val, fallback);
  }

  async exportSvgAsPng(svg) {
    return exportSvgAsPng(svg, this.settings, this.isDarkMode());
  }

  openFullscreenLightbox(sourceSvg, diagramMeta) {
    return openFullscreenLightbox(sourceSvg, diagramMeta, {
      settings: this.settings,
      saveSettings: () => this.saveSettings(),
      exportSvgAsPng: (svg) => this.exportSvgAsPng(svg),
    });
  }
}

module.exports = MermaidBoostPlugin;
