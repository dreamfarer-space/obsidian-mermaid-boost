"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const { createMockElement } = require("./helpers.js");

function setupObsidianMock() {
  const origLoad = Module._load;
  Module._load = function (request, parent, isMain) {
    if (request === "obsidian") {
      return {
        Plugin: class {
          constructor(app, manifest) {
            this.app = app;
            this.manifest = manifest;
          }
          addSettingTab() {}
          registerEvent() {}
          addCommand() {}
          async loadData() {
            return {};
          }
          async saveData() {}
        },
        PluginSettingTab: class {},
        Setting: class {},
        Notice: class {},
        setIcon: (el, name) => {
          if (el) el.dataset.icon = name;
        },
      };
    }
    return origLoad.apply(this, arguments);
  };
  return () => {
    Module._load = origLoad;
  };
}

class MockResizeObserver {
  static instances = [];

  constructor(callback) {
    this.callback = callback;
    this.observed = [];
    this.disconnected = false;
    MockResizeObserver.instances.push(this);
  }

  observe(target) {
    if (!this.observed.includes(target)) {
      this.observed.push(target);
    }
  }

  unobserve(target) {
    const idx = this.observed.indexOf(target);
    if (idx !== -1) {
      this.observed.splice(idx, 1);
    }
  }

  disconnect() {
    this.disconnected = true;
    this.observed = [];
  }

  trigger(entries) {
    if (!this.disconnected) {
      this.callback(entries, this);
    }
  }
}

function createDiagramBlock(options = {}) {
  const natW = options.naturalWidth || 400;
  const natH = options.naturalHeight || 800;
  const containerWidth = options.containerWidth || 700;

  const rect = createMockElement("rect", { rx: "0", ry: "0", style: "fill:#ECECFF;" });
  const node = createMockElement("g", { class: "node", id: "flowchart-A-0" }, [rect]);
  const svg = createMockElement("svg", {
    "aria-roledescription": options.type || "flowchart-v2",
    viewBox: `0 0 ${natW} ${natH}`,
  }, [node]);

  svg.style.setProperty("width", `${natW}px`);
  svg.style.setProperty("height", `${natH}px`);
  svg.style.setProperty("max-width", "500px");

  const block = createMockElement("div", { class: "mermaid" }, [svg]);
  block.clientWidth = containerWidth;
  block.clientHeight = natH;

  const host = createMockElement("div", { class: "markdown-preview-sizer" }, [block]);
  host.clientWidth = containerWidth;

  return { block, svg, host, node, rect };
}

