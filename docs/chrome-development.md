# Chrome And Brave Development

Chrome and Brave share one MV3 artifact with Store ID
`ikodhdphpodjkdhafomobpjdhhhiiapd`.

## Build

```text
npm install
npm run verify:chrome
npm run package:chrome
```

Load `.build/chrome` as an unpacked extension in `chrome://extensions` or
`brave://extensions`. Developer mode must be enabled. The displayed ID must
exactly equal the approved Store ID above.

The ZIP under `dist/chrome` is the Web Store update artifact. Do not upload it
until local Chrome and Brave runtime acceptance is complete.

## Direct Linking

Use the shared Chrome / Brave row in SaltMark Direct App Settings > Browser.
Link or Repair writes the exact `allowed_origins` manifest into the macOS
registration consumed by both browsers:

```text
~/Library/Application Support/Google/Chrome/NativeMessagingHosts
```

Restart each running browser after changing the shared native-host manifest.

## Manual Acceptance

Brave 150 runtime acceptance is complete. Repeat the same matrix in Chrome with
the store-distributed artifact during release validation:

- the shared Link, Repair and Unlink state applies to Chrome and Brave;
- popup Save Bookmark and `Control+Shift+S` both deliver the current tab;
- regular mode works unlocked and presents the expected locked-vault flow;
- Save to Unsorted works unlocked and locked with the configured Dock behavior;
- favicon data is saved through Chromium's browser-owned Favicon API;
- unsupported pages fail closed;
- no extra SaltMark window or unwanted foreground activation occurs;
- changing the shortcut in the browser is reflected in the popup.

Brave may return a valid PNG from its browser-owned `_favicon` endpoint without
a `Content-Type` header. The Chromium adapter accepts that narrow case only
after the PNG signature and shared byte limit pass. Network favicon responses
outside this browser-owned endpoint continue to require an approved MIME type.
