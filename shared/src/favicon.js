import {
  hasPNGSignature,
  isSupportedFaviconMIMEType,
  normalizedFaviconMIMEType,
  validatedDataImageURL
} from "./favicon-data-url.js";
import { PROTOCOL_LIMITS } from "./protocol-limits.js";

export { validatedDataImageURL } from "./favicon-data-url.js";

export async function resolveFaviconDataURL(
  rawValue,
  {
    fetcher = globalThis.fetch,
    timeoutMilliseconds = 1_500,
    encodeBase64 = bytesToBase64,
    allowedProtocols = ["http:", "https:"],
    allowsHeaderlessPNG = false
  } = {}
) {
  if (typeof rawValue !== "string" || rawValue.length === 0) {
    return null;
  }
  if (rawValue.startsWith("data:")) {
    return validatedDataImageURL(rawValue);
  }

  let iconURL;
  try {
    iconURL = new URL(rawValue);
  } catch {
    return null;
  }
  if (!allowedProtocols.includes(iconURL.protocol)) {
    return null;
  }
  if (typeof fetcher !== "function") {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMilliseconds);
  try {
    const response = await fetcher(iconURL.href, {
      cache: "force-cache",
      credentials: "omit",
      redirect: "follow",
      referrerPolicy: "no-referrer",
      signal: controller.signal
    });
    if (!response?.ok) {
      return null;
    }

    const declaredMIMEType = normalizedFaviconMIMEType(
      response.headers?.get("content-type")
    );
    const usesHeaderlessPNG = declaredMIMEType.length === 0
      && allowsHeaderlessPNG;
    if (!isSupportedFaviconMIMEType(declaredMIMEType)
        && !usesHeaderlessPNG) {
      return null;
    }
    const declaredLength = Number(response.headers?.get("content-length"));
    if (Number.isFinite(declaredLength)
        && declaredLength > PROTOCOL_LIMITS.maximumFaviconByteCount) {
      return null;
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length === 0
        || bytes.length > PROTOCOL_LIMITS.maximumFaviconByteCount) {
      return null;
    }
    if (usesHeaderlessPNG && !hasPNGSignature(bytes)) {
      return null;
    }
    const mimeType = usesHeaderlessPNG ? "image/png" : declaredMIMEType;
    return validatedDataImageURL(
      `data:${mimeType};base64,${encodeBase64(bytes)}`
    );
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function bytesToBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return globalThis.btoa(binary);
}
