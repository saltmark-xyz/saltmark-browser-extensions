import { cp, mkdir, rm, utimes } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { renderAppIcons } from "./app-icons.mjs";
import {
  chromeIconSizes
} from "./chrome-icon-contract.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestSource = resolve(repositoryRoot, "chrome/identity/manifest.json");
const outputRoot = resolve(repositoryRoot, ".build/chrome-identity");
const iconOutput = resolve(outputRoot, "icons");

await rm(outputRoot, { recursive: true, force: true });
await mkdir(iconOutput, { recursive: true });
await cp(manifestSource, resolve(outputRoot, "manifest.json"));

await renderAppIcons(iconOutput, chromeIconSizes);

const stableTimestamp = new Date("1980-01-01T00:00:00.000Z");
await Promise.all([
  resolve(outputRoot, "manifest.json"),
  ...chromeIconSizes.map((size) => resolve(iconOutput, `favicon-${size}.png`))
].map((path) => utimes(path, stableTimestamp, stableTimestamp)));

process.stdout.write(`Chrome identity extension composed at ${outputRoot}\n`);
