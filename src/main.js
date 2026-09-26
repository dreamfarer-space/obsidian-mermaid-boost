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
const {
  extractDirectivesFromText,
  extractMermaidCodeBlocks,
  extractDirectiveFromElement,
  resolveEffectiveSettings,
} = require("./directive.js");

class MermaidBoostPlugin extends Plugin {
  /**
   * Initializes the Mermaid Boost plugin, registers commands, event handlers, settings, and observers.
   */
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new MermaidBoostSettingTab(this.app, this));
    this.applyGlobalThemeVariables();

    this.setupMutationObserver();

    if (typeof this.registerMarkdownPostProcessor === "function") {
      this.registerMarkdownPostProcessor((el, ctx) => {
        this.handleMarkdownPostProcessor(el, ctx);
      });
    }

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

  /**
   * Cleans up plugin resources, observers, DOM modifications, styles, and event listeners on unload.
   */
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
        delete block.dataset.mbTheme;
        delete block.dataset.mbHasPattern;
        delete block.dataset.mbDirectives;
      }
      delete block._mbDirectives;
      delete block._mbEffectiveSettings;
      delete block._mbLastRenderedWidth;
      delete block._mbLastRenderedHeight;
      delete block._mbLastRenderedContentWidth;
      delete block._mbLastContainerWidth;
      delete block._mbObservedContainerWidth;
      if (block.classList) {
        block.classList.remove(
          "mb-no-frame",
          "mb-has-frame",
          "mb-has-grid",
          "mb-no-grid"
        );
      }
      [
        "--mb-card-bg",
        "--mb-card-fg",
        "--mb-card-bg-image",
        "--mb-card-bg-size",
        "--mb-svg-filter",
        "--mb-card-border",
        "--mb-grid-dot",
        "--mb-edge-stroke",
        "--mb-node-radius",
        "--mb-font-family",
        "--mb-collapsed-height",
      ].forEach((prop) => {
        if (block.style && typeof block.style.removeProperty === "function") {
          block.style.removeProperty(prop);
        }
      });
      this.unobserveDiagram(block);
    });
    if (typeof document !== "undefined" && document.body && document.body.dataset) {
      delete document.body.dataset.mbTheme;
      delete document.body.dataset.mbHasPattern;
    }
  }

  /**
   * Cycles to the next visual theme and saves settings.
   * @returns {Promise<string>} The new theme key.
   */
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

  /**
   * Loads plugin settings from disk and applies fallbacks if necessary.
   */
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

  /**
   * Persists plugin settings to disk, updates CSS variables, and refreshes rendered diagrams.
   */
  async saveSettings() {
    await this.saveData(this.settings);
    this.applyGlobalThemeVariables();
    this.refreshAllMermaidBlocks(true);
  }

  /**
   * Detects whether Obsidian is currently using a dark theme.
   * @returns {boolean} True if dark mode is active.
   */
  isDarkMode() {
    return document.body.classList.contains("theme-dark");
  }

  /**
   * Updates global CSS variables on document.body corresponding to current theme and appearance settings.
   */
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

  /**
   * Sets up a MutationObserver to watch for dynamically added or removed Mermaid diagrams.
   */
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

  /**
   * Markdown post-processor that intercepts rendered markdown elements, extracts directives,
   * and decorates any rendered Mermaid diagrams.
   * @param {HTMLElement} el - The markdown rendered element or block container.
   * @param {Object} ctx - Obsidian MarkdownPostProcessorContext with getSectionInfo.
   */
  handleMarkdownPostProcessor(el, ctx) {
    if (!el) return;

    let sectionText = "";
    if (ctx && typeof ctx.getSectionInfo === "function") {
      try {
        const info = ctx.getSectionInfo(el);
        if (
          info &&
          typeof info.text === "string" &&
          Number.isFinite(info.lineStart) &&
          Number.isFinite(info.lineEnd)
        ) {
          const lines = info.text.split("\n").slice(info.lineStart, info.lineEnd + 1);
          sectionText = lines.join("\n");
        }
      } catch (_e) {}
    }

    // Attach section directives to container element even if .mermaid has not finished rendering yet
    let sectionOverrides = null;
    const blockMatches = sectionText
      ? extractMermaidCodeBlocks(sectionText)
      : [];
    if (sectionText) {
      sectionOverrides = extractDirectivesFromText(sectionText);
      if (Object.keys(sectionOverrides).length > 0 && blockMatches.length <= 1) {
        el._mbDirectives = sectionOverrides;
        if (el.dataset) {
          el.dataset.mbDirectives = JSON.stringify(sectionOverrides);
        }
        if (typeof el.querySelectorAll === "function") {
          const codeBlocks = el.querySelectorAll(
            "code.language-mermaid, pre.language-mermaid, .block-language-mermaid"
          );
          for (let i = 0; i < codeBlocks.length; i++) {
            codeBlocks[i]._mbDirectives = sectionOverrides;
            if (codeBlocks[i].dataset) {
              codeBlocks[i].dataset.mbDirectives = JSON.stringify(sectionOverrides);
            }
          }
        }
      }
    }

    const mermaidBlocks = [];
    if (el.classList && el.classList.contains("mermaid")) {
      mermaidBlocks.push(el);
    }
    if (typeof el.querySelectorAll === "function") {
      const nested = el.querySelectorAll(".mermaid");
      for (let i = 0; i < nested.length; i++) {
        if (!mermaidBlocks.includes(nested[i])) {
          mermaidBlocks.push(nested[i]);
        }
      }
    }
    if (mermaidBlocks.length === 0) return;

    if (sectionText) {
      if (blockMatches.length > 0 && blockMatches.length === mermaidBlocks.length) {
        for (let i = 0; i < mermaidBlocks.length; i++) {
          const rawCode = blockMatches[i];
          const overrides = extractDirectivesFromText(rawCode);
          if (Object.keys(overrides).length > 0) {
            mermaidBlocks[i]._mbDirectives = overrides;
            if (mermaidBlocks[i].dataset) {
              mermaidBlocks[i].dataset.mbDirectives = JSON.stringify(overrides);
            }
          }
        }
      } else if (
        blockMatches.length <= 1 &&
        sectionOverrides &&
        Object.keys(sectionOverrides).length > 0
      ) {
        for (const b of mermaidBlocks) {
          b._mbDirectives = sectionOverrides;
          if (b.dataset) {
            b.dataset.mbDirectives = JSON.stringify(sectionOverrides);
          }
        }
      }
    } else if (sectionOverrides && Object.keys(sectionOverrides).length > 0) {
      for (const b of mermaidBlocks) {
        b._mbDirectives = sectionOverrides;
        if (b.dataset) {
          b.dataset.mbDirectives = JSON.stringify(sectionOverrides);
        }
      }
    }

    for (const b of mermaidBlocks) {
      if (b.querySelector && b.querySelector("svg")) {
        this.decorateMermaidBlock(b, true);
      }
    }
  }

  /**
   * Refreshes and decorates all Mermaid diagram blocks currently in the document.
   * @param {boolean} [forceRestyle=false] - Whether to force a full SVG DOM beautification pass.
   */
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

  /**
   * Decorates a single Mermaid diagram element with themes, sizing, toolbar, and zoom controls.
   * @param {HTMLElement} block - The container element holding the Mermaid SVG.
   * @param {boolean} [forceRestyle=false] - Whether to re-apply SVG styles unconditionally.
   */
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

    // Extract per-diagram directives and compute diagram-specific effective settings
    const overrides = extractDirectiveFromElement(block, this.app);
    const effectiveSettings = resolveEffectiveSettings(this.settings, overrides);
    block._mbEffectiveSettings = effectiveSettings;

    // Apply per-diagram frame override (mb-no-frame / mb-has-frame)
    if (typeof overrides.frame === "boolean") {
      block.classList.toggle("mb-no-frame", !effectiveSettings.showCardFrame);
      block.classList.toggle("mb-has-frame", effectiveSettings.showCardFrame);
    } else {
      block.classList.remove("mb-no-frame", "mb-has-frame");
    }

    // Apply per-diagram grid override (mb-has-grid / mb-no-grid)
    if (typeof overrides.grid === "boolean") {
      block.classList.toggle("mb-has-grid", effectiveSettings.showDotGrid);
      block.classList.toggle("mb-no-grid", !effectiveSettings.showDotGrid);
    } else {
      block.classList.remove("mb-has-grid", "mb-no-grid");
    }

    // Apply per-diagram theme palette CSS custom properties to card container
    const hasThemeOverride = Boolean(overrides.theme);
    const hasRadiusOverride = Number.isFinite(overrides.radius);
    if (hasThemeOverride || hasRadiusOverride) {
      const isDark = this.isDarkMode();
      const { themeKey, themeObj, palette } = resolveThemeSpec(effectiveSettings, isDark);
      if (block.style && typeof block.style.setProperty === "function") {
        block.style.setProperty("--mb-card-bg", palette.cardBg);
        block.style.setProperty("--mb-card-fg", palette.cardFg || palette.rootNode.text);
        block.style.setProperty("--mb-card-bg-image", themeObj.cardBgImage || "none");
        block.style.setProperty("--mb-card-bg-size", themeObj.cardBgSize || "auto");
        block.style.setProperty("--mb-svg-filter", themeObj.svgFilter || "none");
        block.style.setProperty("--mb-card-border", palette.cardBorder);
        block.style.setProperty("--mb-grid-dot", palette.gridDot);
        block.style.setProperty("--mb-edge-stroke", palette.edge.stroke);
        block.style.setProperty(
          "--mb-node-radius",
          `${effectiveSettings.nodeRadius ?? themeObj.defaultRadius ?? 6}px`
        );
        block.style.setProperty(
          "--mb-font-family",
          themeObj.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif'
        );
      }
      if (block.dataset) {
        block.dataset.mbTheme = themeKey;
        block.dataset.mbHasPattern =
          themeObj.cardBgImage && themeObj.cardBgImage !== "none" ? "true" : "false";
      }
    } else {
      [
        "--mb-card-bg",
        "--mb-card-fg",
        "--mb-card-bg-image",
        "--mb-card-bg-size",
        "--mb-svg-filter",
        "--mb-card-border",
        "--mb-grid-dot",
        "--mb-edge-stroke",
        "--mb-node-radius",
        "--mb-font-family",
      ].forEach((prop) => {
        if (block.style && typeof block.style.removeProperty === "function") {
          block.style.removeProperty(prop);
        }
      });
      if (block.dataset) {
        delete block.dataset.mbTheme;
        delete block.dataset.mbHasPattern;
      }
    }

    // Apply SVG DOM Beautification (colors, rounded corners, arrowheads, shadows)
    const beautifyKey = `${effectiveSettings.theme}-${this.isDarkMode()}-${effectiveSettings.multiToneNodes}-${effectiveSettings.nodeRadius}`;
    if (forceRestyle || svg.dataset.mbStyledTheme !== beautifyKey) {
      beautifySvgDom(svg, effectiveSettings, this.isDarkMode());
      svg.dataset.mbStyledTheme = beautifyKey;
    }

    // Apply responsive sizing
    this.updateDiagramSizing(block, null, effectiveSettings);

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
   * @param {Object|null} [passedEffectiveSettings=null] - Optional precomputed effective settings.
   */
  updateDiagramSizing(block, explicitContainerWidth = null, passedEffectiveSettings = null) {
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

    const effectiveSettings =
      passedEffectiveSettings ||
      block._mbEffectiveSettings ||
      resolveEffectiveSettings(this.settings, extractDirectiveFromElement(block, this.app));
    block._mbEffectiveSettings = effectiveSettings;

    let effectiveNat = origNat;
    if (diagramMeta.type === "pie") {
      if (effectiveSettings.trimPiePadding) {
        effectiveNat = tightenPieViewBox(svg, origNat);
      } else if (svg.dataset.mbOrigViewBox) {
        svg.setAttribute("viewBox", svg.dataset.mbOrigViewBox);
      }
    }

    const cardPresetKey =
      (block.dataset && block.dataset.mbPresetOverride) || effectiveSettings.sizePreset;
    const cardPreset = SIZE_PRESETS[cardPresetKey] || SIZE_PRESETS.compact;
    const sizingSettings = Object.assign({}, effectiveSettings, {
      sizePreset: cardPresetKey,
      baseScale:
        block.dataset && block.dataset.mbPresetOverride
          ? cardPreset.baseScale
          : effectiveSettings.baseScale,
      maxHeight:
        block.dataset && block.dataset.mbPresetOverride
          ? cardPreset.maxHeight
          : effectiveSettings.maxHeight,
      maxWidth:
        block.dataset && block.dataset.mbPresetOverride
          ? cardPreset.maxWidth
          : effectiveSettings.maxWidth,
      minReadableScale:
        block.dataset && block.dataset.mbPresetOverride
          ? cardPreset.minReadableScale
          : effectiveSettings.minReadableScale,
    });

    const hostContainer =
      (typeof block.closest === "function" &&
        block.closest(".markdown-preview-sizer, .cm-content, .callout-content")) ||
      block.parentElement;
    const hostWidth =
      hostContainer &&
      typeof document !== "undefined" &&
      hostContainer !== document.body &&
      hostContainer !== document.documentElement
        ? hostContainer.clientWidth
        : 0;
    const parentWidth =
      block.parentElement &&
      typeof document !== "undefined" &&
      block.parentElement !== document.body &&
      block.parentElement !== document.documentElement
        ? block.parentElement.clientWidth
        : 0;
    const observedWidth =
      block._mbObservedContainerWidth > 0
        ? parentWidth > 0
          ? Math.min(block._mbObservedContainerWidth, parentWidth)
          : block._mbObservedContainerWidth
        : null;
    const containerWidth =
      explicitContainerWidth ||
      observedWidth ||
      (hostWidth > 0 && parentWidth > 0
        ? Math.min(hostWidth, parentWidth)
        : hostWidth || parentWidth) ||
      block.clientWidth ||
      640;

    const sizing = computeSmartDiagramSize(
      effectiveNat,
      diagramMeta,
      sizingSettings,
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
    const computedBlockStyle =
      typeof getComputedStyle === "function" ? getComputedStyle(block) : null;
    const renderedContentWidth = computedBlockStyle
      ? block.clientWidth -
        (parseFloat(computedBlockStyle.paddingLeft) || 0) -
        (parseFloat(computedBlockStyle.paddingRight) || 0)
      : finalWidth;
    block._mbLastRenderedWidth = finalWidth;
    block._mbLastRenderedHeight = finalHeight;
    block._mbLastRenderedContentWidth =
      Number.isFinite(renderedContentWidth) && renderedContentWidth > 0
        ? renderedContentWidth
        : finalWidth;
    block._mbLastContainerWidth = containerWidth;
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

    this.ensureToolbar(block, svg, diagramMeta, displayPercent, cardPresetKey, sizingSettings);
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
    const hostContainer =
      (typeof block.closest === "function" &&
        block.closest(".markdown-preview-sizer, .cm-content, .callout-content")) ||
      block.parentElement;
    if (
      hostContainer &&
      hostContainer !== block.parentElement &&
      typeof document !== "undefined" &&
      hostContainer !== document.body &&
      hostContainer !== document.documentElement
    ) {
      try {
        observer.observe(hostContainer);
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
    delete block._mbLastRenderedWidth;
    delete block._mbLastRenderedHeight;
    delete block._mbLastRenderedContentWidth;
    delete block._mbLastContainerWidth;
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

    const hostContainer =
      (typeof block.closest === "function" &&
        block.closest(".markdown-preview-sizer, .cm-content, .callout-content")) ||
      block.parentElement;

    const liveContainerW =
      (hostContainer &&
        typeof document !== "undefined" &&
        hostContainer !== document.body &&
        hostContainer !== document.documentElement &&
        Number.isFinite(hostContainer.clientWidth) &&
        hostContainer.clientWidth > 0 &&
        hostContainer.clientWidth) ||
      (block.parentElement &&
        typeof document !== "undefined" &&
        block.parentElement !== document.body &&
        block.parentElement !== document.documentElement &&
        Number.isFinite(block.parentElement.clientWidth) &&
        block.parentElement.clientWidth > 0 &&
        block.parentElement.clientWidth) ||
      0;

    const lastContainerW = block._mbLastContainerWidth;

    let hasMeaningfulResize = false;
    if (entries && Array.isArray(entries)) {
      for (const entry of entries) {
        if (
          !entry ||
          !entry.contentRect ||
          !Number.isFinite(entry.contentRect.width) ||
          entry.contentRect.width <= 0
        ) {
          continue;
        }

        const entryW = entry.contentRect.width;

        if (entry.target === block) {
          // If the entry is for the diagram block itself:
          // 1. If we have a live container in the DOM and its width hasn't changed,
          //    this block resize is an internal layout echo (from our own SVG sizing,
          //    card padding/min-width, or toolbar) and MUST be ignored to prevent loops.
          if (
            liveContainerW > 0 &&
            lastContainerW &&
            Math.abs(liveContainerW - lastContainerW) <= 2
          ) {
            continue;
          }

          // 2. If the entry matches our last rendered card content width or SVG width, ignore.
          const renderedContentW = block._mbLastRenderedContentWidth;
          if (renderedContentW && Math.abs(entryW - renderedContentW) <= 2) {
            continue;
          }
          const renderedW = block._mbLastRenderedWidth;
          if (renderedW && Math.abs(entryW - renderedW) <= 2) {
            continue;
          }
          if (
            renderedW &&
            (Math.abs(entryW - (renderedW + 28)) <= 2 ||
              Math.abs(entryW - (renderedW + 30)) <= 2)
          ) {
            continue;
          }
          if (
            renderedW < 240 &&
            (Math.abs(entryW - 210) <= 2 || Math.abs(entryW - 240) <= 2)
          ) {
            continue;
          }

          // 3. If container width has not changed compared to lastContainerW, ignore.
          if (lastContainerW && Math.abs(entryW - lastContainerW) <= 2) {
            continue;
          }

          const calculatedObservedW =
            liveContainerW > 0 && Math.abs(liveContainerW - lastContainerW) > 2
              ? Math.min(liveContainerW, entryW)
              : entryW;
          block._mbObservedContainerWidth =
            block._mbObservedContainerWidth > 0
              ? Math.min(block._mbObservedContainerWidth, calculatedObservedW)
              : calculatedObservedW;
          hasMeaningfulResize = true;
        } else {
          // For container/parent elements: ignore if container width hasn't meaningfully changed
          const parentW =
            block.parentElement &&
            typeof document !== "undefined" &&
            block.parentElement !== document.body &&
            block.parentElement !== document.documentElement &&
            Number.isFinite(block.parentElement.clientWidth) &&
            block.parentElement.clientWidth > 0
              ? block.parentElement.clientWidth
              : 0;
          const effectiveW =
            parentW > 0 && entry.target !== block.parentElement
              ? Math.min(parentW, entryW)
              : entryW;
          if (lastContainerW && Math.abs(effectiveW - lastContainerW) <= 2) {
            continue;
          }
          block._mbObservedContainerWidth =
            block._mbObservedContainerWidth > 0
              ? Math.min(block._mbObservedContainerWidth, effectiveW)
              : effectiveW;
          hasMeaningfulResize = true;
        }
      }
    }

    if (!hasMeaningfulResize) return;
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

  /**
   * Ensures the expand/collapse bar is created and properly configured for tall diagrams.
   * @param {HTMLElement} block - The Mermaid card element.
   * @param {number} fullHeight - Unconstrained diagram height in pixels.
   * @param {number} collapsedHeight - Collapsed maximum height in pixels.
   */
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

  /**
   * Ensures the floating action toolbar is created or updated above the diagram.
   * @param {HTMLElement} block - The Mermaid card element.
   * @param {SVGElement} svg - The diagram SVG element.
   * @param {Object} diagramMeta - Diagram classification metadata.
   * @param {number} displayPercent - Current scale percentage.
   * @param {string} cardPresetKey - Active size preset name.
   * @param {Object|null} [sizingSettings=null] - Card sizing and header display settings.
   */
  ensureToolbar(block, svg, diagramMeta, displayPercent, cardPresetKey, sizingSettings = null) {
    const shouldShowHeader =
      sizingSettings && typeof sizingSettings.showHeaderBar === "boolean"
        ? sizingSettings.showHeaderBar
        : this.settings.showHeaderBar !== false;

    if (!shouldShowHeader) {
      let existingToolbars = [];
      if (typeof block.querySelectorAll === "function") {
        try {
          existingToolbars = Array.from(block.querySelectorAll(":scope > .mb-toolbar"));
        } catch (_e) {
          existingToolbars = Array.from(block.querySelectorAll(".mb-toolbar"));
        }
      }
      for (const t of existingToolbars) {
        if (typeof t.remove === "function") t.remove();
      }
      return;
    }

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

  /**
   * Resolves a CSS color string, converting CSS variable references into computed hex/rgb values.
   * @param {string} val - CSS color or var(--...) expression.
   * @param {string} [fallback="#ffffff"] - Fallback color if resolution fails.
   * @returns {string} Computed CSS color string.
   */
  resolveLiveCssColor(val, fallback = "#ffffff") {
    return resolveLiveCssColor(val, fallback);
  }

  /**
   * Exports an SVG diagram element as a high-resolution PNG image with transparent or styled background.
   * @param {SVGElement} svg - The SVG element to export.
   * @param {Object|null} [explicitSettings=null] - Optional explicit settings/overrides.
   * @returns {Promise<Blob|null>} The generated PNG blob or null if export failed.
   */
  async exportSvgAsPng(svg, explicitSettings = null) {
    const block = svg && svg.closest && svg.closest(".mermaid-boost-card");
    const effectiveSettings =
      explicitSettings ||
      (block && block._mbEffectiveSettings) ||
      (svg && svg._mbEffectiveSettings) ||
      this.settings;
    return exportSvgAsPng(svg, effectiveSettings, this.isDarkMode());
  }

  /**
   * Opens the diagram in the immersive fullscreen lightbox viewer with pan/zoom and actions.
   * @param {SVGElement} sourceSvg - The source SVG diagram element to display.
   * @param {Object} diagramMeta - Diagram classification metadata.
   * @returns {Function|null} Close function to dismiss the lightbox.
   */
  openFullscreenLightbox(sourceSvg, diagramMeta) {
    const block = sourceSvg && sourceSvg.closest && sourceSvg.closest(".mermaid-boost-card");
    const hasLocalThemeOverride = Boolean(
      block && block._mbDirectives && block._mbDirectives.theme
    );
    const effectiveSettings = (block && block._mbEffectiveSettings) || this.settings;
    let closeFn = null;
    closeFn = openFullscreenLightbox(sourceSvg, diagramMeta, {
      settings: effectiveSettings,
      saveSettings: () => (hasLocalThemeOverride ? Promise.resolve() : this.saveSettings()),
      cycleTheme: hasLocalThemeOverride
        ? async () => {
            const nextKey = nextThemeKey(effectiveSettings.theme);
            effectiveSettings.theme = nextKey;
            const themeDef = THEMES[nextKey];
            if (themeDef && Number.isFinite(themeDef.defaultRadius)) {
              effectiveSettings.nodeRadius = themeDef.defaultRadius;
            }
            if (block) {
              block._mbEffectiveSettings = effectiveSettings;
            }
            new Notice(`Mermaid Boost theme: ${themeDef ? themeDef.name : nextKey}`);
            return nextKey;
          }
        : () => this.cycleTheme(),
      exportSvgAsPng: (svg) => this.exportSvgAsPng(svg, effectiveSettings),
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
