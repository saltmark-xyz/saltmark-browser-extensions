import { installBackgroundController } from "./core/background-controller.js";
import { chromiumAPI } from "./api.js";
import { saveCurrentChromiumTab } from "./save-current-tab.js";

const api = chromiumAPI();
installBackgroundController(api, { save: saveCurrentChromiumTab });
