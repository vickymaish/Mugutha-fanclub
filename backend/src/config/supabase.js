const { createClient } = require('@supabase/supabase-js');
const { supabase } = require('./env');

if (!supabase.url || !supabase.serviceRoleKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend .env');
}

const client = createClient(supabase.url, supabase.serviceRoleKey, {
  auth: {
    persistSession: false
  }
});

module.exports = client;
