const fs = require('fs');
const path = require('path');
const { deviceSlug } = require('./slug');

const imagesDir = path.join(__dirname, '..', 'docs', 'images');
const VALID_STATUSES = ['supported', 'unsupported', null];

// Support arrays are ordered newest first, so a valid row reads:
// unsupported* supported+ null*  (dropped → supported → not yet released)
const SUPPORT_PATTERN = /^u*s+n*$/;

function encodeSupport(support) {
  return support.map(s => s === 'supported' ? 's' : s === 'unsupported' ? 'u' : 'n').join('');
}

// Returns a list of error messages (empty when the data is valid)
function validate(data) {
  const errors = [];
  // readdirSync is case-sensitive, unlike the default macOS filesystem
  const images = new Set(fs.readdirSync(imagesDir));
  const seenNames = new Set();
  const seenSlugs = new Set();

  for (const section of data.sections) {
    const where = `[${section.name}]`;

    if (section.gridColumns < section.osVersions.length + 1) {
      errors.push(`${where} gridColumns (${section.gridColumns}) is less than osVersions + 1 (${section.osVersions.length + 1})`);
    }

    for (const os of section.osVersions) {
      if (!images.has(os.image)) {
        errors.push(`${where} ${os.name}: image "${os.image}" not found in docs/images (names are case-sensitive)`);
      }
    }

    for (let i = 1; i < section.osVersions.length; i++) {
      if (section.osVersions[i].year > section.osVersions[i - 1].year) {
        errors.push(`${where} osVersions are not ordered newest first (${section.osVersions[i - 1].name} before ${section.osVersions[i].name})`);
      }
    }

    for (const device of section.devices) {
      const label = `${where} ${device.names.join(' / ')}`;

      for (const name of device.names) {
        if (seenNames.has(name)) errors.push(`${label}: duplicate device name "${name}"`);
        seenNames.add(name);
      }

      const slug = deviceSlug(device);
      if (seenSlugs.has(slug)) errors.push(`${label}: page URL "devices/${slug}/" is already used by another device`);
      seenSlugs.add(slug);

      if (device.support.length !== section.osVersions.length) {
        errors.push(`${label}: has ${device.support.length} support values, expected ${section.osVersions.length}`);
        continue;
      }

      const invalid = device.support.filter(s => !VALID_STATUSES.includes(s));
      if (invalid.length) {
        errors.push(`${label}: invalid support values ${JSON.stringify(invalid)}`);
        continue;
      }

      if (!SUPPORT_PATTERN.test(encodeSupport(device.support))) {
        errors.push(`${label}: support values are out of order (expected unsupported → supported → null, newest first)`);
      }
    }
  }

  return errors;
}

module.exports = { validate };
