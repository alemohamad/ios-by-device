const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { validate } = require('./validate');
const { deviceSlug } = require('./slug');

// Read the JSON data
const dataPath = path.join(__dirname, '..', 'data', 'ios.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const docsDir = path.join(__dirname, '..', 'docs');
const devicesDir = path.join(docsDir, 'devices');
const cssPath = path.join(docsDir, 'css', 'ios-version-by-device.webflow.css');
const siteUrl = 'https://iosbydevice.info/';
// Content hash in the og:image URL makes social sites refetch the image when it changes
const ogImagePath = path.join(docsDir, 'images', 'iOS-by-Device.png');
const ogImageHash = crypto.createHash('sha256').update(fs.readFileSync(ogImagePath)).digest('hex').slice(0, 8);
const siteDescription = 'Find the iOS and iPadOS versions supported by any iPhone or iPad — fast and easy.';

// Map support status to CSS class
function supportClass(status) {
  if (status === 'supported') return 'os-green';
  if (status === 'unsupported') return 'os-red';
  return '';
}

// Map support status to the text shown on device pages
function supportLabel(status) {
  if (status === 'supported') return 'Supported';
  if (status === 'unsupported') return 'Not supported';
  return 'Not released yet';
}

// Section class attribute (iPod touch has an extra class)
function sectionAttr(name) {
  if (name === 'iPod touch') return ' class="section ipod-touch"';
  return ' class="section"';
}

// Generate OS version columns (header row)
function generateOSColumns(osVersions) {
  return osVersions.map(os =>
    `        <div class="os-column"><img src="images/${os.image}" loading="lazy" width="32" height="32" alt="" class="os-image">
          <div class="os-name">${os.name}</div>
          <div class="os-launch-date">${os.year}</div>
        </div>`
  ).join('\n');
}

// Generate a single device row, linked as a whole to the device's page.
// The dots are hidden from screen readers here; the device page lists each status as text.
function generateDevice(device, hasTrailingColumn) {
  const names = device.names.map(n => `          <div class="device-name">${n}</div>`).join('\n');
  const colors = device.support.map(s => {
    const cls = supportClass(s);
    return `        <div class="color-div">
          <div class="color${cls ? ' ' + cls : ''}" aria-hidden="true"></div>
        </div>`;
  }).join('\n');

  let html = `        <a class="device-row" href="devices/${deviceSlug(device)}/" aria-label="${device.names.join(' and ')}">
        <div class="device-info">
${names}
        </div>
${colors}`;

  if (hasTrailingColumn) {
    html += '\n        <div class="empty-column"></div>';
  }

  return html + '\n        </a>';
}

// Generate a full section (iPhone, iPad, or iPod touch)
function generateSection(section) {
  const hasTrailingColumn = section.gridColumns > section.osVersions.length + 1;

  const osColumns = generateOSColumns(section.osVersions);
  const trailingHeader = hasTrailingColumn ? '\n        <div class="empty-column"></div>' : '';
  const devices = section.devices.map(d => generateDevice(d, hasTrailingColumn)).join('\n');

  return `  <section${sectionAttr(section.name)}>
    <h2>${section.name}</h2>
    <div class="version-grid-container">
      <div class="w-layout-grid ${section.gridClass}">
        <div class="clear-grid-space"></div>
${osColumns}${trailingHeader}
${devices}
      </div>
    </div>
  </section>`;
}

// Shared <head>; root is the relative path back to docs/ ('' or '../../')
function generateHead({ title, description, pagePath, root, cssHash }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta content="${description}" name="description">
  <meta content="${title}" property="og:title">
  <meta content="${description}" property="og:description">
  <meta content="${siteUrl}images/iOS-by-Device.png?v=${ogImageHash}" property="og:image">
  <meta content="${title}" property="twitter:title">
  <meta content="${description}" property="twitter:description">
  <meta property="og:type" content="website">
  <meta content="summary_large_image" name="twitter:card">
  <meta content="width=device-width, initial-scale=1" name="viewport">
  <link href="${siteUrl}${pagePath}" rel="canonical">
  <link href="${root}css/normalize.css" rel="stylesheet" type="text/css">
  <link href="${root}css/ios-version-by-device.webflow.css?v=${cssHash}" rel="stylesheet" type="text/css">
  <link href="${root}images/favicon.png" rel="shortcut icon" type="image/x-icon">
  <link href="${root}images/webclip.png" rel="apple-touch-icon">
</head>`;
}

function generateFooter(root) {
  return `  <section class="footer">
    <div>iPhone, iOS, iPhone OS, iPad, iPadOS and iPod touch are trademarks of Apple Inc., registered in the U.S. and other countries.</div>
    <div class="footer-links">
      <a href="${root}api.json">JSON API</a>
      <a href="https://github.com/alemohamad">Curated by <strong class="bold-text">Ale Mohamad</strong></a>
    </div>
  </section>`;
}

// Generate the complete HTML
function generateHTML(cssHash) {
  const sections = data.sections.map(generateSection).join('\n');

  return `${generateHead({ title: 'iOS by Device', description: siteDescription, pagePath: '', root: '', cssHash })}
<body>
  <section class="header">
    <h1 class="heading-2">iOS by Device</h1>
    <div class="description">These tables list every iPhone, iPad, and iPod touch along with the first and last iOS or iPadOS versions they support. Only major releases (e.g., iOS 13) are shown; minor point updates are omitted for clarity.</div>
  </section>
${sections}
${generateFooter('')}
</body>
</html>`;
}

// One-sentence summary of a device's support range, e.g.
// "iPhone XR supports iOS 12 through iOS 18. It can't be updated to iOS 26 or later."
function deviceSummary(device, osVersions) {
  const names = device.names.join(' and ');
  const plural = device.names.length > 1;
  const newest = device.support.indexOf('supported');
  const oldest = device.support.lastIndexOf('supported');
  const first = osVersions[oldest].name;
  const last = osVersions[newest].name;

  if (newest === 0) {
    if (oldest === 0) return `${names} ${plural ? 'ship' : 'ships'} with ${last}, the latest version.`;
    return `${names} ${plural ? 'support' : 'supports'} ${first} through ${last}, the latest version.`;
  }
  return `${names} ${plural ? 'support' : 'supports'} ${first} through ${last}. ${plural ? 'They' : 'It'} can't be updated to ${osVersions[newest - 1].name} or later.`;
}

// Generate a device's own page, listing every OS version since its release
function generateDevicePage(device, osVersions, cssHash) {
  const slug = deviceSlug(device);
  const summary = deviceSummary(device, osVersions);
  const title = `${device.names.join(' and ')} – iOS by Device`;
  const heading = device.names.map(n => `<span class="device-title-name">${n}</span>`).join('');
  const rows = device.support.map((s, i) => {
    if (s === null) return null;
    const os = osVersions[i];
    return `      <li class="os-row">
        <img src="../../images/${os.image}" loading="lazy" width="32" height="32" alt="" class="os-image">
        <div class="os-info">
          <div class="os-name">${os.name}</div>
          <div class="os-launch-date">${os.year}</div>
        </div>
        <div class="os-status">${supportLabel(s)}</div>
        <div class="color ${supportClass(s)}" aria-hidden="true"></div>
      </li>`;
  }).filter(Boolean).join('\n');

  return `${generateHead({ title, description: summary, pagePath: `devices/${slug}/`, root: '../../', cssHash })}
<body>
  <header class="top-bar">
    <a class="back-link" href="../../">← All devices</a>
    <div class="top-bar-title" aria-hidden="true">${device.names.join(' and ')}</div>
  </header>
  <main class="device-layout">
    <div class="device-content">
      <section class="device-header">
        <h1 class="device-title">${heading}</h1>
        <div class="device-summary">${summary}</div>
      </section>
      <ul class="os-list">
${rows}
      </ul>
    </div>
  </main>
${generateFooter('../../')}
</body>
</html>`;
}

// Public data for developers, one entry per device row. Keep this format stable:
// other sites may rely on it, unlike data/ios.json which is free to change.
function generateAPI() {
  const devices = data.sections.flatMap(section => section.devices.map(device => {
    const supported = device.support
      .map((s, i) => s === 'supported' ? section.osVersions[i].name : null)
      .filter(Boolean)
      .reverse();
    return {
      names: device.names,
      type: section.name,
      url: `${siteUrl}devices/${deviceSlug(device)}/`,
      firstSupported: supported[0],
      latestSupported: supported[supported.length - 1],
      isCurrent: device.support[0] === 'supported',
      supported,
    };
  }));
  return JSON.stringify({ version: 1, source: siteUrl, devices }, null, 2) + '\n';
}

// List the home page and every device page for search engines
function generateSitemap() {
  const urls = [siteUrl, ...data.sections.flatMap(s => s.devices.map(d => `${siteUrl}devices/${deviceSlug(d)}/`))];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`;
}

// Update CSS grid-template-columns to match gridColumns from JSON
function updateCSS() {
  let css = fs.readFileSync(cssPath, 'utf8');

  for (const section of data.sections) {
    // The device name column is sized by .device-info; OS columns share the rest
    const columns = ['auto', ...Array(section.gridColumns - 1).fill('1fr')].join(' ');
    const regex = new RegExp(
      `(\\.${section.gridClass}\\s*\\{[^}]*grid-template-columns:)\\s*[^;]+(;)`,
    );
    css = css.replace(regex, `$1 ${columns}$2`);
  }

  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('Updated CSS grid-template-columns');
  return css;
}

// Validate the data before writing anything
const errors = validate(data);
if (errors.length) {
  console.error(`Found ${errors.length} problem(s) in data/ios.json:`);
  errors.forEach(e => console.error(`  - ${e}`));
  process.exit(1);
}

// Write the output (the CSS hash only changes when the stylesheet does)
const css = updateCSS();
const cssHash = crypto.createHash('sha256').update(css).digest('hex').slice(0, 8);
const outputPath = path.join(docsDir, 'index.html');
fs.writeFileSync(outputPath, generateHTML(cssHash), 'utf8');

// Device pages are fully regenerated, so renamed or removed devices leave no stale pages
fs.rmSync(devicesDir, { recursive: true, force: true });
for (const section of data.sections) {
  for (const device of section.devices) {
    const dir = path.join(devicesDir, deviceSlug(device));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), generateDevicePage(device, section.osVersions, cssHash), 'utf8');
  }
}
fs.writeFileSync(path.join(docsDir, 'sitemap.xml'), generateSitemap(), 'utf8');
fs.writeFileSync(path.join(docsDir, 'api.json'), generateAPI(), 'utf8');

const totalDevices = data.sections.reduce((sum, s) => sum + s.devices.length, 0);
console.log(`Generated index.html with ${data.sections.length} sections, ${totalDevices} devices`);
console.log(`Generated ${totalDevices} device pages in docs/devices/, sitemap.xml and api.json`);
console.log(`Output: ${outputPath}`);
