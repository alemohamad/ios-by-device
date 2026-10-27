// Renders scripts/og-image.html to a 1200×630 PNG with headless Chrome.
// Usage: npm run og [-- output.png]   (defaults to docs/images/iOS-by-Device.png)
// Set CHROME_PATH if Chrome isn't in the default macOS location.
const { execFileSync } = require('child_process');
const path = require('path');

const chrome = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const template = path.join(__dirname, 'og-image.html');
const output = path.resolve(process.argv[2] || path.join(__dirname, '..', 'docs', 'images', 'iOS-by-Device.png'));

execFileSync(chrome, [
  '--headless',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--virtual-time-budget=2000',
  '--window-size=1200,630',
  `--screenshot=${output}`,
  `file://${template}`,
], { stdio: ['ignore', 'ignore', 'ignore'] });

console.log(`Rendered ${output}`);
console.log('Run `npm run build` afterwards so the og:image URL hash updates.');
