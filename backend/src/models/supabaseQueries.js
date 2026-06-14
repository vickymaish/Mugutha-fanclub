const supabase = require('../config/supabase');

const MEMBER_FIELDS = 'id,name,phone,email,join_date,membership_status,created_at,updated_at';
const BROADCAST_FIELDS = 'id,title,message,status,scheduled_for,sent_at,created_by,created_at';

async function listMembers() {
  const { data, error } = await supabase.from('members').select(MEMBER_FIELDS).order('created_at', { ascending: false }).limit(100);
  if (error) throw error;
  return data;
}

async function createMember(payload) {
  const { data, error } = await supabase.from('members').insert([payload]).select().single();
  if (error) throw error;
  return data;
}

async function getMember(id) {
  const { data, error } = await supabase.from('members').select(MEMBER_FIELDS).eq('id', id).single();
  if (error) throw error;
  return data;
}

async function updateMember(id, payload) {
  const { data, error } = await supabase.from('members').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

async function deleteMember(id) {
  const { error } = await supabase.from('members').delete().eq('id', id);
  if (error) throw error;
}

async function getExpiringMembers(days = 7) {
  const { data, error } = await supabase
    .from('members')
    .select(MEMBER_FIELDS)
    .eq('membership_status', 'active')
    .order('created_at', { ascending: true })
    .limit(100);
  if (error) throw error;
  return data;
}

async function listAllMembers(status = null) {
  let query = supabase.from('members').select(MEMBER_FIELDS).order('created_at', { ascending: true });
  if (status) {
    query = query.eq('membership_status', status);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function listBroadcasts() {
  const { data, error } = await supabase.from('broadcasts').select(BROADCAST_FIELDS).order('created_at', { ascending: false }).limit(50);
  if (error) throw error;
  return data;
}

async function createBroadcast(payload) {
  const { data, error } = await supabase.from('broadcasts').insert([payload]).select().single();
  if (error) throw error;
  return data;
}

async function insertMessage(payload) {
  const { data, error } = await supabase.from('messages').insert([payload]).select().single();
  if (error) throw error;
  return data;
}

async function listScheduledBroadcasts() {
  const now = new Date().toISOString();
  const { data, error } = await supabase.from('broadcasts').select(BROADCAST_FIELDS).eq('status', 'scheduled').lte('scheduled_for', now);
  if (error) throw error;
  return data;
}

async function updateBroadcastStatus(id, status) {
  const { data, error } = await supabase.from('broadcasts').update({ status }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

module.exports = {
  listMembers,
  createMember,
  getMember,
  updateMember,
  deleteMember,
  getExpiringMembers,
  listAllMembers,
  listBroadcasts,
  createBroadcast,
  insertMessage,
  listScheduledBroadcasts,
  updateBroadcastStatus
};
