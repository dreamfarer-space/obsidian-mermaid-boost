"use strict";

const { SIZE_PRESETS, DEFAULT_SETTINGS } = require("./settings.js");
const { THEMES, LEGACY_THEME_MAP } = require("./themes.js");

const SIZE_ALIAS_MAP = {
  s: "compact",
  compact: "compact",
  m: "balanced",
  balanced: "balanced",
  l: "relaxed",
  relaxed: "relaxed",
  "1:1": "original",
  original: "original",
};

/**
 * Parses a boolean value from a string or boolean input.
 * Supports: true/false, yes/no, on/off, 1/0.
 * @param {string|boolean} val
 * @param {string} [specialTrue] - Optional token to treat as true (e.g. 'dot' for grid)
 * @param {string} [specialFalse] - Optional token to treat as false (e.g. 'none' for frame)
 * @returns {boolean|null}
 */
function parseBoolean(val, specialTrue = null, specialFalse = null) {
  if (typeof val === "boolean") return val;
  if (typeof val !== "string") return null;
  const s = val.trim().toLowerCase();
  if (
    s === "true" ||
    s === "1" ||
    s === "yes" ||
    s === "on" ||
    s === "y" ||
    (specialTrue && s === specialTrue)
  ) {
    return true;
  }
  if (
    s === "false" ||
    s === "0" ||
    s === "no" ||
    s === "off" ||
    s === "n" ||
    (specialFalse && s === specialFalse)
  ) {
    return false;
  }
  return null;
}

const THEME_ALIASES = {
  styled: "claude",
  "styled-dark": "notion-dark",
  forest: "builtin-forest",
  default: "builtin-default",
  neutral: "builtin-neutral",
  dark: "builtin-dark",
  github: "github-light",
  terminal: "terminal-crt",
  gameboy: "game-boy",
  "retro-arcade": "synthwave",
  monochrome: "mono-accent",
};

/**
 * Validates and resolves a theme name against the 29 themes and aliases.
 * @param {string} val
 * @returns {string|null}
 */
function parseTheme(val) {
  if (typeof val !== "string") return null;
  const s = val.trim().toLowerCase();
  if (THEMES[s]) return s;
  if (THEME_ALIASES[s] && THEMES[THEME_ALIASES[s]]) {
    return THEME_ALIASES[s];
  }
  if (LEGACY_THEME_MAP[s] && THEMES[LEGACY_THEME_MAP[s]]) {
    return LEGACY_THEME_MAP[s];
  }
  return null;
}

/**
 * Validates and resolves a size preset name.
 * @param {string} val
 * @returns {string|null}
 */
function parseSize(val) {
  if (typeof val !== "string") return null;
  const s = val.trim().toLowerCase();
  return SIZE_ALIAS_MAP[s] || null;
}

/**
 * Validates and resolves a corner radius value in pixels.
 * @param {string|number} val
 * @returns {number|null}
 */
function parseRadius(val) {
  if (typeof val === "number" && Number.isFinite(val) && val >= 0 && val <= 64) {
    return Math.round(val);
  }
  if (typeof val !== "string") return null;
  const s = val.trim().toLowerCase().replace(/px$/, "");
  const num = parseFloat(s);
  if (Number.isFinite(num) && num >= 0 && num <= 64) {
    return Math.round(num);
  }
  return null;
}

/**
 * Parses key-value pairs from a directive string.
 * Example: "theme=blueprint size=relaxed collapse=false radius=8"
 * Unknown keys or malformed tokens are safely ignored.
 * @param {string} rawString
 * @returns {Object} Validated override map
 */
