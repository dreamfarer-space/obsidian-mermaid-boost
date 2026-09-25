"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  validateManifestSchema,
  validatePluginMetadata,
} = require("../scripts/validate-plugin.js");

test("validatePluginMetadata passes for current repository and detects schema/version drift", () => {
  const currentManifest = require("../manifest.json");
  const repoResult = validatePluginMetadata({
    rootDir: path.resolve(__dirname, ".."),
    releaseTag: process.env.RELEASE_TAG || currentManifest.version,
  });
  assert.equal(repoResult.id, currentManifest.id);
  assert.equal(repoResult.version, currentManifest.version);
  assert.equal(repoResult.minAppVersion, currentManifest.minAppVersion);

  const [major, minor, patch] = currentManifest.version.split(".").map(Number);
  const mismatchedTag = `${major}.${minor}.${patch + 1}`;
  const staleVersion = `${major}.${minor}.${patch + 1}`;

  assert.throws(
    () =>
      validateManifestSchema({
        id: "mermaid-boost",
        name: "Mermaid Boost",
        version: `${currentManifest.version}-beta.1`,
        minAppVersion: currentManifest.minAppVersion,
        description: "desc",
        author: "author",
        isDesktopOnly: false,
      }),
    /must strictly match x\.y\.z/
  );

  assert.throws(
    () =>
      validateManifestSchema({
        id: null,
        name: "Mermaid Boost",
        version: currentManifest.version,
        minAppVersion: currentManifest.minAppVersion,
        description: "desc",
        author: "author",
        isDesktopOnly: false,
      }),
    /field "id" must be a non-empty string/
  );

  assert.throws(
    () =>
      validatePluginMetadata({
        rootDir: path.resolve(__dirname, ".."),
        releaseTag: `v${currentManifest.version}`,
      }),
    /must strictly match x\.y\.z/
  );

  assert.throws(
    () =>
      validatePluginMetadata({
        rootDir: path.resolve(__dirname, ".."),
        releaseTag: mismatchedTag,
      }),
    /does not match manifest\.json version/
  );

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mb-validate-"));
  try {
    for (const f of [
      "package.json",
      "manifest.json",
      "versions.json",
      "main.js",
      "styles.css",
      "LICENSE",
      "README.md",
      "README.zh-CN.md",
      "CHANGELOG.md",
    ]) {
      fs.copyFileSync(path.join(__dirname, "..", f), path.join(tmpDir, f));
    }

    const currentRow = `(\`${currentManifest.version}\`, \`minAppVersion: ${currentManifest.minAppVersion}\`)`;
    const originalReadme = fs.readFileSync(path.join(tmpDir, "README.md"), "utf8");
    assert.ok(originalReadme.includes(currentRow), "README fixture row not found");

    const readmeStale = originalReadme.replace(
      currentRow,
      `(\`${staleVersion}\`, \`minAppVersion: ${currentManifest.minAppVersion}\`)`
    );
    fs.writeFileSync(path.join(tmpDir, "README.md"), readmeStale, "utf8");

    assert.throws(
      () => validatePluginMetadata({ rootDir: tmpDir }),
      (err) =>
        err instanceof Error &&
        err.message.includes(
          `README.md repository structure row for manifest.json does not reference current version ${currentManifest.version}`
        )
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
