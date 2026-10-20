# Firefox Development

## Automated Verification

Use Node.js and install locked development dependencies with `npm ci`.
No third-party runtime package is bundled. Build tooling uses Sharp; shared
verification also builds and tests the Chromium composition.

```text
npm run verify:firefox
npm audit
```

Verification covers protocol closure and bounds, exact response correlation,
favicon conversion/omission, current-tab delivery, manifest identity,
permissions, data-collection declarations, shortcut composition, referenced
files, default-locale references, success/failure badge behavior and symlink
rejection.

## Temporary Installation

Run `npm run build:firefox`, open Firefox or LibreWolf debugging tools and load
the manifest from `.build/firefox`. A packaged unsigned XPI from
`npm run package:firefox` is also a development artifact, not a normal release.

End-to-end native delivery additionally requires a Direct build whose app and
embedded bridge carry matching verifiable Apple Team IDs. Ad-hoc app signing
correctly fails closed at that boundary.

Gecko starts the native host with the installed manifest path followed by the
stable add-on ID. Runtime QA must exercise this real browser launch path; calling
the bridge directly with the add-on ID as the first argument is not a valid test.

Popup QA must verify the canonical icon in light and dark browser themes,
current-page presentation, unsupported-page rejection, Save Bookmark outcome,
the Save to Unsorted preference and persistence, actual shortcut display and
direct `Control+Shift+S` delivery without opening the popup. The footer says
`Protected local transfer`; the transport does not claim a separate encryption
layer.
