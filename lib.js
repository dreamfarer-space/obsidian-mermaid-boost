"use strict";

/**
 * Mermaid Boost — Core Sizing, Theme Palettes & SVG Beautification Engine
 * Supports all 7 theme groups (29 themes) matching the reference HTML showcase 1:1:
 * 1. Styled (Claude, Notion, Notion dark, Handcrafted)
 * 2. Developer (Nord, Dracula, Solarized, Gruvbox)
 * 3. Paper & print (Blueprint, Newspaper, Academic, Kraft paper)
 * 4. Retro & playful (Chalkboard, Terminal / CRT, Game Boy, Synthwave, Sticky notes)
 * 5. Brand-inspired (GitHub light, GitHub dark, Linear, Stripe, Metro map)
 * 6. Functional (High contrast, Colorblind-safe, Mono + one accent)
 * 7. Built-in (default, neutral, dark, forest)
 */

const SIZE_PRESETS = {
  compact: {
    id: "compact",
    label: "Compact",
    shortLabel: "S",
    baseScale: 0.72,
    maxHeight: 320,
    maxWidth: 620,
    minReadableScale: 0.52,
  },
  balanced: {
    id: "balanced",
    label: "Balanced",
    shortLabel: "M",
    baseScale: 0.85,
    maxHeight: 440,
    maxWidth: 740,
    minReadableScale: 0.58,
  },
  relaxed: {
    id: "relaxed",
    label: "Relaxed",
    shortLabel: "L",
    baseScale: 1.0,
    maxHeight: 580,
    maxWidth: 900,
    minReadableScale: 0.65,
  },
  original: {
    id: "original",
    label: "Original",
    shortLabel: "1:1",
    baseScale: 1.0,
    maxHeight: 2400,
    maxWidth: 1600,
    minReadableScale: 1.0,
  },
};

const DEFAULT_SETTINGS = {
  sizePreset: "compact",
  baseScale: 0.72,
  maxHeight: 320,
  maxWidth: 620,
  minReadableScale: 0.52,
  theme: "claude",
  nodeRadius: 12,
  multiToneNodes: false,
  trimPiePadding: true,
  showCardFrame: true,
  showDotGrid: false,
  showHeaderBar: true,
  autoCollapseTall: true,
  doubleClickFullscreen: true,
  zoomSensitivity: 1.0,
};

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

const DIAGRAM_TYPE_LABELS = {
  flowchart: "Flowchart",
  pie: "Pie",
  gantt: "Gantt",
  sequence: "Sequence",
  state: "State",
  mindmap: "Mindmap",
  class: "Class",
  er: "ER",
  other: "Mermaid",
};

/**
 * Extracts natural width/height/x/y from an SVG element's viewBox or width/height attributes.
 */
function extractSvgNaturalSize(svg) {
  if (!svg) return null;

  if (svg.dataset && svg.dataset.mbNaturalWidth && svg.dataset.mbNaturalHeight) {
    const w = parseFloat(svg.dataset.mbNaturalWidth);
    const h = parseFloat(svg.dataset.mbNaturalHeight);
    const x = parseFloat(svg.dataset.mbNaturalX || "0");
    const y = parseFloat(svg.dataset.mbNaturalY || "0");
    if (w > 0 && h > 0) {
      return { x, y, width: w, height: h };
    }
  }

  const viewBoxAttr =
    typeof svg.getAttribute === "function" ? svg.getAttribute("viewBox") : null;
  if (viewBoxAttr) {
    const parts = viewBoxAttr
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    if (
      parts.length === 4 &&
      parts.every((n) => Number.isFinite(n)) &&
      parts[2] > 0 &&
      parts[3] > 0
    ) {
      return {
        x: parts[0],
        y: parts[1],
        width: parts[2],
        height: parts[3],
      };
    }
  }

  if (svg.viewBox && svg.viewBox.baseVal) {
    const vb = svg.viewBox.baseVal;
    if (vb.width > 0 && vb.height > 0) {
      return {
        x: vb.x || 0,
        y: vb.y || 0,
        width: vb.width,
        height: vb.height,
      };
    }
  }

  const attrW = parseFloat(
    (typeof svg.getAttribute === "function" && svg.getAttribute("width")) || ""
  );
  const attrH = parseFloat(
    (typeof svg.getAttribute === "function" && svg.getAttribute("height")) || ""
  );
  if (attrW > 0 && attrH > 0) {
    return { x: 0, y: 0, width: attrW, height: attrH };
  }

  const styleMaxW =
    svg.style && svg.style.maxWidth ? parseFloat(svg.style.maxWidth) : NaN;
  if (Number.isFinite(styleMaxW) && styleMaxW > 0) {
    return { x: 0, y: 0, width: styleMaxW, height: Math.round(styleMaxW * 0.65) };
  }

  return null;
}

