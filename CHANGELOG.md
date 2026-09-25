# Changelog

All notable changes to **Mermaid Boost** (`mermaid-boost`) are documented in this file.

## [1.0.4] - 2026-09-26

### Added
- **Per-Diagram Overrides (`%% mermaid-boost: ...`)**:
  - Embedded local configuration comments directly inside Mermaid diagram source via `%% mermaid-boost: key=value` or short alias `%%mb: key=value` comments (also supports HTML comments `<!-- mermaid-boost: ... -->`).
  - Supported fine-grained diagram-level control over `theme`, `preset` (`compact`/`balanced`/`relaxed`/`original`), `frame` (`true`/`false`), `grid` (`true`/`false`), `header` (`true`/`false`), `radius` (number), and `collapse` (`true`/`false`).
  - Preserved global settings when cycling themes in fullscreen lightbox for diagrams with local overrides.
  - Implemented CommonMark-compliant fence matching to handle any fence length without premature termination.
- **Dynamic ResizeObserver Diagram Resizing**:
  - Attached non-duplicate `ResizeObserver` instances to each enhanced Mermaid diagram container to respond dynamically to split pane dragging, sidebar open/close, mobile orientation changes, and workspace resize events.
  - Implemented debounced event batching to eliminate layout thrashing.
  - Re-run only sizing-related logic on resize instead of triggering full diagram card rebuilds or SVG restyling.
  - Guaranteed clean observer teardown upon diagram disappearance and plugin unload.
  - Reinforced narrow-container constraints and responsive min-width (`min(240px, 100%)`) to prevent mobile and narrow-pane overflow.
- **Comprehensive DOM & Obsidian Lifecycle Integration Test Suite**:
  - Added 51 automated unit and integration tests covering idempotency, MutationObserver debouncing, view switching between Reading View and Live Preview, note close teardown, toolbar zoom/reset/expand interactions, fullscreen lightbox interactions, and theme switching.

### Changed
- **CSS Strict Specificity Architecture**:
  - Completely eliminated all `!important` occurrences in `styles.css` using structured selector specificity (`.markdown-rendered .mermaid.mermaid-boost-card` and `.mermaid-boost-card.mb-has-frame`).
  - Ensured 100% compliance with Obsidian Community Plugin CSS guidelines and automated lint checks.

## [1.0.3] - 2026-09-25

### Added
- **Modularized Source Architecture**:
  - Restructured monolithic source and test suites into clean, single-responsibility modules in `src/` (`themes.js`, `sizing.js`, `beautify.js`, `export.js`, `lightbox.js`, `settings.js`, `main.js`) and `tests/`.
  - Added modern `scripts/build.js` bundle pipeline via `esbuild` with `--check` and `--watch` options, maintaining full backward compatibility through `lib.js`.
  - Added CI build verification (`npm run build:check`) to prevent source-bundle drift.
- **Dedicated Card Frame & Dot Grid Controls**:
  - Added separate settings toggle for **Card Frame** and **Dot Grid**, supporting borderless and transparent container modes when card frame is toggled off.

### Changed
- **Graph Topology Optimization**:
  - Replaced $O(E \cdot N^2)$ edge scanning in `classifyGraphTopology` with standard Mermaid edge pattern regex fast-paths and early termination.
  - Skipped graph topology classification when multi-tone hierarchy and node color mapping are not active.
- **Dynamic ViewBox HD PNG Export**:
  - Export sizing now prioritizes active, tightened SVG `viewBox` over static natural dimensions.
- **Node Corner Radius Setting Precedence**:
  - Allowed user-configured "Node Corner Radius" settings slider to properly override theme defaults.
- **Unified Theme Cycling**:
  - Consolidated theme rotation across command palette, card floating toolbar, and fullscreen lightbox into a shared `cycleTheme()` workflow.
- **Clean Plugin Lifecycle Teardown**:
  - Managed SVG double-click fullscreen listener via Obsidian's `registerDomEvent` to guarantee leak-free teardown.
  - Automatically tracked and closed active fullscreen lightbox instances upon plugin unload.
  - Fully restored original SVG inline dimensions/priorities (`width`, `height`, `max-width`) and cleaned up all dataset flags (`mbInitialized`, `mbOrigViewBox`, etc.) on unload.

## [1.0.2] - 2026-09-24

### Added
- Root `LICENSE` file (MIT) matching package metadata.
- Deterministic `package-lock.json` lockfile for reproducible builds and build verification.
- Explicit `# Mermaid Boost` top-level H1 heading in documentation to satisfy Obsidian Community Plugin requirements.

### Changed
- **CSS Architecture**: Completely eliminated all 42 instances of `!important` in `styles.css` using structured selector specificity (`.markdown-rendered .mermaid.mermaid-boost-card`).
- **Container Flexibility**: Supported non-`div` Mermaid containers (such as `<pre class="mermaid">`) across card styling, dot grids, typography, and collapsible views.
- Updated documentation badges and release download links to target v1.0.2.

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
  - Automated Node.js 22 CI test workflow (`.github/workflows/ci.yml`) and `versions.json`.