function parseDirectiveString(rawString) {
  if (typeof rawString !== "string" || !rawString.trim()) {
    return {};
  }

  const overrides = {};
  // Matches key=value or key:value with optional single/double quotes
  const pairRegex = /([a-zA-Z0-9_-]+)\s*[:=]\s*(?:"([^"]*)"|'([^']*)'|([^\s,;]+))/g;
  let match;

  while ((match = pairRegex.exec(rawString)) !== null) {
    const rawKey = match[1];
    const rawVal = match[2] !== undefined ? match[2] : match[3] !== undefined ? match[3] : match[4];
    if (!rawKey || rawVal === undefined) continue;

    const key = rawKey.toLowerCase().trim();

    switch (key) {
      case "theme": {
        const theme = parseTheme(rawVal);
        if (theme) overrides.theme = theme;
        break;
      }
      case "size": {
        const size = parseSize(rawVal);
        if (size) overrides.size = size;
        break;
      }
      case "collapse": {
        const collapse = parseBoolean(rawVal);
        if (collapse !== null) overrides.collapse = collapse;
        break;
      }
      case "frame": {
        const frame = parseBoolean(rawVal, null, "none");
        if (frame !== null) overrides.frame = frame;
        break;
      }
      case "grid": {
        const grid = parseBoolean(rawVal, "dot", "none");
        if (grid !== null) overrides.grid = grid;
        break;
      }
      case "header": {
        const header = parseBoolean(rawVal);
        if (header !== null) overrides.header = header;
        break;
      }
      case "radius": {
        const radius = parseRadius(rawVal);
        if (radius !== null) overrides.radius = radius;
        break;
      }
      default:
        // Safely ignore unknown keys
        break;
    }
  }

  return overrides;
}

const MERMAID_COMMENT_REGEX = /^\s*%%\s*(?:mermaid-boost|mermaidboost|mb)(?::|\s)\s*(.*)$/gim;
const HTML_COMMENT_REGEX = /<!--\s*(?:mermaid-boost|mermaidboost|mb)(?::|\s)\s*(.*?)\s*-->/gis;

/**
 * Extracts and merges all Mermaid Boost directives found in markdown or diagram text.
 * Checks both %% mermaid-boost: ... and <!-- mermaid-boost: ... -->.
 * @param {string} text
 * @returns {Object} Merged validated overrides
 */
function extractDirectivesFromText(text) {
  if (typeof text !== "string" || (!text.includes("mermaid") && !text.includes("mb"))) {
    return {};
  }

  const result = {};

  // Extract from Mermaid comments (%% ...)
  const mermaidMatches = text.matchAll(MERMAID_COMMENT_REGEX);
  for (const m of mermaidMatches) {
    if (m && m[1]) {
      const parsed = parseDirectiveString(m[1]);
      Object.assign(result, parsed);
    }
  }

  // Extract from HTML/Markdown comments (<!-- ... -->)
  const htmlMatches = text.matchAll(HTML_COMMENT_REGEX);
  for (const m of htmlMatches) {
    if (m && m[1]) {
      const parsed = parseDirectiveString(m[1]);
      Object.assign(result, parsed);
    }
  }

  return result;
}

/**
 * Extracts raw Mermaid code blocks from markdown section text following Markdown fence rules.
 * Matches opening fence by character (` or ~) and minimum length (>=3), and matches closing fence
 * by the same character, at least as many characters, with only trailing whitespace allowed.
 * @param {string} sectionText - Markdown source text.
 * @returns {string[]} Array of inner code block strings.
 */
