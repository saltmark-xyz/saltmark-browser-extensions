import { access, lstat, readFile, readdir } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const artifactRoot = resolve(repositoryRoot, ".build/firefox");
const manifestURL = resolve(artifactRoot, "manifest.json");
const manifest = JSON.parse(await readFile(manifestURL, "utf8"));
const packageManifest = JSON.parse(
  await readFile(resolve(repositoryRoot, "package.json"), "utf8")
);

assert(manifest.manifest_version === 3, "manifest_version must be 3");
assert(manifest.version === packageManifest.version, "package version mismatch");
assert(
  manifest.browser_specific_settings?.gecko?.id === "firefox@saltmark.xyz",
  "unexpected Gecko ID"
);
assert(
  manifest.browser_specific_settings.gecko.strict_min_version === "140.0",
  "unexpected minimum Firefox version"
);
assertSet(
  manifest.browser_specific_settings.gecko.data_collection_permissions?.required,
  ["browsingActivity", "websiteContent"],
  "data collection permissions"
);
assert(manifest.default_locale === "en", "unexpected default locale");
assertSet(
  manifest.permissions,
  ["activeTab", "nativeMessaging", "storage"],
  "permissions"
);
assert(manifest.host_permissions === undefined, "host permissions are forbidden");
assert(
  manifest.commands?.["save-current-tab"]?.suggested_key?.mac
    === "MacCtrl+Shift+S",
  "approved macOS shortcut is missing"
);
assert(
  manifest.commands?._execute_action === undefined,
  "popup composition must use a direct-save custom command"
);
assert(
  manifest.action?.default_popup === "popup/popup.html",
  "Firefox popup entry is invalid"
);
assert(
  manifest.background?.scripts?.length === 1
    && manifest.background.scripts[0] === "background.js",
  "Firefox background entry is invalid"
);
assert(
  manifest.background.service_worker === undefined,
  "Firefox composition must not declare a service worker"
);

const referencedFiles = [
  manifest.background.scripts[0],
  ...Object.values(manifest.action.default_icon),
  manifest.options_ui.page,
  ...Object.values(manifest.icons)
];
for (const relativePath of new Set(referencedFiles)) {
  await access(resolve(artifactRoot, relativePath), constants.R_OK);
}

const artifactFiles = await recursiveFiles(artifactRoot);
for (const path of artifactFiles) {
  const metadata = await lstat(path);
  assert(!metadata.isSymbolicLink(), "symlinks are forbidden in extension output");
}

const expectedFiles = [
  "LICENSE",
  "NOTICE",
  "BRANDING.md",
  "_locales/en/messages.json",
  "background.js",
  "core/background-controller.js",
  "core/favicon-data-url.js",
  "core/favicon.js",
  "core/protocol-limits.js",
  "core/protocol.js",
  "core/popup-controller.js",
  "core/save-current-tab.js",
  "icons/favicon-16.png",
  "icons/favicon-32.png",
  "icons/favicon-48.png",
  "icons/favicon-64.png",
  "icons/favicon-96.png",
  "icons/favicon-128.png",
  "manifest.json",
  "options/options.css",
  "options/options.html",
  "options/options.js",
  "popup/popup.css",
  "popup/popup.html",
  "popup/popup.js"
];
assertSet(
  artifactFiles.map((path) => relative(artifactRoot, path)),
  expectedFiles,
  "artifact files"
);

const messages = JSON.parse(
  await readFile(resolve(artifactRoot, "_locales/en/messages.json"), "utf8")
);
const optionsHTML = await readFile(
  resolve(artifactRoot, "options/options.html"),
  "utf8"
);
const popupHTML = await readFile(
  resolve(artifactRoot, "popup/popup.html"),
  "utf8"
);
const localizationKeys = new Set([
  ...[...JSON.stringify(manifest).matchAll(/__MSG_([a-zA-Z0-9_@]+)__/g)]
    .map((match) => match[1]),
  ...[...optionsHTML.matchAll(/data-i18n="([a-zA-Z0-9_@]+)"/g)]
    .map((match) => match[1]),
  ...[...popupHTML.matchAll(/data-i18n="([a-zA-Z0-9_@]+)"/g)]
    .map((match) => match[1])
]);
for (const key of localizationKeys) {
  assert(messages[key]?.message, `missing default-locale message: ${key}`);
}

for (const relativePath of [
  "options/options.css",
  "options/options.js",
  "popup/popup.css",
  "popup/popup.js"
]) {
  await access(resolve(artifactRoot, relativePath), constants.R_OK);
}

process.stdout.write(`Firefox extension lint passed: ${artifactRoot}\n`);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertSet(actual, expected, label) {
  assert(Array.isArray(actual), `${label} must be an array`);
  assert(
    actual.length === expected.length
      && expected.every((value) => actual.includes(value)),
    `${label} does not match the approved set`
  );
}

async function recursiveFiles(root) {
  const result = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = resolve(root, entry.name);
    if (entry.isDirectory()) {
      result.push(...await recursiveFiles(path));
    } else {
      result.push(path);
    }
  }
  return result;
}