/**
 * Detects the Mermaid diagram type and orientation from SVG DOM attributes and elements.
 */
function detectDiagramType(svg, naturalSize) {
  if (!svg) {
    return { type: "other", orientation: "horizontal", label: DIAGRAM_TYPE_LABELS.other };
  }

  const role = (
    (typeof svg.getAttribute === "function" &&
      (svg.getAttribute("aria-roledescription") || svg.getAttribute("class"))) ||
    ""
  ).toLowerCase();

  const q = (sel) =>
    typeof svg.querySelector === "function" ? svg.querySelector(sel) : null;

  let type = "other";
  if (role.includes("pie") || q(".pieCircle") || q(".pieTitleText")) {
    type = "pie";
  } else if (role.includes("gantt") || (q(".grid .tick") && q(".task"))) {
    type = "gantt";
  } else if (role.includes("sequence") || q(".actor")) {
    type = "sequence";
  } else if (role.includes("state") || q(".statediagram-state")) {
    type = "state";
  } else if (role.includes("mindmap") || q(".mindmap-node")) {
    type = "mindmap";
  } else if (role.includes("class") || q(".classGroup")) {
    type = "class";
  } else if (role.includes("er") || q(".er.entityBox")) {
    type = "er";
  } else if (
    role.includes("flowchart") ||
    role.includes("graph") ||
    q(".node") ||
    q(".edgePath") ||
    q(".flowchart-link")
  ) {
    type = "flowchart";
  }

  const size = naturalSize || extractSvgNaturalSize(svg) || { width: 400, height: 300 };
  const ratio = size.width / Math.max(1, size.height);
  let orientation = "horizontal";
  if (ratio < 0.85) {
    orientation = "vertical";
  } else if (ratio <= 1.2) {
    orientation = "square";
  }

  return {
    type,
    orientation,
    aspectRatio: ratio,
    label: DIAGRAM_TYPE_LABELS[type] || DIAGRAM_TYPE_LABELS.other,
  };
}

/**
 * Tightens excessive horizontal whitespace in Mermaid pie charts.
 */
function tightenPieViewBox(svg, naturalSize) {
  if (!svg || !naturalSize) return naturalSize;
  const { x, y, width, height } = naturalSize;

  if (typeof svg.getBBox === "function") {
    try {
      const bbox = svg.getBBox();
      if (
        bbox &&
        Number.isFinite(bbox.width) &&
        Number.isFinite(bbox.height) &&
        bbox.width > 80 &&
        bbox.height > 80 &&
        bbox.width < width * 0.94
      ) {
        const padX = 24;
        const padY = 16;
        const newX = Math.round(bbox.x - padX);
        const newY = Math.round(bbox.y - padY);
        const newW = Math.max(260, Math.round(bbox.width + padX * 2));
        const newH = Math.max(200, Math.round(bbox.height + padY * 2));
        if (typeof svg.setAttribute === "function") {
          svg.setAttribute("viewBox", `${newX} ${newY} ${newW} ${newH}`);
        }
        return { x: newX, y: newY, width: newW, height: newH, trimmed: true };
      }
    } catch (_) {
      // Fallback
    }
  }

  if (width >= 640 && height >= 360 && width / height >= 1.5) {
    const trimLeft = Math.round(width * 0.16);
    const trimRight = Math.round(width * 0.11);
    const trimTop = Math.round(height * 0.04);
    const trimBottom = Math.round(height * 0.05);
    const newX = x + trimLeft;
    const newY = y + trimTop;
    const newW = Math.max(320, width - trimLeft - trimRight);
    const newH = Math.max(240, height - trimTop - trimBottom);
    if (typeof svg.setAttribute === "function") {
      svg.setAttribute("viewBox", `${newX} ${newY} ${newW} ${newH}`);
    }
    return { x: newX, y: newY, width: newW, height: newH, trimmed: true };
  }
  return { x, y, width, height, trimmed: false };
}

/**
 * Computes smart rendered dimensions (width, height, scale) and whether height collapse is needed.
 */
