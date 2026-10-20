# SaltMark Browser Extensions

This repository owns the standalone Firefox/LibreWolf and Chrome/Brave browser
extensions for SaltMark Direct. It contains the source from which distributable
browser artifacts are built. It does not contain the SaltMark application,
native-host installer or native bridge.

Chrome/Brave share one MV3 composition and stable Chrome Web Store identity.
Safari is excluded: its Web Extension is embedded and signed in `saltmark-macos`.

## Repository Layout

```text
shared/src/       browser-neutral protocol, favicon and current-tab behavior
firefox/          Firefox manifest, adapter, options, locales and icons
chrome/           Chrome/Brave MV3 manifest, adapters, popup and settings
public/           canonical cross-surface brand assets used by build tooling
tests/shared/     browser-neutral behavior tests
tests/firefox/    Firefox manifest/composition tests
scripts/          deterministic build, lint and package commands
docs/             architecture, protocol and development documentation
```

## Firefox Commands

```text
npm run verify:firefox
npm run package:firefox
```

The first command runs all current tests, composes `.build/firefox` and validates
the unpacked artifact. The second creates an unsigned development XPI under
`dist/firefox`. Normal Firefox distribution requires a Mozilla-signed XPI.

## Chrome Commands

```text
npm run verify:chrome
npm run package:chrome
```

The product ZIP is written to `dist/chrome`. Its pinned public key preserves the
Store ID `ikodhdphpodjkdhafomobpjdhhhiiapd` when loaded unpacked in Chrome or
Brave. Runtime QA instructions are in `docs/chrome-development.md`.

## Product Boundary

The extension sends one bounded `saltmark.addBookmark` v1 message to the native
host `xyz.saltmark.bridge`. The Direct application owns App Settings > Browser,
Link/Repair/Unlink, native-host manifests, caller authorization, the bridge and
the app-side protocol receiver. Cross-repository protocol changes must be
coordinated atomically and accepted in both repositories before release.

The Firefox toolbar action opens a compact popup. Its explicit Save Bookmark
button and the custom `save-current-tab` command both route through the same
browser-neutral request behavior. The popup reads the actual Firefox shortcut
rather than assuming the manifest default and performs no background connection
or health probing. On macOS the low-conflict default is `Control+Shift+S`; users
can replace or clear it in Firefox extension-shortcut settings.

## License

Source code and documentation: [Apache-2.0](LICENSE).
Copyright 2026 Vitali Rijenco. See [NOTICE](NOTICE).
SaltMark icons and branding artwork are excluded; see [BRANDING.md](BRANDING.md).
