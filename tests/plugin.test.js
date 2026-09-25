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