function computeSmartDiagramSize(naturalSize, diagramMeta, settings = {}, containerWidth = 0) {
  const merged = Object.assign({}, DEFAULT_SETTINGS, settings);
  const preset = SIZE_PRESETS[merged.sizePreset] || SIZE_PRESETS.compact;

  const baseScale =
    merged.sizePreset === "original"
      ? 1.0
      : Number.isFinite(merged.baseScale) && merged.baseScale > 0
      ? merged.baseScale
      : preset.baseScale;

  let maxHeight =
    merged.sizePreset === "original"
      ? 2400
      : Number.isFinite(merged.maxHeight) && merged.maxHeight > 0
      ? merged.maxHeight
      : preset.maxHeight;

  let maxWidth =
    merged.sizePreset === "original"
      ? 1600
      : Number.isFinite(merged.maxWidth) && merged.maxWidth > 0
      ? merged.maxWidth
      : preset.maxWidth;

  const minReadableScale =
    merged.sizePreset === "original"
      ? 1.0
      : Number.isFinite(merged.minReadableScale) && merged.minReadableScale > 0
      ? merged.minReadableScale
      : preset.minReadableScale;

  const natW = Math.max(1, (naturalSize && naturalSize.width) || 400);
  const natH = Math.max(1, (naturalSize && naturalSize.height) || 300);
  const type = (diagramMeta && diagramMeta.type) || "flowchart";

  if (merged.sizePreset !== "original") {
    if (type === "pie") {
      maxHeight = Math.min(maxHeight, merged.sizePreset === "compact" ? 235 : 280);
      maxWidth = Math.min(maxWidth, merged.sizePreset === "compact" ? 430 : 500);
    } else if (type === "gantt") {
      maxHeight = Math.min(maxHeight, merged.sizePreset === "compact" ? 260 : 320);
      maxWidth = Math.max(maxWidth, 640);
    }
  }

  const effectiveContainerW =
    containerWidth && containerWidth > 140
      ? Math.max(120, containerWidth - 32)
      : maxWidth;

  const availableWidth = Math.min(maxWidth, effectiveContainerW);

  const scaleW = availableWidth / natW;
  const scaleH = maxHeight / natH;

  const idealScale = Math.min(baseScale, scaleW, scaleH);
  const readableFloor = Math.min(scaleW, Math.max(minReadableScale, idealScale));
  const finalScale = Math.max(0.15, Math.min(1.5, readableFloor));

  const renderWidth = Math.max(40, Math.round(natW * finalScale));
  const renderHeight = Math.max(30, Math.round(natH * finalScale));

  const needsHeightCollapse =
    Boolean(merged.autoCollapseTall) &&
    merged.sizePreset !== "original" &&
    renderHeight > maxHeight * 1.12;

  return {
    naturalWidth: natW,
    naturalHeight: natH,
    width: renderWidth,
    height: renderHeight,
    scale: Number(finalScale.toFixed(3)),
    maxHeight,
    maxWidth: availableWidth,
    needsHeightCollapse,
    collapsedHeight: needsHeightCollapse ? maxHeight : renderHeight,
  };
}

/**
 * Checks whether an element has a custom author-specified fill/stroke.
 */
function hasExplicitUserStyle(el) {
  if (!el || typeof el.getAttribute !== "function") return false;
  if (el.dataset && el.dataset.mbUserCustom !== undefined) {
    return el.dataset.mbUserCustom === "true";
  }

  const styleAttr = (el.getAttribute("style") || "").toLowerCase();
  const fillAttr = (el.getAttribute("fill") || "").toLowerCase();
  const combined = `${styleAttr};fill:${fillAttr}`;

  if (!combined.includes("fill")) {
    if (el.dataset) el.dataset.mbUserCustom = "false";
    return false;
  }

  const mermaidDefaults = [
    "#ececff",
    "rgb(236, 236, 255)",
    "#ffffde",
    "rgb(255, 255, 222)",
    "#f9f9f9",
    "#eeeeee",
    "#eaeaea",
    "#ffffff",
    "#1f2020",
    "#282a36",
    "#2a2a2a",
    "none",
    "transparent",
  ];

  const fillMatch = styleAttr.match(/fill\s*:\s*([^;!]+)/i);
  const candidateFill = (fillMatch ? fillMatch[1] : fillAttr).trim();
  if (!candidateFill || candidateFill.startsWith("var(")) {
    if (el.dataset) el.dataset.mbUserCustom = "false";
    return false;
  }

  for (const def of mermaidDefaults) {
    if (candidateFill === def) {
      if (el.dataset) el.dataset.mbUserCustom = "false";
      return false;
    }
  }

  if (el.dataset) el.dataset.mbUserCustom = "true";
  return true;
}

