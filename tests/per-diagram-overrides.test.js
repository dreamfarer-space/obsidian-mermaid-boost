"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const { createMockElement } = require("./helpers.js");
const { THEMES } = require("../src/themes.js");
const { SIZE_PRESETS } = require("../src/settings.js");

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
          registerMarkdownPostProcessor() {}
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

test("Per-diagram override: theme override applies local palette and does not mutate global settings", async () => {
  const restoreObsidian = setupObsidianMock();
  MockResizeObserver.instances = [];
  global.ResizeObserver = MockResizeObserver;

  try {
    const { block, svg, host, rect } = createDiagramBlock();
    const { body } = setupGlobalEnvironment([block]);
    body.appendChild(host);

    const MermaidBoostPlugin = require("../src/main.js");
    const plugin = new MermaidBoostPlugin({}, {});
    await plugin.loadSettings();

    // Global settings theme is "claude"
    assert.equal(plugin.settings.theme, "claude");

    // Diagram has directive overriding theme to "blueprint"
    block.dataset.mbDirective = "theme=blueprint";

    plugin.decorateMermaidBlock(block);

    // Block has blueprint CSS variables
    const blueprintSpec = THEMES.blueprint;
    assert.equal(block.style.getPropertyValue("--mb-card-bg"), blueprintSpec.light.cardBg);
    assert.equal(block.dataset.mbTheme, "blueprint");

    // Rect node fill matches blueprint root node fill
    assert.equal(
      rect.style.getPropertyValue("fill") || rect.style.fill,
      blueprintSpec.light.rootNode.fill
    );

    // Global plugin settings remain untouched
    assert.equal(plugin.settings.theme, "claude");
  } finally {
    restoreObsidian();
    delete global.ResizeObserver;
    delete global.document;
    delete global.window;
  }
});

test("Per-diagram override: size preset override changes dimensions and scale floor", async () => {
  const restoreObsidian = setupObsidianMock();
  MockResizeObserver.instances = [];
  global.ResizeObserver = MockResizeObserver;

  try {
    const { block: blockCompact, svg: svgCompact, host: host1 } = createDiagramBlock({
      naturalWidth: 600,
      naturalHeight: 800,
      containerWidth: 800,
    });
    const { block: blockRelaxed, svg: svgRelaxed, host: host2 } = createDiagramBlock({
      naturalWidth: 600,
      naturalHeight: 800,
      containerWidth: 800,
    });
    const { body } = setupGlobalEnvironment([blockCompact, blockRelaxed]);
    body.appendChild(host1);
    body.appendChild(host2);

    const MermaidBoostPlugin = require("../src/main.js");
    const plugin = new MermaidBoostPlugin({}, {});
    await plugin.loadSettings();

    // Default global is compact
    plugin.decorateMermaidBlock(blockCompact);
    const compactWidth = parseInt(svgCompact.style.width, 10);
    const compactHeight = parseInt(svgCompact.style.height, 10);

    // Second block overrides to relaxed
    blockRelaxed.dataset.mbDirective = "size=relaxed";
    plugin.decorateMermaidBlock(blockRelaxed);
    const relaxedWidth = parseInt(svgRelaxed.style.width, 10);
    const relaxedHeight = parseInt(svgRelaxed.style.height, 10);

    assert.ok(
      relaxedWidth > compactWidth,
      `Relaxed width (${relaxedWidth}) should be greater than compact width (${compactWidth})`
    );
    assert.ok(
      relaxedHeight > compactHeight,
      `Relaxed height (${relaxedHeight}) should be greater than compact height (${compactHeight})`
    );
    assert.equal(plugin.settings.sizePreset, "compact", "Global settings must remain compact");
  } finally {
    restoreObsidian();
    delete global.ResizeObserver;
    delete global.document;
    delete global.window;
  }
});

