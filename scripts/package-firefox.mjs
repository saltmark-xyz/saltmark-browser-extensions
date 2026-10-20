import { mkdir, readFile, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

await import("./build-firefox.mjs");
await import("./lint-firefox.mjs");

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const artifactRoot = resolve(repositoryRoot, ".build/firefox");
const outputDirectory = resolve(repositoryRoot, "dist/firefox");
const manifest = JSON.parse(
  await readFile(resolve(artifactRoot, "manifest.json"), "utf8")
);
const outputURL = resolve(
  outputDirectory,
  `saltmark-firefox-${manifest.version}.xpi`
);

await mkdir(outputDirectory, { recursive: true });
await rm(outputURL, { force: true });
await run("/usr/bin/zip", ["-X", "-q", "-r", outputURL, "."], artifactRoot);

process.stdout.write(`Unsigned Firefox XPI created at ${outputURL}\n`);

function run(command, arguments_, cwd) {
  return new Promise((resolvePromise, reject) => {
    const process = spawn(command, arguments_, { cwd, stdio: "inherit" });
    process.on("error", reject);
    process.on("exit", (status) => {
      if (status === 0) {
        resolvePromise();
      } else {
        reject(new Error(`${command} exited with status ${status}`));
      }
    });
  });
}
