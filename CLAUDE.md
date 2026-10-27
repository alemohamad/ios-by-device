# iOS by Device

A compatibility matrix showing which iOS/iPadOS versions are supported by every iPhone, iPad, and iPod touch.

## Build

```bash
npm run build
```

This validates `data/ios.json`, then generates `docs/index.html`, one page per device row in `docs/devices/<slug>/index.html`, and `docs/sitemap.xml`. The build fails with a list of problems if the data is invalid (wrong support array length, missing or wrongly-cased image, out-of-order support values, duplicate names). A GitHub Action runs the build on every push and fails if the committed `docs/` output is out of date.

## Project Structure

```
├── data/
│   └── ios.json              # Device compatibility data (source of truth)
├── docs/
│   ├── index.html            # Generated output (do not edit directly)
│   ├── devices/              # Generated device pages (wiped and rebuilt every build)
│   ├── sitemap.xml           # Generated
│   ├── api.json              # Generated public data for developers (linked in the footer)
│   ├── robots.txt            # Points search engines to the sitemap
│   ├── css/                  # normalize.css + site stylesheet (status colors)
│   └── images/               # OS version icons and site assets
├── scripts/
│   ├── generate-html.js      # JSON → HTML generator script
│   ├── slug.js               # Device page URL slug (from the row's first name)
│   ├── og-image.html         # Template for the social preview image
│   ├── render-og.js          # `npm run og`: renders the template to docs/images/iOS-by-Device.png (needs Chrome)
│   └── validate.js           # Data checks run before every build
├── .github/workflows/        # CI: build + check generated output is committed
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

Values must read `unsupported* → supported+ → null*` (newest first); the validator enforces this.

### Notes

- Status colors (`os-green`, `os-red`) are CSS variables in `docs/css/ios-version-by-device.webflow.css`; not inline. Webflow's JS/CSS are no longer used; the file name is historical
- The build rewrites each grid's `grid-template-columns` as `auto` (device column) + `1fr` per remaining column
- The stylesheet link uses a content hash (`?v=<hash>`), so `index.html` only changes when the data or CSS does
- `gridColumns` matches the CSS `grid-template-columns` count for the section's grid class
- When `gridColumns > osVersions.length + 1`, a trailing `empty-column` is added per row
- OS versions are ordered newest first (left to right)
- Devices are ordered newest first (top to bottom)
- Sections: iPhone, iPad, iPod touch
- Some devices share a row (e.g., "iPhone 17 Pro" and "iPhone 17 Pro Max") via the `names` array; a shared row gets one page, named after its first device (`devices/iphone-17-pro/`)
- Each row on the home page is a single link (`a.device-row`, `display: contents`) to its device page. Renaming a row's first device changes its page URL
- Images for OS version icons go in `docs/images/`
- `docs/api.json` is a public, stable format (`version: 1`) that other sites may depend on. `data/ios.json` can change freely, but changes to `generateAPI()`'s output should stay backwards compatible (add fields, don't rename or remove), or bump `version`
