import { createHash } from "node:crypto";
import { lstat, readFile, readdir } from "node:fs/promises";
import { relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  chromeIconPixelSHA256,
  chromeIconSizes
} from "./chrome-icon-contract.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const artifactRoot = resolve(repositoryRoot, ".build/chrome-identity");
const manifest = JSON.parse(
  await readFile(resolve(artifactRoot, "manifest.json"), "utf8")
);

assertSet(
  Object.keys(manifest),
  ["manifest_version", "name", "version", "description", "icons"],
  "manifest keys"
);
assert(manifest.manifest_version === 3, "manifest_version must be 3");
assert(manifest.name === "SaltMark", "unexpected extension name");
assert(manifest.version === "0.0.0.1", "unexpected identity package version");
assert(
  manifest.description === "Save Chrome and Brave bookmarks to SaltMark Direct.",
  "unexpected extension description"
);
assert(
  manifest.description.length <= 132,
  "Chrome Web Store description exceeds 132 characters"
);
assertSet(Object.keys(manifest.icons), ["16", "32", "48", "128"], "icons");

for (const size of chromeIconSizes) {
  const relativePath = `icons/favicon-${size}.png`;
  assert(manifest.icons[String(size)] === relativePath, `invalid ${size}px icon path`);
  const data = await readFile(resolve(artifactRoot, relativePath));
  assert(data.subarray(1, 4).toString("ascii") === "PNG", "icon must be PNG");
  const decoded = await sharp(data).ensureAlpha().raw().toBuffer({
    resolveWithObject: true
  });
  assert(decoded.info.width === size, `invalid ${size}px icon width`);
  assert(decoded.info.height === size, `invalid ${size}px icon height`);
  assert(decoded.info.channels === 4, `invalid ${size}px icon channel count`);
  assert(
    createHash("sha256").update(decoded.data).digest("hex")
      === chromeIconPixelSHA256.get(size),
    `invalid ${size}px icon pixel provenance`
  );
}

const artifactFiles = await recursiveFiles(artifactRoot);
assertSet(
  artifactFiles.map((path) => relative(artifactRoot, path)),
  [
    "icons/favicon-16.png",
    "icons/favicon-32.png",
    "icons/favicon-48.png",
    "icons/favicon-128.png",
    "manifest.json"
  ],
  "identity artifact files"
);
for (const path of artifactFiles) {
  assert(!(await lstat(path)).isSymbolicLink(), "symlinks are forbidden");
}

process.stdout.write(`Chrome identity extension lint passed: ${artifactRoot}\n`);

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

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertSet(actual, expected, label) {
  assert(
    actual.length === expected.length
      && expected.every((value) => actual.includes(value)),
    `${label} does not match the approved set`
  );
}
