import { mkdir, readFile, readdir, rm, stat, utimes } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

await import("./build-chrome.mjs");
await import("./lint-chrome.mjs");

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const artifactRoot = resolve(repositoryRoot, ".build/chrome");
const outputDirectory = resolve(repositoryRoot, "dist/chrome");
const manifest = JSON.parse(await readFile(resolve(artifactRoot, "manifest.json")));
const outputURL = resolve(outputDirectory, `saltmark-chrome-${manifest.version}.zip`);
const files = (await recursiveFiles(artifactRoot))
  .map((path) => relative(artifactRoot, path))
  .sort();
const timestamp = new Date("1980-01-01T00:00:00.000Z");
await Promise.all(files.map((path) =>
  utimes(resolve(artifactRoot, path), timestamp, timestamp)
));
await mkdir(outputDirectory, { recursive: true });
await rm(outputURL, { force: true });
await run("/usr/bin/zip", ["-X", "-q", outputURL, ...files], artifactRoot);
await run("/usr/bin/unzip", ["-tqq", outputURL], repositoryRoot);
const entries = (await capture("/usr/bin/unzip", ["-Z1", outputURL]))
  .trim().split("\n").filter(Boolean);
assertSet(entries, files);
process.stdout.write(`Chrome ZIP created at ${outputURL}\n`);

async function recursiveFiles(root) {
  const result = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = resolve(root, entry.name);
    if (entry.isDirectory()) result.push(...await recursiveFiles(path));
    else if ((await stat(path)).isFile()) result.push(path);
  }
  return result;
}

function run(command, arguments_, cwd) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, arguments_, { cwd, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (status) => status === 0
      ? resolvePromise()
      : reject(new Error(`${command} exited with status ${status}`)));
  });
}

function capture(command, arguments_) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, arguments_, {
      stdio: ["ignore", "pipe", "inherit"]
    });
    let output = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.on("error", reject);
    child.on("exit", (status) => status === 0
      ? resolvePromise(output)
      : reject(new Error(`${command} exited with status ${status}`)));
  });
}

function assertSet(actual, expected) {
  if (actual.length !== expected.length
      || !expected.every((value) => actual.includes(value))) {
    throw new Error("Chrome ZIP contains unexpected entries");
  }
}
