import assert from "node:assert/strict";
import test from "node:test";
import {
  BrowserExtensionFailure,
  PROTOCOL_LIMITS,
  createBookmarkRequest,
  validateNativeResponse
} from "../../shared/src/protocol.js";

const requestId = "f5438378-be3f-4984-a592-b056d5986a5e";

test("canonical request contains only the minimal protocol fields", () => {
  const request = createBookmarkRequest({
    requestId,
    url: "https://example.com/docs",
    title: " Example ",
    silent: true,
    faviconDataURL: "data:image/png;base64,AQID"
  });

  assert.deepEqual(request, {
    kind: "saltmark.addBookmark",
    version: 1,
    requestId,
    mode: { silent: true },
    bookmark: {
      title: "Example",
      url: "https://example.com/docs",
      favIconUrl: "data:image/png;base64,AQID"
    }
  });
  assert.equal("source" in request, false);
  assert.equal("trigger" in request, false);
  assert.equal("sentAt" in request, false);
});

test("request IDs and bookmark URLs fail closed", () => {
  assert.throws(
    () => createBookmarkRequest({
      requestId: "not-a-uuid",
      url: "https://example.com",
      title: "Example"
    }),
    (error) => error instanceof BrowserExtensionFailure
      && error.code === "invalid_request_id"
  );
  assert.throws(
    () => createBookmarkRequest({
      requestId,
      url: "file:///private/sentinel",
      title: "Local"
    }),
    (error) => error instanceof BrowserExtensionFailure
      && error.code === "unsupported_tab_url"
  );
  assert.throws(
    () => createBookmarkRequest({
      requestId,
      url: `https://example.com/${"🙂".repeat(3_000)}`,
      title: "Expanded URL"
    }),
    (error) => error instanceof BrowserExtensionFailure
      && error.code === "url_too_long"
  );
});

test("favicon input cannot bypass the shared data-image policy", () => {
  const request = createBookmarkRequest({
    requestId,
    url: "https://example.com",
    title: "Example",
    faviconDataURL: "data:text/plain;base64,AQID"
  });
  assert.equal("favIconUrl" in request.bookmark, false);

  const canonical = createBookmarkRequest({
    requestId,
    url: "https://example.com",
    title: "Example",
    faviconDataURL: "data:image/jpg;base64,AQID"
  });
  assert.equal(
    canonical.bookmark.favIconUrl,
    "data:image/jpeg;base64,AQID"
  );
  assert.ok(
    new TextEncoder().encode(JSON.stringify(canonical)).byteLength
      <= PROTOCOL_LIMITS.maximumMessageByteCount
  );
});

test("native response must carry the exact request ID and a closed error", () => {
  assert.equal(
    validateNativeResponse({ requestId, ok: true }, requestId).ok,
    true
  );
  assert.throws(
    () => validateNativeResponse({ requestId: "different", ok: true }, requestId),
    (error) => error.code === "response_request_id_mismatch"
  );
  assert.throws(
    () => validateNativeResponse({ requestId, ok: false, error: "payload echo" }, requestId),
    (error) => error.code === "delivery_failed"
  );
  assert.throws(
    () => validateNativeResponse({ requestId, ok: true, extra: "payload" }, requestId),
    (error) => error.code === "delivery_failed"
  );
  assert.throws(
    () => validateNativeResponse({ requestId, ok: false }, requestId),
    (error) => error.code === "delivery_failed"
  );
});
