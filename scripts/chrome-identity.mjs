import { createHash } from "node:crypto";

export const chromeWebStoreID = "ikodhdphpodjkdhafomobpjdhhhiiapd";

export function extensionIDFromPublicKey(publicKey) {
  if (typeof publicKey !== "string" || /\s/.test(publicKey)) {
    throw new Error("Chrome public key must be one-line Base64");
  }
  const der = Buffer.from(publicKey, "base64");
  if (der.length === 0 || der.toString("base64") !== publicKey) {
    throw new Error("Chrome public key is not canonical Base64 DER");
  }
  return [...createHash("sha256").update(der).digest("hex").slice(0, 32)]
    .map((nibble) => String.fromCharCode(97 + Number.parseInt(nibble, 16)))
    .join("");
}
