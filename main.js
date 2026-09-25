"use strict";
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};

// src/themes.js
var require_themes = __commonJS({
  "src/themes.js"(exports2, module2) {
    "use strict";
    var HAND = '"Segoe Print", "Bradley Hand", "Chalkboard SE", "Comic Sans MS", "LXGW WenKai", cursive, sans-serif';
    var MONO = '"Courier New", Courier, monospace';
    var SANS = '-apple-system, "Segoe UI", Helvetica, Arial, sans-serif';
    var SERIF = 'Georgia, "Times New Roman", "Noto Serif SC", "Source Han Serif SC", serif';
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
        strokeWidth: nodeStrokeWidth
      };
      const secondCell = {
        fill: o.second || o.node,
        stroke: o.border,
        text: o.text,
        strokeWidth: nodeStrokeWidth
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
          text: o.noteText || o.text
        },
        cluster: {
          fill: o.second || o.node,
          stroke: o.border,
          text: o.text
        },
        edge: {
          stroke: o.line,
          labelBg: o.elbl || o.bg,
          labelBorder: o.border,
          labelText: o.text,
          strokeWidth: edgeStrokeWidth
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
          o.text
        ]
      };
      return {
        group,
        title,
        note,
        name: `[${group}] ${title} \u2014 ${note}`,
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
        dark: palette
      };
    }
    var THEME_GROUPS = [
      "Styled",
      "Developer",
      "Paper & print",
      "Retro & playful",
      "Brand-inspired",
      "Functional",
      "Built-in"
    ];
    var THEMES2 = {
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
        cls: "round-lg"
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
        cls: "round"
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
        cls: "round"
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
        cls: "wobble round-lg"
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
        cls: "round"
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
        cls: "round"
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
        cls: "round"
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
        cls: "round"
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
        size: "20px 20px"
      }),
      newspaper: mkTheme("Paper & print", "Newspaper", "ink on newsprint", {
        bg: "#f2efe8",
        node: "#f2efe8",
        border: "#111111",
        line: "#111111",
        text: "#111111",
        second: "#e4e0d6",
        note: "#e4e0d6",
        font: SERIF
      }),
      academic: mkTheme("Paper & print", "Academic", "greyscale for papers", {
        bg: "#ffffff",
        node: "#efefef",
        border: "#333333",
        line: "#555555",
        text: "#000000",
        second: "#dddddd",
        note: "#f7f7f7",
        font: '"Computer Modern", "Times New Roman", serif'
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
        cls: "round"
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
        cls: "wobble round-lg"
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
        cls: "glow"
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
        font: MONO
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
        cls: "glow-pink round"
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
          F: { fill: "#b9f6a4", stroke: "#7ec46a", text: "#2b2b2b" }
        },
        nodeCycle: [
          { fill: "#fff176", stroke: "#e0c800", text: "#2b2b2b" },
          { fill: "#ffb3c7", stroke: "#e58fa6", text: "#2b2b2b" },
          { fill: "#fff176", stroke: "#e0c800", text: "#2b2b2b" },
          { fill: "#b9f6a4", stroke: "#7ec46a", text: "#2b2b2b" },
          { fill: "#ffb3c7", stroke: "#e58fa6", text: "#2b2b2b" },
          { fill: "#b9f6a4", stroke: "#7ec46a", text: "#2b2b2b" }
        ]
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
        cls: "round"
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
        cls: "round"
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
        cls: "glow-violet round"
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
        cls: "round-lg"
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
          { stroke: "#00a651", strokeWidth: "6px" }
        ]
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
        edgeStrokeWidth: "3px"
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
          F: { fill: "#f5c9b0", stroke: "#D55E00", text: "#111111", strokeWidth: "2px" }
        },
        nodeCycle: [
          { fill: "#cfe8f7", stroke: "#0072B2", text: "#111111", strokeWidth: "2px" },
          { fill: "#fbe3b0", stroke: "#E69F00", text: "#111111", strokeWidth: "2px" },
          { fill: "#b8e6d6", stroke: "#009E73", text: "#111111", strokeWidth: "2px" },
          { fill: "#f3d3e3", stroke: "#CC79A7", text: "#111111", strokeWidth: "2px" },
          { fill: "#f9f0a6", stroke: "#B8A800", text: "#111111", strokeWidth: "2px" },
          { fill: "#f5c9b0", stroke: "#D55E00", text: "#111111", strokeWidth: "2px" }
        ]
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
          E: { fill: "#fff0e6", stroke: "#e8590c", text: "#27272a", strokeWidth: "2px" }
        },
        nodeCycle: [
          { fill: "#fff0e6", stroke: "#e8590c", text: "#27272a", strokeWidth: "2px" },
          { fill: "#fff0e6", stroke: "#e8590c", text: "#27272a", strokeWidth: "2px" },
          { fill: "#fff0e6", stroke: "#e8590c", text: "#27272a", strokeWidth: "2px" },
          { fill: "#f4f4f5", stroke: "#a1a1aa", text: "#27272a", strokeWidth: "1.5px" },
          { fill: "#fff0e6", stroke: "#e8590c", text: "#27272a", strokeWidth: "2px" },
          { fill: "#f4f4f5", stroke: "#a1a1aa", text: "#27272a", strokeWidth: "1.5px" }
        ],
        edgeCycle: [
          { stroke: "#e8590c", strokeWidth: "3px" },
          { stroke: "#e8590c", strokeWidth: "3px" },
          { stroke: "#a1a1aa", strokeWidth: "1.5px" },
          { stroke: "#e8590c", strokeWidth: "3px" },
          { stroke: "#a1a1aa", strokeWidth: "1.5px" },
          { stroke: "#a1a1aa", strokeWidth: "1.5px" }
        ]
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
        font: SANS
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
        font: SANS
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
        font: SANS
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
        font: SANS
      })
    };
    var LEGACY_THEME_MAP2 = {
      "claude-anthropic": "claude",
      "notion-pastel": "notion",
      "github-tailwind": "github-light",
      "excalidraw-sketch": "handcrafted",
      "swiss-mono": "high-contrast",
      "custom-obsidian": "claude"
    };
    function nextThemeKey2(currentTheme) {
      const keys = Object.keys(THEMES2);
      const resolved = LEGACY_THEME_MAP2[currentTheme] || currentTheme;
      const currentIndex = keys.indexOf(resolved);
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % keys.length : 0;
      return keys[nextIndex] || "claude";
    }
    function resolveThemeSpec2(settings = {}, isDark = false) {
      const rawTheme = settings && settings.theme || "claude";
      const resolvedKey = LEGACY_THEME_MAP2[rawTheme] || rawTheme;
      const baseTheme = THEMES2[resolvedKey] || THEMES2.claude;
      return {
        themeKey: THEMES2[resolvedKey] ? resolvedKey : "claude",
        themeObj: baseTheme,
        palette: isDark ? baseTheme.dark : baseTheme.light
      };
    }
    module2.exports = {
      HAND,
      MONO,
      SANS,
      SERIF,
      mkTheme,
      THEME_GROUPS,
      THEMES: THEMES2,
      LEGACY_THEME_MAP: LEGACY_THEME_MAP2,
      nextThemeKey: nextThemeKey2,
      resolveThemeSpec: resolveThemeSpec2
    };
  }
});

