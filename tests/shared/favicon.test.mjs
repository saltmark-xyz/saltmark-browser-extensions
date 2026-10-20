import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveFaviconDataURL,
  validatedDataImageURL
} from "../../shared/src/favicon.js";

test("bounded data-image favicons pass without network access", async () => {
  let fetched = false;
  const favicon = await resolveFaviconDataURL(
    "data:image/png;base64,AQID",
    { fetcher: async () => { fetched = true; } }
  );
  assert.equal(favicon, "data:image/png;base64,AQID");
  assert.equal(fetched, false);
});

test("browser-provided remote favicon is converted to bounded data", async () => {
  const favicon = await resolveFaviconDataURL(
    "https://example.com/favicon.png",
    {
      fetcher: async (_url, options) => {
        assert.equal(options.credentials, "omit");
        assert.equal(options.referrerPolicy, "no-referrer");
        return {
          ok: true,
          headers: new Headers({
            "content-type": "image/png",
            "content-length": "3"
          }),
          arrayBuffer: async () => Uint8Array.from([1, 2, 3]).buffer
        };
      }
    }
  );
  assert.equal(favicon, "data:image/png;base64,AQID");
});

test("unsupported and oversized favicons are omitted", async () => {
  assert.equal(validatedDataImageURL("data:image/tiff;base64,AQID"), null);
  const favicon = await resolveFaviconDataURL(
    "https://example.com/favicon.png",
    {
      fetcher: async () => ({
        ok: true,
        headers: new Headers({
          "content-type": "image/png",
          "content-length": String(32 * 1024 + 1)
        }),
        arrayBuffer: async () => new ArrayBuffer(0)
      })
    }
  );
  assert.equal(favicon, null);
});

test("non-web favicon schemes require an explicit browser adapter policy", async () => {
  const rawValue = "chrome-extension://example/_favicon/?pageUrl=https://example.com";
  assert.equal(await resolveFaviconDataURL(rawValue), null);
  assert.equal(
    await resolveFaviconDataURL(rawValue, {
      allowedProtocols: ["chrome-extension:"],
      fetcher: async () => ({
        ok: true,
        headers: new Headers({ "content-type": "image/png" }),
        arrayBuffer: async () => Uint8Array.from([1, 2, 3]).buffer
      })
    }),
    "data:image/png;base64,AQID"
  );
});

test("headerless PNG requires an explicit adapter policy and exact signature", async () => {
  const rawValue = "chrome-extension://example/_favicon/?pageUrl=https://example.com";
  const pngBytes = Uint8Array.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3
  ]);
  const fetcher = async () => ({
    ok: true,
    headers: new Headers(),
    arrayBuffer: async () => pngBytes.buffer
  });

  assert.equal(
    await resolveFaviconDataURL(rawValue, {
      allowedProtocols: ["chrome-extension:"],
      fetcher
    }),
    null
  );
  assert.equal(
    await resolveFaviconDataURL(rawValue, {
      allowedProtocols: ["chrome-extension:"],
      allowsHeaderlessPNG: true,
      fetcher
    }),
    `data:image/png;base64,${Buffer.from(pngBytes).toString("base64")}`
  );
  assert.equal(
    await resolveFaviconDataURL(rawValue, {
      allowedProtocols: ["chrome-extension:"],
      allowsHeaderlessPNG: true,
      fetcher: async () => ({
        ok: true,
        headers: new Headers(),
        arrayBuffer: async () => Uint8Array.from([1, 2, 3]).buffer
      })
    }),
    null
  );
});
