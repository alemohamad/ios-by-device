const fs = require('fs');
const path = require('path');

// Read the JSON data
const dataPath = path.join(__dirname, '..', 'data', 'ios.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Map support status to CSS class
function supportClass(status) {
  if (status === 'supported') return 'os-green';
  if (status === 'unsupported') return 'os-red';
  return '';
}

// Section class attribute (iPod touch has a special class)
function sectionAttr(name) {
  if (name === 'iPod touch') return ' class="section ipod-touch"';
  return '';
}

// Generate OS version columns (header row)
function generateOSColumns(osVersions) {
  return osVersions.map(os =>
    `        <div class="os-column"><img src="images/${os.image}" loading="lazy" width="32" alt="" class="os-image">
          <div class="os-name">${os.name}</div>
          <div class="os-launch-date">${os.year}</div>
        </div>`
  ).join('\n');
}

// Generate a single device row
function generateDevice(device, hasTrailingColumn) {
  const names = device.names.map(n => `          <div class="device-name">${n}</div>`).join('\n');
  const colors = device.support.map(s => {
    const cls = supportClass(s);
    return `        <div class="color-div">
          <div class="color${cls ? ' ' + cls : ''}"></div>
        </div>`;
  }).join('\n');

  let html = `        <div class="device-info">
${names}
        </div>
${colors}`;

  if (hasTrailingColumn) {
    html += '\n        <div class="empty-column"></div>';
  }

  return html;
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

// Generate the complete HTML
function generateHTML() {
  const sections = data.sections.map(generateSection).join('\n');

  return `<!DOCTYPE html>
<html data-wf-page="6915ad67ed7b5d6004897ccf" data-wf-site="6915ad66ed7b5d6004897c94">
<head>
  <meta charset="utf-8">
  <title>iOS by Device</title>
  <meta content="Find the iOS and iPadOS versions supported by any iPhone or iPad — fast and easy." name="description">
  <meta content="iOS by Device" property="og:title">
  <meta content="Find the iOS and iPadOS versions supported by any iPhone or iPad — fast and easy." property="og:description">
  <meta content="https://iosbydevice.info/images/iOS-by-Device.png" property="og:image">
  <meta content="iOS by Device" property="twitter:title">
  <meta content="Find the iOS and iPadOS versions supported by any iPhone or iPad — fast and easy." property="twitter:description">
  <meta property="og:type" content="website">
  <meta content="summary_large_image" name="twitter:card">
  <meta content="width=device-width, initial-scale=1" name="viewport">
  <meta content="Webflow" name="generator">
  <link href="css/normalize.css" rel="stylesheet" type="text/css">
  <link href="css/webflow.css" rel="stylesheet" type="text/css">
  <link href="css/ios-version-by-device.webflow.css" rel="stylesheet" type="text/css">
  <script type="text/javascript">!function(o,c){var n=c.documentElement,t=" w-mod-";n.className+=t+"js",("ontouchstart"in o||o.DocumentTouch&&c instanceof DocumentTouch)&&(n.className+=t+"touch")}(window,document);</script>
  <link href="images/favicon.png" rel="shortcut icon" type="image/x-icon">
  <link href="images/webclip.png" rel="apple-touch-icon">
</head>
<body>
  <section class="header">
    <h1 class="heading-2">iOS by Device</h1>
    <div class="description">These tables list every iPhone, iPad, and iPod touch along with the first and last iOS or iPadOS versions they support. Only major releases (e.g., iOS 13) are shown; minor point updates are omitted for clarity.</div>
  </section>
${sections}
  <section class="footer">
    <div>iPhone, iOS, iPhone OS, iPad, iPadOS and iPod touch are trademarks of Apple Inc., registered in the U.S. and other countries.</div>
    <a href="#">Curated by <strong class="bold-text">Ale Mohamad</strong></a>
  </section>
  <script src="https://d3e54v103j8qbb.cloudfront.net/js/jquery-3.5.1.min.dc5e7f18c8.js?site=6915ad66ed7b5d6004897c94" type="text/javascript" integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=" crossorigin="anonymous"></script>
  <script src="js/webflow.js" type="text/javascript"></script>
</body>
</html>`;
}

// Write the output
const outputPath = path.join(__dirname, '..', 'docs', 'index.html');
const html = generateHTML();
fs.writeFileSync(outputPath, html, 'utf8');

const totalDevices = data.sections.reduce((sum, s) => sum + s.devices.length, 0);
console.log(`Generated index.html with ${data.sections.length} sections, ${totalDevices} devices`);
console.log(`Output: ${outputPath}`);
