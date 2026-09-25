"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const esbuild = require("esbuild");

test("committed main.js bundle is up to date with src/ (no source-bundle drift)", async () => {
  const rootDir = path.resolve(__dirname, "..");
  const entryFile = path.join(rootDir, "src", "main.js");
  const bundleFile = path.join(rootDir, "main.js");

  assert.ok(fs.existsSync(bundleFile), "main.js bundle file must exist");
  assert.ok(fs.existsSync(entryFile), "src/main.js entry file must exist");

  const buildResult = await esbuild.build({
    entryPoints: [entryFile],
    bundle: true,
    format: "cjs",
    target: "es2020",
    platform: "browser",
    outfile: bundleFile,
    external: [
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
    ],
    write: false,
  });

  assert.ok(
    buildResult.outputFiles && buildResult.outputFiles.length > 0,
    "esbuild must produce output"
  );

  const generated = buildResult.outputFiles[0].text.replace(/\r\n/g, "\n");
  const committed = fs.readFileSync(bundleFile, "utf8").replace(/\r\n/g, "\n");

  assert.equal(
    committed,
    generated,
    "Committed main.js bundle is out of date with src/! Please run 'npm run build' and commit the updated main.js."
  );
});
