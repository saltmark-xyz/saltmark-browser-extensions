import { chromiumAPI } from "../api.js";

const api = chromiumAPI();
const silentMode = document.querySelector("#silent-mode");
const shortcutButton = document.querySelector("#open-shortcut-settings");

for (const element of document.querySelectorAll("[data-i18n]")) {
  const message = api.i18n.getMessage(element.dataset.i18n);
  if (message) element.textContent = message;
}

const stored = await api.storage.local.get({ silentMode: false });
silentMode.checked = stored.silentMode === true;
silentMode.addEventListener("change", async () => {
  await api.storage.local.set({ silentMode: silentMode.checked });
});
shortcutButton.addEventListener("click", () => api.commands.openShortcutSettings());
