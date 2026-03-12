# iOS by Device

A compatibility matrix showing which iOS/iPadOS versions are supported by every iPhone, iPad, and iPod touch.

## Build

```bash
npm run build
```

This reads `data/ios.json` and generates `docs/index.html`.

## Project Structure

```
├── data/
│   └── ios.json              # Device compatibility data (source of truth)
├── docs/
│   ├── index.html            # Generated output (do not edit directly)
│   ├── css/                  # Webflow stylesheets (status colors defined here)
│   ├── images/               # OS version icons and site assets
│   └── js/                   # Webflow scripts
├── scripts/
│   ├── extract-ios.js        # HTML → JSON extraction script
│   └── generate-html.js      # JSON → HTML generator script
└── package.json
```

## Adding/Updating Devices

Edit `data/ios.json`, then run `npm run build`.

### JSON Structure

```json
{
  "sections": [
    {
      "name": "iPhone",
      "gridClass": "version-grid-ios",
      "gridColumns": 21,
      "osVersions": [
        { "name": "iOS 26", "image": "iOS_26.png", "year": 2025 }
      ],
      "devices": [
        {
          "names": ["iPhone 17 Pro", "iPhone 17 Pro Max"],
          "support": ["supported", null, null]
        }
      ]
    }
  ]
}
```

### Support Values

- `"supported"` — Device supports this OS version (green dot, CSS class `os-green`)
- `"unsupported"` — Device does not support this OS version (red dot, CSS class `os-red`)
- `null` — Device did not exist during this OS version (gray dot, no extra CSS class)

### Notes

- Status colors (`os-green`, `os-red`) are defined in `docs/css/ios-version-by-device.webflow.css`, not inline
- `gridColumns` matches the CSS `grid-template-columns` count for the section's grid class
- When `gridColumns > osVersions.length + 1`, a trailing `empty-column` is added per row
- OS versions are ordered newest first (left to right)
- Devices are ordered newest first (top to bottom)
- Sections: iPhone, iPad, iPod touch
- Some devices share a row (e.g., "iPhone 17 Pro" and "iPhone 17 Pro Max") via the `names` array
- Images for OS version icons go in `docs/images/`
