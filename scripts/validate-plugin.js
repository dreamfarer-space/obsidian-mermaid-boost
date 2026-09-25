"use strict";

const fs = require("node:fs");
const path = require("node:path");

const STRICT_VERSION_RE = /^\d+\.\d+\.\d+$/;
const PLUGIN_ID_RE = /^[a-z0-9-]+$/;

const REQUIRED_STRING_FIELDS = [
  "id",
  "name",
  "version",
  "minAppVersion",
  "description",
  "author",
];

const ALLOWED_MANIFEST_KEYS = new Set([
  ...REQUIRED_STRING_FIELDS,
  "isDesktopOnly",
  "authorUrl",
  "fundingUrl",
  "helpUrl",
]);

const REQUIRED_RELEASE_FILES = [
  "main.js",
  "manifest.json",
  "styles.css",
  "LICENSE",
];

function readJson(rootDir, relativePath) {
  const fullPath = path.join(rootDir, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  try {
    return JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch (err) {
    throw new Error(`Invalid JSON in ${relativePath}: ${err.message}`);
  }
}

function validateManifestSchema(manifest) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new Error("manifest.json must contain a JSON object");
  }

  for (const key of REQUIRED_STRING_FIELDS) {
    if (!(key in manifest)) {
      throw new Error(`manifest.json is missing required field: ${key}`);
    }
    if (typeof manifest[key] !== "string" || manifest[key].trim().length === 0) {
      throw new Error(
        `manifest.json field "${key}" must be a non-empty string (received ${JSON.stringify(manifest[key])})`
      );
    }
  }

  if (!("isDesktopOnly" in manifest) || typeof manifest.isDesktopOnly !== "boolean") {
    throw new Error(
      `manifest.json field "isDesktopOnly" must be a boolean (received ${JSON.stringify(manifest.isDesktopOnly)})`
    );
  }

  for (const key of Object.keys(manifest)) {
    if (!ALLOWED_MANIFEST_KEYS.has(key)) {
      throw new Error(`manifest.json contains unsupported property: ${key}`);
    }
  }

  if (
    !PLUGIN_ID_RE.test(manifest.id) ||
    manifest.id.includes("obsidian") ||
    manifest.id.endsWith("plugin")
  ) {
    throw new Error(`manifest.json has an invalid Obsidian plugin id: ${manifest.id}`);
  }

  if (!STRICT_VERSION_RE.test(manifest.version)) {
    throw new Error(
      `manifest.json version "${manifest.version}" must strictly match x.y.z without prerelease or build suffixes`
    );
  }

  if (!STRICT_VERSION_RE.test(manifest.minAppVersion)) {
    throw new Error(
      `manifest.json minAppVersion "${manifest.minAppVersion}" must strictly match x.y.z`
    );
  }
}

function validateReadmeSync(rootDir, relativePath, version, minAppVersion) {
  const fullPath = path.join(rootDir, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing documentation file: ${relativePath}`);
  }
  const content = fs.readFileSync(fullPath, "utf8");

  const expectedChecks = [
    {
      token: `badge/release-v${version}-`,
      label: `release badge version v${version}`,
    },
    {
      token: `releases/tag/${version}`,
      label: `GitHub release tag link ${version}`,
    },
    {
      token: `badge/Obsidian-%3E%3D${minAppVersion}-`,
      label: `Obsidian minAppVersion badge >=${minAppVersion}`,
    },
    {
      token: `mermaid-boost-${version}.zip`,
      label: `release archive filename mermaid-boost-${version}.zip`,
    },
    {
      token: `\`minAppVersion: ${minAppVersion}\``,
      label: `manifest minAppVersion reference \`minAppVersion: ${minAppVersion}\``,
    },
  ];

  for (const check of expectedChecks) {
    if (!content.includes(check.token)) {
      throw new Error(
        `${relativePath} is out of sync with manifest.json: missing ${check.label} (${check.token})`
      );
    }
  }

  const manifestTableMatch = content.match(/\|\s*`manifest\.json`\s*\|[^\r\n]+/);
  if (!manifestTableMatch || !manifestTableMatch[0].includes(`\`${version}\``)) {
    throw new Error(
      `${relativePath} repository structure row for manifest.json does not reference current version ${version}`
    );
  }
}

