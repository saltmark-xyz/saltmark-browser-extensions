import assert from "node:assert/strict";
import test from "node:test";
import { chromiumAPI } from "../../.build/chrome/api.js";
import { resolveChromiumFaviconDataURL } from "../../.build/chrome/favicon.js";
import { saveCurrentChromiumTab } from "../../.build/chrome/save-current-tab.js";

const requestID = "f5438378-be3f-4984-a592-b056d5986a5e";

test("Chromium shortcut settings adapter opens the browser-owned page", async () => {
  let opened;
  const api = chromiumAPI({
    action: {},
    commands: { onCommand: {}, getAll: async () => [] },
    i18n: { getMessage: () => "" },
    runtime: { getURL: () => "", sendNativeMessage: async () => ({}) },
    storage: { local: { get: async () => ({}), set: async () => {} } },
    tabs: {
      create: async (details) => { opened = details; },
      query: async () => []
    }
  });
  await api.commands.openShortcutSettings();
  assert.deepEqual(opened, { url: "chrome://extensions/shortcuts" });
});

test("Chromium favicon adapter uses only the browser-owned Favicon API", async () => {
  let fetchedURL;
  const pngBytes = Uint8Array.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3
  ]);
  const result = await resolveChromiumFaviconDataURL(
    "https://site.example/icon.png",
    "https://site.example/path?q=1",
    {
      runtime: {
        getURL: (path) => {
          assert.equal(path, "/_favicon/");
          return "chrome-extension://ikodhdphpodjkdhafomobpjdhhhiiapd/_favicon/";
        }
      },
      fetcher: async (url) => {
        fetchedURL = new URL(url);
        return {
          ok: true,
          headers: new Headers(),
          arrayBuffer: async () => pngBytes.buffer
        };
      }
    }
  );
  assert.equal(fetchedURL.protocol, "chrome-extension:");
  assert.equal(fetchedURL.pathname, "/_favicon/");
  assert.equal(
    fetchedURL.searchParams.get("pageUrl"),
    "https://site.example/path?q=1"
  );
  assert.equal(fetchedURL.searchParams.get("size"), "32");
  assert.equal(
    result,
    `data:image/png;base64,${Buffer.from(pngBytes).toString("base64")}`
  );
});

test("Chromium favicon adapter rejects a headerless non-PNG response", async () => {
  const result = await resolveChromiumFaviconDataURL(
    null,
    "https://site.example/",
    {
      runtime: {
        getURL: () => "chrome-extension://example/_favicon/"
      },
      fetcher: async () => ({
        ok: true,
        headers: new Headers(),
        arrayBuffer: async () => Uint8Array.from([1, 2, 3]).buffer
      })
    }
  );
  assert.equal(result, null);
});

test("Chromium save reuses the shared correlated request path", async () => {
  let nativeRequest;
  const api = {
    runtime: {
      getURL: () => "chrome-extension://ikodhdphpodjkdhafomobpjdhhhiiapd/",
      sendNativeMessage: async (_host, request) => {
        nativeRequest = request;
        return { requestId: request.requestId, ok: true };
      }
    },
    storage: { local: { get: async () => ({ silentMode: true }) } },
    tabs: {
      query: async () => [{
        title: "Example",
        url: "https://example.com/",
        favIconUrl: "https://example.com/favicon.ico"
      }]
    }
  };
  await saveCurrentChromiumTab(api, {
    createRequestID: () => requestID,
    faviconResolver: async (_iconURL, pageURL) => {
      assert.equal(pageURL, "https://example.com/");
      return "data:image/png;base64,AQID";
    }
  });
  assert.equal(nativeRequest.requestId, requestID);
  assert.equal(nativeRequest.mode.silent, true);
  assert.equal(nativeRequest.bookmark.favIconUrl, "data:image/png;base64,AQID");
});
