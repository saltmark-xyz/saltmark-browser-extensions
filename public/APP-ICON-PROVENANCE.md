# Application icon provenance

`app-icon-direct.png` is the complete 256 × 256 Direct Icon Composer compatibility
rendering exported on 2026-10-15 from the desktop's Xcode-compiled `AppIcon.icns`,
using `iconutil -c iconset` and its `icon_128x128@2x.png` representation. It is
an immutable derivative, not a second editable source. Canonical artwork lives
in `saltmark-macos/AppTargets/Direct/AppIcon.icon`.

Source SHA-256: `31b267ddb818eeaf0244d1990ec739620cde45c46cf2f09dff84694392b839e7`.

`scripts/app-icons.mjs` renders each required size with pinned Sharp 0.35.5,
Lanczos3 resize, sRGB conversion and PNG compression level 9 (no palette).
Source and decoded RGBA hashes are pinned in `scripts/chrome-icon-contract.mjs`
and tested for both products. Regeneration requires reviewing the complete
composition and updating provenance alongside all hashes. No build reads the
desktop checkout. Safari derivatives belong to desktop and vary by edition.

`favicon.svg` remains the website reference and is no longer an extension icon.

## Rights

Copyright 2026 Vitali Rijenco. All rights reserved.
The application icons, website favicon, and generated branding derivatives are
excluded from the repository's Apache-2.0 license. See [branding rights](../BRANDING.md).