test("Per-diagram override: collapse=false prevents auto-collapse on ultra-tall diagrams", async () => {
  const restoreObsidian = setupObsidianMock();
  MockResizeObserver.instances = [];
  global.ResizeObserver = MockResizeObserver;

  try {
    const { block, host } = createDiagramBlock({
      naturalWidth: 300,
      naturalHeight: 1400,
      containerWidth: 700,
    });
    const { body } = setupGlobalEnvironment([block]);
    body.appendChild(host);

    const MermaidBoostPlugin = require("../src/main.js");
    const plugin = new MermaidBoostPlugin({}, {});
    await plugin.loadSettings();

    // Directive explicitly disables collapse
    block.dataset.mbDirective = "collapse=false";

    plugin.decorateMermaidBlock(block);

    assert.equal(block.classList.contains("is-mb-collapsible"), false);
    assert.equal(block.querySelectorAll(":scope > .mb-expand-bar").length, 0);
    assert.equal(plugin.settings.autoCollapseTall, true, "Global setting must remain true");
  } finally {
    restoreObsidian();
    delete global.ResizeObserver;
    delete global.document;
    delete global.window;
  }
});

test("Per-diagram override: collapse=true forces collapse even when global autoCollapseTall is false", async () => {
  const restoreObsidian = setupObsidianMock();
  MockResizeObserver.instances = [];
  global.ResizeObserver = MockResizeObserver;

  try {
    const { block, host } = createDiagramBlock({
      naturalWidth: 300,
      naturalHeight: 1400,
      containerWidth: 700,
    });
    const { body } = setupGlobalEnvironment([block]);
    body.appendChild(host);

    const MermaidBoostPlugin = require("../src/main.js");
    const plugin = new MermaidBoostPlugin({}, {});
    await plugin.loadSettings();

    // Turn off global collapse
    plugin.settings.autoCollapseTall = false;

    // Directive explicitly enables collapse
    block.dataset.mbDirective = "collapse=true";

    plugin.decorateMermaidBlock(block);

    assert.equal(block.classList.contains("is-mb-collapsible"), true);
    assert.equal(block.querySelectorAll(":scope > .mb-expand-bar").length, 1);
    assert.equal(plugin.settings.autoCollapseTall, false, "Global setting must remain false");
  } finally {
    restoreObsidian();
    delete global.ResizeObserver;
    delete global.document;
    delete global.window;
  }
});

test("Per-diagram override: frame, grid, header, and radius overrides", async () => {
  const restoreObsidian = setupObsidianMock();
  MockResizeObserver.instances = [];
  global.ResizeObserver = MockResizeObserver;

  try {
    const { block, host, rect } = createDiagramBlock();
    const { body } = setupGlobalEnvironment([block]);
    body.appendChild(host);

    const MermaidBoostPlugin = require("../src/main.js");
    const plugin = new MermaidBoostPlugin({}, {});
    await plugin.loadSettings();

    block.dataset.mbDirective = "frame=false grid=true header=false radius=14px";
    plugin.decorateMermaidBlock(block);

    // Frame override class
    assert.equal(block.classList.contains("mb-no-frame"), true);

    // Grid override class
    assert.equal(block.classList.contains("mb-has-grid"), true);

    // Header override: toolbar is suppressed
    assert.equal(block.querySelectorAll(":scope > .mb-toolbar").length, 0);

    // Radius override: applied to style property and rect elements
    assert.equal(block.style.getPropertyValue("--mb-node-radius"), "14px");
    assert.equal(rect.getAttribute("rx"), "14");
    assert.equal(rect.getAttribute("ry"), "14");
  } finally {
    restoreObsidian();
    delete global.ResizeObserver;
    delete global.document;
    delete global.window;
  }
});

