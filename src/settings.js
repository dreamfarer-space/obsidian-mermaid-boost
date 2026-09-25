"use strict";

let PluginSettingTab;
let Setting;
try {
  const obsidian = require("obsidian");
  PluginSettingTab = obsidian.PluginSettingTab;
  Setting = obsidian.Setting;
} catch (_err) {
  PluginSettingTab = class {};
  Setting = class {};
}
const { THEME_GROUPS, THEMES } = require("./themes.js");

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
  nodeRadius: null,
  multiToneNodes: false,
  trimPiePadding: true,
  showCardFrame: true,
  showDotGrid: false,
  showHeaderBar: true,
  autoCollapseTall: true,
  doubleClickFullscreen: true,
  zoomSensitivity: 1.0,
};

class MermaidBoostSettingTab extends PluginSettingTab {
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
      cls: "setting-item-description",
    });

    new Setting(containerEl)
      .setName("Base Scale")
      .setDesc(`Default scale ratio for diagram nodes and labels (${Math.round(this.plugin.settings.baseScale * 100)}%).`)
      .addSlider((slider) =>
        slider
          .setLimits(0.45, 1.1, 0.02)
          .setValue(this.plugin.settings.baseScale)
          .setDynamicTooltip()
          .onChange(async (val) => {
            this.plugin.settings.baseScale = val;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Max Height (px)")
      .setDesc(`Maximum vertical height before scaling or collapsing (${this.plugin.settings.maxHeight}px).`)
      .addSlider((slider) =>
        slider
          .setLimits(180, 720, 20)
          .setValue(this.plugin.settings.maxHeight)
          .setDynamicTooltip()
          .onChange(async (val) => {
            this.plugin.settings.maxHeight = val;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Max Width (px)")
      .setDesc(`Maximum horizontal width for wide diagrams (${this.plugin.settings.maxWidth}px).`)
      .addSlider((slider) =>
        slider
          .setLimits(360, 1080, 20)
          .setValue(this.plugin.settings.maxWidth)
          .setDynamicTooltip()
          .onChange(async (val) => {
            this.plugin.settings.maxWidth = val;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Min Readable Scale")
      .setDesc("Minimum scale floor so ultra-tall flowcharts stay legible and trigger height collapse instead.")
      .addSlider((slider) =>
        slider
          .setLimits(0.4, 0.8, 0.02)
          .setValue(this.plugin.settings.minReadableScale)
          .setDynamicTooltip()
          .onChange(async (val) => {
            this.plugin.settings.minReadableScale = val;
            await this.plugin.saveSettings();
          })
      );

    containerEl.createEl("h3", { text: "Appearance & Palette (7 Groups · 29 Themes)" });

    // Interactive 7-Group Theme Gallery matching the HTML demo
    const activeThemeSpec = THEMES[this.plugin.settings.theme] || THEMES.claude;
    if (!this._selectedGroup) {
      this._selectedGroup = activeThemeSpec.group || "Styled";
    }
    const gallery = containerEl.createDiv({ cls: "mb-theme-gallery" });
    const groupRow = gallery.createDiv({ cls: "mb-theme-group-row" });
    THEME_GROUPS.forEach((grp) => {
      const gBtn = groupRow.createEl("button", {
        text: grp,
        cls: `mb-theme-group-btn ${this._selectedGroup === grp ? "is-active" : ""}`,
      });
      gBtn.type = "button";
      gBtn.addEventListener("click", () => {
        this._selectedGroup = grp;
        this.display();
      });
    });

    const cardsGrid = gallery.createDiv({ cls: "mb-theme-cards-grid" });
    Object.entries(THEMES)
      .filter(([, spec]) => spec.group === this._selectedGroup)
      .forEach(([key, spec]) => {
        const card = cardsGrid.createDiv({
          cls: `mb-theme-card ${this.plugin.settings.theme === key ? "is-active" : ""}`,
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
          cls: "mb-theme-card-node",
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
          cls: "mb-theme-card-node",
        });
        const secSpec =
          (spec.light.nodeCycle && spec.light.nodeCycle[1]) ||
          spec.light.cluster ||
          spec.light.rootNode;
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

    new Setting(containerEl)
      .setName("Theme Palette")
      .setDesc("Select from all 29 themes across the 7 groups (Styled, Developer, Paper & print, Retro & playful, Brand-inspired, Functional, Built-in).")
      .addDropdown((dropdown) => {
        Object.entries(THEMES).forEach(([key, spec]) => {
          dropdown.addOption(key, spec.name);
        });
        dropdown.setValue(this.plugin.settings.theme).onChange(async (val) => {
          this.plugin.settings.theme = val;
          if (THEMES[val]) {
            this._selectedGroup = THEMES[val].group;
            if (Number.isFinite(THEMES[val].defaultRadius)) {
              this.plugin.settings.nodeRadius = THEMES[val].defaultRadius;
            }
          }
          await this.plugin.saveSettings();
          this.display();
        });
      });

    new Setting(containerEl)
      .setName("Multi-Tone Hierarchy")
      .setDesc("Automatically distinguish root, branch, and leaf nodes by graph topology.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.multiToneNodes).onChange(async (val) => {
          this.plugin.settings.multiToneNodes = val;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Node Corner Radius")
      .setDesc("Rounded corner radius for diagram nodes and cards.")
      .addSlider((slider) =>
        slider
          .setLimits(0, 16, 1)
          .setValue(
            Number.isFinite(this.plugin.settings.nodeRadius)
              ? this.plugin.settings.nodeRadius
              : (activeThemeSpec.defaultRadius ?? 6)
          )
          .setDynamicTooltip()
          .onChange(async (val) => {
            this.plugin.settings.nodeRadius = val;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Trim Pie Padding")
      .setDesc("Automatically crop excessive horizontal whitespace around Mermaid pie charts.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.trimPiePadding).onChange(async (val) => {
          this.plugin.settings.trimPiePadding = val;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Card Frame")
      .setDesc("Display themed card frame with rounded border and background container around diagrams.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showCardFrame).onChange(async (val) => {
          this.plugin.settings.showCardFrame = val;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Dot Grid")
      .setDesc("Display subtle dot-grid canvas background inside diagram cards.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showDotGrid).onChange(async (val) => {
          this.plugin.settings.showDotGrid = val;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Auto-Collapse Tall Diagrams")
      .setDesc("Collapse ultra-tall vertical diagrams to Max Height with a one-click Expand/Collapse bar.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.autoCollapseTall).onChange(async (val) => {
          this.plugin.settings.autoCollapseTall = val;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Double-Click Fullscreen")
      .setDesc("Double-click any diagram to open the interactive pan & zoom lightbox.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.doubleClickFullscreen).onChange(async (val) => {
          this.plugin.settings.doubleClickFullscreen = val;
          await this.plugin.saveSettings();
        })
      );

  }
}

module.exports = {
  SIZE_PRESETS,
  DEFAULT_SETTINGS,
  MermaidBoostSettingTab,
};