function applyStyleProp(el, prop, val) {
  if (!el || !el.style) return;
  el.style[prop] = val;
  if (typeof el.style.setProperty === "function") {
    const cssProp = prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
    el.style.setProperty(cssProp, val, "important");
  }
}

/**
 * Analyzes flowchart/graph nodes and edges in SVG DOM.
 */
function classifyGraphTopology(svg) {
  const result = new Map();
  if (!svg || typeof svg.querySelectorAll !== "function") return result;

  const nodes = Array.from(svg.querySelectorAll(".node"));
  if (nodes.length === 0) return result;

  const nodeIds = [];
  const nodeKeyMap = new Map();
  const nodeOrderMap = new Map();

  nodes.forEach((node, idx) => {
    const rawId =
      (typeof node.getAttribute === "function" &&
        (node.getAttribute("data-id") || node.getAttribute("id"))) ||
      `node_${idx}`;
    const cleanMatch = rawId.match(/^flowchart-(.+?)-\d+$/);
    const key = cleanMatch ? cleanMatch[1] : rawId;
    nodeIds.push(key);
    nodeKeyMap.set(key, node);
    nodeOrderMap.set(key, idx);
  });

  const adj = new Map(nodeIds.map((k) => [k, new Set()]));
  const rev = new Map(nodeIds.map((k) => [k, new Set()]));

  const edges = Array.from(
    svg.querySelectorAll(".edgePath, .flowchart-link, path[data-edge], g.edgePaths > g")
  );

  const sortedKeys = [...nodeIds].sort((a, b) => b.length - a.length);

  edges.forEach((edge) => {
    const idStr =
      (typeof edge.getAttribute === "function" &&
        (edge.getAttribute("id") || edge.getAttribute("class"))) ||
      "";
    for (const src of sortedKeys) {
      for (const dst of sortedKeys) {
        if (src === dst) continue;
        if (
          idStr.includes(`-${src}-${dst}`) ||
          idStr.includes(`_${src}_${dst}`) ||
          (idStr.includes(`LS-${src}`) && idStr.includes(`LE-${dst}`))
        ) {
          adj.get(src).add(dst);
          rev.get(dst).add(src);
        }
      }
    }
  });

  const anyEdgeMatched = Array.from(rev.values()).some((s) => s.size > 0);
  const depthMap = new Map();
  const branchGroupMap = new Map();

  if (anyEdgeMatched) {
    const roots = nodeIds.filter(
      (k) => rev.get(k).size === 0 && adj.get(k).size > 0
    );
    const startSeeds = roots.length > 0 ? roots : [nodeIds[0]];

    const queue = [];
    startSeeds.forEach((rKey) => {
      depthMap.set(rKey, 0);
      branchGroupMap.set(rKey, 0);
      queue.push(rKey);
    });

    let nextSectionBranchIdx = 0;
    while (queue.length > 0) {
      const curr = queue.shift();
      const currDepth = depthMap.get(curr) || 0;
      const children = Array.from(adj.get(curr) || []).sort(
        (a, b) => (nodeOrderMap.get(a) || 0) - (nodeOrderMap.get(b) || 0)
      );

      for (const child of children) {
        if (!depthMap.has(child)) {
          const nextDepth = currDepth + 1;
          depthMap.set(child, nextDepth);
          if (nextDepth === 1) {
            branchGroupMap.set(child, nextSectionBranchIdx++);
          } else {
            branchGroupMap.set(child, branchGroupMap.get(curr) || 0);
          }
          queue.push(child);
        }
      }
    }
  }

  const sinks = anyEdgeMatched
    ? nodeIds.filter((k) => adj.get(k).size === 0 && rev.get(k).size > 0)
    : [];
  const hasSingleConvergenceSink = sinks.length === 1 && nodes.length >= 3;

  nodes.forEach((node, idx) => {
    const key = nodeIds[idx];
    const depth = depthMap.has(key) ? depthMap.get(key) : idx === 0 ? 0 : 1;
    const branchGroup = branchGroupMap.has(key)
      ? branchGroupMap.get(key)
      : Math.max(0, idx - 1);

    let tier = "detail";
    if (anyEdgeMatched) {
      const inDeg = rev.get(key).size;
      const outDeg = adj.get(key).size;
      if (inDeg === 0 && outDeg > 0) {
        tier = "root";
      } else if (outDeg === 0 && inDeg > 0 && hasSingleConvergenceSink) {
        tier = "leaf";
      } else if (depth === 1 && outDeg > 0) {
        tier = "section";
      } else {
        tier = "detail";
      }
    } else {
      if (idx === 0) {
        tier = "root";
      } else if (idx === nodes.length - 1 && nodes.length >= 3) {
        tier = "leaf";
      } else {
        tier = "section";
      }
    }

    result.set(node, {
      tier,
      depth,
      branchGroup,
      index: idx,
      paletteIndex: branchGroup % 4,
      key,
    });
  });

  return result;
}

