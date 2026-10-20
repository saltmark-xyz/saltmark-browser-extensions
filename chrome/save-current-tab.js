import { saveCurrentTab } from "./core/save-current-tab.js";
import { resolveChromiumFaviconDataURL } from "./favicon.js";

export function saveCurrentChromiumTab(
  api,
  {
    faviconResolver = resolveChromiumFaviconDataURL,
    createRequestID = () => globalThis.crypto.randomUUID()
  } = {}
) {
  return saveCurrentTab(api, {
    createRequestID,
    faviconResolver: (_faviconURL, pageURL) =>
      faviconResolver(null, pageURL, { runtime: api.runtime })
  });
}
