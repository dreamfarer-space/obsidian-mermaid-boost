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
          el.dataset.icon = name;
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

function createMockMermaidBlock(options = {}) {
  const natW = options.naturalWidth || 640;
  const natH = options.naturalHeight || 360;
  const containerWidth = options.containerWidth || 700;

  const rect = createMockElement("rect", { rx: "0", ry: "0", style: "fill:#ECECFF;" });
  const node = createMockElement("g", { class: "node", id: "flowchart-A-0" }, [rect]);
  const svg = createMockElement("svg", {
    "aria-roledescription": "flowchart-v2",
    viewBox: `0 0 ${natW} ${natH}`,
  }, [node]);

  const prio = {};
  svg.style = {
    setProperty(k, v, p) {
      this[k] = v;
      prio[k] = p || "";
    },
    removeProperty(k) {
      delete this[k];
      delete prio[k];
    },
    getPropertyValue(k) {
      return this[k] || "";
    },
    getPropertyPriority(k) {
      return prio[k] || "";
    },
  };
  svg.addEventListener = () => {};

  const addedChildren = [];
  const blockClassSet = new Set(["mermaid"]);
  const host = {
    clientWidth: containerWidth,
  };

  const block = {
    isConnected: true,
    dataset: {},
    clientWidth: containerWidth,
    style: {
      setProperty(k, v) {
        this[k] = v;
      },
    },
    classList: {
      add: (...cs) => cs.forEach((c) => blockClassSet.add(c)),
      remove: (...cs) => cs.forEach((c) => blockClassSet.delete(c)),
      contains: (c) => blockClassSet.has(c),
      toggle: (c, force) => {
        const next = force !== undefined ? Boolean(force) : !blockClassSet.has(c);
        if (next) blockClassSet.add(c);
        else blockClassSet.delete(c);
        return next;
      },
    },
    closest: (sel) => {
      if (sel && sel.includes("markdown-preview-sizer")) return host;
      return null;
    },
    parentElement: host,
    querySelector(sel) {
      if (sel === "svg") return svg;
      if (sel === ":scope > .mb-toolbar")
        return addedChildren.find((c) => c.className === "mb-toolbar") || null;
      if (sel === ":scope > .mb-expand-bar")
        return addedChildren.find((c) => c.className === "mb-expand-bar") || null;
      return null;
    },
    appendChild(child) {
      addedChildren.push(child);
      return child;
    },
  };

  return { block, svg, host, addedChildren };
}