// src/settings.js
var require_settings = __commonJS({
  "src/settings.js"(exports2, module2) {
    "use strict";
    var PluginSettingTab;
    var Setting;
    try {
      const obsidian = require("obsidian");
      PluginSettingTab = obsidian.PluginSettingTab;
      Setting = obsidian.Setting;
    } catch (_err) {
      PluginSettingTab = class {
      };
      Setting = class {
      };
    }
    var { THEME_GROUPS, THEMES: THEMES2 } = require_themes();
    var SIZE_PRESETS2 = {
      compact: {
        id: "compact",
        label: "Compact",
        shortLabel: "S",
        baseScale: 0.72,
        maxHeight: 320,
        maxWidth: 620,
        minReadableScale: 0.52
      },
      balanced: {
        id: "balanced",
        label: "Balanced",
        shortLabel: "M",
        baseScale: 0.85,
        maxHeight: 440,
        maxWidth: 740,
        minReadableScale: 0.58
      },
      relaxed: {
        id: "relaxed",
        label: "Relaxed",
        shortLabel: "L",
        baseScale: 1,
        maxHeight: 580,
        maxWidth: 900,
        minReadableScale: 0.65
      },
      original: {
        id: "original",
        label: "Original",
        shortLabel: "1:1",
        baseScale: 1,
        maxHeight: 2400,
        maxWidth: 1600,
        minReadableScale: 1
      }
    };
    var DEFAULT_SETTINGS2 = {
      sizePreset: "compact",
      baseScale: 0.72,
      maxHeight: 320,
      maxWidth: 620,
      minReadableScale: 0.52,
      theme: "claude",
      nodeRadius: null,
      multiToneNodes: false,
      trimPiePadding: true,
      showCardFrame: true,
      showDotGrid: false,
      showHeaderBar: true,
      autoCollapseTall: true,
      doubleClickFullscreen: true,
      zoomSensitivity: 1
    };
    var MermaidBoostSettingTab2 = class extends PluginSettingTab {
      constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
      }
      display() {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl("h2", { text: "Mermaid Boost" });
        containerEl.createEl("p", {
          text: "Smart compact sizing, 4 signature Styled modes (Claude, Notion, Notion dark, Handcrafted), and interactive controls for Mermaid diagrams.",
          cls: "setting-item-description"
        });
        new Setting(containerEl).setName("Base Scale").setDesc(`Default scale ratio for diagram nodes and labels (${Math.round(this.plugin.settings.baseScale * 100)}%).`).addSlider(
          (slider) => slider.setLimits(0.45, 1.1, 0.02).setValue(this.plugin.settings.baseScale).setDynamicTooltip().onChange(async (val) => {
            this.plugin.settings.baseScale = val;
            await this.plugin.saveSettings();
          })
        );
        new Setting(containerEl).setName("Max Height (px)").setDesc(`Maximum vertical height before scaling or collapsing (${this.plugin.settings.maxHeight}px).`).addSlider(
          (slider) => slider.setLimits(180, 720, 20).setValue(this.plugin.settings.maxHeight).setDynamicTooltip().onChange(async (val) => {
            this.plugin.settings.maxHeight = val;
            await this.plugin.saveSettings();
          })
        );
        new Setting(containerEl).setName("Max Width (px)").setDesc(`Maximum horizontal width for wide diagrams (${this.plugin.settings.maxWidth}px).`).addSlider(
          (slider) => slider.setLimits(360, 1080, 20).setValue(this.plugin.settings.maxWidth).setDynamicTooltip().onChange(async (val) => {
            this.plugin.settings.maxWidth = val;
            await this.plugin.saveSettings();
          })
        );
        new Setting(containerEl).setName("Min Readable Scale").setDesc("Minimum scale floor so ultra-tall flowcharts stay legible and trigger height collapse instead.").addSlider(
          (slider) => slider.setLimits(0.4, 0.8, 0.02).setValue(this.plugin.settings.minReadableScale).setDynamicTooltip().onChange(async (val) => {
            this.plugin.settings.minReadableScale = val;
            await this.plugin.saveSettings();
          })
        );
        containerEl.createEl("h3", { text: "Appearance & Palette (7 Groups \xB7 29 Themes)" });
        const activeThemeSpec = THEMES2[this.plugin.settings.theme] || THEMES2.claude;
        if (!this._selectedGroup) {
          this._selectedGroup = activeThemeSpec.group || "Styled";
        }
        const gallery = containerEl.createDiv({ cls: "mb-theme-gallery" });
        const groupRow = gallery.createDiv({ cls: "mb-theme-group-row" });
        THEME_GROUPS.forEach((grp) => {
          const gBtn = groupRow.createEl("button", {
            text: grp,
            cls: `mb-theme-group-btn ${this._selectedGroup === grp ? "is-active" : ""}`
          });
          gBtn.type = "button";
          gBtn.addEventListener("click", () => {
            this._selectedGroup = grp;
            this.display();
          });
        });
        const cardsGrid = gallery.createDiv({ cls: "mb-theme-cards-grid" });
        Object.entries(THEMES2).filter(([, spec]) => spec.group === this._selectedGroup).forEach(([key, spec]) => {
          const card = cardsGrid.createDiv({
            cls: `mb-theme-card ${this.plugin.settings.theme === key ? "is-active" : ""}`
          });
          card.style.backgroundColor = spec.light.cardBg;
          if (spec.cardBgImage && spec.cardBgImage !== "none") {
            card.style.backgroundImage = spec.cardBgImage;
            card.style.backgroundSize = spec.cardBgSize || "auto";
          }
          card.style.color = spec.light.cardFg;
          card.style.fontFamily = spec.fontFamily;
          const header = card.createDiv({ cls: "mb-theme-card-header" });
          header.createSpan({ text: spec.title, cls: "mb-theme-card-title" });
          header.createSpan({ text: spec.note, cls: "mb-theme-card-note" });
          const preview = card.createDiv({ cls: "mb-theme-card-preview" });
          const sampleA = preview.createDiv({
            text: "Order",
            cls: "mb-theme-card-node"
          });
          sampleA.style.backgroundColor = spec.light.rootNode.fill;
          sampleA.style.borderColor = spec.light.rootNode.stroke;
          sampleA.style.borderWidth = spec.nodeStrokeWidth || "1.5px";
          sampleA.style.borderRadius = `${spec.defaultRadius}px`;
          sampleA.style.color = spec.light.rootNode.text;
          const arrow = preview.createSpan({ text: "\u2192" });
          arrow.style.color = spec.light.edge.stroke;
          arrow.style.fontWeight = "700";
          const sampleB = preview.createDiv({
            text: "Ship",
            cls: "mb-theme-card-node"
          });
          const secSpec = spec.light.nodeCycle && spec.light.nodeCycle[1] || spec.light.cluster || spec.light.rootNode;
          sampleB.style.backgroundColor = secSpec.fill;
          sampleB.style.borderColor = secSpec.stroke;
          sampleB.style.borderWidth = spec.nodeStrokeWidth || "1.5px";
          sampleB.style.borderRadius = `${spec.defaultRadius}px`;
          sampleB.style.color = secSpec.text;
          card.addEventListener("click", async () => {
            this.plugin.settings.theme = key;
            this.plugin.settings.nodeRadius = spec.defaultRadius;
            await this.plugin.saveSettings();
            this.display();
          });
        });
        new Setting(containerEl).setName("Theme Palette").setDesc("Select from all 29 themes across the 7 groups (Styled, Developer, Paper & print, Retro & playful, Brand-inspired, Functional, Built-in).").addDropdown((dropdown) => {
          Object.entries(THEMES2).forEach(([key, spec]) => {
            dropdown.addOption(key, spec.name);
          });
          dropdown.setValue(this.plugin.settings.theme).onChange(async (val) => {
            this.plugin.settings.theme = val;
            if (THEMES2[val]) {
              this._selectedGroup = THEMES2[val].group;
              if (Number.isFinite(THEMES2[val].defaultRadius)) {
                this.plugin.settings.nodeRadius = THEMES2[val].defaultRadius;
              }
            }
            await this.plugin.saveSettings();
            this.display();
          });
        });
        new Setting(containerEl).setName("Multi-Tone Hierarchy").setDesc("Automatically distinguish root, branch, and leaf nodes by graph topology.").addToggle(
          (toggle) => toggle.setValue(this.plugin.settings.multiToneNodes).onChange(async (val) => {
            this.plugin.settings.multiToneNodes = val;
            await this.plugin.saveSettings();
          })
        );
        new Setting(containerEl).setName("Node Corner Radius").setDesc("Rounded corner radius for diagram nodes and cards.").addSlider(
          (slider) => slider.setLimits(0, 16, 1).setValue(
            Number.isFinite(this.plugin.settings.nodeRadius) ? this.plugin.settings.nodeRadius : activeThemeSpec.defaultRadius ?? 6
          ).setDynamicTooltip().onChange(async (val) => {
            this.plugin.settings.nodeRadius = val;
            await this.plugin.saveSettings();
          })
        );
        new Setting(containerEl).setName("Trim Pie Padding").setDesc("Automatically crop excessive horizontal whitespace around Mermaid pie charts.").addToggle(
          (toggle) => toggle.setValue(this.plugin.settings.trimPiePadding).onChange(async (val) => {
            this.plugin.settings.trimPiePadding = val;
            await this.plugin.saveSettings();
          })
        );
        new Setting(containerEl).setName("Card Frame").setDesc("Display themed card frame with rounded border and background container around diagrams.").addToggle(
          (toggle) => toggle.setValue(this.plugin.settings.showCardFrame).onChange(async (val) => {
            this.plugin.settings.showCardFrame = val;
            await this.plugin.saveSettings();
          })
        );
        new Setting(containerEl).setName("Dot Grid").setDesc("Display subtle dot-grid canvas background inside diagram cards.").addToggle(
          (toggle) => toggle.setValue(this.plugin.settings.showDotGrid).onChange(async (val) => {
            this.plugin.settings.showDotGrid = val;
            await this.plugin.saveSettings();
          })
        );
        new Setting(containerEl).setName("Auto-Collapse Tall Diagrams").setDesc("Collapse ultra-tall vertical diagrams to Max Height with a one-click Expand/Collapse bar.").addToggle(
          (toggle) => toggle.setValue(this.plugin.settings.autoCollapseTall).onChange(async (val) => {
            this.plugin.settings.autoCollapseTall = val;
            await this.plugin.saveSettings();
          })
        );
        new Setting(containerEl).setName("Double-Click Fullscreen").setDesc("Double-click any diagram to open the interactive pan & zoom lightbox.").addToggle(
          (toggle) => toggle.setValue(this.plugin.settings.doubleClickFullscreen).onChange(async (val) => {
            this.plugin.settings.doubleClickFullscreen = val;
            await this.plugin.saveSettings();
          })
        );
      }
    };
    module2.exports = {
      SIZE_PRESETS: SIZE_PRESETS2,
      DEFAULT_SETTINGS: DEFAULT_SETTINGS2,
      MermaidBoostSettingTab: MermaidBoostSettingTab2
    };
  }
});

