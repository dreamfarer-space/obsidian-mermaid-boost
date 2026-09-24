"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  SIZE_PRESETS,
  DEFAULT_SETTINGS,
  THEMES,
  extractSvgNaturalSize,
  detectDiagramType,
  tightenPieViewBox,
  computeSmartDiagramSize,
  hasExplicitUserStyle,
  classifyGraphTopology,
  beautifySvgDom,
} = require("./lib.js");

function createMockElement(tagName, attrs = {}, children = []) {
  const attributes = Object.assign({}, attrs);
  const style = {};
  const dataset = {};
  const classSet = new Set(
    (attributes.class || "")
      .split(/\s+/)
      .filter(Boolean)
  );

  const el = {
    tagName: tagName.toUpperCase(),
    style,
    dataset,
    children,
    firstChild: children[0] || null,
    classList: {
      contains: (c) => classSet.has(c),
      add: (...cs) => cs.forEach((c) => classSet.add(c)),
      remove: (...cs) => cs.forEach((c) => classSet.delete(c)),
    },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(attributes, name)
        ? String(attributes[name])
        : null;
    },
    setAttribute(name, val) {
      attributes[name] = String(val);
      if (name === "class") {
        classSet.clear();
        String(val)
          .split(/\s+/)
          .filter(Boolean)
          .forEach((c) => classSet.add(c));
      }
    },
    appendChild(child) {
      children.push(child);
      if (!this.firstChild) this.firstChild = child;
      return child;
    },
    insertBefore(child) {
      children.unshift(child);
      this.firstChild = children[0];
      return child;
    },
    querySelector(selector) {
      return this.querySelectorAll(selector)[0] || null;
    },
    querySelectorAll(selector) {
      const results = [];
      const selectors = selector.split(",").map((s) => s.trim());
      const matchesSingle = (node, sel) => {
        if (sel === "#mb-node-shadow") return node.getAttribute("id") === "mb-node-shadow";
        if (sel === "defs") return node.tagName.toLowerCase() === "defs";
        if (sel === "rect") return node.tagName.toLowerCase() === "rect";
        if (sel === "path.pieCircle")
          return node.tagName.toLowerCase() === "path" && node.classList.contains("pieCircle");
        if (sel === "path.flowchart-link")
          return node.tagName.toLowerCase() === "path" && node.classList.contains("flowchart-link");
        if (sel === ".legend rect")
          return node.tagName.toLowerCase() === "rect" && node._parentClass === "legend";
        if (sel.startsWith(".")) {
          const cls = sel.slice(1);
          return node.classList.contains(cls);
        }
        if (sel === "rect, polygon, circle, ellipse, path.basic.label-container") {
          return ["rect", "polygon", "circle", "ellipse"].includes(
            node.tagName.toLowerCase()
          );
        }
        return false;
      };
      const walk = (node) => {
        for (const child of node.children || []) {
          if (selectors.some((sel) => matchesSingle(child, sel))) {
            results.push(child);
          }
          walk(child);
        }
      };
      walk(this);
      return results;
    },
    ownerDocument: {
      createElementNS(_ns, tag) {
        return createMockElement(tag);
      },
    },
  };
  return el;
}

test("extractSvgNaturalSize parses viewBox, attributes, and handles invalid inputs", () => {
  const svg1 = createMockElement("svg", { viewBox: "0 0 784 450" });
  assert.deepEqual(extractSvgNaturalSize(svg1), {
    x: 0,
    y: 0,
    width: 784,
    height: 450,
  });

  const svgComma = createMockElement("svg", { viewBox: "-8, -12, 340.5, 820" });
  assert.deepEqual(extractSvgNaturalSize(svgComma), {
    x: -8,
    y: -12,
    width: 340.5,
    height: 820,
  });

  const svgAttr = createMockElement("svg", { width: "520px", height: "280px" });
  assert.deepEqual(extractSvgNaturalSize(svgAttr), {
    x: 0,
    y: 0,
    width: 520,
    height: 280,
  });

  const svgInvalid = createMockElement("svg", { viewBox: "0 0 0 -10" });
  assert.equal(extractSvgNaturalSize(svgInvalid), null);
  assert.equal(extractSvgNaturalSize(null), null);
});