function extractMermaidCodeBlocks(sectionText) {
  if (typeof sectionText !== "string" || !sectionText.includes("mermaid")) {
    return [];
  }
  const lines = sectionText.split(/\r?\n/);
  const blocks = [];
  let inBlock = false;
  let fenceChar = "";
  let fenceLength = 0;
  let blockLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!inBlock) {
      const openMatch = line.match(/^[ \t]*(`{3,}|~{3,})[ \t]*mermaid\b/i);
      if (openMatch) {
        inBlock = true;
        fenceChar = openMatch[1][0];
        fenceLength = openMatch[1].length;
        blockLines = [];
      }
    } else {
      const trimmed = line.trim();
      if (
        trimmed.length >= fenceLength &&
        trimmed.startsWith(fenceChar.repeat(fenceLength)) &&
        !trimmed.split("").some((ch) => ch !== fenceChar)
      ) {
        inBlock = false;
        blocks.push(blockLines.join("\n"));
        blockLines = [];
      } else {
        blockLines.push(line);
      }
    }
  }

  return blocks;
}

/**
 * Locates code block text in active CodeMirror 6 editor when in Live Preview.
 * @param {HTMLElement} block
 * @param {Object} app - Obsidian app instance
 * @returns {string|null}
 */
function findDiagramTextFromEditor(block, app) {
  if (!block || !app || !app.workspace) return null;
  const activeView =
    typeof app.workspace.getActiveViewOfType === "function"
      ? app.workspace.getActiveViewOfType(app.workspace.MarkdownView || Object)
      : null;
  const leaves =
    typeof app.workspace.getLeavesOfType === "function"
      ? app.workspace.getLeavesOfType("markdown")
      : [];
  const candidates = activeView ? [activeView, ...leaves] : leaves;

  for (const leaf of candidates) {
    if (!leaf) continue;
    const editor = leaf.editor || (leaf.view && leaf.view.editor);
    if (!editor) continue;
    const cm = editor.cm;
    if (cm && typeof cm.posAtDOM === "function" && cm.state && cm.state.doc) {
      if (cm.dom && typeof cm.dom.contains === "function" && !cm.dom.contains(block)) {
        continue;
      }
      try {
        const pos = cm.posAtDOM(block);
        if (Number.isFinite(pos) && pos >= 0) {
          const doc = cm.state.doc;
          const line = doc.lineAt(pos);
          let startLine = line.number;
          while (startLine >= 1) {
            const l = doc.line(startLine);
            if (l.text.trim().startsWith("```mermaid")) break;
            if (startLine < line.number && l.text.trim().startsWith("```")) break;
            startLine--;
          }
          if (startLine >= 1 && doc.line(startLine).text.trim().startsWith("```mermaid")) {
            let endLine = startLine + 1;
            while (endLine <= doc.lines) {
              const l = doc.line(endLine);
              if (l.text.trim().startsWith("```")) break;
              endLine++;
            }
            return doc.sliceString(doc.line(startLine).from, doc.line(Math.min(doc.lines, endLine)).to);
          }
        }
      } catch (_err) {
        // Continue checking other candidate leaves if posAtDOM fails for this editor
        continue;
      }
    }
  }
  return null;
}

/**
 * Inspects a DOM block element, its datasets, and surrounding context to extract directives.
 * @param {HTMLElement} block
 * @param {Object} [app] - Optional Obsidian App instance
 * @returns {Object} Parsed overrides map
 */
