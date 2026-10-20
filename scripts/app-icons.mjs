import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";
import { chromeIconSourceSHA256 } from "./chrome-icon-contract.mjs";

export const firefoxIconSizes = Object.freeze([16, 32, 48, 64, 96, 128]);

// The committed PNG is a complete Icon Composer compatibility rendering,
// including the background. Builds never read the desktop repository.
export async function renderAppIcons(outputDirectory, sizes) {
  const source = await readFile(new URL("../public/app-icon-direct.png", import.meta.url));
  if (createHash("sha256").update(source).digest("hex") !== chromeIconSourceSHA256) {
    throw new Error("Direct app icon changed; update reviewed icon provenance first");
  }
  await Promise.all(sizes.map((size) => sharp(source)
    .resize(size, size)
    .toColourspace("srgb")
    .png({ compressionLevel: 9, palette: false })
    .toFile(resolve(outputDirectory, `favicon-${size}.png`))));
}
