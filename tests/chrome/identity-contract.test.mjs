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

test("pinned Chrome public key derives the approved Web Store ID", () => {
  assert.equal(extensionIDFromPublicKey(manifest.key), chromeWebStoreID);
  assert.equal(chromeWebStoreID, "ikodhdphpodjkdhafomobpjdhhhiiapd");
});

test("Chrome public key validation rejects noncanonical input", () => {
  assert.throws(() => extensionIDFromPublicKey(`${manifest.key}\n`));
  assert.throws(() => extensionIDFromPublicKey("not base64"));
});
