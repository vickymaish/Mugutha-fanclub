function formatPhone(raw) {
  if (!raw) return '';
  return raw.replace(/[^0-9+]/g, '');
}
module.exports = formatPhone;