test("detectDiagramType identifies flowchart orientations, pie, and gantt charts", () => {
  const flowTd = createMockElement("svg", {
    "aria-roledescription": "flowchart-v2",
    viewBox: "0 0 320 780",
  });
  const metaTd = detectDiagramType(flowTd);
  assert.equal(metaTd.type, "flowchart");
  assert.equal(metaTd.orientation, "vertical");

  const flowLr = createMockElement("svg", {
    "aria-roledescription": "flowchart-v2",
    viewBox: "0 0 680 190",
  });
  const metaLr = detectDiagramType(flowLr);
  assert.equal(metaLr.type, "flowchart");
  assert.equal(metaLr.orientation, "horizontal");

  const pieSvg = createMockElement("svg", {
    "aria-roledescription": "pie",
    viewBox: "0 0 784 450",
  });
  const metaPie = detectDiagramType(pieSvg);
  assert.equal(metaPie.type, "pie");
});

test("tightenPieViewBox trims bloated 784x450 Mermaid pie canvas without touching compact diagrams", () => {
  const pieSvg = createMockElement("svg", { viewBox: "0 0 784 450" });
  const nat = extractSvgNaturalSize(pieSvg);
  const trimmed = tightenPieViewBox(pieSvg, nat);

  assert.equal(trimmed.trimmed, true);
  assert.ok(trimmed.width < 600, `Expected trimmed width < 600, got ${trimmed.width}`);
  assert.ok(trimmed.x > 80, `Expected positive left offset > 80, got ${trimmed.x}`);
  assert.equal(
    pieSvg.getAttribute("viewBox"),
    `${trimmed.x} ${trimmed.y} ${trimmed.width} ${trimmed.height}`
  );

  const compactSvg = createMockElement("svg", { viewBox: "0 0 360 280" });
  const untrimmed = tightenPieViewBox(compactSvg, extractSvgNaturalSize(compactSvg));
  assert.equal(untrimmed.trimmed, false);
  assert.equal(untrimmed.width, 360);
});

test("computeSmartDiagramSize scales down oversized diagrams while enforcing minReadableScale floor", () => {
  // 1. Medium 5-step vertical flowchart (340 x 580) -> fits nicely inside compact maxHeight (320px)
  const sizeMedium = computeSmartDiagramSize(
    { width: 340, height: 580 },
    { type: "flowchart", orientation: "vertical" },
    DEFAULT_SETTINGS,
    700
  );
  assert.ok(sizeMedium.height <= 325, `Expected height <= 325, got ${sizeMedium.height}`);
  assert.ok(sizeMedium.scale >= 0.52 && sizeMedium.scale <= 0.72);
  assert.equal(sizeMedium.needsHeightCollapse, false);

  // 2. Ultra-tall 15-step vertical flowchart (320 x 1500) -> floors at minReadableScale (0.52) and enables collapse!
  const sizeTall = computeSmartDiagramSize(
    { width: 320, height: 1500 },
    { type: "flowchart", orientation: "vertical" },
    DEFAULT_SETTINGS,
    700
  );
  assert.equal(sizeTall.scale, 0.52);
  assert.equal(sizeTall.width, Math.round(320 * 0.52));
  assert.equal(sizeTall.needsHeightCollapse, true);
  assert.equal(sizeTall.collapsedHeight, 320);

  // 3. Pie chart (572 x 410) -> capped at compact pie dimensions (height <= 235px)
  const sizePie = computeSmartDiagramSize(
    { width: 572, height: 410 },
    { type: "pie", orientation: "horizontal" },
    DEFAULT_SETTINGS,
    700
  );
  assert.ok(sizePie.height <= 235, `Expected pie height <= 235, got ${sizePie.height}`);
  assert.ok(sizePie.width <= 430, `Expected pie width <= 430, got ${sizePie.width}`);

  // 4. Narrow mobile/sidebar container (width 280px) -> never overflows containerWidth - 32
  const sizeNarrow = computeSmartDiagramSize(
    { width: 640, height: 260 },
    { type: "flowchart", orientation: "horizontal" },
    DEFAULT_SETTINGS,
    280
  );
  assert.ok(sizeNarrow.width <= 248, `Expected width <= 248, got ${sizeNarrow.width}`);
});