function extractDirectiveFromElement(block, app = null) {
  if (!block) return {};

  // 1. Return already cached overrides if present
  if (block._mbDirectives && typeof block._mbDirectives === "object") {
    return block._mbDirectives;
  }

  const overrides = {};

  // 1.5. Inherit directives from ancestor container if present (e.g. section el or .block-language-mermaid)
  if (typeof block.closest === "function") {
    const ancestor = block.closest("[data-mb-directives], [data-mermaid-boost], .block-language-mermaid");
    if (ancestor && ancestor !== block) {
      if (ancestor._mbDirectives && typeof ancestor._mbDirectives === "object") {
        Object.assign(overrides, ancestor._mbDirectives);
      } else if (ancestor.dataset && ancestor.dataset.mbDirectives) {
        try {
          Object.assign(overrides, JSON.parse(ancestor.dataset.mbDirectives));
        } catch (_e) {}
      }
    }
  }

  // 2. Direct dataset or attribute directives
  const rawDirective =
    (block.dataset && (block.dataset.mbDirective || block.dataset.mbDirectives)) ||
    (typeof block.getAttribute === "function" &&
      (block.getAttribute("data-mermaid-boost") ||
        block.getAttribute("data-mb-directive") ||
        block.getAttribute("data-mb-directives")));

  if (rawDirective) {
    try {
      if (rawDirective.trim().startsWith("{")) {
        const json = JSON.parse(rawDirective);
        Object.assign(overrides, parseDirectiveString(
          Object.entries(json)
            .map(([k, v]) => `${k}=${v}`)
            .join(" ")
        ));
      } else {
        Object.assign(overrides, parseDirectiveString(rawDirective));
      }
    } catch (_err) {
      Object.assign(overrides, parseDirectiveString(rawDirective));
    }
  }

  // 3. Child comments (e.g. <!-- mermaid-boost: ... -->)
  if (block.childNodes && block.childNodes.length > 0) {
    for (let i = 0; i < block.childNodes.length; i++) {
      const child = block.childNodes[i];
      if (child && child.nodeType === 8 && child.textContent) {
        Object.assign(overrides, extractDirectivesFromText(`<!-- ${child.textContent} -->`));
      }
    }
  }

  // 4. Preceding sibling comments
  let prev = block.previousSibling;
  let hops = 0;
  while (prev && hops < 3) {
    if (prev.nodeType === 8 && prev.textContent) {
      Object.assign(overrides, extractDirectivesFromText(`<!-- ${prev.textContent} -->`));
    } else if (
      prev.nodeType === 1 &&
      prev.getAttribute &&
      (prev.getAttribute("data-mermaid-boost") || prev.getAttribute("data-mb-directive"))
    ) {
      Object.assign(overrides, parseDirectiveString(
        prev.getAttribute("data-mermaid-boost") || prev.getAttribute("data-mb-directive")
      ));
    }
    prev = prev.previousSibling;
    hops++;
  }

  // 5. Parent's preceding sibling comments (e.g. adjacent to .block-language-mermaid)
  if (block.parentElement) {
    let parentPrev = block.parentElement.previousSibling;
    let parentHops = 0;
    while (parentPrev && parentHops < 2) {
      if (parentPrev.nodeType === 8 && parentPrev.textContent) {
        Object.assign(overrides, extractDirectivesFromText(`<!-- ${parentPrev.textContent} -->`));
      }
      parentPrev = parentPrev.previousSibling;
      parentHops++;
    }
  }

  // 6. Inspect block textContent if it still has raw mermaid code
  if (
    block.textContent &&
    (block.textContent.includes("%%") || block.textContent.includes("mermaid-boost") || block.textContent.includes("mb:"))
  ) {
    Object.assign(overrides, extractDirectivesFromText(block.textContent));
  }

  // 7. Live Preview CM6 document inspection
  if (app) {
    const editorText = findDiagramTextFromEditor(block, app);
    if (editorText) {
      Object.assign(overrides, extractDirectivesFromText(editorText));
    }
  }

  // Cache on the element
  block._mbDirectives = overrides;
  if (block.dataset && Object.keys(overrides).length > 0) {
    block.dataset.mbDirectives = JSON.stringify(overrides);
  }

  return overrides;
}

/**
 * Returns a new settings object combining global settings with per-diagram overrides.
 * Guarantees that globalSettings is never mutated.
 * @param {Object} globalSettings
 * @param {Object} overrides
 * @returns {Object} Effective settings object
 */
function resolveEffectiveSettings(globalSettings, overrides = {}) {
  const effective = Object.assign({}, DEFAULT_SETTINGS, globalSettings);
  if (!overrides || typeof overrides !== "object") {
    return effective;
  }

  if (overrides.theme) {
    effective.theme = overrides.theme;
  }

  if (overrides.size) {
    effective.sizePreset = overrides.size;
    const preset = SIZE_PRESETS[overrides.size];
    if (preset) {
      effective.baseScale = preset.baseScale;
      effective.maxHeight = preset.maxHeight;
      effective.maxWidth = preset.maxWidth;
      effective.minReadableScale = preset.minReadableScale;
    }
  }

  if (typeof overrides.collapse === "boolean") {
    effective.autoCollapseTall = overrides.collapse;
  }

  if (typeof overrides.frame === "boolean") {
    effective.showCardFrame = overrides.frame;
  }

  if (typeof overrides.grid === "boolean") {
    effective.showDotGrid = overrides.grid;
  }

  if (typeof overrides.header === "boolean") {
    effective.showHeaderBar = overrides.header;
  }

  if (Number.isFinite(overrides.radius)) {
    effective.nodeRadius = overrides.radius;
  }

  return effective;
}

module.exports = {
  SIZE_ALIAS_MAP,
  parseBoolean,
  parseTheme,
  parseSize,
  parseRadius,
  parseDirectiveString,
  extractDirectivesFromText,
  extractMermaidCodeBlocks,
  findDiagramTextFromEditor,
  extractDirectiveFromElement,
  resolveEffectiveSettings,
};
