"use strict";

/**
 * Mermaid Boost — Theme Palettes & Style Specifications (7 groups, 29 themes)
 */

const HAND =
  '"Segoe Print", "Bradley Hand", "Chalkboard SE", "Comic Sans MS", "LXGW WenKai", cursive, sans-serif';
const MONO = '"Courier New", Courier, monospace';
const SANS = '-apple-system, "Segoe UI", Helvetica, Arial, sans-serif';
const SERIF =
  'Georgia, "Times New Roman", "Noto Serif SC", "Source Han Serif SC", serif';

function mkTheme(group, title, note, o) {
  const cls = o.cls || "";
  const defaultRadius = cls.includes("round-lg") ? 12 : cls.includes("round") ? 6 : 0;
  const wobble = cls.includes("wobble");
  let svgFilter = "none";
  if (wobble) {
    svgFilter = "url(#mb-wobble)";
  } else if (cls.includes("glow-pink")) {
    svgFilter = "drop-shadow(0 0 4px #ff2e97)";
  } else if (cls.includes("glow-violet")) {
    svgFilter = "drop-shadow(0 0 6px rgba(94,106,210,.55))";
  } else if (cls.includes("glow")) {
    svgFilter = `drop-shadow(0 0 3px ${o.text || "#33ff66"})`;
  }

  const font = o.font || SANS;
  const strokeWidth = o.strokeWidth || "1.5px";
  const nodeStrokeWidth = o.nodeStrokeWidth || strokeWidth;
  const edgeStrokeWidth = o.edgeStrokeWidth || strokeWidth;

  const nodeCell = {
    fill: o.node,
    stroke: o.border,
    text: o.text,
    strokeWidth: nodeStrokeWidth,
  };
  const secondCell = {
    fill: o.second || o.node,
    stroke: o.border,
    text: o.text,
    strokeWidth: nodeStrokeWidth,
  };

  const palette = {
    cardBg: o.bg,
    cardFg: o.text,
    cardBorder: "rgba(128, 128, 128, 0.3)",
    gridDot: "rgba(128, 128, 128, 0.16)",
    rootNode: nodeCell,
    leafNode: nodeCell,
    sectionPalettes: [nodeCell, secondCell],
    detailPalettes: [nodeCell, nodeCell],
    branchPalettes: [nodeCell, secondCell],
    actor: { fill: o.node, stroke: o.border, text: o.text },
    note: {
      fill: o.note || o.node,
      stroke: o.noteBorder || o.border,
      text: o.noteText || o.text,
    },
    cluster: {
      fill: o.second || o.node,
      stroke: o.border,
      text: o.text,
    },
    edge: {
      stroke: o.line,
      labelBg: o.elbl || o.bg,
      labelBorder: o.border,
      labelText: o.text,
      strokeWidth: edgeStrokeWidth,
    },
    nodeMap: o.nodeMap || null,
    nodeCycle: o.nodeCycle || null,
    edgeCycle: o.edgeCycle || null,
    pieColors: o.pieColors || [
      o.border,
      o.node,
      o.second || o.node,
      o.third || o.bg,
      o.note || o.node,
      o.line,
      o.noteBorder || o.border,
      o.text,
    ],
  };

  return {
    group,
    title,
    note,
    name: `[${group}] ${title} — ${note}`,
    defaultRadius,
    strokeWidth,
    nodeStrokeWidth,
    edgeStrokeWidth,
    wobble,
    svgFilter,
    cls,
    cardBgImage: o.img || "none",
    cardBgSize: o.size || "auto",
    fontFamily: font,
    light: palette,
    dark: palette,
  };
}

const THEME_GROUPS = [
  "Styled",
  "Developer",
  "Paper & print",
  "Retro & playful",
  "Brand-inspired",
  "Functional",
  "Built-in",
];