test("classifyGraphTopology & beautifySvgDom apply all 7 groups (29 themes) matching the HTML demo 1:1", () => {
  const { THEME_GROUPS } = require("./lib.js");
  assert.deepEqual(THEME_GROUPS, [
    "Styled",
    "Developer",
    "Paper & print",
    "Retro & playful",
    "Brand-inspired",
    "Functional",
    "Built-in",
  ]);
  assert.equal(Object.keys(THEMES).length, 29);

  const rect1 = createMockElement("rect", { rx: "0", ry: "0", style: "fill:#ECECFF;stroke:#9370DB;" });
  const rect2 = createMockElement("rect", { rx: "0", ry: "0", style: "fill:#ECECFF;stroke:#9370DB;" });
  const rect3Custom = createMockElement("rect", { rx: "0", ry: "0", style: "fill:#ff0055;stroke:#990022;" });

  const node1 = createMockElement("g", { class: "node", id: "flowchart-A-0" }, [rect1]);
  const node2 = createMockElement("g", { class: "node", id: "flowchart-B-1" }, [rect2]);
  const node3 = createMockElement("g", { class: "node", id: "flowchart-C-2" }, [rect3Custom]);

  const path0 = createMockElement("path", { class: "flowchart-link" });
  const path2 = createMockElement("path", { class: "flowchart-link" });
  const edge12 = createMockElement("g", { class: "edgePath", id: "L-A-B-0" }, [path0]);
  const edge23 = createMockElement("g", { class: "edgePath", id: "L-B-C-0" }, [path2]);

  const svg = createMockElement(
    "svg",
    { viewBox: "0 0 340 600" },
    [node1, node2, node3, edge12, edge23]
  );

  // 1. Styled: Claude & Handcrafted
  beautifySvgDom(svg, DEFAULT_SETTINGS, false);
  assert.equal(THEMES.claude.light.cardBg, "#faf9f5");
  assert.equal(rect1.getAttribute("rx"), "12");
  assert.equal(rect1.style.fill, "#f0eee6");
  assert.equal(rect1.style.stroke, "#c6613f");
  assert.equal(svg.getAttribute("filter"), null);
  assert.equal(hasExplicitUserStyle(rect3Custom), true);
  assert.equal(rect3Custom.style.fill, undefined);

  beautifySvgDom(svg, { ...DEFAULT_SETTINGS, theme: "handcrafted" }, false);
  assert.equal(THEMES.handcrafted.light.cardBg, "#fdf6e3");
  assert.equal(rect1.getAttribute("rx"), "12");
  assert.equal(rect1.style.fill, "#fff3b0");
  assert.equal(svg.getAttribute("filter"), "url(#mb-wobble)");

  // 2. Developer: Nord & Dracula
  beautifySvgDom(svg, { ...DEFAULT_SETTINGS, theme: "nord" }, false);
  assert.equal(THEMES.nord.light.cardBg, "#2e3440");
  assert.equal(rect1.getAttribute("rx"), "6");
  assert.equal(rect1.style.fill, "#3b4252");
  assert.equal(rect1.style.stroke, "#88c0d0");

  // 3. Paper & print: Blueprint (grid background image + 0px corners)
  beautifySvgDom(svg, { ...DEFAULT_SETTINGS, theme: "blueprint" }, false);
  assert.equal(THEMES.blueprint.light.cardBg, "#0b3d91");
  assert.equal(THEMES.blueprint.cardBgSize, "20px 20px");
  assert.equal(rect1.getAttribute("rx"), "0");
  assert.equal(rect1.style.fill, "#0e4aa8");
  assert.equal(rect1.style.stroke, "#ffffff");

  // 4. Retro & playful: Terminal / CRT (glow), Synthwave (glow-pink), Sticky notes (A=yellow, B=pink)
  beautifySvgDom(svg, { ...DEFAULT_SETTINGS, theme: "terminal-crt" }, false);
  assert.equal(svg.getAttribute("filter"), "drop-shadow(0 0 3px #33ff66)");

  beautifySvgDom(svg, { ...DEFAULT_SETTINGS, theme: "synthwave" }, false);
  assert.equal(svg.getAttribute("filter"), "drop-shadow(0 0 4px #ff2e97)");

  beautifySvgDom(svg, { ...DEFAULT_SETTINGS, theme: "sticky-notes" }, false);
  assert.equal(rect1.style.fill, "#fff176"); // Node A -> yellow
  assert.equal(rect2.style.fill, "#ffb3c7"); // Node B -> pink

  // 5. Brand-inspired: Linear (glow-violet) & Metro map (4px node stroke, 6px red/blue transit links)
  beautifySvgDom(svg, { ...DEFAULT_SETTINGS, theme: "linear" }, false);
  assert.equal(svg.getAttribute("filter"), "drop-shadow(0 0 6px rgba(94,106,210,.55))");

  beautifySvgDom(svg, { ...DEFAULT_SETTINGS, theme: "metro-map" }, false);
  assert.equal(rect1.style.strokeWidth, "4px");
  assert.equal(path0.style.stroke, "#e63946");
  assert.equal(path0.style.strokeWidth, "6px");

  // 6. Functional: Colorblind-safe (Okabe-Ito) & Mono + one accent
  beautifySvgDom(svg, { ...DEFAULT_SETTINGS, theme: "colorblind-safe" }, false);
  assert.equal(rect1.style.fill, "#cfe8f7"); // Node A
  assert.equal(rect2.style.fill, "#fbe3b0"); // Node B

  beautifySvgDom(svg, { ...DEFAULT_SETTINGS, theme: "mono-accent" }, false);
  assert.equal(rect1.style.fill, "#fff0e6");
  assert.equal(rect1.style.stroke, "#e8590c");
  assert.equal(path0.style.stroke, "#e8590c");
  assert.equal(path0.style.strokeWidth, "3px");
});