function setupMockDocument(blocks = []) {
  global.window = {
    setTimeout: (...args) => setTimeout(...args),
    clearTimeout: (...args) => clearTimeout(...args),
  };
  global.document = {
    body: {
      dataset: {},
      classList: {
        contains: () => false,
        add: () => {},
        remove: () => {},
        toggle: () => {},
      },
      style: { setProperty: () => {} },
    },
    querySelectorAll(sel) {
      if (sel === ".mermaid-boost-card") return blocks;
      return [];
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    createElement(tag) {
      const node = {
        tagName: tag.toUpperCase(),
        className: "",
        dataset: {},
        style: {},
        children: [],
        set innerHTML(_value) {
          this.children = [];
        },
        setAttribute() {},
        addEventListener() {},
        remove() {},
        appendChild(c) {
          this.children.push(c);
          return c;
        },
      };
      return node;
    },
  };
}

test("ResizeObserver attaches to enhanced diagram container without duplicate observers", async () => {
  const restoreObsidian = setupObsidianMock();
  MockResizeObserver.instances = [];
  global.ResizeObserver = MockResizeObserver;

  try {
    const { block } = createMockMermaidBlock({ containerWidth: 720 });
    setupMockDocument([block]);

    const MermaidBoostPlugin = require("../src/main.js");
    const plugin = new MermaidBoostPlugin({}, {});
    await plugin.loadSettings();

    // First decoration attaches ResizeObserver
    plugin.decorateMermaidBlock(block);
    assert.equal(block.dataset.mbObserved, "true");
    assert.equal(plugin._diagramObservers.size, 1);
    assert.equal(MockResizeObserver.instances.length, 1);
    assert.ok(MockResizeObserver.instances[0].observed.includes(block));

    // Multiple calls to decorateMermaidBlock on same block must not attach duplicate observers
    plugin.decorateMermaidBlock(block);
    plugin.decorateMermaidBlock(block);
    assert.equal(plugin._diagramObservers.size, 1);
    assert.equal(MockResizeObserver.instances.length, 1);
  } finally {
    restoreObsidian();
    delete global.ResizeObserver;
    delete global.document;
  }
});

test("Diagram width updates after dragging Obsidian split pane or toggling sidebars", async () => {
  const restoreObsidian = setupObsidianMock();
  MockResizeObserver.instances = [];
  global.ResizeObserver = MockResizeObserver;

  try {
    const { block, svg, host } = createMockMermaidBlock({
      naturalWidth: 640,
      naturalHeight: 320,
      containerWidth: 800,
    });
    setupMockDocument([block]);

    const MermaidBoostPlugin = require("../src/main.js");
    const plugin = new MermaidBoostPlugin({}, {});
    await plugin.loadSettings();

    plugin.decorateMermaidBlock(block);
    const initialWidth = parseInt(svg.style.width, 10);
    assert.ok(initialWidth > 350, `Expected wide initial width, got ${initialWidth}`);
    const initialToolbar = block.querySelector(":scope > .mb-toolbar");
    assert.ok(initialToolbar);
    const initialBadge = initialToolbar.children.find((c) => c.className === "mb-badge");
    assert.ok(initialBadge);
    const initialBadgeText = initialBadge.textContent;

    const observer = MockResizeObserver.instances[0];
    assert.ok(observer);

    // 1. Simulate dragging split pane narrower (width down to 320px)
    host.clientWidth = 320;
    block.clientWidth = 320;
    observer.trigger([{ target: block, contentRect: { width: 320 } }]);

    // Verify debounce/batch mechanism queues and flushes correctly
    plugin.flushResizeBatch();
    const narrowWidth = parseInt(svg.style.width, 10);
    assert.ok(
      narrowWidth <= 288,
      `Expected narrow width <= 288 (320-32), got ${narrowWidth}`
    );
    assert.ok(narrowWidth < initialWidth);

    // Verify toolbar badge updated with new scale percentage
    const toolbar = block.querySelector(":scope > .mb-toolbar");
    assert.ok(toolbar);
    const badge = toolbar.children.find((c) => c.className === "mb-badge");
    assert.ok(badge);
    assert.ok(badge.textContent.includes("Flowchart"));
    assert.notEqual(badge.textContent, initialBadgeText);

    // 2. Simulate opening split pane wider (width back up to 800px)
    host.clientWidth = 800;
    block.clientWidth = 800;
    observer.trigger([{ target: block, contentRect: { width: 800 } }]);
    plugin.flushResizeBatch();

    const restoredWidth = parseInt(svg.style.width, 10);
    assert.equal(restoredWidth, initialWidth);
  } finally {
    restoreObsidian();
    delete global.ResizeObserver;
    delete global.document;
  }
});

test("Resize batch timer coalesces rapid triggers and runs updateDiagramSizing once after debounce timer elapses", async () => {
  const restoreObsidian = setupObsidianMock();
  MockResizeObserver.instances = [];
  global.ResizeObserver = MockResizeObserver;

  try {
    const { block, svg, host } = createMockMermaidBlock({
      naturalWidth: 640,
      naturalHeight: 320,
      containerWidth: 800,
    });
    setupMockDocument([block]);

    const MermaidBoostPlugin = require("../src/main.js");
    const plugin = new MermaidBoostPlugin({}, {});
    await plugin.loadSettings();

    plugin.decorateMermaidBlock(block);

    let sizingCalls = 0;
    const origUpdateSizing = plugin.updateDiagramSizing.bind(plugin);
    plugin.updateDiagramSizing = (...args) => {
      sizingCalls++;
      return origUpdateSizing(...args);
    };

    const observer = MockResizeObserver.instances[0];
    assert.ok(observer);

    // Fire 5 rapid resize triggers simulating live sash dragging
    host.clientWidth = 360;
    block.clientWidth = 360;
    observer.trigger([{ target: block, contentRect: { width: 420 } }]);
    observer.trigger([{ target: block, contentRect: { width: 400 } }]);
    observer.trigger([{ target: block, contentRect: { width: 380 } }]);
    observer.trigger([{ target: block, contentRect: { width: 370 } }]);
    observer.trigger([{ target: block, contentRect: { width: 360 } }]);

    // Prior to timer completion, sizing should not have run synchronously
    assert.equal(sizingCalls, 0);

    // Wait beyond the 40ms debounce timer
    await new Promise((resolve) => setTimeout(resolve, 75));

    // Coalesced into a single execution
    assert.equal(sizingCalls, 1);
    const updatedWidth = parseInt(svg.style.width, 10);
    assert.ok(updatedWidth <= 328);
  } finally {
    restoreObsidian();
    delete global.ResizeObserver;
    delete global.document;
  }
});

test("Re-runs only sizing logic during resize instead of fully rebuilding or restyling diagram", async () => {
  const restoreObsidian = setupObsidianMock();
  MockResizeObserver.instances = [];
  global.ResizeObserver = MockResizeObserver;

  try {
    const { block, svg, host } = createMockMermaidBlock({
      naturalWidth: 640,
      naturalHeight: 320,
      containerWidth: 700,
    });
    setupMockDocument([block]);

    const MermaidBoostPlugin = require("../src/main.js");
    const plugin = new MermaidBoostPlugin({}, {});
    await plugin.loadSettings();

    plugin.decorateMermaidBlock(block);

    // Add a sentinel attribute to verify beautification DOM is NOT re-run
    svg.dataset.testBeautifySentintel = "persisted";
    const initialStyledTheme = svg.dataset.mbStyledTheme;

    // Trigger resize
    host.clientWidth = 400;
    block.clientWidth = 400;
    const observer = MockResizeObserver.instances[0];
    let decorateCalls = 0;
    const origDecorate = plugin.decorateMermaidBlock.bind(plugin);
    plugin.decorateMermaidBlock = (...args) => {
      decorateCalls++;
      return origDecorate(...args);
    };
    observer.trigger([{ target: block, contentRect: { width: 400 } }]);
    plugin.flushResizeBatch();
    assert.equal(decorateCalls, 0);

    // Sizing updated
    const resizedWidth = parseInt(svg.style.width, 10);
    assert.ok(resizedWidth <= 368);

    // Sentinel and theme remain intact without full beautify re-run
    assert.equal(svg.dataset.testBeautifySentintel, "persisted");
    assert.equal(svg.dataset.mbStyledTheme, initialStyledTheme);
  } finally {
    restoreObsidian();
    delete global.ResizeObserver;
    delete global.document;
  }
});

test("Mobile orientation changes and narrow containers do not overflow", async () => {
  const restoreObsidian = setupObsidianMock();
  MockResizeObserver.instances = [];
  global.ResizeObserver = MockResizeObserver;

  try {
    const { block, svg, host } = createMockMermaidBlock({
      naturalWidth: 800,
      naturalHeight: 400,
      containerWidth: 320, // mobile portrait
    });
    setupMockDocument([block]);

    const MermaidBoostPlugin = require("../src/main.js");
    const plugin = new MermaidBoostPlugin({}, {});
    await plugin.loadSettings();

    plugin.decorateMermaidBlock(block);

    // Mobile portrait (320px) -> diagram width must be <= 288px (320 - 32)
    let renderedW = parseInt(svg.style.width, 10);
    assert.ok(renderedW <= 288, `Expected <= 288 in mobile portrait, got ${renderedW}`);

    // Mobile landscape (640px)
    const observer = MockResizeObserver.instances[0];
    host.clientWidth = 640;
    block.clientWidth = 640;
    observer.trigger([{ target: block, contentRect: { width: 640 } }]);
    plugin.flushResizeBatch();

    renderedW = parseInt(svg.style.width, 10);
    assert.ok(renderedW <= 608, `Expected <= 608 in mobile landscape, got ${renderedW}`);
    assert.ok(renderedW > 288, `Expected > 288 in mobile landscape, got ${renderedW}`);

    // Ultra-narrow sidebar container (120px)
    host.clientWidth = 120;
    block.clientWidth = 120;
    observer.trigger([{ target: block, contentRect: { width: 120 } }]);
    plugin.flushResizeBatch();

    renderedW = parseInt(svg.style.width, 10);
    assert.ok(renderedW <= 88, `Expected <= 88 in ultra-narrow container, got ${renderedW}`);

    // Sub-48px narrow container (40px) caps final SVG width at containerWidth (no overflow)
    host.clientWidth = 40;
    block.clientWidth = 40;
    observer.trigger([{ target: block, contentRect: { width: 40 } }]);
    plugin.flushResizeBatch();

    renderedW = parseInt(svg.style.width, 10);
    assert.ok(renderedW <= 40, `Expected <= 40 in sub-48px container, got ${renderedW}`);

    // Narrow wrapper inside wider hostContainer prioritizes observed wrapper width
    host.clientWidth = 1000;
    block.clientWidth = 300;
    observer.trigger([{ target: block, contentRect: { width: 300 } }]);
    plugin.flushResizeBatch();

    renderedW = parseInt(svg.style.width, 10);
    assert.ok(renderedW <= 300, `Expected <= 300 in column wrapper, got ${renderedW}`);
  } finally {
    restoreObsidian();
    delete global.ResizeObserver;
    delete global.document;
  }
});

test("Observers are disconnected when diagrams disappear or plugin unloads", async () => {
  const restoreObsidian = setupObsidianMock();
  MockResizeObserver.instances = [];
  global.ResizeObserver = MockResizeObserver;

  try {
    const { block } = createMockMermaidBlock({ containerWidth: 600 });
    setupMockDocument([block]);

    const MermaidBoostPlugin = require("../src/main.js");
    const plugin = new MermaidBoostPlugin({}, {});
    await plugin.loadSettings();

    plugin.decorateMermaidBlock(block);
    assert.equal(plugin._diagramObservers.size, 1);
    const observer = MockResizeObserver.instances[0];
    assert.equal(observer.disconnected, false);

    // Unobserve specific diagram
    plugin.unobserveDiagram(block);
    assert.equal(observer.disconnected, true);
    assert.equal(plugin._diagramObservers.size, 0);
    assert.equal(block.dataset.mbObserved, undefined);

    // Re-observe and test onunload disconnect
    plugin.observeDiagram(block);
    assert.equal(plugin._diagramObservers.size, 1);
    const observer2 = MockResizeObserver.instances[1];
    assert.equal(observer2.disconnected, false);

    plugin.onunload();
    assert.equal(observer2.disconnected, true);
    assert.equal(plugin._diagramObservers.size, 0);
    assert.equal(block.dataset.mbObserved, undefined);

    // Verify disconnected element auto-cleanup on resize event
    const { block: detachedBlock } = createMockMermaidBlock({ containerWidth: 500 });
    plugin.decorateMermaidBlock(detachedBlock);
    const observer3 = MockResizeObserver.instances[2];
    assert.equal(observer3.disconnected, false);

    detachedBlock.isConnected = false;
    observer3.trigger([{ target: detachedBlock, contentRect: { width: 300 } }]);
    assert.equal(observer3.disconnected, true);
    assert.equal(plugin._diagramObservers.has(detachedBlock), false);
  } finally {
    restoreObsidian();
    delete global.ResizeObserver;
    delete global.document;
  }
});

test("Restores observation and sizing without re-beautifying when an initialized diagram is reinserted into DOM", async () => {
  const restoreObsidian = setupObsidianMock();
  MockResizeObserver.instances = [];
  global.ResizeObserver = MockResizeObserver;

  try {
    const { block, svg, host } = createMockMermaidBlock({ containerWidth: 600 });
    let mutationCb = null;
    global.MutationObserver = class {
      constructor(cb) {
        mutationCb = cb;
      }
      observe() {}
      disconnect() {}
    };

    setupMockDocument([block]);

    const MermaidBoostPlugin = require("../src/main.js");
    const plugin = new MermaidBoostPlugin({}, {});
    await plugin.loadSettings();
    plugin.setupMutationObserver();

    // Initial decoration
    plugin.decorateMermaidBlock(block);
    const initialWidth = parseInt(svg.style.width, 10);
    assert.equal(plugin._diagramObservers.size, 1);

    // Simulate node removed from DOM
    mutationCb([{ removedNodes: [block], addedNodes: [] }]);
    assert.equal(plugin._diagramObservers.size, 0);
    assert.equal(block.dataset.mbObserved, undefined);

    // Spy on decorateMermaidBlock to ensure full restyle is NOT run
    let decorateCalls = 0;
    const origDecorate = plugin.decorateMermaidBlock.bind(plugin);
    plugin.decorateMermaidBlock = (...args) => {
      decorateCalls++;
      return origDecorate(...args);
    };

    // Change host width while detached
    host.clientWidth = 320;
    block.clientWidth = 320;

    // Simulate node reinserted into DOM
    mutationCb([{ removedNodes: [], addedNodes: [block] }]);

    // Observer and sizing are restored without re-decorating
    assert.equal(decorateCalls, 0);
    assert.equal(plugin._diagramObservers.size, 1);
    assert.equal(block.dataset.mbObserved, "true");

    const reinsertedWidth = parseInt(svg.style.width, 10);
    assert.ok(reinsertedWidth <= 288, `Expected reinsertedWidth <= 288, got ${reinsertedWidth}`);
    assert.ok(reinsertedWidth < initialWidth, `Expected reinsertedWidth < initialWidth, got ${reinsertedWidth} >= ${initialWidth}`);
  } finally {
    restoreObsidian();
    delete global.ResizeObserver;
    delete global.MutationObserver;
    delete global.document;
  }
});

test("Self-resize loop prevention: ResizeObserver entry matching rendered SVG width does not trigger infinite shrinking loop", async () => {
  const restoreObsidian = setupObsidianMock();
  MockResizeObserver.instances = [];
  global.ResizeObserver = MockResizeObserver;

  try {
    const { block, svg, host } = createMockMermaidBlock({
      naturalWidth: 640,
      naturalHeight: 320,
      containerWidth: 800,
    });
    setupMockDocument([block]);

    const MermaidBoostPlugin = require("../src/main.js");
    const plugin = new MermaidBoostPlugin({}, {});
    await plugin.loadSettings();

    plugin.decorateMermaidBlock(block);
    const initialWidth = parseInt(svg.style.width, 10);
    assert.ok(initialWidth > 0, "Initial width should be computed");

    const observer = MockResizeObserver.instances[0];
    assert.ok(observer);

    // Simulate real browser layout: ResizeObserver fires for block with contentRect matching rendered SVG width
    observer.trigger([{ target: block, contentRect: { width: initialWidth } }]);

    // Batch flush should not have scheduled or changed diagram width
    plugin.flushResizeBatch();
    const afterSelfNotificationWidth = parseInt(svg.style.width, 10);
    assert.equal(
      afterSelfNotificationWidth,
      initialWidth,
      "Diagram width must not shrink when ResizeObserver reports the block's own rendered width"
    );

    // Repeated self-resize callbacks (simulating browser layout events) remain strictly stable
    for (let i = 0; i < 5; i++) {
      observer.trigger([{ target: block, contentRect: { width: afterSelfNotificationWidth } }]);
      plugin.flushResizeBatch();
    }
    const finalStableWidth = parseInt(svg.style.width, 10);
    assert.equal(
      finalStableWidth,
      initialWidth,
      "Diagram width must remain strictly identical across multiple self-resize callbacks without shrinking"
    );
  } finally {
    restoreObsidian();
    delete global.ResizeObserver;
    delete global.document;
  }
});

