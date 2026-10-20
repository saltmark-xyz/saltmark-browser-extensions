import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const manifest = JSON.parse(
  fs.readFileSync(
    new URL("../../firefox/manifest.json", import.meta.url)
  )
);

test("Firefox manifest has the final identity and minimal permissions", () => {
  assert.equal(manifest.manifest_version, 3);
  assert.equal(
    manifest.browser_specific_settings.gecko.id,
    "firefox@saltmark.xyz"
  );
  assert.deepEqual(
    new Set(manifest.permissions),
    new Set(["activeTab", "nativeMessaging", "storage"])
  );
  assert.equal("host_permissions" in manifest, false);
});

test("Firefox hotkey remains a direct save while the toolbar opens popup", () => {
  assert.equal(
    manifest.commands["save-current-tab"].suggested_key.mac,
    "MacCtrl+Shift+S"
  );
  assert.equal("_execute_action" in manifest.commands, false);
  assert.equal(manifest.action.default_popup, "popup/popup.html");
  assert.deepEqual(manifest.background.scripts, ["background.js"]);
  assert.equal("service_worker" in manifest.background, false);
});

test("Firefox popup presents the shortcut as plain semantic text", () => {
  const markup = fs.readFileSync(
    new URL("../../firefox/popup/popup.html", import.meta.url),
    "utf8"
  );
  const stylesheet = fs.readFileSync(
    new URL("../../firefox/popup/popup.css", import.meta.url),
    "utf8"
  );
  const kbdRule = stylesheet.match(/kbd\s*\{([^}]*)\}/)?.[1];

  assert.match(markup, /<kbd id="shortcut"><\/kbd>/);
  assert.ok(kbdRule, "missing shortcut kbd rule");
  assert.match(kbdRule, /font:\s*inherit;/);
  assert.match(kbdRule, /white-space:\s*nowrap;/);
  assert.doesNotMatch(kbdRule, /(?:background|border|padding|border-radius):/);
});

test("Firefox UI names the unsorted-save preference without helper copy", () => {
  const popupMarkup = fs.readFileSync(
    new URL("../../firefox/popup/popup.html", import.meta.url),
    "utf8"
  );
  const optionsMarkup = fs.readFileSync(
    new URL("../../firefox/options/options.html", import.meta.url),
    "utf8"
  );
  const messages = JSON.parse(
    fs.readFileSync(
      new URL("../../firefox/locales/en/messages.json", import.meta.url)
    )
  );

  assert.match(popupMarkup, /data-i18n="saveToUnsortedLabel"/);
  assert.match(optionsMarkup, /data-i18n="saveToUnsortedLabel"/);
  assert.equal(
    messages.saveToUnsortedLabel.message,
    "Save to Unsorted"
  );
  assert.equal("silentModeLabel" in messages, false);
  assert.equal("silentModeShortLabel" in messages, false);
  assert.equal("silentModeDescription" in messages, false);
  assert.doesNotMatch(popupMarkup, /setting-description|Silent Mode/);
  assert.doesNotMatch(optionsMarkup, /setting-description|Silent Mode/);
});

test("Firefox declares raster sizes for the Direct application icon", () => {
  assert.deepEqual(manifest.action.default_icon, {
    "16": "icons/favicon-16.png", "32": "icons/favicon-32.png"
  });
  for (const size of [16, 32, 48, 64, 96, 128]) {
    assert.equal(manifest.icons[size], `icons/favicon-${size}.png`);
  }
});

test("Firefox declares only required primary-function data categories", () => {
  assert.deepEqual(
    manifest.browser_specific_settings.gecko.data_collection_permissions,
    { required: ["browsingActivity", "websiteContent"] }
  );
});