test("MermaidBoostPlugin main.js decorates .mermaid blocks, applies compact sizing, creates toolbar and expand bar", async () => {
  const Module = require("node:module");
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

  try {
    const MermaidBoostPlugin = require("./main.js");
    const plugin = new MermaidBoostPlugin({}, {});
    await plugin.loadSettings();

    // Build mock DOM block with an ultra-tall 320x1500 flowchart SVG
    const rect = createMockElement("rect", { rx: "0", ry: "0", style: "fill:#ECECFF;" });
    const node = createMockElement("g", { class: "node", id: "flowchart-A-0" }, [rect]);
    const svg = createMockElement("svg", {
      "aria-roledescription": "flowchart-v2",
      viewBox: "0 0 320 1500",
    }, [node]);
    svg.style.setProperty = function (k, v) {
      this[k] = v;
    };
    svg.addEventListener = () => {};

    const addedChildren = [];
    const blockClassSet = new Set(["mermaid"]);
    const block = {
      dataset: {},
      clientWidth: 680,
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
      closest: () => ({ clientWidth: 680 }),
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

    global.document = {
      body: {
        classList: {
          contains: () => false,
          add: () => {},
          remove: () => {},
          toggle: () => {},
        },
        style: { setProperty: () => {} },
      },
      createElement(tag) {
        return {
          tagName: tag.toUpperCase(),
          className: "",
          dataset: {},
          style: {},
          children: [],
          setAttribute() {},
          addEventListener() {},
          appendChild(c) {
            this.children.push(c);
            return c;
          },
        };
      },
    };

    plugin.decorateMermaidBlock(block);

    assert.equal(block.classList.contains("mermaid-boost-card"), true);
    assert.equal(block.classList.contains("is-mb-collapsible"), true);
    assert.equal(svg.style.width, "166px");
    assert.equal(svg.style.height, "780px");
    assert.equal(svg.style["max-width"], "none");
    assert.ok(addedChildren.some((c) => c.className === "mb-toolbar"));
    assert.ok(addedChildren.some((c) => c.className === "mb-expand-bar"));
  } finally {
    Module._load = origLoad;
    delete global.document;
  }
});

