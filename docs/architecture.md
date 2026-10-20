# Architecture

## Ownership

This repository owns code executed by standalone browser extensions and the
tooling that builds their distributable artifacts. `saltmark-macos` owns the
Direct application and all native integration required to link those extensions
to the app. Safari remains in `saltmark-macos` because it is an embedded app
extension rather than a standalone browser-store artifact.

## Composition

Browser-neutral modules own the wire request, response correlation, favicon
policy and one current-tab action. Each browser directory owns only its manifest,
entry point and browser-specific UI/assets. Browser adapters must not copy or
fork shared product behavior.

The shared favicon resolver requires an approved MIME type by default. The
Chromium adapter explicitly enables one narrower browser-owned exception:
headerless `_favicon` responses must have the PNG signature and remain within
the shared byte limit. This exception is unavailable to remote HTTP(S) favicon
fetches unless a browser adapter explicitly opts in.

Standalone extensions use `public/app-icon-direct.png`, an immutable complete
rendering of the Direct app's Icon Composer composition. One shared renderer
produces PNG sizes for Firefox and Chrome; source and decoded-pixel hashes
protect provenance. Builds never read the desktop checkout. The website's
`public/favicon.svg` is retained as a reference, not an extension build input.
Safari's Store/Direct icon derivatives are owned by the desktop repository.

Firefox owns the popup DOM adapter while `shared/src/popup-controller.js` owns
its current-page presentation, actual-shortcut resolution, the user-facing
Save to Unsorted preference and closed operation outcomes. That preference maps
to the stable protocol's `mode.silent` delivery behavior. The toolbar click opens
the popup. The custom
`save-current-tab` command preserves direct keyboard delivery independently of
that popup and reuses the same `saveCurrentTab` request path.

The popup does not probe native-host or app availability. It reports only the
outcome of an explicit save request. `Protected local transfer` describes local
browser pipes plus the permission- and identity-protected Unix socket; it must
not be changed to an encryption claim.

Generated output is never source of truth:

```text
shared/src + firefox -> .build/firefox -> dist/firefox/*.xpi
chrome identity manifest + public/app-icon-direct.png
  -> .build/chrome-identity -> dist/chrome/*identity*.zip
shared/src + chrome -> .build/chrome -> dist/chrome/*.zip
```

The Chrome identity ZIP is a one-purpose historical registration artifact with
no permissions or executable behavior. The product output uses the pinned Store
public key, thin Chromium adapters and the same browser-neutral behavior as
Firefox.

## Repository Boundary

The standalone extension repository does not install native-host manifests and
does not launch, sign or modify SaltMark Direct. The app repository does not
compile or package Firefox/Chrome JavaScript. The stable native host name,
message version and enabled extension identities form a coordinated public
contract between the two repositories.

For Gecko native messaging, `allowed_extensions` authorizes the add-on in the
host manifest. Gecko starts the host with the manifest path followed by the
add-on ID. The desktop bridge validates that exact invocation layout before it
reads a bookmark message; the extension never declares its identity inside the
JSON payload.