function validateChangelogSync(rootDir, version) {
  const changelogPath = path.join(rootDir, "CHANGELOG.md");
  if (!fs.existsSync(changelogPath)) {
    throw new Error("Missing required file: CHANGELOG.md");
  }
  const content = fs.readFileSync(changelogPath, "utf8");
  const expectedPrefix = `## [${version}]`;
  const hasReleaseHeading = content
    .split(/\r?\n/)
    .some((line) => line.trim().startsWith(expectedPrefix));
  if (!hasReleaseHeading) {
    throw new Error(
      `CHANGELOG.md is missing a release section heading for current version: ${expectedPrefix}`
    );
  }
}

function validatePluginMetadata(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, "..");
  const releaseTag =
    options.releaseTag !== undefined
      ? options.releaseTag
      : process.env.RELEASE_TAG || null;

  const pkg = readJson(rootDir, "package.json");
  const manifest = readJson(rootDir, "manifest.json");
  const versions = readJson(rootDir, "versions.json");

  validateManifestSchema(manifest);

  if (typeof pkg.version !== "string" || !STRICT_VERSION_RE.test(pkg.version)) {
    throw new Error(
      `package.json version "${pkg.version}" must strictly match x.y.z`
    );
  }

  if (pkg.version !== manifest.version) {
    throw new Error(
      `package.json version (${pkg.version}) does not match manifest.json version (${manifest.version})`
    );
  }

  if (!pkg.main || typeof pkg.main !== "string") {
    throw new Error("package.json field \"main\" must be a non-empty string");
  }

  if (!fs.existsSync(path.join(rootDir, pkg.main))) {
    throw new Error(`package.json main entry does not exist: ${pkg.main}`);
  }

  if (!versions || typeof versions !== "object" || Array.isArray(versions)) {
    throw new Error("versions.json must contain a JSON object");
  }

  for (const [ver, minApp] of Object.entries(versions)) {
    if (!STRICT_VERSION_RE.test(ver) || typeof minApp !== "string" || !STRICT_VERSION_RE.test(minApp)) {
      throw new Error(
        `versions.json contains invalid version mapping: ${JSON.stringify(ver)} -> ${JSON.stringify(minApp)}`
      );
    }
  }

  if (versions[manifest.version] !== manifest.minAppVersion) {
    throw new Error(
      `versions.json must map "${manifest.version}" to "${manifest.minAppVersion}" (found ${JSON.stringify(versions[manifest.version])})`
    );
  }

  for (const file of REQUIRED_RELEASE_FILES) {
    if (!fs.existsSync(path.join(rootDir, file))) {
      throw new Error(`Required plugin release file is missing: ${file}`);
    }
  }

  validateReadmeSync(rootDir, "README.md", manifest.version, manifest.minAppVersion);
  validateReadmeSync(rootDir, "README.zh-CN.md", manifest.version, manifest.minAppVersion);
  validateChangelogSync(rootDir, manifest.version);

  if (releaseTag !== null && releaseTag !== "") {
    if (!STRICT_VERSION_RE.test(releaseTag)) {
      throw new Error(
        `Release tag "${releaseTag}" must strictly match x.y.z without a "v" prefix or prerelease suffix`
      );
    }
    if (releaseTag !== manifest.version) {
      throw new Error(
        `Release tag "${releaseTag}" does not match manifest.json version "${manifest.version}"`
      );
    }
  }

  return {
    id: manifest.id,
    version: manifest.version,
    minAppVersion: manifest.minAppVersion,
  };
}

if (require.main === module) {
  let releaseTag = process.env.RELEASE_TAG || null;
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--tag" && i + 1 < args.length) {
      releaseTag = args[i + 1];
      i++;
    } else if (args[i].startsWith("--tag=")) {
      releaseTag = args[i].slice("--tag=".length);
    }
  }

  try {
    const result = validatePluginMetadata({ releaseTag });
    console.log(
      `Validated ${result.id}@${result.version} (minAppVersion ${result.minAppVersion})` +
        (releaseTag ? ` for release tag ${releaseTag}` : "")
    );
  } catch (err) {
    console.error(`Plugin metadata validation failed: ${err.message}`);
    process.exit(1);
  }
}

module.exports = {
  STRICT_VERSION_RE,
  validateManifestSchema,
  validatePluginMetadata,
};