// src/sizing.js
var require_sizing = __commonJS({
  "src/sizing.js"(exports2, module2) {
    "use strict";
    var { SIZE_PRESETS: SIZE_PRESETS2, DEFAULT_SETTINGS: DEFAULT_SETTINGS2 } = require_settings();
    var DIAGRAM_TYPE_LABELS = {
      flowchart: "Flowchart",
      pie: "Pie",
      gantt: "Gantt",
      sequence: "Sequence",
      state: "State",
      mindmap: "Mindmap",
      class: "Class",
      er: "ER",
      other: "Mermaid"
    };
    function extractSvgNaturalSize2(svg) {
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
      const viewBoxAttr = typeof svg.getAttribute === "function" ? svg.getAttribute("viewBox") : null;
      if (viewBoxAttr) {
        const parts = viewBoxAttr.trim().split(/[\s,]+/).map(Number);
        if (parts.length === 4 && parts.every((n) => Number.isFinite(n)) && parts[2] > 0 && parts[3] > 0) {
          return {
            x: parts[0],
            y: parts[1],
            width: parts[2],
            height: parts[3]
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
            height: vb.height
          };
        }
      }
      const attrW = parseFloat(
        typeof svg.getAttribute === "function" && svg.getAttribute("width") || ""
      );
      const attrH = parseFloat(
        typeof svg.getAttribute === "function" && svg.getAttribute("height") || ""
      );
      if (attrW > 0 && attrH > 0) {
        return { x: 0, y: 0, width: attrW, height: attrH };
      }
      const styleMaxW = svg.style && svg.style.maxWidth ? parseFloat(svg.style.maxWidth) : NaN;
      if (Number.isFinite(styleMaxW) && styleMaxW > 0) {
        return { x: 0, y: 0, width: styleMaxW, height: Math.round(styleMaxW * 0.65) };
      }
      return null;
    }
    function detectDiagramType2(svg, naturalSize) {
      if (!svg) {
        return { type: "other", orientation: "horizontal", label: DIAGRAM_TYPE_LABELS.other };
      }
      const role = (typeof svg.getAttribute === "function" && (svg.getAttribute("aria-roledescription") || svg.getAttribute("class")) || "").toLowerCase();
      const q = (sel) => typeof svg.querySelector === "function" ? svg.querySelector(sel) : null;
      let type = "other";
      if (role.includes("pie") || q(".pieCircle") || q(".pieTitleText")) {
        type = "pie";
      } else if (role.includes("gantt") || q(".grid .tick") && q(".task")) {
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
      } else if (role.includes("flowchart") || role.includes("graph") || q(".node") || q(".edgePath") || q(".flowchart-link")) {
        type = "flowchart";
      }
      const size = naturalSize || extractSvgNaturalSize2(svg) || { width: 400, height: 300 };
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
        label: DIAGRAM_TYPE_LABELS[type] || DIAGRAM_TYPE_LABELS.other
      };
    }
    function tightenPieViewBox2(svg, naturalSize) {
      if (!svg || !naturalSize) return naturalSize;
      const { x, y, width, height } = naturalSize;
      if (typeof svg.getBBox === "function") {
        try {
          const bbox = svg.getBBox();
          if (bbox && Number.isFinite(bbox.width) && Number.isFinite(bbox.height) && bbox.width > 80 && bbox.height > 80 && bbox.width < width * 0.94) {
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
    function computeSmartDiagramSize2(naturalSize, diagramMeta, settings = {}, containerWidth = 0) {
      const merged = Object.assign({}, DEFAULT_SETTINGS2, settings);
      const preset = SIZE_PRESETS2[merged.sizePreset] || SIZE_PRESETS2.compact;
      const baseScale = merged.sizePreset === "original" ? 1 : Number.isFinite(merged.baseScale) && merged.baseScale > 0 ? merged.baseScale : preset.baseScale;
      let maxHeight = merged.sizePreset === "original" ? 2400 : Number.isFinite(merged.maxHeight) && merged.maxHeight > 0 ? merged.maxHeight : preset.maxHeight;
      let maxWidth = merged.sizePreset === "original" ? 1600 : Number.isFinite(merged.maxWidth) && merged.maxWidth > 0 ? merged.maxWidth : preset.maxWidth;
      const minReadableScale = merged.sizePreset === "original" ? 1 : Number.isFinite(merged.minReadableScale) && merged.minReadableScale > 0 ? merged.minReadableScale : preset.minReadableScale;
      const natW = Math.max(1, naturalSize && naturalSize.width || 400);
      const natH = Math.max(1, naturalSize && naturalSize.height || 300);
      const type = diagramMeta && diagramMeta.type || "flowchart";
      if (merged.sizePreset !== "original") {
        if (type === "pie") {
          maxHeight = Math.min(maxHeight, merged.sizePreset === "compact" ? 235 : 280);
          maxWidth = Math.min(maxWidth, merged.sizePreset === "compact" ? 430 : 500);
        } else if (type === "gantt") {
          maxHeight = Math.min(maxHeight, merged.sizePreset === "compact" ? 260 : 320);
          maxWidth = Math.max(maxWidth, 640);
        }
      }
      const effectiveContainerW = containerWidth && containerWidth > 140 ? Math.max(120, containerWidth - 32) : maxWidth;
      const availableWidth = Math.min(maxWidth, effectiveContainerW);
      const scaleW = availableWidth / natW;
      const scaleH = maxHeight / natH;
      const idealScale = Math.min(baseScale, scaleW, scaleH);
      const readableFloor = Math.min(scaleW, Math.max(minReadableScale, idealScale));
      const finalScale = Math.max(0.15, Math.min(1.5, readableFloor));
      const renderWidth = Math.max(40, Math.round(natW * finalScale));
      const renderHeight = Math.max(30, Math.round(natH * finalScale));
      const needsHeightCollapse = Boolean(merged.autoCollapseTall) && merged.sizePreset !== "original" && renderHeight > maxHeight * 1.12;
      return {
        naturalWidth: natW,
        naturalHeight: natH,
        width: renderWidth,
        height: renderHeight,
        scale: Number(finalScale.toFixed(3)),
        maxHeight,
        maxWidth: availableWidth,
        needsHeightCollapse,
        collapsedHeight: needsHeightCollapse ? maxHeight : renderHeight
      };
    }
    module2.exports = {
      DIAGRAM_TYPE_LABELS,
      extractSvgNaturalSize: extractSvgNaturalSize2,
      detectDiagramType: detectDiagramType2,
      tightenPieViewBox: tightenPieViewBox2,
      computeSmartDiagramSize: computeSmartDiagramSize2
    };
  }
});

// src/beautify.js
var require_beautify = __commonJS({
  "src/beautify.js"(exports2, module2) {
    "use strict";
    var { resolveThemeSpec: resolveThemeSpec2 } = require_themes();
    var { tightenPieViewBox: tightenPieViewBox2, extractSvgNaturalSize: extractSvgNaturalSize2 } = require_sizing();
    var { DEFAULT_SETTINGS: DEFAULT_SETTINGS2 } = require_settings();
    function hasExplicitUserStyle(el) {
      if (!el || typeof el.getAttribute !== "function") return false;
      if (el.dataset && el.dataset.mbUserCustom !== void 0) {
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
        "transparent"
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
    function classifyGraphTopology(svg) {
      const result = /* @__PURE__ */ new Map();
      if (!svg || typeof svg.querySelectorAll !== "function") return result;
      const nodes = Array.from(svg.querySelectorAll(".node"));
      if (nodes.length === 0) return result;
      const nodeIds = [];
      const nodeKeyMap = /* @__PURE__ */ new Map();
      const nodeOrderMap = /* @__PURE__ */ new Map();
      nodes.forEach((node, idx) => {
        const rawId = typeof node.getAttribute === "function" && (node.getAttribute("data-id") || node.getAttribute("id")) || `node_${idx}`;
        const cleanMatch = rawId.match(/^flowchart-(.+?)-\d+$/);
        const key = cleanMatch ? cleanMatch[1] : rawId;
        nodeIds.push(key);
        nodeKeyMap.set(key, node);
        nodeOrderMap.set(key, idx);
      });
      const adj = new Map(nodeIds.map((k) => [k, /* @__PURE__ */ new Set()]));
      const rev = new Map(nodeIds.map((k) => [k, /* @__PURE__ */ new Set()]));
      const edges = Array.from(
        svg.querySelectorAll(".edgePath, .flowchart-link, path[data-edge], g.edgePaths > g")
      );
      const keySet = new Set(nodeIds);
      const sortedKeys = [...nodeIds].sort((a, b) => b.length - a.length);
      edges.forEach((edge) => {
        const idStr = typeof edge.getAttribute === "function" && (edge.getAttribute("id") || edge.getAttribute("class")) || "";
        if (!idStr) return;
        const lsMatch = idStr.match(/LS-(.+?)[-_]LE-(.+?)(?:$|[-_\s])/);
        if (lsMatch && keySet.has(lsMatch[1]) && keySet.has(lsMatch[2])) {
          adj.get(lsMatch[1]).add(lsMatch[2]);
          rev.get(lsMatch[2]).add(lsMatch[1]);
          return;
        }
        const lMatch = idStr.match(/(?:flowchart|L)[-_](.+?)[-_](.+?)(?:[-_]\d+)?$/);
        if (lMatch && keySet.has(lMatch[1]) && keySet.has(lMatch[2])) {
          adj.get(lMatch[1]).add(lMatch[2]);
          rev.get(lMatch[2]).add(lMatch[1]);
          return;
        }
        let matched = false;
        for (const src of sortedKeys) {
          if (!idStr.includes(src)) continue;
          for (const dst of sortedKeys) {
            if (src === dst) continue;
            if (idStr.includes(`-${src}-${dst}`) || idStr.includes(`_${src}_${dst}`) || idStr.includes(`LS-${src}`) && idStr.includes(`LE-${dst}`)) {
              adj.get(src).add(dst);
              rev.get(dst).add(src);
              matched = true;
              break;
            }
          }
          if (matched) break;
        }
      });
      const anyEdgeMatched = Array.from(rev.values()).some((s) => s.size > 0);
      const depthMap = /* @__PURE__ */ new Map();
      const branchGroupMap = /* @__PURE__ */ new Map();
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
      const sinks = anyEdgeMatched ? nodeIds.filter((k) => adj.get(k).size === 0 && rev.get(k).size > 0) : [];
      const hasSingleConvergenceSink = sinks.length === 1 && nodes.length >= 3;
      nodes.forEach((node, idx) => {
        const key = nodeIds[idx];
        const depth = depthMap.has(key) ? depthMap.get(key) : idx === 0 ? 0 : 1;
        const branchGroup = branchGroupMap.has(key) ? branchGroupMap.get(key) : Math.max(0, idx - 1);
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
          key
        });
      });
      return result;
    }
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
    function beautifySvgDom2(svg, settings = {}, isDark = false) {
      if (!svg || typeof svg.querySelectorAll !== "function") return;
      const merged = Object.assign({}, DEFAULT_SETTINGS2, settings);
      const { themeKey, themeObj, palette } = resolveThemeSpec2(merged, isDark);
      const radius = typeof settings.nodeRadius === "number" && Number.isFinite(settings.nodeRadius) ? settings.nodeRadius : Number.isFinite(themeObj.defaultRadius) ? themeObj.defaultRadius : Number.isFinite(merged.nodeRadius) ? merged.nodeRadius : 6;
      const svgFilter = themeObj.svgFilter || "none";
      const fontFamily = themeObj.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif';
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
          const parts = vbAttr.trim().split(/[\s,]+/).map(Number);
          if (parts.length === 4 && parts.every(Number.isFinite) && parts[2] > 0 && parts[3] > 0) {
            const padX = 20;
            const padY = 14;
            const nextVb = `${parts[0] - padX} ${parts[1] - padY} ${parts[2] + padX * 2} ${parts[3] + padY * 2}`;
            svg.setAttribute("viewBox", nextVb);
            svg.dataset.mbViewBoxPadded = "true";
          }
        }
      }
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
      const needsTopology = Boolean(merged.multiToneNodes || palette && palette.nodeMap);
      const topology = needsTopology ? classifyGraphTopology(svg) : /* @__PURE__ */ new Map();
      const sectionList = palette.sectionPalettes || palette.branchPalettes;
      const detailList = palette.detailPalettes || palette.branchPalettes;
      const nodes = Array.from(svg.querySelectorAll(".node, .statediagram-state"));
      nodes.forEach((node, idx) => {
        const info = topology.get(node) || {
          tier: idx === 0 ? "root" : "detail",
          branchGroup: Math.max(0, idx - 1),
          paletteIndex: Math.max(0, idx - 1) % detailList.length,
          key: `node_${idx}`
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
              const origW = parseFloat(fo.getAttribute && fo.getAttribute("width") || "0");
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
              const origRw = parseFloat(shape.getAttribute && shape.getAttribute("width") || "0");
              const origRx = parseFloat(shape.getAttribute && shape.getAttribute("x") || "0");
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
    module2.exports = {
      hasExplicitUserStyle,
      applyStyleProp,
      classifyGraphTopology,
      ensureDropShadowFilter,
      beautifySvgDom: beautifySvgDom2
    };
  }
});

// src/export.js
var require_export = __commonJS({
  "src/export.js"(exports2, module2) {
    "use strict";
    var Notice2;
    try {
      Notice2 = require("obsidian").Notice;
    } catch (_err) {
      Notice2 = class {
      };
    }
    var { extractSvgNaturalSize: extractSvgNaturalSize2 } = require_sizing();
    var { resolveThemeSpec: resolveThemeSpec2 } = require_themes();
    var { beautifySvgDom: beautifySvgDom2, applyStyleProp } = require_beautify();
    function resolveLiveCssColor2(val, fallback = "#ffffff") {
      if (!val || typeof val !== "string") return fallback;
      const trimmed = val.trim();
      if (!trimmed.includes("var(") && !trimmed.includes("color-mix(")) {
        return trimmed;
      }
      if (typeof document === "undefined" || !document.body) return fallback;
      try {
        const probe = document.createElement("div");
        probe.style.position = "fixed";
        probe.style.left = "-9999px";
        probe.style.visibility = "hidden";
        probe.style.color = trimmed;
        document.body.appendChild(probe);
        const computed = window.getComputedStyle(probe).color;
        probe.remove();
        return computed && computed !== "rgba(0, 0, 0, 0)" ? computed : fallback;
      } catch (_e) {
        return fallback;
      }
    }
    async function exportSvgAsPng2(svg, settings = {}, isDark) {
      const dark = typeof isDark === "boolean" ? isDark : typeof document !== "undefined" && document.body && document.body.classList.contains("theme-dark");
      try {
        beautifySvgDom2(svg, settings, dark);
        let nat = null;
        const currentVb = typeof svg.getAttribute === "function" ? svg.getAttribute("viewBox") : null;
        if (currentVb) {
          const parts = currentVb.trim().split(/[\s,]+/).map(Number);
          if (parts.length === 4 && parts.every(Number.isFinite) && parts[2] > 0 && parts[3] > 0) {
            nat = { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
          }
        }
        if (!nat) {
          nat = extractSvgNaturalSize2(svg) || { x: 0, y: 0, width: 640, height: 420 };
        }
        const scale = 3;
        const { themeObj, palette } = resolveThemeSpec2(settings, dark);
        const resolvedCardBg = resolveLiveCssColor2(
          palette.cardBg,
          dark ? "#191919" : "#FAF9F5"
        );
        const resolvedCardBorder = resolveLiveCssColor2(
          palette.cardBorder,
          dark ? "#3D3934" : "#D8D2C6"
        );
        const resolvedGridDot = resolveLiveCssColor2(
          palette.gridDot,
          dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"
        );
        const fontFamily = themeObj.fontFamily || '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei UI", sans-serif';
        const clone = svg.cloneNode(true);
        clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        clone.style.setProperty("width", `${nat.width}px`);
        clone.style.setProperty("height", `${nat.height}px`);
        clone.setAttribute("width", String(nat.width));
        clone.setAttribute("height", String(nat.height));
        const colorProps = ["fill", "stroke", "color", "backgroundColor", "borderColor"];
        const allEls = [clone, ...Array.from(clone.querySelectorAll("*"))];
        allEls.forEach((el) => {
          if (el.style) {
            for (const prop of colorProps) {
              const rawVal = el.style[prop];
              if (rawVal && (rawVal.includes("var(") || rawVal.includes("color-mix("))) {
                const resolved = resolveLiveCssColor2(rawVal, "");
                if (resolved) {
                  applyStyleProp(el, prop, resolved);
                }
              }
            }
          }
          if (typeof el.getAttribute === "function") {
            for (const attr of ["fill", "stroke"]) {
              const attrVal = el.getAttribute(attr);
              if (attrVal && (attrVal.includes("var(") || attrVal.includes("color-mix("))) {
                const resolved = resolveLiveCssColor2(attrVal, "");
                if (resolved) {
                  el.setAttribute(attr, resolved);
                }
              }
            }
          }
        });
        const styleEl = document.createElementNS("http://www.w3.org/2000/svg", "style");
        styleEl.textContent = `
      svg, text, .nodeLabel, .edgeLabel, .label, foreignObject div, foreignObject span {
        font-family: ${fontFamily} !important;
        line-height: 1.42 !important;
        letter-spacing: 0.01em !important;
      }
      foreignObject {
        overflow: visible !important;
      }
    `;
        clone.insertBefore(styleEl, clone.firstChild);
        const xml = new XMLSerializer().serializeToString(clone);
        const dataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = dataUrl;
        });
        const pad = 32;
        const totalW = nat.width + pad * 2;
        const totalH = nat.height + pad * 2;
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(totalW * scale);
        canvas.height = Math.round(totalH * scale);
        const ctx = canvas.getContext("2d");
        ctx.scale(scale, scale);
        ctx.fillStyle = resolvedCardBg;
        ctx.fillRect(0, 0, totalW, totalH);
        if (settings.showDotGrid !== false) {
          ctx.save();
          if (settings.theme === "swiss-mono") {
            ctx.strokeStyle = resolvedGridDot;
            ctx.lineWidth = 0.75;
            const step = 20;
            for (let x = step; x < totalW; x += step) {
              ctx.beginPath();
              ctx.moveTo(x, 0);
              ctx.lineTo(x, totalH);
              ctx.stroke();
            }
            for (let y = step; y < totalH; y += step) {
              ctx.beginPath();
              ctx.moveTo(0, y);
              ctx.lineTo(totalW, y);
              ctx.stroke();
            }
          } else {
            ctx.fillStyle = resolvedGridDot;
            const step = 18;
            for (let x = 12; x < totalW; x += step) {
              for (let y = 12; y < totalH; y += step) {
                ctx.beginPath();
                ctx.arc(x, y, 1.05, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
          ctx.restore();
        }
        ctx.strokeStyle = resolvedCardBorder;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(0.75, 0.75, totalW - 1.5, totalH - 1.5);
        ctx.drawImage(img, pad, pad, nat.width, nat.height);
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
        if (blob && navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          new Notice2(`Copied 3x HD PNG (${themeObj.name})`);
        } else if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `mermaid-${settings.theme}-${Date.now()}.png`;
          a.click();
          URL.revokeObjectURL(url);
          new Notice2("Downloaded 3x HD PNG");
        }
      } catch (err) {
        console.error("Mermaid Boost PNG export error:", err);
        new Notice2("Failed to export PNG");
      }
    }
    module2.exports = {
      resolveLiveCssColor: resolveLiveCssColor2,
      exportSvgAsPng: exportSvgAsPng2
    };
  }
});

// src/lightbox.js
var require_lightbox = __commonJS({
  "src/lightbox.js"(exports2, module2) {
    "use strict";
    var setIcon2;
    var Notice2;
    try {
      const obsidian = require("obsidian");
      setIcon2 = obsidian.setIcon;
      Notice2 = obsidian.Notice;
    } catch (_err) {
      setIcon2 = () => {
      };
      Notice2 = class {
      };
    }
    var { extractSvgNaturalSize: extractSvgNaturalSize2 } = require_sizing();
    var { THEMES: THEMES2, nextThemeKey: nextThemeKey2 } = require_themes();
    var { beautifySvgDom: beautifySvgDom2 } = require_beautify();
    function openFullscreenLightbox2(sourceSvg, diagramMeta, options = {}) {
      const {
        settings = {},
        saveSettings = async () => {
        },
        exportSvgAsPng: exportSvgAsPng2 = async () => {
        },
        cycleTheme,
        onClose
      } = options;
      const nat = extractSvgNaturalSize2(sourceSvg) || { width: 640, height: 420 };
      const overlay = document.createElement("div");
      overlay.className = "mb-lightbox-overlay";
      const header = document.createElement("div");
      header.className = "mb-lightbox-header";
      const titleEl = document.createElement("div");
      titleEl.className = "mb-lightbox-title";
      titleEl.textContent = `${diagramMeta.label} \u2014 Fullscreen (Wheel: Zoom \xB7 Drag: Pan \xB7 Esc: Close)`;
      header.appendChild(titleEl);
      const actions = document.createElement("div");
      actions.className = "mb-lightbox-actions";
      const scaleReadout = document.createElement("span");
      scaleReadout.className = "mb-lightbox-scale";
      scaleReadout.textContent = "100%";
      const state = {
        scale: 1,
        tx: 0,
        ty: 0,
        dragging: false,
        startX: 0,
        startY: 0
      };
      const viewport = document.createElement("div");
      viewport.className = "mb-lightbox-viewport";
      const stage = document.createElement("div");
      stage.className = "mb-lightbox-stage";
      const svgClone = sourceSvg.cloneNode(true);
      svgClone.style.setProperty("width", `${nat.width}px`, "important");
      svgClone.style.setProperty("height", `${nat.height}px`, "important");
      svgClone.style.setProperty("max-width", "none", "important");
      stage.appendChild(svgClone);
      viewport.appendChild(stage);
      const syncTransform = () => {
        stage.style.transform = `translate(${state.tx}px, ${state.ty}px) scale(${state.scale})`;
        scaleReadout.textContent = `${Math.round(state.scale * 100)}%`;
      };
      const fitToScreen = () => {
        const vw = viewport.clientWidth || window.innerWidth - 80;
        const vh = viewport.clientHeight || window.innerHeight - 140;
        const pad = 64;
        const fitScale = Math.min(
          (vw - pad) / Math.max(1, nat.width),
          (vh - pad) / Math.max(1, nat.height),
          1.6
        );
        state.scale = Math.max(0.25, Number(fitScale.toFixed(3)));
        state.tx = Math.round((vw - nat.width * state.scale) / 2);
        state.ty = Math.round((vh - nat.height * state.scale) / 2);
        syncTransform();
      };
      const zoomAt = (factor, cx, cy) => {
        const next = Math.max(0.15, Math.min(5, state.scale * factor));
        const ratio = next / state.scale;
        state.tx = cx - (cx - state.tx) * ratio;
        state.ty = cy - (cy - state.ty) * ratio;
        state.scale = next;
        syncTransform();
      };
      const makeBtn = (icon, label, cb, extraCls = "") => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = `mb-icon-btn ${extraCls}`;
        b.title = label;
        setIcon2(b, icon);
        b.addEventListener("click", (e) => {
          e.stopPropagation();
          cb();
        });
        actions.appendChild(b);
      };
      const themeBtn = document.createElement("button");
      themeBtn.type = "button";
      themeBtn.className = "mb-lightbox-theme-btn";
      const updateThemeBtnText = () => {
        const activeTheme = THEMES2[settings.theme] || THEMES2["claude-anthropic"] || THEMES2.claude;
        themeBtn.textContent = `\u{1F3A8} ${activeTheme.name}`;
        themeBtn.title = "Click to switch theme live (T)";
      };
      updateThemeBtnText();
      themeBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        let nextKey;
        if (typeof cycleTheme === "function") {
          nextKey = await cycleTheme();
        } else {
          nextKey = nextThemeKey2(settings.theme);
          settings.theme = nextKey;
          if (THEMES2[nextKey] && Number.isFinite(THEMES2[nextKey].defaultRadius)) {
            settings.nodeRadius = THEMES2[nextKey].defaultRadius;
          }
          await saveSettings();
          new Notice2(`Theme: ${THEMES2[nextKey].name}`);
        }
        const isDark = typeof document !== "undefined" && document.body && document.body.classList.contains("theme-dark");
        beautifySvgDom2(svgClone, settings, isDark);
        updateThemeBtnText();
      });
      actions.appendChild(themeBtn);
      makeBtn(
        "minus",
        "Zoom Out (-)",
        () => zoomAt(0.82, viewport.clientWidth / 2, viewport.clientHeight / 2)
      );
      actions.appendChild(scaleReadout);
      makeBtn(
        "plus",
        "Zoom In (+)",
        () => zoomAt(1.22, viewport.clientWidth / 2, viewport.clientHeight / 2)
      );
      makeBtn("rotate-ccw", "Fit to Screen (0)", fitToScreen);
      makeBtn("camera", "Copy HD PNG", () => exportSvgAsPng2(svgClone));
      let closed = false;
      const closeLightbox = () => {
        if (closed) return;
        closed = true;
        window.removeEventListener("keydown", onKeyDown);
        overlay.remove();
        if (typeof onClose === "function") {
          onClose();
        }
      };
      makeBtn("x", "Close (Esc)", closeLightbox, "mb-close-btn");
      header.appendChild(actions);
      overlay.appendChild(header);
      overlay.appendChild(viewport);
      document.body.appendChild(overlay);
      viewport.addEventListener(
        "wheel",
        (e) => {
          e.preventDefault();
          const rect = viewport.getBoundingClientRect();
          const mx = e.clientX - rect.left;
          const my = e.clientY - rect.top;
          const factor = e.deltaY < 0 ? 1.12 : 0.89;
          zoomAt(factor, mx, my);
        },
        { passive: false }
      );
      viewport.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        state.dragging = true;
        state.startX = e.clientX - state.tx;
        state.startY = e.clientY - state.ty;
        viewport.setPointerCapture(e.pointerId);
        viewport.classList.add("is-dragging");
      });
      viewport.addEventListener("pointermove", (e) => {
        if (!state.dragging) return;
        state.tx = e.clientX - state.startX;
        state.ty = e.clientY - state.startY;
        syncTransform();
      });
      const stopDrag = () => {
        state.dragging = false;
        viewport.classList.remove("is-dragging");
      };
      viewport.addEventListener("pointerup", stopDrag);
      viewport.addEventListener("pointercancel", stopDrag);
      const onKeyDown = (e) => {
        if (e.key === "Escape") closeLightbox();
        else if (e.key === "+" || e.key === "=")
          zoomAt(1.2, viewport.clientWidth / 2, viewport.clientHeight / 2);
        else if (e.key === "-" || e.key === "_")
          zoomAt(0.82, viewport.clientWidth / 2, viewport.clientHeight / 2);
        else if (e.key === "0") fitToScreen();
      };
      window.addEventListener("keydown", onKeyDown);
      window.requestAnimationFrame(fitToScreen);
      return closeLightbox;
    }
    module2.exports = {
      openFullscreenLightbox: openFullscreenLightbox2
    };
  }
});

// src/main.js
var { Plugin, Notice, setIcon } = require("obsidian");
var { SIZE_PRESETS, DEFAULT_SETTINGS, MermaidBoostSettingTab } = require_settings();
var {
  extractSvgNaturalSize,
  detectDiagramType,
  tightenPieViewBox,
  computeSmartDiagramSize
} = require_sizing();
var { THEMES, resolveThemeSpec, LEGACY_THEME_MAP, nextThemeKey } = require_themes();
var { beautifySvgDom } = require_beautify();
var { resolveLiveCssColor, exportSvgAsPng } = require_export();
var { openFullscreenLightbox } = require_lightbox();
var MermaidBoostPlugin = class extends Plugin {
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new MermaidBoostSettingTab(this.app, this));
    this.applyGlobalThemeVariables();
    this.setupMutationObserver();
    this.app.workspace.onLayoutReady(() => {
      this.refreshAllMermaidBlocks();
    });
    this.registerEvent(
      this.app.workspace.on("layout-change", () => this.refreshAllMermaidBlocks())
    );
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => this.refreshAllMermaidBlocks())
    );
    this.registerEvent(
      this.app.workspace.on("file-open", () => {
        window.setTimeout(() => this.refreshAllMermaidBlocks(), 120);
      })
    );
    this.registerEvent(
      this.app.workspace.on("css-change", () => {
        this.applyGlobalThemeVariables();
        this.refreshAllMermaidBlocks(true);
      })
    );
    this._onResize = () => {
      if (this._resizeTimer) window.clearTimeout(this._resizeTimer);
      this._resizeTimer = window.setTimeout(() => this.refreshAllMermaidBlocks(), 150);
    };
    window.addEventListener("resize", this._onResize);
    this.addCommand({
      id: "cycle-theme",
      name: "Cycle Theme Palette",
      callback: () => this.cycleTheme()
    });
    this.addCommand({
      id: "refresh-all-mermaid",
      name: "Refresh All Diagrams",
      callback: () => {
        this.refreshAllMermaidBlocks(true);
        new Notice("Mermaid diagrams refreshed");
      }
    });
  }
  onunload() {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
    if (this._flushTimer) {
      window.clearTimeout(this._flushTimer);
    }
    if (this._onCalloutClick) {
      document.removeEventListener("click", this._onCalloutClick, true);
    }
    if (this._onResize) {
      window.removeEventListener("resize", this._onResize);
    }
    if (this._resizeTimer) {
      window.clearTimeout(this._resizeTimer);
    }
    if (this._openLightboxes) {
      this._openLightboxes.forEach((close) => {
        try {
          close();
        } catch (_e) {
        }
      });
      this._openLightboxes.clear();
    }
    document.querySelectorAll(".mb-lightbox-overlay").forEach((el) => el.remove());
    document.body.classList.remove(
      "mermaid-boost-enabled",
      "mermaid-boost-dot-grid",
      "mermaid-boost-frame"
    );
    const blocks = document.querySelectorAll(".mermaid-boost-card");
    blocks.forEach((block) => {
      block.classList.remove(
        "mermaid-boost-card",
        "is-mb-collapsible",
        "is-mb-expanded"
      );
      const toolbar = block.querySelector(":scope > .mb-toolbar");
      if (toolbar) toolbar.remove();
      const expandBar = block.querySelector(":scope > .mb-expand-bar");
      if (expandBar) expandBar.remove();
      const svg = block.querySelector("svg");
      if (svg) {
        if (svg.dataset.mbOrigViewBox) {
          svg.setAttribute("viewBox", svg.dataset.mbOrigViewBox);
        }
        delete svg.dataset.mbInitialized;
        delete svg.dataset.mbDblClickBound;
        delete svg.dataset.mbOrigViewBox;
        delete svg.dataset.mbNaturalWidth;
        delete svg.dataset.mbNaturalHeight;
        delete svg.dataset.mbNaturalX;
        delete svg.dataset.mbNaturalY;
        delete svg.dataset.mbViewBoxPadded;
        delete svg.dataset.mbStyledTheme;
        if (svg.style && typeof svg.style.removeProperty === "function") {
          svg.style.removeProperty("width");
          svg.style.removeProperty("height");
          svg.style.removeProperty("max-width");
        }
      }
      if (block.dataset) {
        delete block.dataset.mbDiagramType;
        delete block.dataset.mbOrientation;
        delete block.dataset.mbZoomFactor;
        delete block.dataset.mbPresetOverride;
      }
    });
    if (typeof document !== "undefined" && document.body && document.body.dataset) {
      delete document.body.dataset.mbTheme;
      delete document.body.dataset.mbHasPattern;
    }
  }
  async cycleTheme() {
    const nextKey = nextThemeKey(this.settings.theme);
    this.settings.theme = nextKey;
    const themeDef = THEMES[nextKey];
    if (themeDef && Number.isFinite(themeDef.defaultRadius)) {
      this.settings.nodeRadius = themeDef.defaultRadius;
    }
    await this.saveSettings();
    new Notice(`Mermaid Boost theme: ${themeDef ? themeDef.name : nextKey}`);
    return nextKey;
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    if (LEGACY_THEME_MAP[this.settings.theme]) {
      this.settings.theme = LEGACY_THEME_MAP[this.settings.theme];
    }
    if (!THEMES[this.settings.theme]) {
      this.settings.theme = "claude";
      this.settings.nodeRadius = THEMES.claude.defaultRadius;
    }
  }
  async saveSettings() {
    await this.saveData(this.settings);
    this.applyGlobalThemeVariables();
    this.refreshAllMermaidBlocks(true);
  }
  isDarkMode() {
    return document.body.classList.contains("theme-dark");
  }
  applyGlobalThemeVariables() {
    const isDark = this.isDarkMode();
    const { themeKey, themeObj, palette } = resolveThemeSpec(this.settings, isDark);
    document.body.classList.add("mermaid-boost-enabled");
    if (document.body.dataset) {
      document.body.dataset.mbTheme = themeKey;
      document.body.dataset.mbHasPattern = themeObj.cardBgImage && themeObj.cardBgImage !== "none" ? "true" : "false";
    }
    document.body.classList.toggle("mermaid-boost-dot-grid", Boolean(this.settings.showDotGrid));
    document.body.classList.toggle("mermaid-boost-frame", Boolean(this.settings.showCardFrame));
    const style = document.body.style;
    style.setProperty("--mb-card-bg", palette.cardBg);
    style.setProperty("--mb-card-fg", palette.cardFg || palette.rootNode.text);
    style.setProperty("--mb-card-bg-image", themeObj.cardBgImage || "none");
    style.setProperty("--mb-card-bg-size", themeObj.cardBgSize || "auto");
    style.setProperty("--mb-svg-filter", themeObj.svgFilter || "none");
    style.setProperty("--mb-card-border", palette.cardBorder);
    style.setProperty("--mb-grid-dot", palette.gridDot);
    style.setProperty("--mb-edge-stroke", palette.edge.stroke);
    style.setProperty("--mb-node-radius", `${this.settings.nodeRadius}px`);
    style.setProperty(
      "--mb-font-family",
      themeObj.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif'
    );
  }
  setupMutationObserver() {
    this._pendingBlocks = /* @__PURE__ */ new Set();
    this._flushTimer = null;
    this._isDecorating = false;
    const scheduleFlush = () => {
      if (this._flushTimer) return;
      this._flushTimer = window.setTimeout(() => {
        this._flushTimer = null;
        if (this._isDecorating || this._pendingBlocks.size === 0) return;
        this._isDecorating = true;
        try {
          const batch = Array.from(this._pendingBlocks);
          this._pendingBlocks.clear();
          for (const b of batch) {
            if (b && b.isConnected) {
              this.decorateMermaidBlock(b, false);
            }
          }
        } finally {
          this._isDecorating = false;
        }
      }, 50);
    };
    this.mutationObserver = new MutationObserver((mutations) => {
      if (this._isDecorating) return;
      let addedAny = false;
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement || node instanceof SVGElement)) continue;
          if (node.closest && node.closest(".mb-toolbar, .mb-expand-bar, .mb-lightbox-overlay, .mermaid-zoom-inline-controls, defs")) {
            continue;
          }
          if (node instanceof HTMLElement && node.classList.contains("mermaid")) {
            const svg = node.querySelector("svg");
            if (svg && svg.dataset.mbInitialized !== "true") {
              this._pendingBlocks.add(node);
              addedAny = true;
            }
          } else {
            const parentMermaid = node.closest && node.closest(".mermaid");
            if (parentMermaid) {
              const svg = parentMermaid.querySelector("svg");
              if (svg && svg.dataset.mbInitialized !== "true") {
                this._pendingBlocks.add(parentMermaid);
                addedAny = true;
              }
            } else if (node.querySelectorAll) {
              const mermaids = node.querySelectorAll(".mermaid");
              for (let i = 0; i < mermaids.length; i++) {
                const m = mermaids[i];
                const svg = m.querySelector("svg");
                if (svg && svg.dataset.mbInitialized !== "true") {
                  this._pendingBlocks.add(m);
                  addedAny = true;
                }
              }
            }
          }
        }
      }
      if (addedAny) {
        scheduleFlush();
      }
    });
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
    this._onCalloutClick = (e) => {
      const target = e.target;
      if (target instanceof HTMLElement && target.closest(".callout-title, .callout-fold, summary")) {
        window.setTimeout(() => this.refreshAllMermaidBlocks(false), 120);
      }
    };
    document.addEventListener("click", this._onCalloutClick, true);
  }
  refreshAllMermaidBlocks(forceRestyle = false) {
    if (this._isDecorating) return;
    this._isDecorating = true;
    try {
      const blocks = document.querySelectorAll(".mermaid");
      blocks.forEach((block) => {
        this.decorateMermaidBlock(block, forceRestyle);
      });
    } finally {
      this._isDecorating = false;
    }
  }
  decorateMermaidBlock(block, forceRestyle = false) {
    const svg = block.querySelector("svg");
    if (!svg) return;
    if (!block.classList.contains("mermaid-boost-card")) {
      block.classList.add("mermaid-boost-card");
    }
    if (!svg.dataset.mbInitialized) {
      const currentVb = svg.getAttribute("viewBox");
      if (currentVb) {
        svg.dataset.mbOrigViewBox = currentVb;
      }
      const nat = extractSvgNaturalSize(svg);
      if (nat) {
        svg.dataset.mbNaturalX = String(nat.x);
        svg.dataset.mbNaturalY = String(nat.y);
        svg.dataset.mbNaturalWidth = String(nat.width);
        svg.dataset.mbNaturalHeight = String(nat.height);
      }
      svg.dataset.mbInitialized = "true";
    }
    const origNat = extractSvgNaturalSize(svg);
    if (!origNat) return;
    const diagramMeta = detectDiagramType(svg, origNat);
    block.dataset.mbDiagramType = diagramMeta.type;
    block.dataset.mbOrientation = diagramMeta.orientation;
    let effectiveNat = origNat;
    if (diagramMeta.type === "pie") {
      if (this.settings.trimPiePadding) {
        effectiveNat = tightenPieViewBox(svg, origNat);
      } else if (svg.dataset.mbOrigViewBox) {
        svg.setAttribute("viewBox", svg.dataset.mbOrigViewBox);
      }
    }
    if (forceRestyle || svg.dataset.mbStyledTheme !== `${this.settings.theme}-${this.isDarkMode()}-${this.settings.multiToneNodes}-${this.settings.nodeRadius}`) {
      beautifySvgDom(svg, this.settings, this.isDarkMode());
      svg.dataset.mbStyledTheme = `${this.settings.theme}-${this.isDarkMode()}-${this.settings.multiToneNodes}-${this.settings.nodeRadius}`;
    }
    const cardPresetKey = block.dataset.mbPresetOverride || this.settings.sizePreset;
    const cardPreset = SIZE_PRESETS[cardPresetKey] || SIZE_PRESETS.compact;
    const effectiveSettings = Object.assign({}, this.settings, {
      sizePreset: cardPresetKey,
      baseScale: block.dataset.mbPresetOverride ? cardPreset.baseScale : this.settings.baseScale,
      maxHeight: block.dataset.mbPresetOverride ? cardPreset.maxHeight : this.settings.maxHeight,
      maxWidth: block.dataset.mbPresetOverride ? cardPreset.maxWidth : this.settings.maxWidth,
      minReadableScale: block.dataset.mbPresetOverride ? cardPreset.minReadableScale : this.settings.minReadableScale
    });
    const hostContainer = block.closest(".markdown-preview-sizer, .cm-content, .callout-content") || block.parentElement;
    const containerWidth = hostContainer && hostContainer.clientWidth || block.clientWidth || 640;
    const sizing = computeSmartDiagramSize(
      effectiveNat,
      diagramMeta,
      effectiveSettings,
      containerWidth
    );
    const userZoomFactor = parseFloat(block.dataset.mbZoomFactor || "1") || 1;
    const finalWidth = Math.max(48, Math.round(sizing.width * userZoomFactor));
    const finalHeight = Math.max(36, Math.round(sizing.height * userZoomFactor));
    const displayPercent = Math.round(sizing.scale * userZoomFactor * 100);
    svg.style.setProperty("width", `${finalWidth}px`, "important");
    svg.style.setProperty("height", `${finalHeight}px`, "important");
    svg.style.setProperty("max-width", "none", "important");
    block.classList.toggle("is-mb-user-zoomed", Math.abs(userZoomFactor - 1) > 0.01);
    const shouldCollapse = sizing.needsHeightCollapse && userZoomFactor <= 1.05;
    block.classList.toggle("is-mb-collapsible", shouldCollapse);
    if (shouldCollapse) {
      block.style.setProperty("--mb-collapsed-height", `${sizing.collapsedHeight}px`);
      this.ensureExpandBar(block, finalHeight, sizing.collapsedHeight);
    } else {
      block.classList.remove("is-mb-expanded");
      const oldBar = block.querySelector(":scope > .mb-expand-bar");
      if (oldBar) oldBar.remove();
    }
    this.ensureToolbar(block, svg, diagramMeta, displayPercent, cardPresetKey);
    if (!svg.dataset.mbDblClickBound) {
      svg.dataset.mbDblClickBound = "true";
      const onDblClick = (e) => {
        if (!this.settings.doubleClickFullscreen) return;
        e.preventDefault();
        e.stopPropagation();
        this.openFullscreenLightbox(svg, diagramMeta);
      };
      if (typeof this.registerDomEvent === "function") {
        this.registerDomEvent(svg, "dblclick", onDblClick);
      } else {
        svg.addEventListener("dblclick", onDblClick);
      }
    }
  }
  ensureExpandBar(block, fullHeight, collapsedHeight) {
    let bar = block.querySelector(":scope > .mb-expand-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "mb-expand-bar";
      block.appendChild(bar);
    }
    const isExpanded = block.classList.contains("is-mb-expanded");
    bar.innerHTML = "";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mb-expand-btn";
    btn.textContent = isExpanded ? `\u25B2 Collapse (${collapsedHeight}px)` : `\u25BC Expand Full (${fullHeight}px)`;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      block.classList.toggle("is-mb-expanded");
      this.ensureExpandBar(block, fullHeight, collapsedHeight);
    });
    bar.appendChild(btn);
  }
  ensureToolbar(block, svg, diagramMeta, displayPercent) {
    const renderKey = `${diagramMeta.type}-${displayPercent}`;
    let toolbar = block.querySelector(":scope > .mb-toolbar");
    if (toolbar && toolbar.dataset && toolbar.dataset.mbRenderKey === renderKey) {
      return;
    }
    if (!toolbar) {
      toolbar = document.createElement("div");
      toolbar.className = "mb-toolbar";
      block.appendChild(toolbar);
    }
    if (toolbar.dataset) {
      toolbar.dataset.mbRenderKey = renderKey;
    }
    toolbar.innerHTML = "";
    const badge = document.createElement("span");
    badge.className = "mb-badge";
    badge.textContent = `${diagramMeta.label.split(" ")[0]} \xB7 ${displayPercent}%`;
    badge.title = "Current scale (Double-click diagram for fullscreen)";
    toolbar.appendChild(badge);
    const addIconBtn = (iconName, title, onClick) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mb-icon-btn";
      btn.title = title;
      btn.setAttribute("aria-label", title);
      setIcon(btn, iconName);
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        onClick(e);
      });
      toolbar.appendChild(btn);
      return btn;
    };
    addIconBtn("minus", "Zoom Out", () => {
      const cur = parseFloat(block.dataset.mbZoomFactor || "1") || 1;
      block.dataset.mbZoomFactor = String(Math.max(0.4, Number((cur * 0.85).toFixed(2))));
      this.decorateMermaidBlock(block);
    });
    addIconBtn("plus", "Zoom In", () => {
      const cur = parseFloat(block.dataset.mbZoomFactor || "1") || 1;
      block.dataset.mbZoomFactor = String(Math.min(2.5, Number((cur * 1.18).toFixed(2))));
      this.decorateMermaidBlock(block);
    });
    addIconBtn("rotate-ccw", "Reset Size", () => {
      delete block.dataset.mbZoomFactor;
      delete block.dataset.mbPresetOverride;
      this.decorateMermaidBlock(block);
    });
    addIconBtn("palette", "Switch Theme", () => this.cycleTheme());
    addIconBtn("camera", "Copy HD PNG", () => {
      this.exportSvgAsPng(svg);
    });
    addIconBtn("maximize-2", "Fullscreen Viewer", () => {
      this.openFullscreenLightbox(svg, diagramMeta);
    });
  }
  resolveLiveCssColor(val, fallback = "#ffffff") {
    return resolveLiveCssColor(val, fallback);
  }
  async exportSvgAsPng(svg) {
    return exportSvgAsPng(svg, this.settings, this.isDarkMode());
  }
  openFullscreenLightbox(sourceSvg, diagramMeta) {
    let closeFn = null;
    closeFn = openFullscreenLightbox(sourceSvg, diagramMeta, {
      settings: this.settings,
      saveSettings: () => this.saveSettings(),
      cycleTheme: () => this.cycleTheme(),
      exportSvgAsPng: (svg) => this.exportSvgAsPng(svg),
      onClose: () => {
        if (closeFn && this._openLightboxes) {
          this._openLightboxes.delete(closeFn);
        }
      }
    });
    if (closeFn) {
      if (!this._openLightboxes) {
        this._openLightboxes = /* @__PURE__ */ new Set();
      }
      this._openLightboxes.add(closeFn);
    }
    return closeFn;
  }
};
module.exports = MermaidBoostPlugin;
