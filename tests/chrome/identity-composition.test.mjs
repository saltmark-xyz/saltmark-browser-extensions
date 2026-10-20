import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  chromeIconSizes,
  chromeIconSourceSHA256
} from "../../scripts/chrome-icon-contract.mjs";

const repositoryRoot = new URL("../../", import.meta.url);

test("Chrome identity manifest reserves the product without premature behavior", async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL("chrome/identity/manifest.json", repositoryRoot),
      "utf8"
    )
  );

  assert.deepEqual(Object.keys(manifest).sort(), [
    "description",
    "icons",
    "manifest_version",
    "name",
    "version"
  ]);
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.name, "SaltMark");
  assert.equal(manifest.version, "0.0.0.1");
  assert.equal(
    manifest.description,
    "Save Chrome and Brave bookmarks to SaltMark Direct."
  );
  assert.deepEqual(Object.keys(manifest.icons).map(Number), chromeIconSizes);
  assert.equal(manifest.key, undefined);
  assert.equal(manifest.permissions, undefined);
  assert.equal(manifest.background, undefined);
  assert.equal(manifest.action, undefined);
});

test("Chrome icons remain derived from the approved Direct app icon", async () => {
  const favicon = await readFile(new URL("public/app-icon-direct.png", repositoryRoot));
  assert.equal(
    createHash("sha256").update(favicon).digest("hex"),
    chromeIconSourceSHA256
  );
});