function setupGlobalEnvironment(blocks = []) {
  const windowListeners = new Map();
  global.window = {
    innerWidth: 1024,
    innerHeight: 768,
    setTimeout: (...args) => setTimeout(...args),
    clearTimeout: (...args) => clearTimeout(...args),
    requestAnimationFrame: (cb) => {
      cb();
      return 1;
    },
    addEventListener: (type, fn) => {
      if (!windowListeners.has(type)) windowListeners.set(type, new Set());
      windowListeners.get(type).add(fn);
    },
    removeEventListener: (type, fn) => {
      if (windowListeners.has(type)) windowListeners.get(type).delete(fn);
    },
    dispatchEvent: (event) => {
      const type = event.type || event;
      if (windowListeners.has(type)) {
        for (const handler of Array.from(windowListeners.get(type))) {
          handler(event);
        }
      }
    },
  };

  const body = createMockElement("body");
  global.document = {
    body,
    querySelectorAll(sel) {
      if (sel === ".mermaid") {
        return blocks.filter((b) => b.classList.contains("mermaid"));
      }
      if (sel === ".mermaid-boost-card") {
        return blocks.filter((b) => b.classList.contains("mermaid-boost-card"));
      }
      if (sel === ".mermaid, .mermaid-boost-card") {
        return blocks.filter(
          (b) => b.classList.contains("mermaid") || b.classList.contains("mermaid-boost-card")
        );
      }
      if (sel === ".mb-lightbox-overlay") {
        return body.querySelectorAll(".mb-lightbox-overlay");
      }
      return body.querySelectorAll(sel);
    },
    createElement(tag) {
      return createMockElement(tag);
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  };

  return { windowListeners, body };
}

test("Idempotency: Re-enhancing the same Mermaid block produces exactly one stable enhanced result", async () => {
  const restoreObsidian = setupObsidianMock();
  MockResizeObserver.instances = [];
  global.ResizeObserver = MockResizeObserver;

  try {
    const { block, svg } = createDiagramBlock({ naturalWidth: 320, naturalHeight: 900, containerWidth: 680 });
    setupGlobalEnvironment([block]);

    const MermaidBoostPlugin = require("../src/main.js");
    const plugin = new MermaidBoostPlugin({}, {});
    await plugin.loadSettings();

    // Re-enhance the same block 5 consecutive times
    for (let i = 0; i < 5; i++) {
      plugin.decorateMermaidBlock(block);
    }

    // 1. Exactly one toolbar exists
    const toolbars = block.querySelectorAll(":scope > .mb-toolbar");
    assert.equal(toolbars.length, 1, `Expected exactly 1 toolbar, found ${toolbars.length}`);

    // 2. Exactly one expand bar exists (since height 900 > 650 threshold)
    const expandBars = block.querySelectorAll(":scope > .mb-expand-bar");
    assert.equal(expandBars.length, 1, `Expected exactly 1 expand bar, found ${expandBars.length}`);

    // 3. Exactly one ResizeObserver instance is attached
    assert.equal(plugin._diagramObservers.size, 1);
    assert.equal(MockResizeObserver.instances.length, 1);

    // 4. Stable class names and no nested wrapper cards
    assert.equal(block.classList.contains("mermaid-boost-card"), true);
    assert.equal(block.classList.contains("is-mb-collapsible"), true);
    const cardChildren = block.querySelectorAll(".mermaid-boost-card");
    assert.equal(cardChildren.length, 0, "No duplicate inner wrapper cards should be created");

    // 5. SVG dimensions remain deterministic and identical
    const finalWidth = svg.style.width;
    const finalHeight = svg.style.height;
    assert.ok(finalWidth);
    assert.ok(finalHeight);

    // Re-enhance one more time
    plugin.decorateMermaidBlock(block);
    assert.equal(svg.style.width, finalWidth);
    assert.equal(svg.style.height, finalHeight);
    assert.equal(block.querySelectorAll(":scope > .mb-toolbar").length, 1);
    assert.equal(block.querySelectorAll(":scope > .mb-expand-bar").length, 1);
    assert.equal(plugin._diagramObservers.size, 1);
  } finally {
    restoreObsidian();
    delete global.ResizeObserver;
    delete global.document;
    delete global.window;
  }
});

test("Idempotency: Repeated MutationObserver callbacks coalesce and remain stable under Obsidian re-rendering", async () => {
  const restoreObsidian = setupObsidianMock();
  MockResizeObserver.instances = [];
  global.ResizeObserver = MockResizeObserver;

  try {
    const { block: block1, svg: svg1 } = createDiagramBlock({ naturalWidth: 400, naturalHeight: 300 });
    const { block: block2, svg: svg2 } = createDiagramBlock({ naturalWidth: 500, naturalHeight: 400 });
    const container = createMockElement("div", { class: "markdown-preview-view" }, [block1, block2]);
    setupGlobalEnvironment([block1, block2]);

    let mutationCallback = null;
    global.MutationObserver = class {
      constructor(cb) {
        mutationCallback = cb;
      }
      observe() {}
      disconnect() {}
    };

    const MermaidBoostPlugin = require("../src/main.js");
    const plugin = new MermaidBoostPlugin({}, {});
    await plugin.loadSettings();
    plugin.setupMutationObserver();

    // Trigger rapid repeated mutation observer events with same blocks and internal UI modifications
    for (let i = 0; i < 8; i++) {
      mutationCallback([
        { addedNodes: [container], removedNodes: [] },
        { addedNodes: [block1], removedNodes: [] },
        { addedNodes: [block2], removedNodes: [] },
        // Simulate mutations originating inside our own toolbar or defs (should be ignored)
        { addedNodes: [createMockElement("div", { class: "mb-toolbar" })], removedNodes: [] },
        { addedNodes: [createMockElement("defs")], removedNodes: [] },
      ]);
    }

    // Wait for the 50ms batch debounce flush timer to complete
    await new Promise((resolve) => setTimeout(resolve, 80));

    // Both diagrams decorated exactly once
    assert.equal(svg1.dataset.mbInitialized, "true");
    assert.equal(svg2.dataset.mbInitialized, "true");
    assert.equal(block1.querySelectorAll(":scope > .mb-toolbar").length, 1);
    assert.equal(block2.querySelectorAll(":scope > .mb-toolbar").length, 1);
    assert.equal(plugin._diagramObservers.size, 2);

    // Further redundant callbacks do not restyle or duplicate UI
    mutationCallback([{ addedNodes: [block1, block2], removedNodes: [] }]);
    await new Promise((resolve) => setTimeout(resolve, 80));

    assert.equal(block1.querySelectorAll(":scope > .mb-toolbar").length, 1);
    assert.equal(block2.querySelectorAll(":scope > .mb-toolbar").length, 1);
    assert.equal(plugin._diagramObservers.size, 2);
  } finally {
    restoreObsidian();
    delete global.ResizeObserver;
    delete global.MutationObserver;
    delete global.document;
    delete global.window;
  }
});

test("Lifecycle: Switching between Reading View and Live Preview cleans up and rebinds cleanly", async () => {
  const restoreObsidian = setupObsidianMock();
  MockResizeObserver.instances = [];
  global.ResizeObserver = MockResizeObserver;

  try {
    const { block: readBlock, svg: readSvg } = createDiagramBlock({ naturalWidth: 400, naturalHeight: 300 });
    const readingView = createMockElement("div", { class: "markdown-preview-view" }, [readBlock]);

    const { block: liveBlock, svg: liveSvg } = createDiagramBlock({ naturalWidth: 400, naturalHeight: 300 });
    const livePreview = createMockElement("div", { class: "cm-content" }, [
      createMockElement("div", { class: "cm-embed-block" }, [liveBlock]),
    ]);

    let mutationCallback = null;
    global.MutationObserver = class {
      constructor(cb) {
        mutationCallback = cb;
      }
      observe() {}
      disconnect() {}
    };

    setupGlobalEnvironment([readBlock, liveBlock]);

    const MermaidBoostPlugin = require("../src/main.js");
    const plugin = new MermaidBoostPlugin({}, {});
    await plugin.loadSettings();
    plugin.setupMutationObserver();

    // 1. Initial Reading View render
    mutationCallback([{ addedNodes: [readingView], removedNodes: [] }]);
    await new Promise((resolve) => setTimeout(resolve, 80));

    assert.equal(readSvg.dataset.mbInitialized, "true");
    assert.equal(plugin._diagramObservers.has(readBlock), true);
    assert.equal(plugin._diagramObservers.size, 1);

    // 2. Switch to Live Preview: Reading view is removed, Live Preview is mounted
    mutationCallback([
      { addedNodes: [], removedNodes: [readingView] },
      { addedNodes: [livePreview], removedNodes: [] },
    ]);
    await new Promise((resolve) => setTimeout(resolve, 80));

    // Old reading view block was cleanly unobserved
    assert.equal(plugin._diagramObservers.has(readBlock), false);
    // New live preview block was observed
    assert.equal(plugin._diagramObservers.has(liveBlock), true);
    assert.equal(liveSvg.dataset.mbInitialized, "true");
    assert.equal(liveBlock.querySelectorAll(":scope > .mb-toolbar").length, 1);

    // 3. Switch back to Reading View: Live Preview removed, Reading View re-added
    mutationCallback([
      { addedNodes: [readingView], removedNodes: [livePreview] },
    ]);
    await new Promise((resolve) => setTimeout(resolve, 80));

    assert.equal(plugin._diagramObservers.has(liveBlock), false);
    assert.equal(plugin._diagramObservers.has(readBlock), true);
    assert.equal(readBlock.querySelectorAll(":scope > .mb-toolbar").length, 1);
  } finally {
    restoreObsidian();
    delete global.ResizeObserver;
    delete global.MutationObserver;
    delete global.document;
    delete global.window;
  }
});

test("Lifecycle: Removing/closing a note cleans up listeners and observers without memory leaks", async () => {
  const restoreObsidian = setupObsidianMock();
  MockResizeObserver.instances = [];
  global.ResizeObserver = MockResizeObserver;

  try {
    const { block: b1, svg: s1 } = createDiagramBlock();
    const { block: b2, svg: s2 } = createDiagramBlock();
    const noteContainer = createMockElement("div", { class: "workspace-leaf" }, [b1, b2]);

    let mutationCallback = null;
    global.MutationObserver = class {
      constructor(cb) {
        mutationCallback = cb;
      }
      observe() {}
      disconnect() {}
    };

    setupGlobalEnvironment([b1, b2]);

    const MermaidBoostPlugin = require("../src/main.js");
    const plugin = new MermaidBoostPlugin({}, {});
    await plugin.loadSettings();
    plugin.setupMutationObserver();

    mutationCallback([{ addedNodes: [noteContainer], removedNodes: [] }]);
    await new Promise((resolve) => setTimeout(resolve, 80));

    assert.equal(plugin._diagramObservers.size, 2);
    assert.equal(b1.dataset.mbObserved, "true");
    assert.equal(b2.dataset.mbObserved, "true");

    // Close note -> noteContainer removed
    mutationCallback([{ addedNodes: [], removedNodes: [noteContainer] }]);

    // Both diagrams unobserved immediately
    assert.equal(plugin._diagramObservers.size, 0);
    assert.equal(b1.dataset.mbObserved, undefined);
    assert.equal(b2.dataset.mbObserved, undefined);

    // Full plugin onunload restores pristine SVG state and clears listeners
    plugin.decorateMermaidBlock(b1);
    assert.equal(s1.dataset.mbInitialized, "true");
    assert.equal(b1.classList.contains("mermaid-boost-card"), true);

    plugin.onunload();

    assert.equal(plugin._diagramObservers.size, 0);
    assert.equal(b1.classList.contains("mermaid-boost-card"), false);
    assert.equal(s1.dataset.mbInitialized, undefined);
    assert.equal(s1._mbDblClickHandler, undefined);
    assert.equal(b1.querySelector(":scope > .mb-toolbar"), null);
    assert.equal(b1.querySelector(":scope > .mb-expand-bar"), null);
  } finally {
    restoreObsidian();
    delete global.ResizeObserver;
    delete global.MutationObserver;
    delete global.document;
    delete global.window;
  }
});

test("User Interactions: Toolbar zoom controls and expand/collapse button work correctly", async () => {
  const restoreObsidian = setupObsidianMock();
  MockResizeObserver.instances = [];
  global.ResizeObserver = MockResizeObserver;

  try {
    const { block, svg } = createDiagramBlock({ naturalWidth: 320, naturalHeight: 900, containerWidth: 700 });
    setupGlobalEnvironment([block]);

    const MermaidBoostPlugin = require("../src/main.js");
    const plugin = new MermaidBoostPlugin({}, {});
    await plugin.loadSettings();

    plugin.decorateMermaidBlock(block);

    const toolbar = block.querySelector(":scope > .mb-toolbar");
    assert.ok(toolbar, "Toolbar must exist");

    const badge = toolbar.querySelector(".mb-badge");
    assert.ok(badge, "Scale badge must exist");
    const initialBadgeText = badge.textContent;

    const zoomInBtn = toolbar.querySelector('button[title="Zoom In"]');
    const zoomOutBtn = toolbar.querySelector('button[title="Zoom Out"]');
    const resetBtn = toolbar.querySelector('button[title="Reset Size"]');
    assert.ok(zoomInBtn && zoomOutBtn && resetBtn);

    const initialWidth = parseInt(svg.style.width, 10);

    // 1. Click Zoom In
    zoomInBtn.click();
    assert.equal(block.classList.contains("is-mb-user-zoomed"), true);
    assert.ok(parseFloat(block.dataset.mbZoomFactor) > 1.0);
    const zoomedInWidth = parseInt(svg.style.width, 10);
    assert.ok(
      zoomedInWidth > initialWidth,
      `Zoomed in width (${zoomedInWidth}) should be > initial (${initialWidth})`
    );
    assert.notEqual(
      toolbar.querySelector(".mb-badge").textContent,
      initialBadgeText
    );

    // 2. Click Reset Size
    const resetBtnAfterZoom = toolbar.querySelector('button[title="Reset Size"]');
    resetBtnAfterZoom.click();
    assert.equal(block.dataset.mbZoomFactor, undefined);
    assert.equal(block.classList.contains("is-mb-user-zoomed"), false);
    assert.equal(parseInt(svg.style.width, 10), initialWidth);
    assert.equal(
      toolbar.querySelector(".mb-badge").textContent,
      initialBadgeText
    );

    // 3. Click Zoom Out
    const zoomOutBtnAfterReset = toolbar.querySelector('button[title="Zoom Out"]');
    zoomOutBtnAfterReset.click();
    assert.equal(block.classList.contains("is-mb-user-zoomed"), true);
    assert.ok(parseFloat(block.dataset.mbZoomFactor) < 1.0);
    const zoomedOutWidth = parseInt(svg.style.width, 10);
    assert.ok(zoomedOutWidth < initialWidth);

    // 4. Expand / Collapse bar interaction
    const expandBar = block.querySelector(":scope > .mb-expand-bar");
    assert.ok(expandBar, "Expand bar must exist for tall diagram");
    const expandBtn = expandBar.querySelector("button.mb-expand-btn");
    assert.ok(expandBtn);
    assert.equal(block.classList.contains("is-mb-expanded"), false);
    assert.ok(expandBtn.textContent.includes("Expand Full"));

    // Click Expand
    expandBtn.click();
    assert.equal(block.classList.contains("is-mb-expanded"), true);
    const updatedExpandBtn = expandBar.querySelector("button.mb-expand-btn");
    assert.ok(updatedExpandBtn && updatedExpandBtn.textContent.includes("Collapse"));

    // Click Collapse
    updatedExpandBtn.click();
    assert.equal(block.classList.contains("is-mb-expanded"), false);
  } finally {
    restoreObsidian();
    delete global.ResizeObserver;
    delete global.document;
    delete global.window;
  }
});

test("Lightbox: Fullscreen open, keyboard navigation, theme switching, and Escape key handling", async () => {
  const restoreObsidian = setupObsidianMock();
  MockResizeObserver.instances = [];
  global.ResizeObserver = MockResizeObserver;

  try {
    const { block, svg } = createDiagramBlock({ naturalWidth: 640, naturalHeight: 360 });
    const { windowListeners, body } = setupGlobalEnvironment([block]);

    const MermaidBoostPlugin = require("../src/main.js");
    const plugin = new MermaidBoostPlugin({}, {});
    await plugin.loadSettings();
    plugin.decorateMermaidBlock(block);

    // Double-click SVG to open lightbox
    svg.dispatchEvent("dblclick");

    assert.equal(plugin._openLightboxes.size, 1);
    const overlay = body.querySelector(".mb-lightbox-overlay");
    assert.ok(overlay, "Lightbox overlay must be mounted to body");

    const scaleEl = overlay.querySelector(".mb-lightbox-scale");
    assert.ok(scaleEl, "Scale indicator must be present");
    const initialScaleText = scaleEl.textContent;
    assert.ok(initialScaleText.endsWith("%"));
    const initialScaleNum = parseInt(initialScaleText, 10);

    // Keyboard zoom: '+' key
    global.window.dispatchEvent({ type: "keydown", key: "+" });
    const zoomedInScaleNum = parseInt(scaleEl.textContent, 10);
    assert.ok(
      zoomedInScaleNum > initialScaleNum,
      `Zoomed in (${zoomedInScaleNum}) should be > initial (${initialScaleNum})`
    );

    // Keyboard zoom: '-' key
    global.window.dispatchEvent({ type: "keydown", key: "-" });
    const zoomedOutScaleNum = parseInt(scaleEl.textContent, 10);
    assert.ok(
      zoomedOutScaleNum < zoomedInScaleNum,
      `Zoomed out (${zoomedOutScaleNum}) should be < zoomed in (${zoomedInScaleNum})`
    );

    // Keyboard fit to screen: '0' key
    global.window.dispatchEvent({ type: "keydown", key: "0" });
    assert.equal(scaleEl.textContent, initialScaleText);

    // Switch theme live inside lightbox
    const themeBtn = overlay.querySelector(".mb-lightbox-theme-btn");
    assert.ok(themeBtn);
    const prevTheme = plugin.settings.theme;
    await themeBtn.click();
    assert.notEqual(plugin.settings.theme, prevTheme);

    // Press Escape to close lightbox
    global.window.dispatchEvent({ type: "keydown", key: "Escape" });
    assert.equal(plugin._openLightboxes.size, 0);
    assert.equal(body.querySelector(".mb-lightbox-overlay"), null, "Overlay must be removed from body");

    // Reopen via toolbar button and close via Close button
    const toolbar = block.querySelector(":scope > .mb-toolbar");
    const fullscreenBtn = toolbar.querySelector('button[title="Fullscreen Viewer"]');
    fullscreenBtn.click();

    assert.equal(plugin._openLightboxes.size, 1);
    const overlay2 = body.querySelector(".mb-lightbox-overlay");
    assert.ok(overlay2);
    const closeBtn = overlay2.querySelector(".mb-close-btn");
    assert.ok(closeBtn);
    closeBtn.click();

    assert.equal(plugin._openLightboxes.size, 0);
    assert.equal(body.querySelector(".mb-lightbox-overlay"), null);
  } finally {
    restoreObsidian();
    delete global.ResizeObserver;
    delete global.document;
    delete global.window;
  }
});

test("Theme changes update existing diagrams without duplicating UI controls", async () => {
  const restoreObsidian = setupObsidianMock();
  MockResizeObserver.instances = [];
  global.ResizeObserver = MockResizeObserver;

  try {
    const { block: b1, svg: s1 } = createDiagramBlock({ naturalWidth: 400, naturalHeight: 300 });
    const { block: b2, svg: s2 } = createDiagramBlock({ naturalWidth: 500, naturalHeight: 800 });
    const { body } = setupGlobalEnvironment([b1, b2]);

    const MermaidBoostPlugin = require("../src/main.js");
    const plugin = new MermaidBoostPlugin({}, {});
    await plugin.loadSettings();

    plugin.decorateMermaidBlock(b1);
    plugin.decorateMermaidBlock(b2);

    assert.equal(b1.querySelectorAll(":scope > .mb-toolbar").length, 1);
    assert.equal(b2.querySelectorAll(":scope > .mb-toolbar").length, 1);
    assert.equal(b2.querySelectorAll(":scope > .mb-expand-bar").length, 1);

    const initialTheme1 = s1.dataset.mbStyledTheme;
    const initialTheme2 = s2.dataset.mbStyledTheme;

    // Cycle theme
    const nextKey = await plugin.cycleTheme();

    assert.equal(body.dataset.mbTheme, nextKey);
    assert.notEqual(s1.dataset.mbStyledTheme, initialTheme1);
    assert.notEqual(s2.dataset.mbStyledTheme, initialTheme2);

    // UI elements must NOT be duplicated
    assert.equal(b1.querySelectorAll(":scope > .mb-toolbar").length, 1);
    assert.equal(b2.querySelectorAll(":scope > .mb-toolbar").length, 1);
    assert.equal(b2.querySelectorAll(":scope > .mb-expand-bar").length, 1);
  } finally {
    restoreObsidian();
    delete global.ResizeObserver;
    delete global.document;
    delete global.window;
  }
});

test("Resize-driven sizing remains stable and narrow containers do not overflow", async () => {
  const restoreObsidian = setupObsidianMock();
  MockResizeObserver.instances = [];
  global.ResizeObserver = MockResizeObserver;

  try {
    const { block, svg, host } = createDiagramBlock({
      naturalWidth: 800,
      naturalHeight: 400,
      containerWidth: 800,
    });
    setupGlobalEnvironment([block]);

    const MermaidBoostPlugin = require("../src/main.js");
    const plugin = new MermaidBoostPlugin({}, {});
    await plugin.loadSettings();

    plugin.decorateMermaidBlock(block);
    const observer = MockResizeObserver.instances[0];

    // Rapid resize back and forth
    const widths = [320, 600, 320, 800, 320];
    for (const w of widths) {
      host.clientWidth = w;
      block.clientWidth = w;
      observer.trigger([{ target: block, contentRect: { width: w } }]);
      plugin.flushResizeBatch();
    }

    // At 320px, diagram width must never exceed 320 - 32 = 288px
    const finalWidth = parseInt(svg.style.width, 10);
    assert.ok(finalWidth <= 288, `Diagram width (${finalWidth}) must not exceed container width (288)`);

    // Ultra-narrow container (80px)
    host.clientWidth = 80;
    block.clientWidth = 80;
    observer.trigger([{ target: block, contentRect: { width: 80 } }]);
    plugin.flushResizeBatch();

    const ultraNarrowWidth = parseInt(svg.style.width, 10);
    assert.ok(ultraNarrowWidth <= 80, `Diagram width (${ultraNarrowWidth}) must not exceed ultra-narrow width 80`);

    // Toolbar and expand bar count remains 1
    assert.equal(block.querySelectorAll(":scope > .mb-toolbar").length, 1);
  } finally {
    restoreObsidian();
    delete global.ResizeObserver;
    delete global.document;
    delete global.window;
  }
});
