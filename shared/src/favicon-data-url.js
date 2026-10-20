import { PROTOCOL_LIMITS } from "./protocol-limits.js";

const supportedMIMETypes = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon"
]);
const pngSignature = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
]);

export function validatedDataImageURL(rawValue) {
  if (typeof rawValue !== "string"
      || rawValue.length > PROTOCOL_LIMITS.maximumFaviconDataURLCharacterCount) {
    return null;
  }
  const match = /^data:([^;,]+);base64,([a-z0-9+/=]+)$/i.exec(rawValue);
  if (!match) {
    return null;
  }
  const mimeType = normalizedFaviconMIMEType(match[1]);
  if (!isSupportedFaviconMIMEType(mimeType)) {
    return null;
  }

  try {
    const decoded = globalThis.atob(match[2]);
    if (decoded.length === 0
        || decoded.length > PROTOCOL_LIMITS.maximumFaviconByteCount) {
      return null;
    }
  } catch {
    return null;
  }
  return `data:${mimeType};base64,${match[2]}`;
}

export function normalizedFaviconMIMEType(rawValue) {
  const value = (rawValue || "")
    .split(";", 1)[0]
    .trim()
    .toLowerCase();
  return value === "image/jpg" ? "image/jpeg" : value;
}

export function isSupportedFaviconMIMEType(value) {
  return supportedMIMETypes.has(value);
}

export function hasPNGSignature(bytes) {
  return bytes instanceof Uint8Array
    && bytes.length >= pngSignature.length
    && pngSignature.every((value, index) => bytes[index] === value);
}