const THEMES = {
  // ==================== 1. Styled ====================
  claude: mkTheme("Styled", "Claude", "cream, clay, serif", {
    bg: "#faf9f5",
    node: "#f0eee6",
    border: "#c6613f",
    line: "#87867f",
    text: "#141413",
    second: "#e8e6dc",
    note: "#f7e3d9",
    font: SERIF,
    cls: "round-lg",
  }),
  notion: mkTheme("Styled", "Notion", "clean, soft grey", {
    bg: "#ffffff",
    node: "#f7f6f3",
    border: "#dfdedb",
    line: "#9b9a97",
    text: "#37352f",
    second: "#e7f3f8",
    note: "#fbf3db",
    noteBorder: "#e9e0c0",
    cls: "round",
  }),
  "notion-dark": mkTheme("Styled", "Notion dark", "charcoal", {
    bg: "#191919",
    node: "#252525",
    border: "#3b3b3b",
    line: "#7f7f7f",
    text: "#e6e6e6",
    second: "#2f3438",
    note: "#3a3320",
    noteBorder: "#5a4f2c",
    noteText: "#f0e6c8",
    cls: "round",
  }),
  handcrafted: mkTheme("Styled", "Handcrafted", "paper, marker, wobbly lines", {
    bg: "#fdf6e3",
    node: "#fff3b0",
    border: "#2b2b2b",
    line: "#2b2b2b",
    text: "#2b2b2b",
    second: "#cdeac0",
    third: "#ffd6d6",
    note: "#cdeac0",
    font: HAND,
    cls: "wobble round-lg",
  }),

  // ==================== 2. Developer ====================
  nord: mkTheme("Developer", "Nord", "icy blue-grey", {
    bg: "#2e3440",
    node: "#3b4252",
    border: "#88c0d0",
    line: "#81a1c1",
    text: "#eceff4",
    second: "#434c5e",
    note: "#4c566a",
    noteBorder: "#81a1c1",
    cls: "round",
  }),
  dracula: mkTheme("Developer", "Dracula", "purple and pink", {
    bg: "#282a36",
    node: "#44475a",
    border: "#bd93f9",
    line: "#ff79c6",
    text: "#f8f8f2",
    second: "#3a3c4e",
    note: "#3a3c4e",
    noteBorder: "#6272a4",
    cls: "round",
  }),
  solarized: mkTheme("Developer", "Solarized", "warm beige, teal", {
    bg: "#fdf6e3",
    node: "#eee8d5",
    border: "#268bd2",
    line: "#586e75",
    text: "#586e75",
    second: "#e6dfc8",
    note: "#f5e9c0",
    noteBorder: "#b58900",
    cls: "round",
  }),
  gruvbox: mkTheme("Developer", "Gruvbox", "retro earthy dark", {
    bg: "#282828",
    node: "#3c3836",
    border: "#fabd2f",
    line: "#a89984",
    text: "#ebdbb2",
    second: "#504945",
    note: "#504945",
    noteBorder: "#d79921",
    cls: "round",
  }),

  // ==================== 3. Paper & print ====================
  blueprint: mkTheme("Paper & print", "Blueprint", "white on blue, grid", {
    bg: "#0b3d91",
    node: "#0e4aa8",
    border: "#ffffff",
    line: "#cfe3ff",
    text: "#ffffff",
    second: "#1156bd",
    note: "#1156bd",
    font: MONO,
    img: "linear-gradient(rgba(255,255,255,.13) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.13) 1px, transparent 1px)",
    size: "20px 20px",
  }),
  newspaper: mkTheme("Paper & print", "Newspaper", "ink on newsprint", {
    bg: "#f2efe8",
    node: "#f2efe8",
    border: "#111111",
    line: "#111111",
    text: "#111111",
    second: "#e4e0d6",
    note: "#e4e0d6",
    font: SERIF,
  }),
  academic: mkTheme("Paper & print", "Academic", "greyscale for papers", {
    bg: "#ffffff",
    node: "#efefef",
    border: "#333333",
    line: "#555555",
    text: "#000000",
    second: "#dddddd",
    note: "#f7f7f7",
    font: '"Computer Modern", "Times New Roman", serif',
  }),
  "kraft-paper": mkTheme("Paper & print", "Kraft paper", "brown stock, stamped", {
    bg: "#c9a97a",
    node: "#e2c99b",
    border: "#4a3520",
    line: "#4a3520",
    text: "#3b2a1a",
    second: "#d8bb88",
    note: "#ead7ae",
    font: MONO,
    cls: "round",
  }),

  // ==================== 4. Retro & playful ====================
  chalkboard: mkTheme("Retro & playful", "Chalkboard", "chalk on green", {
    bg: "#2f3e37",
    node: "#38493f",
    border: "#f5f5f0",
    line: "#f5f5f0",
    text: "#f5f5f0",
    second: "#44574c",
    note: "#44574c",
    font: HAND,
    cls: "wobble round-lg",
  }),
  "terminal-crt": mkTheme("Retro & playful", "Terminal / CRT", "phosphor green", {
    bg: "#050805",
    node: "#0a140a",
    border: "#33ff66",
    line: "#33ff66",
    text: "#33ff66",
    second: "#0f200f",
    note: "#0f200f",
    font: MONO,
    cls: "glow",
  }),
  "game-boy": mkTheme("Retro & playful", "Game Boy", "four greens", {
    bg: "#9bbc0f",
    node: "#8bac0f",
    border: "#0f380f",
    line: "#0f380f",
    text: "#0f380f",
    second: "#306230",
    note: "#306230",
    noteText: "#9bbc0f",
    font: MONO,
  }),
  synthwave: mkTheme("Retro & playful", "Synthwave", "neon on purple", {
    bg: "#1a0b2e",
    node: "#2b1055",
    border: "#ff2e97",
    line: "#00f0ff",
    text: "#f8e8ff",
    second: "#3d1a78",
    note: "#3a1a6e",
    noteBorder: "#00f0ff",
    font: '"Trebuchet MS", sans-serif',
    cls: "glow-pink round",
  }),
  "sticky-notes": mkTheme("Retro & playful", "Sticky notes", "cork board", {
    bg: "#c89f6b",
    node: "#fff176",
    border: "#e0c800",
    line: "#4a3520",
    text: "#2b2b2b",
    second: "#ffb3c7",
    note: "#ffb3c7",
    noteBorder: "#e58fa6",
    font: HAND,
    img: "radial-gradient(rgba(0,0,0,.14) 1px, transparent 1.6px)",
    size: "9px 9px",
    nodeMap: {
      A: { fill: "#fff176", stroke: "#e0c800", text: "#2b2b2b" },
      C: { fill: "#fff176", stroke: "#e0c800", text: "#2b2b2b" },
      B: { fill: "#ffb3c7", stroke: "#e58fa6", text: "#2b2b2b" },
      E: { fill: "#ffb3c7", stroke: "#e58fa6", text: "#2b2b2b" },
      D: { fill: "#b9f6a4", stroke: "#7ec46a", text: "#2b2b2b" },
      F: { fill: "#b9f6a4", stroke: "#7ec46a", text: "#2b2b2b" },
    },
    nodeCycle: [
      { fill: "#fff176", stroke: "#e0c800", text: "#2b2b2b" },
      { fill: "#ffb3c7", stroke: "#e58fa6", text: "#2b2b2b" },
      { fill: "#fff176", stroke: "#e0c800", text: "#2b2b2b" },
      { fill: "#b9f6a4", stroke: "#7ec46a", text: "#2b2b2b" },
      { fill: "#ffb3c7", stroke: "#e58fa6", text: "#2b2b2b" },
      { fill: "#b9f6a4", stroke: "#7ec46a", text: "#2b2b2b" },
    ],
  }),

  // ==================== 5. Brand-inspired ====================
  "github-light": mkTheme("Brand-inspired", "GitHub light", "white, grey, green", {
    bg: "#ffffff",
    node: "#f6f8fa",
    border: "#d0d7de",
    line: "#57606a",
    text: "#1f2328",
    second: "#ddf4ff",
    note: "#dafbe1",
    noteBorder: "#1a7f37",
    cls: "round",
  }),
  "github-dark": mkTheme("Brand-inspired", "GitHub dark", "dimmed dark", {
    bg: "#0d1117",
    node: "#161b22",
    border: "#3d444d",
    line: "#8b949e",
    text: "#e6edf3",
    second: "#1f2937",
    note: "#0f2d1a",
    noteBorder: "#238636",
    cls: "round",
  }),
  linear: mkTheme("Brand-inspired", "Linear", "near-black, violet glow", {
    bg: "#0b0b0f",
    node: "#17171c",
    border: "#5e6ad2",
    line: "#8a8f98",
    text: "#f7f8f8",
    second: "#1e1f3a",
    note: "#1e1f3a",
    noteBorder: "#5e6ad2",
    cls: "glow-violet round",
  }),
  stripe: mkTheme("Brand-inspired", "Stripe", "white, indigo", {
    bg: "#ffffff",
    node: "#f6f9fc",
    border: "#635bff",
    line: "#8898aa",
    text: "#0a2540",
    second: "#e6fbff",
    note: "#e6fbff",
    noteBorder: "#00d4ff",
    font: '"Helvetica Neue", "Segoe UI", Arial, sans-serif',
    cls: "round-lg",
  }),
  "metro-map": mkTheme("Brand-inspired", "Metro map", "bold transit lines", {
    bg: "#ffffff",
    node: "#ffffff",
    border: "#111111",
    line: "#0057b8",
    text: "#111111",
    note: "#eef4ff",
    noteBorder: "#0057b8",
    font: '"Helvetica Neue", Arial, sans-serif',
    nodeStrokeWidth: "4px",
    edgeStrokeWidth: "6px",
    edgeCycle: [
      { stroke: "#e63946", strokeWidth: "6px" },
      { stroke: "#e63946", strokeWidth: "6px" },
      { stroke: "#0057b8", strokeWidth: "6px" },
      { stroke: "#e63946", strokeWidth: "6px" },
      { stroke: "#0057b8", strokeWidth: "6px" },
      { stroke: "#00a651", strokeWidth: "6px" },
    ],
  }),

  // ==================== 6. Functional ====================
  "high-contrast": mkTheme("Functional", "High contrast", "black and white, thick", {
    bg: "#ffffff",
    node: "#ffffff",
    border: "#000000",
    line: "#000000",
    text: "#000000",
    second: "#ffffff",
    note: "#ffff00",
    font: "Arial, Helvetica, sans-serif",
    strokeWidth: "3px",
    nodeStrokeWidth: "3px",
    edgeStrokeWidth: "3px",
  }),
  "colorblind-safe": mkTheme("Functional", "Colorblind-safe", "Okabe-Ito palette", {
    bg: "#ffffff",
    node: "#d6ecf8",
    border: "#0072B2",
    line: "#333333",
    text: "#111111",
    second: "#fbe3b0",
    note: "#f9f0a6",
    noteBorder: "#B8A800",
    cls: "round",
    nodeStrokeWidth: "2px",
    nodeMap: {
      A: { fill: "#cfe8f7", stroke: "#0072B2", text: "#111111", strokeWidth: "2px" },
      B: { fill: "#fbe3b0", stroke: "#E69F00", text: "#111111", strokeWidth: "2px" },
      C: { fill: "#b8e6d6", stroke: "#009E73", text: "#111111", strokeWidth: "2px" },
      D: { fill: "#f3d3e3", stroke: "#CC79A7", text: "#111111", strokeWidth: "2px" },
      E: { fill: "#f9f0a6", stroke: "#B8A800", text: "#111111", strokeWidth: "2px" },
      F: { fill: "#f5c9b0", stroke: "#D55E00", text: "#111111", strokeWidth: "2px" },
    },
    nodeCycle: [
      { fill: "#cfe8f7", stroke: "#0072B2", text: "#111111", strokeWidth: "2px" },
      { fill: "#fbe3b0", stroke: "#E69F00", text: "#111111", strokeWidth: "2px" },
      { fill: "#b8e6d6", stroke: "#009E73", text: "#111111", strokeWidth: "2px" },
      { fill: "#f3d3e3", stroke: "#CC79A7", text: "#111111", strokeWidth: "2px" },
      { fill: "#f9f0a6", stroke: "#B8A800", text: "#111111", strokeWidth: "2px" },
      { fill: "#f5c9b0", stroke: "#D55E00", text: "#111111", strokeWidth: "2px" },
    ],
  }),
  "mono-accent": mkTheme("Functional", "Mono + one accent", "grey, key path in orange", {
    bg: "#ffffff",
    node: "#f4f4f5",
    border: "#a1a1aa",
    line: "#a1a1aa",
    text: "#27272a",
    second: "#e4e4e7",
    note: "#fff0e6",
    noteBorder: "#e8590c",
    cls: "round",
    nodeMap: {
      A: { fill: "#fff0e6", stroke: "#e8590c", text: "#27272a", strokeWidth: "2px" },
      B: { fill: "#fff0e6", stroke: "#e8590c", text: "#27272a", strokeWidth: "2px" },
      C: { fill: "#fff0e6", stroke: "#e8590c", text: "#27272a", strokeWidth: "2px" },
      E: { fill: "#fff0e6", stroke: "#e8590c", text: "#27272a", strokeWidth: "2px" },
    },
    nodeCycle: [
      { fill: "#fff0e6", stroke: "#e8590c", text: "#27272a", strokeWidth: "2px" },
      { fill: "#fff0e6", stroke: "#e8590c", text: "#27272a", strokeWidth: "2px" },
      { fill: "#fff0e6", stroke: "#e8590c", text: "#27272a", strokeWidth: "2px" },
      { fill: "#f4f4f5", stroke: "#a1a1aa", text: "#27272a", strokeWidth: "1.5px" },
      { fill: "#fff0e6", stroke: "#e8590c", text: "#27272a", strokeWidth: "2px" },
      { fill: "#f4f4f5", stroke: "#a1a1aa", text: "#27272a", strokeWidth: "1.5px" },
    ],
    edgeCycle: [
      { stroke: "#e8590c", strokeWidth: "3px" },
      { stroke: "#e8590c", strokeWidth: "3px" },
      { stroke: "#a1a1aa", strokeWidth: "1.5px" },
      { stroke: "#e8590c", strokeWidth: "3px" },
      { stroke: "#a1a1aa", strokeWidth: "1.5px" },
      { stroke: "#a1a1aa", strokeWidth: "1.5px" },
    ],
  }),

  // ==================== 7. Built-in ====================
  "builtin-default": mkTheme("Built-in", "default", "built-in", {
    bg: "#ffffff",
    node: "#ECECFF",
    border: "#9370DB",
    line: "#333333",
    text: "#1c1e21",
    second: "#ffffde",
    note: "#fff5ad",
    noteBorder: "#aaaa33",
    font: SANS,
  }),
  "builtin-neutral": mkTheme("Built-in", "neutral", "print-friendly", {
    bg: "#ffffff",
    node: "#eeeeee",
    border: "#999999",
    line: "#666666",
    text: "#1c1e21",
    second: "#f9f9f9",
    note: "#f5f5f5",
    noteBorder: "#cccccc",
    font: SANS,
  }),
  "builtin-dark": mkTheme("Built-in", "dark", "built-in", {
    bg: "#1e1f22",
    node: "#1f2020",
    border: "#81B1DB",
    line: "#d3d3d3",
    text: "#e8e8e8",
    second: "#2c2d30",
    note: "#2c2d30",
    noteBorder: "#81B1DB",
    font: SANS,
  }),
  "builtin-forest": mkTheme("Built-in", "forest", "built-in", {
    bg: "#ffffff",
    node: "#cde498",
    border: "#13540c",
    line: "#000000",
    text: "#1c1e21",
    second: "#cdffb2",
    note: "#fff5ad",
    noteBorder: "#6eaa49",
    font: SANS,
  }),
};

