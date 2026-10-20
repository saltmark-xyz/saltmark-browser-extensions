# Native Messaging Protocol

The standalone extensions send framed JSON through the browser-owned native
messaging API to host `xyz.saltmark.bridge`. Browser framing is handled by the
browser and Direct native bridge; extension JavaScript sends only the JSON value.

Version 1 request:

```json
{
  "kind": "saltmark.addBookmark",
  "version": 1,
  "requestId": "f5438378-be3f-4984-a592-b056d5986a5e",
  "mode": { "silent": false },
  "bookmark": {
    "title": "Example",
    "url": "https://example.com/",
    "favIconUrl": "data:image/png;base64,AQID"
  }
}
```

`requestId` is a new UUID for every user action and is mandatory. URL schemes are
limited to HTTP(S). Title, URL, message and optional favicon sizes are bounded in
`shared/src/protocol.js`. `favIconUrl` is omitted when no validated bounded data
image is available.

Responses contain only `requestId`, `ok` and, on failure, one closed error code.
The extension accepts a response only when its request ID is an exact match. A
payload field claiming an extension identity is prohibited; caller identity is
authorized by the browser-owned native-host manifest. Gecko uses the exact
`allowed_extensions` ID and supplies the manifest path followed by that ID.
Chrome and Brave use the exact `allowed_origins` value
`chrome-extension://ikodhdphpodjkdhafomobpjdhhhiiapd/` and supply that origin as
their sole argument after the bridge path. SaltMark Direct validates the two
layouts as separate closed branches before reading the message.

The extension validates both individual fields and the complete serialized
request against the shared 64 KiB UTF-8 limit. Optional favicon data is
revalidated at request construction and omitted rather than allowing favicon
failure to block the bookmark. A native response must contain exactly the
approved success or failure fields; unknown or additional fields fail closed.
