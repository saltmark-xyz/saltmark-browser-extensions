import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("source license distinguishes code from reserved branding", async () => {
  const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8");
  const manifest = JSON.parse(await read("package.json"));
  assert.equal(manifest.license, "Apache-2.0");
  assert.equal(manifest.devDependencies.sharp, "0.35.5");
  assert.match(await read("LICENSE"), /Version 2\.0, January 2004/);
  assert.match(await read("NOTICE"), /Copyright 2026 Vitali Rijenco/);
  assert.match(await read("NOTICE"), /Branding artwork is excluded/);
  assert.match(await read("BRANDING.md"), /not SaltMark branding/);
  assert.match(await read("BRANDING.md"), /All rights reserved/);
});

test("both products include unchanged license and branding notices", async () => {
  for (const browser of ["chrome", "firefox"]) {
    for (const name of ["LICENSE", "NOTICE", "BRANDING.md"]) {
      const original = await readFile(new URL(`../../${name}`, import.meta.url));
      const packaged = await readFile(new URL(`../../.build/${browser}/${name}`, import.meta.url));
      assert.deepEqual(packaged, original, `${browser}/${name}`);
    }
  }
});
