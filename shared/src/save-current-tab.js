import { resolveFaviconDataURL } from "./favicon.js";
import {
  NATIVE_HOST_NAME,
  BrowserExtensionFailure,
  createBookmarkRequest,
  validateNativeResponse
} from "./protocol.js";

export async function saveCurrentTab(
  api,
  {
    createRequestID = () => globalThis.crypto.randomUUID(),
    faviconResolver = resolveFaviconDataURL
  } = {}
) {
  const tabs = await api.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab) {
    throw new BrowserExtensionFailure("active_tab_unavailable");
  }

  const settings = await api.storage.local.get({ silentMode: false });
  const faviconDataURL = await faviconResolver(tab.favIconUrl, tab.url);
  const request = createBookmarkRequest({
    requestId: createRequestID(),
    url: tab.url,
    title: tab.title,
    silent: settings.silentMode === true,
    faviconDataURL
  });
  const response = await api.runtime.sendNativeMessage(
    NATIVE_HOST_NAME,
    request
  );
  validateNativeResponse(response, request.requestId);
  return request.requestId;
}
