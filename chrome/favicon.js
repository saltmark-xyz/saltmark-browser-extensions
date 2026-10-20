import { resolveFaviconDataURL } from "./core/favicon.js";

export async function resolveChromiumFaviconDataURL(
  _browserProvidedIconURL,
  pageURL,
  {
    runtime = globalThis.chrome?.runtime,
    fetcher = globalThis.fetch
  } = {}
) {
  let validatedPageURL;
  try {
    validatedPageURL = new URL(pageURL);
  } catch {
    return null;
  }
  if (!["http:", "https:"].includes(validatedPageURL.protocol)) {
    return null;
  }

  const faviconURL = new URL(runtime.getURL("/_favicon/"));
  faviconURL.searchParams.set("pageUrl", validatedPageURL.href);
  faviconURL.searchParams.set("size", "32");
  return resolveFaviconDataURL(faviconURL.href, {
    fetcher,
    allowedProtocols: ["chrome-extension:"],
    allowsHeaderlessPNG: true
  });
}
