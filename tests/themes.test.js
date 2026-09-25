"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { THEME_GROUPS, THEMES, resolveThemeSpec } = require("../src/themes.js");

test("THEME_GROUPS and THEMES contain 7 groups and 29 themes", () => {
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

  // Verify each theme has required properties
  for (const [key, theme] of Object.entries(THEMES)) {
    assert.ok(theme.name, `Theme ${key} must have name`);
    assert.ok(theme.group, `Theme ${key} must belong to a group`);
    assert.ok(THEME_GROUPS.includes(theme.group), `Theme ${key} group ${theme.group} must be valid`);
    assert.ok(theme.light, `Theme ${key} must have light palette`);
    assert.ok(theme.light.cardBg, `Theme ${key} must have light cardBg`);
    assert.ok(theme.light.rootNode, `Theme ${key} must have light rootNode`);
    assert.ok(theme.light.edge, `Theme ${key} must have light edge`);
  }
});

test("resolveThemeSpec resolves correct palettes for light and dark modes with fallback", () => {
  // 1. Default (claude) light
  const resLight = resolveThemeSpec({ theme: "claude" }, false);
  assert.equal(resLight.themeKey, "claude");
  assert.equal(resLight.palette.cardBg, "#faf9f5");
  assert.equal(resLight.palette, resLight.themeObj.light);

  // 2. Default dark
  const resDark = resolveThemeSpec({ theme: "claude" }, true);
  assert.equal(resDark.themeKey, "claude");
  assert.equal(resDark.palette, resDark.themeObj.dark);
  assert.ok(resDark.palette.cardBg);

  // 3. Fallback when invalid theme is specified
  const resFallback = resolveThemeSpec({ theme: "unknown-nonexistent" }, false);
  assert.equal(resFallback.themeKey, "claude");
  assert.equal(resFallback.palette.cardBg, "#faf9f5");

  // 4. Legacy theme map aliases
  const resLegacy = resolveThemeSpec({ theme: "excalidraw-sketch" }, false);
  assert.equal(resLegacy.themeKey, "handcrafted");
});