const LEGACY_THEME_MAP = {
  "claude-anthropic": "claude",
  "notion-pastel": "notion",
  "github-tailwind": "github-light",
  "excalidraw-sketch": "handcrafted",
  "swiss-mono": "high-contrast",
  "custom-obsidian": "claude",
};

/**
 * Returns the next theme key in the 29-theme cycle.
 */
function nextThemeKey(currentTheme) {
  const keys = Object.keys(THEMES);
  const resolved = LEGACY_THEME_MAP[currentTheme] || currentTheme;
  const currentIndex = keys.indexOf(resolved);
  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % keys.length : 0;
  return keys[nextIndex] || "claude";
}

/**
 * Resolves the active theme specification from the 29 themes across 7 groups.
 */
function resolveThemeSpec(settings = {}, isDark = false) {
  const rawTheme = (settings && settings.theme) || "claude";
  const resolvedKey = LEGACY_THEME_MAP[rawTheme] || rawTheme;
  const baseTheme = THEMES[resolvedKey] || THEMES.claude;

  return {
    themeKey: THEMES[resolvedKey] ? resolvedKey : "claude",
    themeObj: baseTheme,
    palette: isDark ? baseTheme.dark : baseTheme.light,
  };
}

module.exports = {
  HAND,
  MONO,
  SANS,
  SERIF,
  mkTheme,
  THEME_GROUPS,
  THEMES,
  LEGACY_THEME_MAP,
  nextThemeKey,
  resolveThemeSpec,
};