/**
 * Resolves the active theme specification from the 29 themes across 7 groups.
 */
function resolveThemeSpec(settings = {}, isDark = false) {
  const merged = Object.assign({}, DEFAULT_SETTINGS, settings);
  const LEGACY_THEME_MAP = {
    "claude-anthropic": "claude",
    "notion-pastel": "notion",
    "github-tailwind": "github-light",
    "excalidraw-sketch": "handcrafted",
    "swiss-mono": "high-contrast",
    "custom-obsidian": "claude",
  };
  const resolvedKey = LEGACY_THEME_MAP[merged.theme] || merged.theme;
  const baseTheme = THEMES[resolvedKey] || THEMES.claude;

  return {
    themeKey: THEMES[resolvedKey] ? resolvedKey : "claude",
    themeObj: baseTheme,
    palette: isDark ? baseTheme.dark : baseTheme.light,
  };
}

/**
 * Ensures SVG <defs> contains the #mb-wobble displacement filter for Handcrafted & Chalkboard modes.
 */
function ensureDropShadowFilter(svg) {
  if (!svg || typeof svg.querySelector !== "function") return;
  const doc = svg.ownerDocument || (typeof document !== "undefined" ? document : null);
  if (!doc || typeof doc.createElementNS !== "function") return;

  const ns = "http://www.w3.org/2000/svg";
  let defs = svg.querySelector("defs");
  if (!defs) {
    defs = doc.createElementNS(ns, "defs");
    svg.insertBefore(defs, svg.firstChild);
  }

  if (!svg.querySelector("#mb-wobble")) {
    const wobbleFilter = doc.createElementNS(ns, "filter");
    wobbleFilter.setAttribute("id", "mb-wobble");
    wobbleFilter.setAttribute("x", "-5%");
    wobbleFilter.setAttribute("y", "-5%");
    wobbleFilter.setAttribute("width", "110%");
    wobbleFilter.setAttribute("height", "110%");

    const turb = doc.createElementNS(ns, "feTurbulence");
    turb.setAttribute("type", "fractalNoise");
    turb.setAttribute("baseFrequency", "0.025");
    turb.setAttribute("numOctaves", "2");
    turb.setAttribute("seed", "7");
    turb.setAttribute("result", "n");

    const disp = doc.createElementNS(ns, "feDisplacementMap");
    disp.setAttribute("in", "SourceGraphic");
    disp.setAttribute("in2", "n");
    disp.setAttribute("scale", "3.2");
    disp.setAttribute("xChannelSelector", "R");
    disp.setAttribute("yChannelSelector", "G");

    wobbleFilter.appendChild(turb);
    wobbleFilter.appendChild(disp);
    defs.appendChild(wobbleFilter);
  }
}

/**
 * Applies deep SVG DOM beautification matching all 29 themes across the 7 groups 1:1.
 */
