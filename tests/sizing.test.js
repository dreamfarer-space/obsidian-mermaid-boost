"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createMockElement } = require("./helpers.js");
const {
  extractSvgNaturalSize,
  detectDiagramType,
  tightenPieViewBox,
  computeSmartDiagramSize,
} = require("../src/sizing.js");
const { DEFAULT_SETTINGS } = require("../src/settings.js");

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

  // 5. Ultra-narrow pane/mobile split (width 120px) -> constrains down properly without overflow
  const sizeUltraNarrow = computeSmartDiagramSize(
    { width: 640, height: 260 },
    { type: "flowchart", orientation: "horizontal" },
    DEFAULT_SETTINGS,
    120
  );
  assert.ok(sizeUltraNarrow.width <= 88, `Expected width <= 88 (120-32), got ${sizeUltraNarrow.width}`);
});
