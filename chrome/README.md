# Chrome Composition Boundary And Identity Gate

Chrome and Brave share one Manifest V3 product composition and the stable Chrome
Web Store ID `ikodhdphpodjkdhafomobpjdhhhiiapd`. The public key returned by the
unpublished identity upload is pinned in `manifest.json`; build tests derive the
ID from that key and fail closed on drift.

The historical `identity/manifest.json` remains the exact permission-free
`0.0.0.1` registration payload. It is not the product manifest and must not be
published.

The product manifest uses a module service worker, action popup, direct
`MacCtrl+Shift+S` command and thin `chrome` API adapters over the shared
protocol, save and popup controllers. Its exact permissions are `activeTab`,
`nativeMessaging`, `storage` and `favicon`; there are no host permissions,
content scripts or persistent ports.

The narrow Chromium Favicon API supplies browser-owned icon bytes through the
extension's `_favicon` endpoint. The adapter requests only the current HTTP(S)
page at 32 pixels, and the shared MIME/size policy validates the result before
native delivery. The extension never adds host permissions or fetches a site's
remote favicon URL directly.

Direct authorizes only
`chrome-extension://ikodhdphpodjkdhafomobpjdhhhiiapd/` through shared
Chrome/Brave native-host registration. Gecko authorization remains a
separate exact branch.

See [Chrome development](../docs/chrome-development.md) for build and runtime checks.
