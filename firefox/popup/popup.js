import { installPopupController } from "../core/popup-controller.js";

const api = globalThis.browser;
const saveButton = document.querySelector("#save-bookmark");
const pageTitle = document.querySelector("#page-title");
const pageHost = document.querySelector("#page-host");
const outcome = document.querySelector("#outcome");
const silentMode = document.querySelector("#silent-mode");
const shortcut = document.querySelector("#shortcut");
const configureShortcut = document.querySelector("#configure-shortcut");

for (const element of document.querySelectorAll("[data-i18n]")) {
  const message = api.i18n.getMessage(element.dataset.i18n);
  if (message) {
    element.textContent = message;
  }
}

const outcomeMessages = {
  sending: "sendingStatus",
  sent: "sentStatus",
  failure: "sendFailureStatus",
  unsupported: "unsupportedPageStatus",
  preferenceFailure: "preferenceFailureStatus",
  shortcutFailure: "shortcutFailureStatus"
};

const view = {
  onSave(handler) {
    saveButton.addEventListener("click", handler);
  },
  onSilentModeChange(handler) {
    silentMode.addEventListener("change", () => handler(silentMode.checked));
  },
  onOpenShortcutSettings(handler) {
    configureShortcut.addEventListener("click", handler);
  },
  render(state) {
    pageTitle.textContent = state.pageTitle
      ?? api.i18n.getMessage("unsupportedPageTitle");
    pageHost.textContent = state.pageHost ?? "";
    shortcut.textContent = state.shortcut
      ?? api.i18n.getMessage("shortcutNotSet");
    silentMode.checked = state.silentMode;
    saveButton.disabled = !state.canSave;
  },
  setBusy(isBusy) {
    saveButton.disabled = isBusy;
    saveButton.setAttribute("aria-busy", String(isBusy));
  },
  setSilentMode(enabled) {
    silentMode.checked = enabled;
  },
  setOutcome(kind) {
    outcome.dataset.kind = kind;
    outcome.textContent = api.i18n.getMessage(outcomeMessages[kind]);
  }
};

await installPopupController(api, view);