test("Per-diagram override: MarkdownPostProcessor parses %% mermaid-boost: directive from source context", async () => {
  const restoreObsidian = setupObsidianMock();
  MockResizeObserver.instances = [];
  global.ResizeObserver = MockResizeObserver;

  try {
    const { block, host } = createDiagramBlock();
    const { body } = setupGlobalEnvironment([block]);
    body.appendChild(host);

    const MermaidBoostPlugin = require("../src/main.js");
    const plugin = new MermaidBoostPlugin({}, {});
    await plugin.loadSettings();

    const markdownDoc = `
# Architecture Note

\`\`\`mermaid
%% mermaid-boost: theme=dracula size=relaxed collapse=false radius=12
flowchart TD
  User --> API
\`\`\`

Some following paragraphs.
`;

    // Simulate Obsidian MarkdownPostProcessor execution
    plugin.handleMarkdownPostProcessor(host, {
      getSectionInfo: () => ({
        text: markdownDoc,
        lineStart: 3,
        lineEnd: 8,
      }),
    });

    assert.equal(block.dataset.mbTheme, "dracula");
    assert.equal(block.style.getPropertyValue("--mb-node-radius"), "12px");
    assert.equal(block.classList.contains("is-mb-collapsible"), false);
  } finally {
    restoreObsidian();
    delete global.ResizeObserver;
    delete global.document;
    delete global.window;
  }
});

test("Per-diagram override: malformed and unknown directives degrade gracefully to global settings", async () => {
  const restoreObsidian = setupObsidianMock();
  MockResizeObserver.instances = [];
  global.ResizeObserver = MockResizeObserver;

  try {
    const { block, host } = createDiagramBlock();
    const { body } = setupGlobalEnvironment([block]);
    body.appendChild(host);

    const MermaidBoostPlugin = require("../src/main.js");
    const plugin = new MermaidBoostPlugin({}, {});
    await plugin.loadSettings();

    // Completely malformed directive
    block.dataset.mbDirective = "???===::: theme=nonexistent size=crazy collapse=maybe radius=-99";

    // Should not throw, should fall back to global settings
    assert.doesNotThrow(() => {
      plugin.decorateMermaidBlock(block);
    });

    assert.equal(block.classList.contains("mermaid-boost-card"), true);
    assert.equal(block.dataset.mbTheme, undefined); // No local theme override, inherits global
  } finally {
    restoreObsidian();
    delete global.ResizeObserver;
    delete global.document;
    delete global.window;
  }
});

test("Per-diagram override: block.dataset.mbPresetOverride affects sizing via computeSmartDiagramSize", async () => {
  const restoreObsidian = setupObsidianMock();
  MockResizeObserver.instances = [];
  global.ResizeObserver = MockResizeObserver;

  try {
    const { block, svg, host } = createDiagramBlock({ naturalWidth: 400, naturalHeight: 800 });
    const { body } = setupGlobalEnvironment([block]);
    body.appendChild(host);

    const MermaidBoostPlugin = require("../src/main.js");
    const plugin = new MermaidBoostPlugin({}, {});
    await plugin.loadSettings();

    // Default sizing in compact preset (baseScale: 0.90)
    plugin.decorateMermaidBlock(block);
    const compactWidth = svg.style.getPropertyValue("width");

    // Override card preset to 'relaxed' (baseScale: 1.15)
    block.dataset.mbPresetOverride = "relaxed";
    plugin.updateDiagramSizing(block);
    const relaxedWidth = svg.style.getPropertyValue("width");

    // Overridden preset should produce larger width
    assert.notEqual(compactWidth, relaxedWidth);
    assert.equal(parseInt(relaxedWidth, 10) > parseInt(compactWidth, 10), true);
  } finally {
    restoreObsidian();
    delete global.ResizeObserver;
    delete global.document;
    delete global.window;
  }
});

