# Changelog

All notable changes to **Mermaid Boost** (`mermaid-boost`) are documented in this file.

## [1.0.1] - 2026-09-24

### Added
- **29 Curated Themes Across 7 Groups**:
  - **Styled (4)**: `claude` *(default)*, `notion`, `notion-dark`, `handcrafted`
  - **Developer (4)**: `nord`, `dracula`, `solarized`, `gruvbox`
  - **Paper & print (4)**: `blueprint`, `newspaper`, `academic`, `kraft-paper`
  - **Retro & playful (5)**: `chalkboard`, `terminal-crt`, `game-boy`, `synthwave`, `sticky-notes`
  - **Brand-inspired (5)**: `github-light`, `github-dark`, `linear`, `stripe`, `metro-map`
  - **Functional (3)**: `high-contrast`, `colorblind-safe`, `mono-accent`
  - **Built-in (4)**: `builtin-default`, `builtin-neutral`, `builtin-dark`, `builtin-forest`
- **Smart Diagram Sizing Engine**:
  - 4 built-in sizing presets: `Compact` (`72%`), `Balanced` (`85%`), `Relaxed` (`100%`), and `Original` (`1:1`).
  - Enforced **Minimum Readable Scale** floor (`0.52` in Compact mode) so sprawling diagrams never shrink into illegible text.
  - Automatic folding/collapsing for overly tall diagrams with an inline expand bar.
- **Interactive Controls & Export**:
  - Header toolbar with inline **Zoom Out (`−`)**, **Scale Reset Badge (`72%`)**, **Zoom In (`+`)**, **Fullscreen Lightbox**, and **3× HD PNG Export**.
  - **Double-Click Fullscreen Lightbox** supporting smooth mouse-wheel zoom and click-drag panning.
- **Documentation & CI**:
  - Bilingual English (`README.md`) and Simplified Chinese (`README.zh-CN.md`) documentation with custom SVG visual banners (`assets/hero-banner.svg`, `assets/theme-gallery.svg`).
  - Automated Node.js 22 CI test workflow (`.github/workflows/ci.yml`), release workflow (`.github/workflows/release.yml`), and `versions.json`.
