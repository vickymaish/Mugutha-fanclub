const { createClient } = require('@supabase/supabase-js');
const { supabase } = require('../config/env');

if (!supabase.url || !supabase.serviceRoleKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend .env');
}

const realtimeClient = createClient(supabase.url, supabase.serviceRoleKey, {
  auth: { persistSession: false }
});

function subscribe(table, callback) {
  return realtimeClient
    .channel(`public:${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => callback(payload))
    .subscribe();
}

async function publishMessageLog(payload) {
  const { data, error } = await realtimeClient.from('messages').insert([payload]).select().single();
  if (error) throw error;
  return data;
}

module.exports = {
  subscribe,
  publishMessageLog
};
