"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  parseDirectiveString,
  extractDirectivesFromText,
  resolveEffectiveSettings,
  extractDirectiveFromElement,
  parseBoolean,
  parseRadius,
  parseSize,
  parseTheme,
} = require("../src/directive.js");
const { DEFAULT_SETTINGS, SIZE_PRESETS } = require("../src/settings.js");
const { createMockElement } = require("./helpers.js");

test("Directive parser: parses individual values correctly", () => {
  assert.equal(parseTheme("blueprint"), "blueprint");
  assert.equal(parseTheme("Claude"), "claude");
  assert.equal(parseTheme("styled"), "claude"); // legacy alias
  assert.equal(parseTheme("nonexistent_theme"), null);

  assert.equal(parseSize("compact"), "compact");
  assert.equal(parseSize("Relaxed"), "relaxed");
  assert.equal(parseSize("s"), "compact");
  assert.equal(parseSize("m"), "balanced");
  assert.equal(parseSize("l"), "relaxed");
  assert.equal(parseSize("1:1"), "original");
  assert.equal(parseSize("giant"), null);

  assert.equal(parseBoolean("true"), true);
  assert.equal(parseBoolean("false"), false);
  assert.equal(parseBoolean("yes"), true);
  assert.equal(parseBoolean("no"), false);
  assert.equal(parseBoolean("1"), true);
  assert.equal(parseBoolean("0"), false);
  assert.equal(parseBoolean("on"), true);
  assert.equal(parseBoolean("off"), false);
  assert.equal(parseBoolean("maybe"), null);

  assert.equal(parseRadius("8"), 8);
  assert.equal(parseRadius("12px"), 12);
  assert.equal(parseRadius(16), 16);
  assert.equal(parseRadius("0"), 0);
  assert.equal(parseRadius("invalid"), null);
  assert.equal(parseRadius("-4"), null);
  assert.equal(parseRadius("100"), null); // exceeds max boundary 64
});

test("Directive parser: valid directive with all keys", () => {
  const input = "theme=blueprint size=relaxed collapse=false frame=true grid=false header=true radius=10px";
  const result = parseDirectiveString(input);

  assert.deepEqual(result, {
    theme: "blueprint",
    size: "relaxed",
    collapse: false,
    frame: true,
    grid: false,
    header: true,
    radius: 10,
  });
});

test("Directive parser: supports colons, commas, semicolons, and quotes", () => {
  const input = 'theme: "nord", size: \'balanced\'; collapse: 0; frame: "false", radius: 14';
  const result = parseDirectiveString(input);

  assert.deepEqual(result, {
    theme: "nord",
    size: "balanced",
    collapse: false,
    frame: false,
    radius: 14,
  });
});

test("Directive parser: partial directives only populate specified keys", () => {
  const input = "theme=dracula size=compact";
  const result = parseDirectiveString(input);

  assert.deepEqual(result, {
    theme: "dracula",
    size: "compact",
  });
  assert.equal(result.collapse, undefined);
  assert.equal(result.frame, undefined);
});

test("Directive parser: malformed and unknown directives fail safely", () => {
  // Empty or invalid tokens
  assert.deepEqual(parseDirectiveString(""), {});
  assert.deepEqual(parseDirectiveString("   "), {});
  assert.deepEqual(parseDirectiveString("???:::======"), {});

  // Unknown keys ignored, valid keys preserved
  const mixed = "unknown_key=foo anotherKey: 123 theme=builtin-forest size=giant radius=invalid collapse=true";
  const result = parseDirectiveString(mixed);

  assert.deepEqual(result, {
    theme: "builtin-forest",
    collapse: true,
  });
  assert.equal(result.size, undefined); // 'giant' is invalid
  assert.equal(result.radius, undefined); // 'invalid' is invalid
});

test("Directive extractor: extracts %% mermaid-boost comments from diagram text", () => {
  const mermaidText = `
%% mermaid-boost: theme=blueprint size=relaxed collapse=false
flowchart TD
  A --> B
`;
  const result = extractDirectivesFromText(mermaidText);
  assert.deepEqual(result, {
    theme: "blueprint",
    size: "relaxed",
    collapse: false,
  });
});

