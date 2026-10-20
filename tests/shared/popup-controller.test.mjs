import assert from "node:assert/strict";
import test from "node:test";
import {
  displayShortcut,
  installPopupController
} from "../../shared/src/popup-controller.js";

test("popup presents the current page, shortcut and unsorted-save preference", async () => {
  const api = popupAPI();
  const view = popupView();

  await installPopupController(api, view, { save: async () => {} });

  assert.deepEqual(view.rendered, {
    canSave: true,
    pageTitle: "SaltMark Docs",
    pageHost: "example.com",
    shortcut: "⌃⇧S",
    silentMode: true
  });
  assert.equal(view.outcomes.length, 0);
});

test("popup sends through shared behavior and reports only closed outcomes", async () => {
  const api = popupAPI();
  const view = popupView();
  let saveCount = 0;
  await installPopupController(api, view, {
    save: async () => { saveCount += 1; }
  });

  await view.saveHandler();

  assert.equal(saveCount, 1);
  assert.deepEqual(view.busy, [true, false]);
  assert.deepEqual(view.outcomes, ["sending", "sent"]);
});

test("popup rejects unsupported pages before native messaging", async () => {
  const api = popupAPI({
    tab: { title: "Firefox Settings", url: "about:preferences" }
  });
  const view = popupView();
  let saveCount = 0;
  await installPopupController(api, view, {
    save: async () => { saveCount += 1; }
  });

  assert.equal(view.rendered.canSave, false);
  assert.deepEqual(view.outcomes, ["unsupported"]);
  await view.saveHandler();
  assert.equal(saveCount, 0);
});

test("popup persists the unsorted-save preference and opens shortcut settings", async () => {
  const api = popupAPI();
  const view = popupView();
  await installPopupController(api, view, { save: async () => {} });

  await view.silentModeHandler(false);
  await view.shortcutHandler();

  assert.deepEqual(api.savedPreferences, [{ silentMode: false }]);
  assert.equal(api.shortcutSettingsOpenCount, 1);
});

test("popup turns private native failures into recovery state", async () => {
  const api = popupAPI();
  const view = popupView();
  await installPopupController(api, view, {
    save: async () => { throw new Error("private native diagnostic"); }
  });

  await view.saveHandler();

  assert.deepEqual(view.outcomes, ["sending", "failure"]);
});

test("shortcut display follows the actual Firefox command", () => {
  assert.equal(displayShortcut("MacCtrl+Shift+S"), "⌃⇧S");
  assert.equal(displayShortcut("Command+Shift+K"), "⌘⇧K");
  assert.equal(displayShortcut("MacCtrl+Alt+B"), "⌃⌥B");
  assert.equal(displayShortcut(""), null);
  assert.equal(displayShortcut(undefined), null);
});

function popupAPI({
  tab = {
    title: "SaltMark Docs",
    url: "https://example.com/docs"
  }
} = {}) {
  const api = {
    savedPreferences: [],
    shortcutSettingsOpenCount: 0,
    tabs: {
      query: async (query) => {
        assert.deepEqual(query, { active: true, currentWindow: true });
        return [tab];
      }
    },
    storage: {
      local: {
        get: async () => ({ silentMode: true }),
        set: async (value) => { api.savedPreferences.push(value); }
      }
    },
    commands: {
      getAll: async () => [{
        name: "save-current-tab",
        shortcut: "MacCtrl+Shift+S"
      }],
      openShortcutSettings: async () => {
        api.shortcutSettingsOpenCount += 1;
      }
    }
  };
  return api;
}

function popupView() {
  return {
    busy: [],
    outcomes: [],
    rendered: null,
    saveHandler: null,
    silentModeHandler: null,
    shortcutHandler: null,
    onSave(handler) { this.saveHandler = handler; },
    onSilentModeChange(handler) { this.silentModeHandler = handler; },
    onOpenShortcutSettings(handler) { this.shortcutHandler = handler; },
    render(value) { this.rendered = value; },
    setBusy(value) { this.busy.push(value); },
    setSilentMode(value) { this.silentMode = value; },
    setOutcome(value) { this.outcomes.push(value); }
  };
}
