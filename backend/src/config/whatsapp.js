const { whatsapp } = require('./env');

module.exports = {
  apiUrl: whatsapp.apiUrl,
  apiToken: whatsapp.apiToken,
  provider: whatsapp.provider,
  fromNumber: whatsapp.fromNumber,
  phoneNumberId: whatsapp.phoneNumberId,
  businessAccountId: whatsapp.businessAccountId,
};