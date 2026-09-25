"use strict";

/**
 * Mermaid Boost — Backward-compatible facade re-exporting canonical modular sources from src/
 */

const { SIZE_PRESETS, DEFAULT_SETTINGS } = require("./src/settings.js");
const {
  HAND,
  MONO,
  SANS,
  SERIF,
  mkTheme,
  THEME_GROUPS,
  THEMES,
  resolveThemeSpec,
} = require("./src/themes.js");
const {
  DIAGRAM_TYPE_LABELS,
  extractSvgNaturalSize,
  detectDiagramType,
  tightenPieViewBox,
  computeSmartDiagramSize,
} = require("./src/sizing.js");
const {
  hasExplicitUserStyle,
  applyStyleProp,
  classifyGraphTopology,
  ensureDropShadowFilter,
  beautifySvgDom,
} = require("./src/beautify.js");

module.exports = {
  SIZE_PRESETS,
  DEFAULT_SETTINGS,
  HAND,
  MONO,
  SANS,
  SERIF,
  mkTheme,
  THEME_GROUPS,
  THEMES,
  DIAGRAM_TYPE_LABELS,
  extractSvgNaturalSize,
  detectDiagramType,
  tightenPieViewBox,
  computeSmartDiagramSize,
  hasExplicitUserStyle,
  applyStyleProp,
  classifyGraphTopology,
  resolveThemeSpec,
  ensureDropShadowFilter,
  beautifySvgDom,
};
