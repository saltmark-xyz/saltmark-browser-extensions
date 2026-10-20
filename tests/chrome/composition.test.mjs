import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  chromeWebStoreID,
  extensionIDFromPublicKey
} from "../../scripts/chrome-identity.mjs";

const manifest = JSON.parse(
  await readFile(new URL("../../chrome/manifest.json", import.meta.url), "utf8")
);

test("Chrome manifest has the stable identity and exact permissions", () => {
  assert.equal(extensionIDFromPublicKey(manifest.key), chromeWebStoreID);
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.version, "0.1.0");
  assert.equal(manifest.minimum_chrome_version, "99");
  assert.deepEqual(new Set(manifest.permissions), new Set([
    "activeTab",
    "nativeMessaging",
    "storage",
    "favicon"
  ]));
  assert.equal(manifest.host_permissions, undefined);
  assert.equal(manifest.content_scripts, undefined);
});

test("Chrome uses a module service worker, popup and direct shortcut", () => {
  assert.deepEqual(manifest.background, {
    service_worker: "background.js",
    type: "module"
  });
  assert.equal(manifest.action.default_popup, "popup/popup.html");
  assert.equal(
    manifest.commands["save-current-tab"].suggested_key.mac,
    "MacCtrl+Shift+S"
  );
  assert.equal(manifest.commands._execute_action, undefined);
});

test("Chrome popup keeps the accepted product interaction", async () => {
  const markup = await readFile(
    new URL("../../chrome/popup/popup.html", import.meta.url),
    "utf8"
  );
  assert.match(markup, /id="save-bookmark"/);
  assert.match(markup, /data-i18n="saveToUnsortedLabel"/);
  assert.match(markup, /<kbd id="shortcut"><\/kbd>/);
  assert.doesNotMatch(markup, /connection|Silent Mode/i);
});
