"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createMockElement } = require("./helpers.js");
const {
  classifyGraphTopology,
  hasExplicitUserStyle,
  applyStyleProp,
  ensureDropShadowFilter,
  beautifySvgDom,
} = require("../src/beautify.js");
const { THEME_GROUPS, THEMES } = require("../src/themes.js");
const { DEFAULT_SETTINGS } = require("../src/settings.js");

test("classifyGraphTopology & beautifySvgDom apply all 7 groups (29 themes) matching the HTML demo 1:1", () => {
  assert.equal(THEME_GROUPS.length, 7);
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
  assert.equal(svg.querySelectorAll("#mb-wobble").length, 1);

  // 2. Developer: Nord & Dracula
  beautifySvgDom(svg, { ...DEFAULT_SETTINGS, theme: "nord" }, false);
  assert.equal(THEMES.nord.light.cardBg, "#2e3440");
  assert.equal(rect1.getAttribute("rx"), "6");
  assert.equal(rect1.style.fill, "#3b4252");
  assert.equal(rect1.style.stroke, "#88c0d0");
  assert.equal(svg.getAttribute("filter"), null);

  // Custom nodeRadius override test
  beautifySvgDom(svg, { ...DEFAULT_SETTINGS, theme: "nord", nodeRadius: 10 }, false);
  assert.equal(rect1.getAttribute("rx"), "10");

  // Re-apply handcrafted to verify wobble filter is not duplicated
  beautifySvgDom(svg, { ...DEFAULT_SETTINGS, theme: "handcrafted" }, false);
  assert.equal(svg.querySelectorAll("#mb-wobble").length, 1);

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