test("Directive extractor: supports short alias %%mb: and case-insensitivity", () => {
  const mermaidText = `
%%mb: theme=synthwave radius=12
sequenceDiagram
  Alice->>Bob: Hello
`;
  const result = extractDirectivesFromText(mermaidText);
  assert.deepEqual(result, {
    theme: "synthwave",
    radius: 12,
  });
});

test("Directive extractor: extracts and merges multiple directive lines and HTML comments", () => {
  const markdownText = `
<!-- mermaid-boost: frame=false grid=true -->
\`\`\`mermaid
%% mermaid-boost: theme=handcrafted
%% mb: size=original collapse=false
flowchart LR
  Start --> End
\`\`\`
`;
  const result = extractDirectivesFromText(markdownText);
  assert.deepEqual(result, {
    frame: false,
    grid: true,
    theme: "handcrafted",
    size: "original",
    collapse: false,
  });
});

test("resolveEffectiveSettings: applies overrides without mutating global settings", () => {
  const globalSettings = Object.freeze(Object.assign({}, DEFAULT_SETTINGS, {
    theme: "claude",
    sizePreset: "compact",
    autoCollapseTall: true,
    showCardFrame: true,
    showDotGrid: false,
    showHeaderBar: true,
    nodeRadius: 6,
  }));

  const overrides = {
    theme: "blueprint",
    size: "relaxed",
    collapse: false,
    frame: false,
    grid: true,
    header: false,
    radius: 16,
  };

  const effective = resolveEffectiveSettings(globalSettings, overrides);

  // Overridden properties
  assert.equal(effective.theme, "blueprint");
  assert.equal(effective.sizePreset, "relaxed");
  assert.equal(effective.baseScale, SIZE_PRESETS.relaxed.baseScale);
  assert.equal(effective.maxHeight, SIZE_PRESETS.relaxed.maxHeight);
  assert.equal(effective.maxWidth, SIZE_PRESETS.relaxed.maxWidth);
  assert.equal(effective.minReadableScale, SIZE_PRESETS.relaxed.minReadableScale);
  assert.equal(effective.autoCollapseTall, false);
  assert.equal(effective.showCardFrame, false);
  assert.equal(effective.showDotGrid, true);
  assert.equal(effective.showHeaderBar, false);
  assert.equal(effective.nodeRadius, 16);

  // Global settings remained untouched
  assert.equal(globalSettings.theme, "claude");
  assert.equal(globalSettings.sizePreset, "compact");
  assert.equal(globalSettings.autoCollapseTall, true);
});

test("resolveEffectiveSettings: partial overrides fall back to global settings", () => {
  const globalSettings = {
    theme: "nord",
    sizePreset: "balanced",
    baseScale: 0.85,
    maxHeight: 440,
    maxWidth: 740,
    minReadableScale: 0.58,
    autoCollapseTall: true,
    showCardFrame: true,
    showDotGrid: false,
    showHeaderBar: true,
    nodeRadius: 8,
  };

  // Only override theme
  const effective = resolveEffectiveSettings(globalSettings, { theme: "monochrome" });
  assert.equal(effective.theme, "monochrome");
  assert.equal(effective.sizePreset, "balanced");
  assert.equal(effective.autoCollapseTall, true);
  assert.equal(effective.nodeRadius, 8);
});

test("extractDirectiveFromElement: extracts from dataset, attributes, comments, and siblings", () => {
  // 1. Dataset attribute
  const el1 = createMockElement("div", { class: "mermaid" });
  el1.dataset.mbDirective = "theme=blueprint size=relaxed";
  assert.deepEqual(extractDirectiveFromElement(el1), {
    theme: "blueprint",
    size: "relaxed",
  });

  // 2. data-mermaid-boost attribute
  const el2 = createMockElement("div", {
    class: "mermaid",
    "data-mermaid-boost": "theme=nord collapse=false",
  });
  assert.deepEqual(extractDirectiveFromElement(el2), {
    theme: "nord",
    collapse: false,
  });

  // 3. Preceding sibling comment node
  const commentNode = {
    nodeType: 8,
    textContent: "mermaid-boost: theme=dracula radius=12",
  };
  const el3 = createMockElement("div", { class: "mermaid" });
  el3.previousSibling = commentNode;
  assert.deepEqual(extractDirectiveFromElement(el3), {
    theme: "dracula",
    radius: 12,
  });
});
