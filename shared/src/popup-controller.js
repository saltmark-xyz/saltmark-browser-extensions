import {
  BrowserExtensionFailure,
  validatedBookmarkURL
} from "./protocol.js";
import { saveCurrentTab } from "./save-current-tab.js";
import { SAVE_CURRENT_TAB_COMMAND } from "./background-controller.js";

export async function installPopupController(
  api,
  view,
  { save = saveCurrentTab } = {}
) {
  let pageCanBeSaved = false;
  let silentMode = false;

  view.onSave(async () => {
    if (!pageCanBeSaved) {
      view.setOutcome("unsupported");
      return;
    }
    view.setBusy(true);
    view.setOutcome("sending");
    try {
      await save(api);
      view.setOutcome("sent");
    } catch (error) {
      view.setOutcome(isUnsupportedPageFailure(error) ? "unsupported" : "failure");
    } finally {
      view.setBusy(false);
    }
  });

  view.onSilentModeChange(async (enabled) => {
    const previousValue = silentMode;
    silentMode = enabled === true;
    try {
      await api.storage.local.set({ silentMode });
    } catch {
      silentMode = previousValue;
      view.setSilentMode(silentMode);
      view.setOutcome("preferenceFailure");
    }
  });

  view.onOpenShortcutSettings(async () => {
    try {
      await api.commands.openShortcutSettings();
    } catch {
      view.setOutcome("shortcutFailure");
    }
  });

  const [tabs, stored, commands] = await Promise.all([
    api.tabs.query({ active: true, currentWindow: true }),
    api.storage.local.get({ silentMode: false }),
    api.commands.getAll()
  ]);
  const page = popupPage(tabs[0]);
  const shortcut = commands.find(
    (command) => command.name === SAVE_CURRENT_TAB_COMMAND
  )?.shortcut;
  pageCanBeSaved = page.canSave;
  silentMode = stored.silentMode === true;

  view.render({
    ...page,
    shortcut: displayShortcut(shortcut),
    silentMode
  });
  if (!pageCanBeSaved) {
    view.setOutcome("unsupported");
  }
}

export function displayShortcut(rawValue) {
  if (typeof rawValue !== "string" || rawValue.trim().length === 0) {
    return null;
  }
  const symbols = new Map([
    ["Command", "⌘"],
    ["MacCtrl", "⌃"],
    ["Ctrl", "⌃"],
    ["Alt", "⌥"],
    ["Shift", "⇧"]
  ]);
  return rawValue
    .split("+")
    .map((part) => symbols.get(part) ?? part)
    .join("");
}

function popupPage(tab) {
  try {
    const url = validatedBookmarkURL(tab?.url);
    const rawTitle = typeof tab?.title === "string" ? tab.title.trim() : "";
    return {
      canSave: true,
      pageTitle: rawTitle.length > 0 ? rawTitle : url.hostname,
      pageHost: url.hostname
    };
  } catch {
    return {
      canSave: false,
      pageTitle: null,
      pageHost: null
    };
  }
}

function isUnsupportedPageFailure(error) {
  return error instanceof BrowserExtensionFailure
    && ["unsupported_tab_url", "url_too_long"].includes(error.code);
}
