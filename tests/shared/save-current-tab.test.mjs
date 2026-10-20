import assert from "node:assert/strict";
import test from "node:test";
import { saveCurrentTab } from "../../shared/src/save-current-tab.js";

const requestId = "f5438378-be3f-4984-a592-b056d5986a5e";

test("Firefox action sends one correlated native message", async () => {
  let nativeCall;
  const api = {
    tabs: {
      query: async (query) => {
        assert.deepEqual(query, { active: true, currentWindow: true });
        return [{
          title: "Example",
          url: "https://example.com/docs",
          favIconUrl: "https://example.com/favicon.png"
        }];
      }
    },
    storage: {
      local: {
        get: async () => ({ silentMode: true })
      }
    },
    runtime: {
      sendNativeMessage: async (host, request) => {
        nativeCall = { host, request };
        return { requestId: request.requestId, ok: true };
      }
    }
  };

  const result = await saveCurrentTab(api, {
    createRequestID: () => requestId,
    faviconResolver: async (faviconURL, pageURL) => {
      assert.equal(faviconURL, "https://example.com/favicon.png");
      assert.equal(pageURL, "https://example.com/docs");
      return "data:image/png;base64,AQID";
    }
  });

  assert.equal(result, requestId);
  assert.equal(nativeCall.host, "xyz.saltmark.bridge");
  assert.equal(nativeCall.request.requestId, requestId);
  assert.equal(nativeCall.request.mode.silent, true);
});
