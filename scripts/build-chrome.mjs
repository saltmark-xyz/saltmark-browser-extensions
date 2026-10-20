import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { renderAppIcons } from "./app-icons.mjs";
import {
  chromeIconSizes
} from "./chrome-icon-contract.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sharedSource = resolve(repositoryRoot, "shared/src");
const chromeSource = resolve(repositoryRoot, "chrome");
const outputRoot = resolve(repositoryRoot, ".build/chrome");
const iconOutput = resolve(outputRoot, "icons");

await rm(outputRoot, { recursive: true, force: true });
await mkdir(iconOutput, { recursive: true });
await Promise.all([
  ...["LICENSE", "NOTICE", "BRANDING.md"].map((name) =>
    cp(resolve(repositoryRoot, name), resolve(outputRoot, name))
  ),
  cp(sharedSource, resolve(outputRoot, "core"), { recursive: true }),
  cp(resolve(chromeSource, "manifest.json"), resolve(outputRoot, "manifest.json")),
  cp(resolve(chromeSource, "background.js"), resolve(outputRoot, "background.js")),
  cp(resolve(chromeSource, "api.js"), resolve(outputRoot, "api.js")),
  cp(resolve(chromeSource, "favicon.js"), resolve(outputRoot, "favicon.js")),
  cp(
    resolve(chromeSource, "save-current-tab.js"),
    resolve(outputRoot, "save-current-tab.js")
  ),
  cp(resolve(chromeSource, "popup"), resolve(outputRoot, "popup"), {
    recursive: true
  }),
  cp(resolve(chromeSource, "options"), resolve(outputRoot, "options"), {
    recursive: true
  }),
  cp(resolve(chromeSource, "locales"), resolve(outputRoot, "_locales"), {
    recursive: true
  })
]);
await renderAppIcons(iconOutput, chromeIconSizes);

process.stdout.write(`Chrome extension composed at ${outputRoot}\n`);
