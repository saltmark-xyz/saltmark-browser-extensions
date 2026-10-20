# Changelog

## Unreleased

### Maintenance

- Update Sharp build tooling from 0.35.3 to 0.35.5.
- License source code and documentation under Apache-2.0. Exclude SaltMark branding artwork.
- Include license and branding notices in Firefox and Chrome product artifacts.

### Added

- Firefox/LibreWolf and Chrome/Brave compositions.
- Toolbar popup with Save Bookmark and the configured keyboard shortcut.
- Save to Unsorted mode.
- Bounded favicon transfer through browser-specific adapters.
- SaltMark Direct application icon.

### Changed

- Default macOS shortcut: Control+Shift+S.
- Shared native-host registration for Chrome and Brave.
- Shared protocol validation and save behavior across browsers.

### Fixed

- Browser-owned favicon response handling.
- Native-message delivery ordering in Gecko browsers.
