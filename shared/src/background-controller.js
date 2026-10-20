import { saveCurrentTab } from "./save-current-tab.js";

const successColor = "#238636";
const failureColor = "#cf222e";
export const SAVE_CURRENT_TAB_COMMAND = "save-current-tab";

export function installBackgroundController(
  api,
  {
    save = saveCurrentTab,
    schedule = globalThis.setTimeout
  } = {}
) {
  const execute = () => executeSave(api, { save, schedule });
  api.commands.onCommand.addListener((command) => {
    if (command === SAVE_CURRENT_TAB_COMMAND) {
      return execute();
    }
    return undefined;
  });
  return execute;
}

export async function executeSave(
  api,
  {
    save = saveCurrentTab,
    schedule = globalThis.setTimeout
  } = {}
) {
  try {
    await save(api);
    await showBadge(api, "OK", successColor, 1_800, schedule);
  } catch {
    await showBadge(api, "!", failureColor, 3_200, schedule);
  }
}

async function showBadge(api, text, color, clearDelay, schedule) {
  try {
    await api.action.setBadgeBackgroundColor({ color });
    await api.action.setBadgeText({ text });
  } catch {
    return;
  }
  schedule(() => {
    void api.action.setBadgeText({ text: "" }).catch(() => {});
  }, clearDelay);
}
