import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { firefoxIconSizes, renderAppIcons } from "./app-icons.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sharedSource = resolve(repositoryRoot, "shared/src");
const firefoxSource = resolve(repositoryRoot, "firefox");
const outputRoot = resolve(repositoryRoot, ".build/firefox");

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });
await mkdir(resolve(outputRoot, "icons"), { recursive: true });

await Promise.all([
  ...["LICENSE", "NOTICE", "BRANDING.md"].map((name) =>
    cp(resolve(repositoryRoot, name), resolve(outputRoot, name))
  ),
  cp(sharedSource, resolve(outputRoot, "core"), {
    recursive: true
  }),
  cp(resolve(firefoxSource, "manifest.json"), resolve(outputRoot, "manifest.json")),
  cp(resolve(firefoxSource, "background.js"), resolve(outputRoot, "background.js")),
  cp(resolve(firefoxSource, "popup"), resolve(outputRoot, "popup"), {
    recursive: true
  }),
  cp(resolve(firefoxSource, "options"), resolve(outputRoot, "options"), {
    recursive: true
  }),
  cp(resolve(firefoxSource, "locales"), resolve(outputRoot, "_locales"), {
    recursive: true
  })
]);
await renderAppIcons(resolve(outputRoot, "icons"), firefoxIconSizes);

process.stdout.write(`Firefox extension composed at ${outputRoot}\n`);
