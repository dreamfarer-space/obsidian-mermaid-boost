"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createMockElement } = require("./helpers.js");

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
    const MermaidBoostPlugin = require("../main.js");
    const plugin = new MermaidBoostPlugin({}, {});
    await plugin.loadSettings();

    // Build mock DOM block with an ultra-tall 320x1500 flowchart SVG
    const rect = createMockElement("rect", { rx: "0", ry: "0", style: "fill:#ECECFF;" });
    const node = createMockElement("g", { class: "node", id: "flowchart-A-0" }, [rect]);
    const svg = createMockElement("svg", {
      "aria-roledescription": "flowchart-v2",
      viewBox: "0 0 320 1500",
    }, [node]);
    const prio = {};
    svg.style["max-width"] = "500px";
    svg.style.setProperty = function (k, v, p) {
      this[k] = v;
      prio[k] = p || "";
    };
    svg.style.removeProperty = function (k) {
      delete this[k];
      delete prio[k];
    };
    svg.style.getPropertyValue = function (k) {
      return this[k] || "";
    };
    svg.style.getPropertyPriority = function (k) {
      return prio[k] || "";
    };
    svg.style.setProperty("height", "900px", "important");
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
        if (sel === ".mermaid-boost-card") return [block];
        return [];
      },
      createElement(tag) {
        const node = {
          tagName: tag.toUpperCase(),
          className: "",
          dataset: {},
          style: {},
          children: [],
          setAttribute() {},
          addEventListener() {},
          remove() {
            const idx = addedChildren.indexOf(node);
            if (idx !== -1) addedChildren.splice(idx, 1);
          },
          appendChild(c) {
            this.children.push(c);
            return c;
          },
        };
        return node;
      },
    };

    plugin.decorateMermaidBlock(block);
    plugin.applyGlobalThemeVariables();

    assert.equal(block.classList.contains("mermaid-boost-card"), true);
    assert.equal(block.classList.contains("is-mb-collapsible"), true);
    assert.equal(svg.style.width, "166px");
    assert.equal(svg.style.height, "780px");
    assert.equal(svg.style["max-width"], "none");
    assert.equal(svg.dataset.mbInitialized, "true");
    assert.ok(addedChildren.some((c) => c.className === "mb-toolbar"));
    assert.ok(addedChildren.some((c) => c.className === "mb-expand-bar"));
    assert.notEqual(global.document.body.dataset.mbTheme, undefined);
    assert.notEqual(global.document.body.dataset.mbHasPattern, undefined);

    // Test lifecycle unload cleanup
    plugin.onunload();
    assert.equal(svg.dataset.mbInitialized, undefined);
    assert.equal(svg.dataset.mbOrigViewBox, undefined);
    assert.equal(svg.dataset.mbDblClickBound, undefined);
    assert.equal(svg.style["max-width"], "500px");
    assert.equal(svg.style.height, "900px");
    assert.equal(svg.style.getPropertyPriority("height"), "important");
    assert.equal(svg.dataset.mbOrigStyleHeight, undefined);
    assert.equal(svg.dataset.mbOrigStyleHeightPriority, undefined);
    assert.equal(svg.style.width, undefined);
    assert.equal(block.classList.contains("mermaid-boost-card"), false);
    assert.equal(block.dataset.mbObserved, undefined);
    assert.equal(global.document.body.dataset.mbTheme, undefined);
    assert.equal(global.document.body.dataset.mbHasPattern, undefined);

    // Test re-decoration after unload recaches and decorates cleanly
    plugin.decorateMermaidBlock(block);
    assert.equal(svg.dataset.mbInitialized, "true");
    assert.equal(svg.style["max-width"], "none");
    assert.equal(svg.dataset.mbOrigStyleMaxWidth, "500px");
    assert.equal(block.classList.contains("mermaid-boost-card"), true);
  } finally {
    Module._load = origLoad;
    delete global.document;
  }
});
