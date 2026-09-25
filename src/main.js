"use strict";

const { Plugin, Notice, setIcon } = require("obsidian");
const { SIZE_PRESETS, DEFAULT_SETTINGS, MermaidBoostSettingTab } = require("./settings.js");
const {
  extractSvgNaturalSize,
  detectDiagramType,
  tightenPieViewBox,
  computeSmartDiagramSize,
} = require("./sizing.js");
const { THEMES, resolveThemeSpec, LEGACY_THEME_MAP, nextThemeKey } = require("./themes.js");
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

    if (this.app && this.app.workspace && typeof this.app.workspace.on === "function") {
      this.registerEvent(
        this.app.workspace.on("resize", () => {
          this.refreshAllDiagramSizing();
        })
      );
    }

    this._onResize = () => {
      if (this._resizeTimer) window.clearTimeout(this._resizeTimer);
      this._resizeTimer = window.setTimeout(() => this.refreshAllDiagramSizing(), 150);
    };
    window.addEventListener("resize", this._onResize);

    this.addCommand({
      id: "cycle-theme",
      name: "Cycle Theme Palette",
      callback: () => this.cycleTheme(),
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
    if (this._resizeBatchTimer) {
      const clearFn = typeof window !== "undefined" ? window.clearTimeout : clearTimeout;
      clearFn(this._resizeBatchTimer);
      this._resizeBatchTimer = null;
    }
    if (this._pendingResizeBlocks) {
      this._pendingResizeBlocks.clear();
    }
    if (this._diagramObservers) {
      for (const [block, observer] of this._diagramObservers.entries()) {
        try {
          if (observer && typeof observer.disconnect === "function") {
            observer.disconnect();
          }
        } catch (_e) {}
        if (block && block.dataset) {
          delete block.dataset.mbObserved;
        }
      }
      this._diagramObservers.clear();
    }
    if (this._openLightboxes) {
      this._openLightboxes.forEach((close) => {
        try {
          close();
        } catch (_e) {}
      });
      this._openLightboxes.clear();
    }
    document.querySelectorAll(".mb-lightbox-overlay").forEach((el) => el.remove());
    document.body.classList.remove(
      "mermaid-boost-enabled",
      "mermaid-boost-dot-grid",
      "mermaid-boost-frame"
    );
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
        if (svg._mbDblClickHandler && typeof svg.removeEventListener === "function") {
          svg.removeEventListener("dblclick", svg._mbDblClickHandler);
          delete svg._mbDblClickHandler;
        }
        if (svg.dataset.mbOrigViewBox) {
          svg.setAttribute("viewBox", svg.dataset.mbOrigViewBox);
        }
        if (svg.style) {
          if (typeof svg.style.setProperty === "function") {
            if (svg.dataset.mbOrigStyleWidth) {
              svg.style.setProperty(
                "width",
                svg.dataset.mbOrigStyleWidth,
                svg.dataset.mbOrigStyleWidthPriority || ""
              );
            } else if (typeof svg.style.removeProperty === "function") {
              svg.style.removeProperty("width");
            }

            if (svg.dataset.mbOrigStyleHeight) {
              svg.style.setProperty(
                "height",
                svg.dataset.mbOrigStyleHeight,
                svg.dataset.mbOrigStyleHeightPriority || ""
              );
            } else if (typeof svg.style.removeProperty === "function") {
              svg.style.removeProperty("height");
            }

            if (svg.dataset.mbOrigStyleMaxWidth) {
              svg.style.setProperty(
                "max-width",
                svg.dataset.mbOrigStyleMaxWidth,
                svg.dataset.mbOrigStyleMaxWidthPriority || ""
              );
            } else if (typeof svg.style.removeProperty === "function") {
              svg.style.removeProperty("max-width");
            }
          } else if (typeof svg.style.removeProperty === "function") {
            svg.style.removeProperty("width");
            svg.style.removeProperty("height");
            svg.style.removeProperty("max-width");
          }
        }
        delete svg.dataset.mbInitialized;
        delete svg.dataset.mbDblClickBound;
        delete svg.dataset.mbOrigViewBox;
        delete svg.dataset.mbNaturalWidth;
        delete svg.dataset.mbNaturalHeight;
        delete svg.dataset.mbNaturalX;
        delete svg.dataset.mbNaturalY;
        delete svg.dataset.mbOrigStyleWidth;
        delete svg.dataset.mbOrigStyleWidthPriority;
        delete svg.dataset.mbOrigStyleHeight;
        delete svg.dataset.mbOrigStyleHeightPriority;
        delete svg.dataset.mbOrigStyleMaxWidth;
        delete svg.dataset.mbOrigStyleMaxWidthPriority;
        delete svg.dataset.mbViewBoxPadded;
        delete svg.dataset.mbStyledTheme;
      }
      if (block.dataset) {
        delete block.dataset.mbDiagramType;
        delete block.dataset.mbOrientation;
        delete block.dataset.mbZoomFactor;
        delete block.dataset.mbPresetOverride;
        delete block.dataset.mbObserved;
      }
      this.unobserveDiagram(block);
    });
    if (typeof document !== "undefined" && document.body && document.body.dataset) {
      delete document.body.dataset.mbTheme;
      delete document.body.dataset.mbHasPattern;
    }
  }

  async cycleTheme() {
    const nextKey = nextThemeKey(this.settings.theme);
    this.settings.theme = nextKey;
    const themeDef = THEMES[nextKey];
    if (themeDef && Number.isFinite(themeDef.defaultRadius)) {
      this.settings.nodeRadius = themeDef.defaultRadius;
    }
    await this.saveSettings();
    new Notice(`Mermaid Boost theme: ${themeDef ? themeDef.name : nextKey}`);
    return nextKey;
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    if (LEGACY_THEME_MAP[this.settings.theme]) {
      this.settings.theme = LEGACY_THEME_MAP[this.settings.theme];
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
      const setFn = typeof window !== "undefined" ? window.setTimeout : setTimeout;
      this._flushTimer = setFn(() => {
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

    const isElementNode = (node) =>
      Boolean(
        node &&
          (node.nodeType === 1 ||
            (typeof HTMLElement !== "undefined" && node instanceof HTMLElement) ||
            (typeof SVGElement !== "undefined" && node instanceof SVGElement) ||
            (node.classList && typeof node.querySelector === "function"))
      );

    this.mutationObserver = new MutationObserver((mutations) => {
      if (this._isDecorating) return;
      let addedAny = false;

      for (const mutation of mutations) {
        if (mutation.removedNodes && mutation.removedNodes.length > 0) {
          for (const node of mutation.removedNodes) {
            if (!isElementNode(node)) continue;
            if (node.classList && (node.classList.contains("mermaid") || node.classList.contains("mermaid-boost-card"))) {
              this.unobserveDiagram(node);
            }
            if (typeof node.querySelectorAll === "function") {
              const removedMermaids = node.querySelectorAll(".mermaid, .mermaid-boost-card");
              for (let i = 0; i < removedMermaids.length; i++) {
                this.unobserveDiagram(removedMermaids[i]);
              }
            }
          }
        }

        for (const node of mutation.addedNodes) {
          if (!isElementNode(node)) continue;
          // Ignore any nodes added inside our own UI controls or defs
          if (
            node.closest &&
            node.closest(".mb-toolbar, .mb-expand-bar, .mb-lightbox-overlay, .mermaid-zoom-inline-controls, defs")
          ) {
            continue;
          }

          const handleCandidate = (m) => {
            const svg = m.querySelector("svg");
            if (!svg) return;
            if (svg.dataset && svg.dataset.mbInitialized !== "true") {
              this._pendingBlocks.add(m);
              addedAny = true;
            } else if (!this._diagramObservers || !this._diagramObservers.has(m)) {
              this.updateDiagramSizing(m);
              this.observeDiagram(m);
            }
          };

          if (node.classList && node.classList.contains("mermaid")) {
            handleCandidate(node);
          } else {
            const parentMermaid = node.closest && node.closest(".mermaid");
            if (parentMermaid) {
              handleCandidate(parentMermaid);
            } else if (node.querySelectorAll) {
              const mermaids = node.querySelectorAll(".mermaid");
              for (let i = 0; i < mermaids.length; i++) {
                handleCandidate(mermaids[i]);
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
        isElementNode(target) &&
        target.closest &&
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

    // Cache original pristine viewBox, dimensions, and inline styles once per rendered SVG element
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
      if (svg.style) {
        const origW =
          (typeof svg.style.getPropertyValue === "function"
            ? svg.style.getPropertyValue("width")
            : svg.style.width) || "";
        const origWPrio =
          typeof svg.style.getPropertyPriority === "function"
            ? svg.style.getPropertyPriority("width")
            : "";
        if (origW) {
          svg.dataset.mbOrigStyleWidth = origW;
          if (origWPrio) svg.dataset.mbOrigStyleWidthPriority = origWPrio;
        }

        const origH =
          (typeof svg.style.getPropertyValue === "function"
            ? svg.style.getPropertyValue("height")
            : svg.style.height) || "";
        const origHPrio =
          typeof svg.style.getPropertyPriority === "function"
            ? svg.style.getPropertyPriority("height")
            : "";
        if (origH) {
          svg.dataset.mbOrigStyleHeight = origH;
          if (origHPrio) svg.dataset.mbOrigStyleHeightPriority = origHPrio;
        }

        const origMW =
          (typeof svg.style.getPropertyValue === "function"
            ? svg.style.getPropertyValue("max-width")
            : svg.style.maxWidth || svg.style["max-width"]) || "";
        const origMWPrio =
          typeof svg.style.getPropertyPriority === "function"
            ? svg.style.getPropertyPriority("max-width")
            : "";
        if (origMW) {
          svg.dataset.mbOrigStyleMaxWidth = origMW;
          if (origMWPrio) svg.dataset.mbOrigStyleMaxWidthPriority = origMWPrio;
        }
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

    // Apply responsive sizing
    this.updateDiagramSizing(block);

    // Attach ResizeObserver to observe diagram container
    this.observeDiagram(block);

    // Attach double-click fullscreen listener once
    if (!svg.dataset.mbDblClickBound) {
      svg.dataset.mbDblClickBound = "true";
      const onDblClick = (e) => {
        if (!this.settings.doubleClickFullscreen) return;
        e.preventDefault();
        e.stopPropagation();
        this.openFullscreenLightbox(svg, diagramMeta);
      };
      svg._mbDblClickHandler = onDblClick;
      if (typeof this.registerDomEvent === "function") {
        this.registerDomEvent(svg, "dblclick", onDblClick);
      } else {
        svg.addEventListener("dblclick", onDblClick);
      }
    }
  }

  /**
   * Recomputes and applies responsive diagram sizing without full DOM or theme rebuilds.
   * @param {HTMLElement} block - The Mermaid diagram card element.
   * @param {number|null} [explicitContainerWidth=null] - Optional explicitly measured container width.
   */
  updateDiagramSizing(block, explicitContainerWidth = null) {
    if (!block) return;
    const svg = block.querySelector("svg");
    if (!svg) return;

    if (!svg.dataset || !svg.dataset.mbInitialized) {
      this.decorateMermaidBlock(block, false);
      return;
    }

    const origNat = extractSvgNaturalSize(svg);
    if (!origNat) return;

    const diagramMeta = detectDiagramType(svg, origNat);

    let effectiveNat = origNat;
    if (diagramMeta.type === "pie") {
      if (this.settings.trimPiePadding) {
        effectiveNat = tightenPieViewBox(svg, origNat);
      } else if (svg.dataset.mbOrigViewBox) {
        svg.setAttribute("viewBox", svg.dataset.mbOrigViewBox);
      }
    }

    const cardPresetKey =
      (block.dataset && block.dataset.mbPresetOverride) || this.settings.sizePreset;
    const cardPreset = SIZE_PRESETS[cardPresetKey] || SIZE_PRESETS.compact;
    const effectiveSettings = Object.assign({}, this.settings, {
      sizePreset: cardPresetKey,
      baseScale:
        block.dataset && block.dataset.mbPresetOverride
          ? cardPreset.baseScale
          : this.settings.baseScale,
      maxHeight:
        block.dataset && block.dataset.mbPresetOverride
          ? cardPreset.maxHeight
          : this.settings.maxHeight,
      maxWidth:
        block.dataset && block.dataset.mbPresetOverride
          ? cardPreset.maxWidth
          : this.settings.maxWidth,
      minReadableScale:
        block.dataset && block.dataset.mbPresetOverride
          ? cardPreset.minReadableScale
          : this.settings.minReadableScale,
    });

    const hostContainer =
      (typeof block.closest === "function" &&
        block.closest(".markdown-preview-sizer, .cm-content, .callout-content")) ||
      block.parentElement;
    const containerWidth =
      explicitContainerWidth ||
      block._mbObservedContainerWidth ||
      (block.parentElement &&
        typeof document !== "undefined" &&
        block.parentElement !== document.body &&
        block.parentElement.clientWidth) ||
      (hostContainer && hostContainer.clientWidth) ||
      block.clientWidth ||
      640;

    const sizing = computeSmartDiagramSize(
      effectiveNat,
      diagramMeta,
      effectiveSettings,
      containerWidth
    );

    const userZoomFactor =
      parseFloat((block.dataset && block.dataset.mbZoomFactor) || "1") || 1;
    const minW = Math.min(48, Math.max(1, containerWidth));
    const scaledW = Math.round(sizing.width * userZoomFactor);
    const finalWidth =
      userZoomFactor > 1
        ? Math.max(minW, scaledW)
        : Math.min(containerWidth, Math.max(minW, scaledW));
    const finalHeight = Math.max(1, Math.round(sizing.height * userZoomFactor));
    const displayPercent = Math.round(sizing.scale * userZoomFactor * 100);

    const targetW = `${finalWidth}px`;
    const targetH = `${finalHeight}px`;
    const curW =
      svg.style &&
      (typeof svg.style.getPropertyValue === "function"
        ? svg.style.getPropertyValue("width")
        : svg.style.width);
    const curH =
      svg.style &&
      (typeof svg.style.getPropertyValue === "function"
        ? svg.style.getPropertyValue("height")
        : svg.style.height);

    if (
      svg.style &&
      (curW !== targetW || curH !== targetH || svg.style.maxWidth !== "none")
    ) {
      svg.style.setProperty("width", targetW, "important");
      svg.style.setProperty("height", targetH, "important");
      svg.style.setProperty("max-width", "none", "important");
    }
    if (block.classList) {
      block.classList.toggle(
        "is-mb-user-zoomed",
        Math.abs(userZoomFactor - 1) > 0.01
      );
    }

    const shouldCollapse = sizing.needsHeightCollapse && userZoomFactor <= 1.05;
    if (block.classList) {
      block.classList.toggle("is-mb-collapsible", shouldCollapse);
    }
    if (shouldCollapse) {
      if (block.style && typeof block.style.setProperty === "function") {
        block.style.setProperty(
          "--mb-collapsed-height",
          `${sizing.collapsedHeight}px`
        );
      }
      this.ensureExpandBar(block, finalHeight, sizing.collapsedHeight);
    } else {
      if (block.classList) {
        block.classList.remove("is-mb-expanded");
      }
      const oldBar = block.querySelector(":scope > .mb-expand-bar");
      if (oldBar && typeof oldBar.remove === "function") oldBar.remove();
    }

    this.ensureToolbar(block, svg, diagramMeta, displayPercent, cardPresetKey);
  }

  /**
   * Attaches a dedicated ResizeObserver to a diagram card and its parent wrapper.
   * Prevents duplicate observers and tracks lifecycle ownership.
   * @param {HTMLElement} block - The Mermaid diagram card element to observe.
   * @returns {ResizeObserver|null} The attached or existing observer instance, or null if unsupported.
   */
  observeDiagram(block) {
    if (!block || typeof ResizeObserver === "undefined") return null;
    if (this._diagramObservers && this._diagramObservers.has(block)) {
      return this._diagramObservers.get(block);
    }
    if (!this._diagramObservers) {
      this._diagramObservers = new Map();
    }
    const observer = new ResizeObserver((entries) => {
      this.handleDiagramResize(block, entries);
    });
    observer.observe(block);
    if (
      block.parentElement &&
      typeof document !== "undefined" &&
      block.parentElement !== document.body &&
      block.parentElement !== document.documentElement
    ) {
      try {
        observer.observe(block.parentElement);
      } catch (_e) {}
    }
    this._diagramObservers.set(block, observer);
    if (block.dataset) {
      block.dataset.mbObserved = "true";
    }
    return observer;
  }

  /**
   * Disconnects and cleans up the ResizeObserver attached to a diagram card.
   * @param {HTMLElement} block - The Mermaid diagram card element to unobserve.
   */
  unobserveDiagram(block) {
    if (!block) return;
    if (this._diagramObservers && this._diagramObservers.has(block)) {
      const observer = this._diagramObservers.get(block);
      if (observer && typeof observer.disconnect === "function") {
        try {
          observer.disconnect();
        } catch (_e) {}
      }
      this._diagramObservers.delete(block);
    }
    if (block.dataset) {
      delete block.dataset.mbObserved;
    }
    if (this._pendingResizeBlocks) {
      this._pendingResizeBlocks.delete(block);
    }
    delete block._mbObservedContainerWidth;
  }

  /**
   * Handles incoming ResizeObserver callback entries for a diagram block, queueing a debounced batch.
   * @param {HTMLElement} block - The Mermaid diagram card associated with the resize event.
   * @param {ResizeObserverEntry[]} entries - ResizeObserver entries for the observed targets.
   */
  handleDiagramResize(block, entries) {
    if (!block || block.isConnected === false) {
      this.unobserveDiagram(block);
      return;
    }
    if (entries && Array.isArray(entries)) {
      for (const entry of entries) {
        if (
          entry &&
          entry.contentRect &&
          Number.isFinite(entry.contentRect.width) &&
          entry.contentRect.width > 0
        ) {
          block._mbObservedContainerWidth = entry.contentRect.width;
        }
      }
    }
    if (!this._pendingResizeBlocks) {
      this._pendingResizeBlocks = new Set();
    }
    this._pendingResizeBlocks.add(block);
    this.scheduleResizeBatch();
  }

  /**
   * Schedules a debounced batch flush for all pending diagram resize updates (40ms debounce).
   */
  scheduleResizeBatch() {
    if (this._resizeBatchTimer) return;
    const setFn = typeof window !== "undefined" ? window.setTimeout : setTimeout;
    this._resizeBatchTimer = setFn(() => {
      this._resizeBatchTimer = null;
      this.flushResizeBatch();
    }, 40);
  }

  /**
   * Synchronously flushes all pending diagram resize computations and applies sizing updates.
   */
  flushResizeBatch() {
    if (this._resizeBatchTimer) {
      const clearFn = typeof window !== "undefined" ? window.clearTimeout : clearTimeout;
      clearFn(this._resizeBatchTimer);
      this._resizeBatchTimer = null;
    }
    if (!this._pendingResizeBlocks || this._pendingResizeBlocks.size === 0) return;
    const batch = Array.from(this._pendingResizeBlocks);
    this._pendingResizeBlocks.clear();
    for (const b of batch) {
      if (b && b.isConnected !== false) {
        this.updateDiagramSizing(b);
      } else if (b) {
        this.unobserveDiagram(b);
      }
      if (b) {
        delete b._mbObservedContainerWidth;
      }
    }
  }

  /**
   * Refreshes diagram sizing for all enhanced Mermaid cards via the debounced batch queue.
   */
  refreshAllDiagramSizing() {
    if (this._isDecorating) return;
    if (!this._pendingResizeBlocks) {
      this._pendingResizeBlocks = new Set();
    }
    const blocks = document.querySelectorAll(".mermaid-boost-card");
    blocks.forEach((block) => {
      this._pendingResizeBlocks.add(block);
    });
    this.scheduleResizeBatch();
  }

  ensureExpandBar(block, fullHeight, collapsedHeight) {
    let existingBars = [];
    if (typeof block.querySelectorAll === "function") {
      try {
        existingBars = Array.from(block.querySelectorAll(":scope > .mb-expand-bar"));
      } catch (_e) {
        existingBars = Array.from(block.querySelectorAll(".mb-expand-bar"));
      }
    }
    let bar =
      (existingBars && existingBars[0]) ||
      (typeof block.querySelector === "function"
        ? block.querySelector(":scope > .mb-expand-bar")
        : null);
    if (existingBars && existingBars.length > 1) {
      for (let i = 1; i < existingBars.length; i++) {
        if (typeof existingBars[i].remove === "function") existingBars[i].remove();
      }
    }
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
    let existingToolbars = [];
    if (typeof block.querySelectorAll === "function") {
      try {
        existingToolbars = Array.from(block.querySelectorAll(":scope > .mb-toolbar"));
      } catch (_e) {
        existingToolbars = Array.from(block.querySelectorAll(".mb-toolbar"));
      }
    }
    let toolbar =
      (existingToolbars && existingToolbars[0]) ||
      (typeof block.querySelector === "function"
        ? block.querySelector(":scope > .mb-toolbar")
        : null);
    if (existingToolbars && existingToolbars.length > 1) {
      for (let i = 1; i < existingToolbars.length; i++) {
        if (typeof existingToolbars[i].remove === "function") existingToolbars[i].remove();
      }
    }
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
      this.updateDiagramSizing(block);
    });

    addIconBtn("plus", "Zoom In", () => {
      const cur = parseFloat(block.dataset.mbZoomFactor || "1") || 1;
      block.dataset.mbZoomFactor = String(Math.min(2.5, Number((cur * 1.18).toFixed(2))));
      this.updateDiagramSizing(block);
    });

    addIconBtn("rotate-ccw", "Reset Size", () => {
      delete block.dataset.mbZoomFactor;
      delete block.dataset.mbPresetOverride;
      this.updateDiagramSizing(block);
    });

    // 4. Theme Quick Switcher
    addIconBtn("palette", "Switch Theme", () => this.cycleTheme());

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
    let closeFn = null;
    closeFn = openFullscreenLightbox(sourceSvg, diagramMeta, {
      settings: this.settings,
      saveSettings: () => this.saveSettings(),
      cycleTheme: () => this.cycleTheme(),
      exportSvgAsPng: (svg) => this.exportSvgAsPng(svg),
      onClose: () => {
        if (closeFn && this._openLightboxes) {
          this._openLightboxes.delete(closeFn);
        }
      },
    });
    if (closeFn) {
      if (!this._openLightboxes) {
        this._openLightboxes = new Set();
      }
      this._openLightboxes.add(closeFn);
    }
    return closeFn;
  }
}

module.exports = MermaidBoostPlugin;
