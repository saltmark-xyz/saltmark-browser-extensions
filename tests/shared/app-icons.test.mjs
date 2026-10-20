import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import sharp from "sharp";
import { firefoxIconSizes, renderAppIcons } from "../../scripts/app-icons.mjs";
import { chromeIconPixelSHA256 } from "../../scripts/chrome-icon-contract.mjs";

test("both browsers render complete Direct app icons with reviewed pixels", async () => {
  const directory = await mkdtemp(join(tmpdir(), "saltmark-app-icons-"));
  try {
    await renderAppIcons(directory, firefoxIconSizes);
    for (const size of firefoxIconSizes) {
      const data = await readFile(join(directory, `favicon-${size}.png`));
      const decoded = await sharp(data).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      assert.equal(decoded.info.width, size);
      assert.equal(decoded.info.height, size);
      assert.equal(createHash("sha256").update(decoded.data).digest("hex"), chromeIconPixelSHA256.get(size));
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
