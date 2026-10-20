import { validatedDataImageURL } from "./favicon-data-url.js";
import { PROTOCOL_LIMITS } from "./protocol-limits.js";

export const NATIVE_HOST_NAME = "xyz.saltmark.bridge";
export const MESSAGE_KIND = "saltmark.addBookmark";
export const MESSAGE_VERSION = 1;
export { PROTOCOL_LIMITS } from "./protocol-limits.js";

const requestIDPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class BrowserExtensionFailure extends Error {
  constructor(code) {
    super(code);
    this.name = "BrowserExtensionFailure";
    this.code = code;
  }
}

export function createBookmarkRequest({
  requestId,
  url,
  title,
  silent = false,
  faviconDataURL = null
}) {
  if (!requestIDPattern.test(requestId)) {
    throw new BrowserExtensionFailure("invalid_request_id");
  }

  const validatedURL = validatedBookmarkURL(url);
  const normalizedTitle = normalizedBookmarkTitle(title, validatedURL);
  const bookmark = {
    title: normalizedTitle,
    url: validatedURL.href
  };
  const validatedFavicon = validatedDataImageURL(faviconDataURL);
  if (validatedFavicon !== null) {
    bookmark.favIconUrl = validatedFavicon;
  }

  const request = {
    kind: MESSAGE_KIND,
    version: MESSAGE_VERSION,
    requestId,
    mode: { silent: silent === true },
    bookmark
  };
  if (encodedByteCount(request) > PROTOCOL_LIMITS.maximumMessageByteCount) {
    delete bookmark.favIconUrl;
  }
  if (encodedByteCount(request) > PROTOCOL_LIMITS.maximumMessageByteCount) {
    throw new BrowserExtensionFailure("message_too_large");
  }
  return request;
}

export function validateNativeResponse(response, requestId) {
  if (!isPlainObject(response) || response.requestId !== requestId) {
    throw new BrowserExtensionFailure("response_request_id_mismatch");
  }
  if (response.ok === true && hasExactKeys(response, ["ok", "requestId"])) {
    return response;
  }
  const allowedCodes = new Set([
    "invalid_request",
    "unauthorized_caller",
    "app_unavailable",
    "delivery_failed"
  ]);
  if (response.ok === false
      && hasExactKeys(response, ["error", "ok", "requestId"])
      && allowedCodes.has(response.error)) {
    throw new BrowserExtensionFailure(response.error);
  }
  throw new BrowserExtensionFailure("delivery_failed");
}

export function validatedBookmarkURL(rawValue) {
  if (typeof rawValue !== "string" || rawValue.length === 0) {
    throw new BrowserExtensionFailure("unsupported_tab_url");
  }
  if (rawValue.length > PROTOCOL_LIMITS.maximumURLCharacterCount) {
    throw new BrowserExtensionFailure("url_too_long");
  }

  let url;
  try {
    url = new URL(rawValue);
  } catch {
    throw new BrowserExtensionFailure("unsupported_tab_url");
  }
  if ((url.protocol !== "http:" && url.protocol !== "https:") || !url.hostname) {
    throw new BrowserExtensionFailure("unsupported_tab_url");
  }
  if (url.href.length > PROTOCOL_LIMITS.maximumURLCharacterCount) {
    throw new BrowserExtensionFailure("url_too_long");
  }
  return url;
}

function normalizedBookmarkTitle(rawValue, url) {
  const title = typeof rawValue === "string" ? rawValue.trim() : "";
  const fallback = url.hostname || url.href;
  const resolved = title.length === 0 ? fallback : title;
  if (resolved.length > PROTOCOL_LIMITS.maximumTitleCharacterCount) {
    throw new BrowserExtensionFailure("title_too_long");
  }
  return resolved;
}

function encodedByteCount(value) {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

function isPlainObject(value) {
  return value !== null
    && typeof value === "object"
    && !Array.isArray(value);
}

function hasExactKeys(value, expectedKeys) {
  const keys = Object.keys(value).sort();
  return keys.length === expectedKeys.length
    && keys.every((key, index) => key === expectedKeys[index]);
}
