// URL slug for a device row, from its first name:
// "iPad Pro 12.9″ (3rd gen.)" → "ipad-pro-12-9-inch-3rd-gen"
function deviceSlug(device) {
  return device.names[0]
    .toLowerCase()
    .replace(/″/g, '-inch')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

module.exports = { deviceSlug };
