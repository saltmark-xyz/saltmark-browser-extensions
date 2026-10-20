# Firefox Composition

The Firefox/LibreWolf extension uses Manifest V3 and the stable Gecko ID
`firefox@saltmark.xyz`.

Its only permissions are `activeTab`, `nativeMessaging` and `storage`. There are
no persistent host permissions. Browser storage contains only the Save to
Unsorted preference (`silentMode` internally); bookmark payloads and native
errors are never persisted.

`background.js` is the Firefox adapter. The build copies the browser-neutral
modules from `shared/src` into the composed artifact, so protocol and current-tab
behavior are not duplicated inside this directory.
