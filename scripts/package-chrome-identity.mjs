import { mkdir, readFile, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

await import("./build-chrome-identity.mjs");
await import("./lint-chrome-identity.mjs");

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const artifactRoot = resolve(repositoryRoot, ".build/chrome-identity");
const outputDirectory = resolve(repositoryRoot, "dist/chrome");
const manifest = JSON.parse(
  await readFile(resolve(artifactRoot, "manifest.json"), "utf8")
);
const outputURL = resolve(
  outputDirectory,
  `saltmark-chrome-identity-${manifest.version}.zip`
);

await mkdir(outputDirectory, { recursive: true });
await rm(outputURL, { force: true });
await run("/usr/bin/zip", [
  "-X",
  "-q",
  outputURL,
  "manifest.json",
  "icons/favicon-16.png",
  "icons/favicon-32.png",
  "icons/favicon-48.png",
  "icons/favicon-128.png"
], artifactRoot);
await run("/usr/bin/unzip", ["-tqq", outputURL], repositoryRoot);

const entries = (await capture("/usr/bin/unzip", ["-Z1", outputURL]))
  .trim()
  .split("\n")
  .filter((entry) => entry.length > 0);
assertSet(entries, [
  "manifest.json",
  "icons/favicon-16.png",
  "icons/favicon-32.png",
  "icons/favicon-48.png",
  "icons/favicon-128.png"
]);

process.stdout.write(`Chrome identity ZIP created at ${outputURL}\n`);

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

function capture(command, arguments_) {
  return new Promise((resolvePromise, reject) => {
    const process = spawn(command, arguments_, {
      stdio: ["ignore", "pipe", "inherit"]
    });
    let output = "";
    process.stdout.setEncoding("utf8");
    process.stdout.on("data", (chunk) => {
      output += chunk;
    });
    process.on("error", reject);
    process.on("exit", (status) => {
      if (status === 0) {
        resolvePromise(output);
      } else {
        reject(new Error(`${command} exited with status ${status}`));
      }
    });
  });
}

function assertSet(actual, expected) {
  if (
    actual.length !== expected.length
    || !expected.every((value) => actual.includes(value))
  ) {
    throw new Error("Chrome identity ZIP contains unexpected entries");
  }
}