function beautifySvgDom(svg, settings = {}, isDark = false) {
  if (!svg || typeof svg.querySelectorAll !== "function") return;
  const merged = Object.assign({}, DEFAULT_SETTINGS, settings);
  const { themeKey, themeObj, palette } = resolveThemeSpec(merged, isDark);
  const radius = Number.isFinite(themeObj.defaultRadius)
    ? themeObj.defaultRadius
    : Number.isFinite(settings.nodeRadius)
    ? settings.nodeRadius
    : merged.nodeRadius;
  const svgFilter = themeObj.svgFilter || "none";
  const fontFamily =
    themeObj.fontFamily ||
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif';
  const strokeWidth = themeObj.strokeWidth || "1.5px";
  const defaultNodeStrokeWidth = themeObj.nodeStrokeWidth || strokeWidth;
  const defaultEdgeStrokeWidth = themeObj.edgeStrokeWidth || strokeWidth;

  ensureDropShadowFilter(svg);
  applyStyleProp(svg, "fontFamily", fontFamily);

  if (svgFilter !== "none") {
    applyStyleProp(svg, "filter", svgFilter);
    if (typeof svg.setAttribute === "function") {
      svg.setAttribute("filter", svgFilter);
    }
  } else {
    applyStyleProp(svg, "filter", "none");
    if (typeof svg.removeAttribute === "function") {
      svg.removeAttribute("filter");
    }
  }

  if (svg.dataset && svg.dataset.mbViewBoxPadded !== "true" && typeof svg.getAttribute === "function") {
    const vbAttr = svg.getAttribute("viewBox");
    if (vbAttr) {
      const parts = vbAttr
        .trim()
        .split(/[\s,]+/)
        .map(Number);
      if (parts.length === 4 && parts.every(Number.isFinite) && parts[2] > 0 && parts[3] > 0) {
        const padX = 20;
        const padY = 14;
        const nextVb = `${parts[0] - padX} ${parts[1] - padY} ${parts[2] + padX * 2} ${parts[3] + padY * 2}`;
        svg.setAttribute("viewBox", nextVb);
        svg.dataset.mbViewBoxPadded = "true";
      }
    }
  }

  // 1. Subgraph / Cluster boxes
  const clusters = Array.from(svg.querySelectorAll(".cluster"));
  clusters.forEach((cluster) => {
    const rect = cluster.querySelector("rect");
    if (rect && !hasExplicitUserStyle(rect)) {
      rect.setAttribute("rx", String(radius));
      rect.setAttribute("ry", String(radius));
      applyStyleProp(rect, "fill", palette.cluster.fill);
      applyStyleProp(rect, "stroke", palette.cluster.stroke);
      applyStyleProp(rect, "strokeWidth", strokeWidth);
      applyStyleProp(rect, "strokeDasharray", "none");
    }
    const labels = Array.from(
      cluster.querySelectorAll(".nodeLabel, .cluster-label span, text")
    );
    labels.forEach((lbl) => {
      applyStyleProp(lbl, "color", palette.cluster.text);
      applyStyleProp(lbl, "fill", palette.cluster.text);
      applyStyleProp(lbl, "fontFamily", fontFamily);
      applyStyleProp(lbl, "fontWeight", "600");
    });
  });

  // 2. Flowchart / State / Sequence Nodes
  const topology = classifyGraphTopology(svg);
  const sectionList = palette.sectionPalettes || palette.branchPalettes;
  const detailList = palette.detailPalettes || palette.branchPalettes;
  const nodes = Array.from(svg.querySelectorAll(".node, .statediagram-state"));
  nodes.forEach((node, idx) => {
    const info = topology.get(node) || {
      tier: idx === 0 ? "root" : "detail",
      branchGroup: Math.max(0, idx - 1),
      paletteIndex: Math.max(0, idx - 1) % detailList.length,
      key: `node_${idx}`,
    };

    let colorSpec = palette.rootNode;
    if (palette.nodeMap && info.key && palette.nodeMap[info.key]) {
      colorSpec = palette.nodeMap[info.key];
    } else if (palette.nodeCycle && palette.nodeCycle.length > 0) {
      colorSpec = palette.nodeCycle[idx % palette.nodeCycle.length];
    } else if (merged.multiToneNodes) {
      if (info.tier === "root") {
        colorSpec = palette.rootNode;
      } else if (info.tier === "leaf") {
        colorSpec = palette.leafNode;
      } else if (info.tier === "section") {
        colorSpec = sectionList[info.branchGroup % sectionList.length];
      } else {
        colorSpec = detailList[info.branchGroup % detailList.length];
      }
    }

    if (node.dataset) {
      node.dataset.mbTier = info.tier;
      node.dataset.mbBranch = String(info.branchGroup ?? 0);
      node.dataset.mbPalette = String(info.paletteIndex);
      node.dataset.mbTheme = themeKey;
    }

    if (typeof node.querySelectorAll === "function") {
      const fos = Array.from(node.querySelectorAll("foreignObject"));
      fos.forEach((fo) => {
        if (typeof fo.setAttribute === "function") {
          fo.setAttribute("overflow", "visible");
        }
        applyStyleProp(fo, "overflow", "visible");
        if (!fo.dataset || fo.dataset.mbExpanded !== "true") {
          const origW = parseFloat((fo.getAttribute && fo.getAttribute("width")) || "0");
          if (origW > 0) {
            const extraW = 34;
            const newW = origW + extraW;
            fo.setAttribute("width", String(newW));
            const origX = fo.getAttribute("x");
            if (origX !== null && origX !== "") {
              fo.setAttribute("x", String(parseFloat(origX) - extraW / 2));
            } else if (fo.parentElement && typeof fo.parentElement.getAttribute === "function") {
              const tf = fo.parentElement.getAttribute("transform") || "";
              const m = tf.match(/translate\(\s*([-\d.]+)\s*[,\s]\s*([-\d.]+)\s*\)/i);
              if (m) {
                const tx = parseFloat(m[1]) - extraW / 2;
                const ty = parseFloat(m[2]);
                fo.parentElement.setAttribute("transform", `translate(${tx}, ${ty})`);
              }
            }
            const innerDivs = Array.from(fo.querySelectorAll("div"));
            innerDivs.forEach((d) => {
              applyStyleProp(d, "maxWidth", `${Math.max(236, newW)}px`);
            });
          }
          if (fo.dataset) fo.dataset.mbExpanded = "true";
        }
      });
    }

    const nodeStrokeW = colorSpec.strokeWidth || defaultNodeStrokeWidth;
    const shapes = Array.from(
      node.querySelectorAll(
        "rect, polygon, circle, ellipse, path.basic.label-container, path.label-container"
      )
    );
    shapes.forEach((shape) => {
      if (shape.tagName.toLowerCase() === "rect") {
        shape.setAttribute("rx", String(radius));
        shape.setAttribute("ry", String(radius));
        if (!shape.dataset || shape.dataset.mbExpanded !== "true") {
          const origRw = parseFloat((shape.getAttribute && shape.getAttribute("width")) || "0");
          const origRx = parseFloat((shape.getAttribute && shape.getAttribute("x")) || "0");
          if (origRw > 30) {
            const extraRw = 26;
            shape.setAttribute("width", String(origRw + extraRw));
            shape.setAttribute("x", String(origRx - extraRw / 2));
            if (shape.dataset) shape.dataset.mbExpanded = "true";
          }
        }
      }
      if (!hasExplicitUserStyle(shape)) {
        applyStyleProp(shape, "fill", colorSpec.fill);
        applyStyleProp(shape, "stroke", colorSpec.stroke);
        applyStyleProp(shape, "strokeWidth", nodeStrokeW);
        applyStyleProp(shape, "filter", "none");
        if (typeof shape.removeAttribute === "function") {
          shape.removeAttribute("filter");
        }
      }
    });

    const textEls = Array.from(
      node.querySelectorAll(".nodeLabel, span, div, text, tspan, p")
    );
    textEls.forEach((tEl) => {
      applyStyleProp(tEl, "color", colorSpec.text);
      applyStyleProp(tEl, "fill", colorSpec.text);
      applyStyleProp(tEl, "fontFamily", fontFamily);
    });
  });

  // 3. Sequence diagram actors & notes
  const actorColor = palette.actor || palette.rootNode;
  const noteColor = palette.note || palette.rootNode;
  const actors = Array.from(svg.querySelectorAll("rect.actor"));
  actors.forEach((actor) => {
    actor.setAttribute("rx", String(radius));
    actor.setAttribute("ry", String(radius));
    if (!hasExplicitUserStyle(actor)) {
      applyStyleProp(actor, "fill", actorColor.fill);
      applyStyleProp(actor, "stroke", actorColor.stroke);
      applyStyleProp(actor, "strokeWidth", strokeWidth);
    }
  });
  const actorTexts = Array.from(svg.querySelectorAll("text.actor > tspan, text.actor"));
  actorTexts.forEach((tEl) => {
    applyStyleProp(tEl, "fill", actorColor.text);
    applyStyleProp(tEl, "fontFamily", fontFamily);
  });

  const notes = Array.from(svg.querySelectorAll(".note, rect.note"));
  notes.forEach((note) => {
    note.setAttribute("rx", String(radius));
    note.setAttribute("ry", String(radius));
    if (!hasExplicitUserStyle(note)) {
      applyStyleProp(note, "fill", noteColor.fill);
      applyStyleProp(note, "stroke", noteColor.stroke);
      applyStyleProp(note, "strokeWidth", strokeWidth);
    }
  });
  const noteTexts = Array.from(svg.querySelectorAll("text.noteText > tspan, text.noteText"));
  noteTexts.forEach((tEl) => {
    applyStyleProp(tEl, "fill", noteColor.text);
    applyStyleProp(tEl, "fontFamily", fontFamily);
  });

  // 4. Edges, Connector Paths, and Arrowhead Markers
  const edgePaths = Array.from(
    svg.querySelectorAll(
      ".edgePath path.path, path.flowchart-link, .messageLine0, .messageLine1, .transition, line.actor-line"
    )
  );
  edgePaths.forEach((path, idx) => {
    let eStroke = palette.edge.stroke;
    let eWidth = defaultEdgeStrokeWidth;
    if (palette.edgeCycle && palette.edgeCycle.length > 0) {
      const eSpec = palette.edgeCycle[idx % palette.edgeCycle.length];
      if (eSpec) {
        if (eSpec.stroke) eStroke = eSpec.stroke;
        if (eSpec.strokeWidth) eWidth = eSpec.strokeWidth;
      }
    }
    applyStyleProp(path, "stroke", eStroke);
    applyStyleProp(path, "strokeWidth", eWidth);
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    if (typeof path.removeAttribute === "function") {
      path.removeAttribute("filter");
    }
  });

  const markers = Array.from(
    svg.querySelectorAll("marker path, marker circle, marker polygon")
  );
  markers.forEach((m) => {
    applyStyleProp(m, "fill", palette.edge.stroke);
    applyStyleProp(m, "stroke", palette.edge.stroke);
  });

  // 5. Edge Labels
  const edgeLabels = Array.from(svg.querySelectorAll(".edgeLabel"));
  edgeLabels.forEach((lbl) => {
    const bgRect = lbl.querySelector("rect, .labelBkg");
    if (bgRect) {
      if (bgRect.tagName && bgRect.tagName.toLowerCase() === "rect") {
        bgRect.setAttribute("rx", "4");
        bgRect.setAttribute("ry", "4");
      }
      applyStyleProp(bgRect, "fill", palette.edge.labelBg);
      applyStyleProp(bgRect, "backgroundColor", palette.edge.labelBg);
      applyStyleProp(bgRect, "stroke", "none");
      applyStyleProp(bgRect, "border", "none");
    }
    const spans = Array.from(lbl.querySelectorAll("span, text, div, p"));
    spans.forEach((s) => {
      applyStyleProp(s, "color", palette.edge.labelText);
      applyStyleProp(s, "fill", palette.edge.labelText);
      applyStyleProp(s, "fontFamily", fontFamily);
    });
  });

  // 6. Pie Chart Slices & Legend
  const pieSlices = Array.from(svg.querySelectorAll("path.pieCircle"));
  if (pieSlices.length > 0) {
    pieSlices.forEach((slice, idx) => {
      const sliceColor = palette.pieColors[idx % palette.pieColors.length];
      applyStyleProp(slice, "fill", sliceColor);
      slice.setAttribute("fill", sliceColor);
      applyStyleProp(slice, "stroke", palette.cardBg);
      slice.setAttribute("stroke", palette.cardBg);
      applyStyleProp(slice, "strokeWidth", "2px");
    });
    const legendRects = Array.from(svg.querySelectorAll(".legend rect"));
    legendRects.forEach((r, idx) => {
      const sliceColor = palette.pieColors[idx % palette.pieColors.length];
      r.setAttribute("rx", "4");
      r.setAttribute("ry", "4");
      applyStyleProp(r, "fill", sliceColor);
      r.setAttribute("fill", sliceColor);
      applyStyleProp(r, "stroke", sliceColor);
    });
    const legendTexts = Array.from(
      svg.querySelectorAll(".legend text, .pieTitleText, text.slice")
    );
    legendTexts.forEach((tEl) => {
      applyStyleProp(tEl, "fontFamily", fontFamily);
      applyStyleProp(tEl, "fill", palette.rootNode.text);
    });
  }

  // 7. Gantt Chart Tasks & Grid
  const ganttTasks = Array.from(svg.querySelectorAll("rect.task"));
  if (ganttTasks.length > 0) {
    ganttTasks.forEach((task, idx) => {
      task.setAttribute("rx", "5");
      task.setAttribute("ry", "5");
      const color = palette.pieColors[idx % palette.pieColors.length];
      applyStyleProp(task, "fill", color);
      applyStyleProp(task, "stroke", color);
    });
    const ganttTexts = Array.from(svg.querySelectorAll("text.taskText, text.titleText, .tick text"));
    ganttTexts.forEach((tEl) => {
      applyStyleProp(tEl, "fontFamily", fontFamily);
      applyStyleProp(tEl, "fill", palette.rootNode.text);
    });
  }
}

module.exports = {
  SIZE_PRESETS,
  DEFAULT_SETTINGS,
  THEME_GROUPS,
  THEMES,
  DIAGRAM_TYPE_LABELS,
  extractSvgNaturalSize,
  detectDiagramType,
  tightenPieViewBox,
  computeSmartDiagramSize,
  hasExplicitUserStyle,
  classifyGraphTopology,
  resolveThemeSpec,
  beautifySvgDom,
};
