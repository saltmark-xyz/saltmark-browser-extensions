import { createHash } from "node:crypto";
import { lstat, readFile, readdir } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  chromeIconPixelSHA256,
  chromeIconSizes
} from "./chrome-icon-contract.mjs";
import {
  chromeWebStoreID,
  extensionIDFromPublicKey
} from "./chrome-identity.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const artifactRoot = resolve(repositoryRoot, ".build/chrome");
const manifest = JSON.parse(
  await readFile(resolve(artifactRoot, "manifest.json"), "utf8")
);

assert(manifest.manifest_version === 3, "manifest_version must be 3");
assert(manifest.version === "0.1.0", "unexpected Chrome product version");
assert(manifest.minimum_chrome_version === "99", "unexpected Chrome baseline");
assert(manifest.default_locale === "en", "unexpected default locale");
assert(
  extensionIDFromPublicKey(manifest.key) === chromeWebStoreID,
  "manifest key does not derive the approved Chrome Web Store ID"
);
assertSet(
  manifest.permissions,
  ["activeTab", "nativeMessaging", "storage", "favicon"],
  "permissions"
);
assert(manifest.host_permissions === undefined, "host permissions are forbidden");
assert(manifest.content_scripts === undefined, "content scripts are forbidden");
assert(
  manifest.background?.service_worker === "background.js"
    && manifest.background.type === "module",
  "Chrome must use one module service worker"
);
assert(
  manifest.action?.default_popup === "popup/popup.html",
  "Chrome popup entry is invalid"
);
assert(
  manifest.commands?.["save-current-tab"]?.suggested_key?.mac
    === "MacCtrl+Shift+S",
  "approved direct-save shortcut is missing"
);

for (const size of chromeIconSizes) {
  const data = await readFile(resolve(artifactRoot, `icons/favicon-${size}.png`));
  const decoded = await sharp(data).ensureAlpha().raw().toBuffer({
    resolveWithObject: true
  });
  assert(
    decoded.info.width === size && decoded.info.height === size,
    `invalid ${size}px Chrome icon dimensions`
  );
  assert(
    createHash("sha256").update(decoded.data).digest("hex")
      === chromeIconPixelSHA256.get(size),
    `invalid ${size}px Chrome icon provenance`
  );
}

const files = await recursiveFiles(artifactRoot);
assertSet(files.map((path) => relative(artifactRoot, path)), [
  "LICENSE",
  "NOTICE",
  "BRANDING.md",
  "_locales/en/messages.json",
  "api.js",
  "background.js",
  "core/background-controller.js",
  "core/favicon-data-url.js",
  "core/favicon.js",
  "core/popup-controller.js",
  "core/protocol-limits.js",
  "core/protocol.js",
  "core/save-current-tab.js",
  "favicon.js",
  "icons/favicon-16.png",
  "icons/favicon-32.png",
  "icons/favicon-48.png",
  "icons/favicon-128.png",
  "manifest.json",
  "options/options.css",
  "options/options.html",
  "options/options.js",
  "popup/popup.css",
  "popup/popup.html",
  "popup/popup.js",
  "save-current-tab.js"
], "Chrome artifact files");
for (const path of files) {
  assert(!(await lstat(path)).isSymbolicLink(), "symlinks are forbidden");
}

const allSource = await Promise.all(files
  .filter((path) => path.endsWith(".js") || path.endsWith(".json"))
  .map((path) => readFile(path, "utf8")));
assert(
  !allSource.some((source) => /fetch\(["'`]https?:/i.test(source)),
  "Chrome artifact contains an app-owned remote fetch"
);

const messages = JSON.parse(
  await readFile(resolve(artifactRoot, "_locales/en/messages.json"), "utf8")
);
const popupHTML = await readFile(
  resolve(artifactRoot, "popup/popup.html"),
  "utf8"
);
const optionsHTML = await readFile(
  resolve(artifactRoot, "options/options.html"),
  "utf8"
);
const localizationKeys = new Set([
  ...[...JSON.stringify(manifest).matchAll(/__MSG_([a-zA-Z0-9_@]+)__/g)]
    .map((match) => match[1]),
  ...[...popupHTML.matchAll(/data-i18n="([a-zA-Z0-9_@]+)"/g)]
    .map((match) => match[1]),
  ...[...optionsHTML.matchAll(/data-i18n="([a-zA-Z0-9_@]+)"/g)]
    .map((match) => match[1])
]);
for (const key of localizationKeys) {
  assert(messages[key]?.message, `missing Chrome locale message: ${key}`);
}

process.stdout.write(`Chrome extension lint passed: ${artifactRoot}\n`);

async function recursiveFiles(root) {
  const result = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = resolve(root, entry.name);
    if (entry.isDirectory()) result.push(...await recursiveFiles(path));
    else result.push(path);
  }
  return result;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertSet(actual, expected, label) {
  assert(
    Array.isArray(actual)
      && actual.length === expected.length
      && expected.every((value) => actual.includes(value)),
    `${label} does not match the approved set`
  );
}
