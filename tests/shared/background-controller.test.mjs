import assert from "node:assert/strict";
import test from "node:test";
import {
  executeSave,
  installBackgroundController
} from "../../shared/src/background-controller.js";

test("background controller installs only the direct-save command", async () => {
  let listener;
  const api = badgeAPI({
    addListener: (value) => { listener = value; }
  });
  let saveCount = 0;
  const execute = installBackgroundController(api, {
    save: async () => { saveCount += 1; },
    schedule: () => {}
  });

  assert.equal(typeof listener, "function");
  assert.equal(typeof execute, "function");
  await listener("save-current-tab");
  assert.equal(saveCount, 1);
  assert.deepEqual(api.badgeTexts, ["OK"]);

  await listener("unrelated-command");
  assert.equal(saveCount, 1);
});

test("background controller reports success and clears its badge", async () => {
  const api = badgeAPI();
  let scheduled;
  await executeSave(api, {
    save: async () => {},
    schedule: (operation, delay) => {
      scheduled = { operation, delay };
    }
  });

  assert.deepEqual(api.badgeColors, ["#238636"]);
  assert.deepEqual(api.badgeTexts, ["OK"]);
  assert.equal(scheduled.delay, 1_800);
  scheduled.operation();
  await Promise.resolve();
  assert.deepEqual(api.badgeTexts, ["OK", ""]);
});

test("background controller converts private failures to a closed badge", async () => {
  const api = badgeAPI();
  let scheduledDelay;
  await executeSave(api, {
    save: async () => { throw new Error("private payload diagnostic"); },
    schedule: (_operation, delay) => { scheduledDelay = delay; }
  });

  assert.deepEqual(api.badgeColors, ["#cf222e"]);
  assert.deepEqual(api.badgeTexts, ["!"]);
  assert.equal(scheduledDelay, 3_200);
});

function badgeAPI({ addListener = () => {} } = {}) {
  const badgeColors = [];
  const badgeTexts = [];
  return {
    badgeColors,
    badgeTexts,
    commands: {
      onCommand: { addListener }
    },
    action: {
      setBadgeBackgroundColor: async ({ color }) => {
        badgeColors.push(color);
      },
      setBadgeText: async ({ text }) => {
        badgeTexts.push(text);
      }
    }
  };
}
