const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET,
  whatsapp: {
    apiUrl: process.env.WHATSAPP_API_URL,
    apiToken: process.env.WHATSAPP_API_TOKEN || process.env.WHATSAPP_API_KEY,
    provider: process.env.WHATSAPP_PROVIDER || 'generic',
    fromNumber: process.env.WHATSAPP_FROM_NUMBER || null
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  }
};
