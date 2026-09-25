"use strict";

const fs = require("node:fs");
const path = require("node:path");
const esbuild = require("esbuild");

const ROOT_DIR = path.resolve(__dirname, "..");
const ENTRY_FILE = path.join(ROOT_DIR, "src", "main.js");
const OUT_FILE = path.join(ROOT_DIR, "main.js");

const EXTERNAL_MODULES = [
  "obsidian",
  "electron",
  "@codemirror/autocomplete",
  "@codemirror/collab",
  "@codemirror/commands",
  "@codemirror/language",
  "@codemirror/lint",
  "@codemirror/search",
  "@codemirror/state",
  "@codemirror/view",
  "@lezer/common",
  "@lezer/highlight",
  "@lezer/lr",
];

async function runBuild(options = {}) {
  const isCheck = options.check || process.argv.includes("--check");
  const isWatch = options.watch || process.argv.includes("--watch");

  const buildOptions = {
    entryPoints: [ENTRY_FILE],
    bundle: true,
    format: "cjs",
    target: "es2020",
    platform: "browser",
    outfile: OUT_FILE,
    external: EXTERNAL_MODULES,
    logLevel: "info",
    write: !isCheck,
  };

  if (isWatch) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    console.log("Watching for changes in src/...");
    return;
  }

  const result = await esbuild.build(buildOptions);

  if (isCheck) {
    if (!result.outputFiles || result.outputFiles.length === 0) {
      throw new Error("Build failed to produce output in check mode");
    }
    const generated = result.outputFiles[0].text.replace(/\r\n/g, "\n");
    if (!fs.existsSync(OUT_FILE)) {
      console.error("Error: main.js does not exist. Run 'npm run build' to generate it.");
      process.exit(1);
    }
    const current = fs.readFileSync(OUT_FILE, "utf8").replace(/\r\n/g, "\n");
    if (generated !== current) {
      console.error(
        "Error: committed main.js bundle is out of date with src/.\n" +
          "Please run 'npm run build' and commit the updated main.js."
      );
      process.exit(1);
    }
    console.log("Verified: main.js bundle is up to date with src/.");
  } else {
    console.log("Successfully built main.js from src/.");
  }
}

if (require.main === module) {
  runBuild().catch((err) => {
    console.error("Build execution failed:", err);
    process.exit(1);
  });
}

module.exports = { runBuild };