test("Per-diagram override: openFullscreenLightbox passes effectiveSettings to exportSvgAsPng", async () => {
  const restoreObsidian = setupObsidianMock();
  MockResizeObserver.instances = [];
  global.ResizeObserver = MockResizeObserver;

  try {
    const { block, svg, host } = createDiagramBlock();
    const { body } = setupGlobalEnvironment([block]);
    body.appendChild(host);

    const MermaidBoostPlugin = require("../src/main.js");
    const plugin = new MermaidBoostPlugin({}, {});
    await plugin.loadSettings();

    block.dataset.mbDirective = "theme=dracula size=relaxed";
    plugin.decorateMermaidBlock(block);

    let capturedSettings = null;
    const origExport = plugin.exportSvgAsPng.bind(plugin);
    plugin.exportSvgAsPng = async (targetSvg, explicitSettings = null) => {
      capturedSettings = explicitSettings;
      return origExport(targetSvg, explicitSettings);
    };

    const closeLightbox = plugin.openFullscreenLightbox(svg, { type: "flowchart" });

    // Find the lightbox copy button and trigger click
    const overlays = body.querySelectorAll(".mb-lightbox-overlay");
    assert.equal(overlays.length > 0, true);
    const buttons = overlays[0].querySelectorAll("button");
    const copyBtn = buttons.find(
      (b) =>
        (b.title && b.title.includes("Copy")) ||
        (b.getAttribute("aria-label") && b.getAttribute("aria-label").includes("Copy"))
    );
    assert.equal(Boolean(copyBtn), true);
    copyBtn.click();

    assert.equal(capturedSettings !== null, true);
    assert.equal(capturedSettings.theme, "dracula");
    assert.equal(capturedSettings.sizePreset, "relaxed");

    if (typeof closeLightbox === "function") closeLightbox();
  } finally {
    restoreObsidian();
    delete global.ResizeObserver;
    delete global.document;
    delete global.window;
  }
});

test("Per-diagram override: post-processor attaches directives to section container before .mermaid renders", async () => {
  const restoreObsidian = setupObsidianMock();
  MockResizeObserver.instances = [];
  global.ResizeObserver = MockResizeObserver;

  try {
    const host = createMockElement("div", { class: "block-language-mermaid" });
    const { body } = setupGlobalEnvironment([]);
    body.appendChild(host);

    const MermaidBoostPlugin = require("../src/main.js");
    const plugin = new MermaidBoostPlugin({}, {});
    await plugin.loadSettings();

    const markdownDoc = `
\`\`\`mermaid
%% mermaid-boost: theme=nord size=relaxed
flowchart LR
  A --> B
\`\`\`
`;
    // Post processor runs on container before Mermaid has rendered .mermaid
    plugin.handleMarkdownPostProcessor(host, {
      getSectionInfo: () => ({
        text: markdownDoc,
        lineStart: 1,
        lineEnd: 5,
      }),
    });

    // Host has directives stored
    assert.equal(host.dataset.mbDirectives !== undefined, true);
    const parsedOnHost = JSON.parse(host.dataset.mbDirectives);
    assert.equal(parsedOnHost.theme, "nord");

    // Later Mermaid renders .mermaid child inside host
    const { block } = createDiagramBlock();
    host.appendChild(block);

    const { extractDirectiveFromElement } = require("../src/directive.js");
    const overrides = extractDirectiveFromElement(block);
    assert.equal(overrides.theme, "nord");
    assert.equal(overrides.size, "relaxed");
  } finally {
    restoreObsidian();
    delete global.ResizeObserver;
    delete global.document;
    delete global.window;
  }
});

test("Per-diagram override: findDiagramTextFromEditor does not abort when first candidate fails or does not contain block", () => {
  const { findDiagramTextFromEditor } = require("../src/directive.js");
  const block = createMockElement("div");

  // Candidate 1: throws or doesn't contain block
  const leaf1 = {
    editor: {
      cm: {
        dom: { contains: () => false },
        posAtDOM: () => {
          throw new RangeError("Not in DOM");
        },
        state: { doc: {} },
      },
    },
  };

  // Candidate 2: contains block and returns text
  const docText = "```mermaid\n%% mermaid-boost: theme=dracula\ngraph TD\nA-->B\n```";
  const leaf2 = {
    editor: {
      cm: {
        dom: { contains: () => true },
        posAtDOM: () => 15,
        state: {
          doc: {
            lines: 5,
            lineAt: () => ({ number: 3 }),
            line: (n) => {
              const lines = docText.split("\n");
              return {
                number: n,
                text: lines[n - 1] || "",
                from: 0,
                to: docText.length,
              };
            },
            sliceString: () => docText,
          },
        },
      },
    },
  };

  const appMock = {
    workspace: {
      getActiveViewOfType: () => leaf1,
      getLeavesOfType: () => [leaf1, leaf2],
    },
  };

  const result = findDiagramTextFromEditor(block, appMock);
  assert.equal(result, docText);
});
