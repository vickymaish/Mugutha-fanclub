const supabase = require('../config/supabase');

const MEMBER_FIELDS = `
id,
name,
phone,
email,
join_date,
membership_status,
tier,
amount_paid,
created_at,
updated_at
`;
const BROADCAST_FIELDS = 'id,title,message,tier,status,scheduled_for,sent_at,created_by,created_at';

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

// ✅ NEW: Filter members by tier
async function listMembersByTier(tier, status = 'active') {
  let query = supabase.from('members').select(MEMBER_FIELDS).eq('tier', tier.toLowerCase());
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

// ✅ SINGLE module.exports with ALL functions
module.exports = {
  listMembers,
  createMember,
  getMember,
  updateMember,
  deleteMember,
  getExpiringMembers,
  listAllMembers,
  listMembersByTier,  // ✅ NEW
  listBroadcasts,
  createBroadcast,
  insertMessage,
  listScheduledBroadcasts,
  updateBroadcastStatus
};
// ─── TEMPLATES ─────────────────────────────────────────────────────────────
// List all templates (optionally filter by tier)
exports.listTemplates = async (tier = null) => {
  let query = supabase
    .from('templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (tier && tier !== 'all') {
    query = query.eq('tier', tier);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

// Get a single template by ID
exports.getTemplateById = async (id) => {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
};

// Get templates by category
exports.getTemplatesByCategory = async (category) => {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('category', category)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

// Create a new template
exports.createTemplate = async (templateData) => {
  const { data, error } = await supabase
    .from('templates')
    .insert([{
      name: templateData.name,
      category: templateData.category || 'general',
      subject: templateData.subject || null,
      message: templateData.message,
      tier: templateData.tier || 'all',
      created_by: templateData.created_by || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Update an existing template
exports.updateTemplate = async (id, updates) => {
  const { data, error } = await supabase
    .from('templates')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Delete a template
exports.deleteTemplate = async (id) => {
  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
};

// Count templates by category
exports.countTemplatesByCategory = async () => {
  const { data, error } = await supabase
    .from('templates')
    .select('category', { count: 'exact', head: true })
    .group('category');
  if (error) throw error;
  return data || [];
};

// ─── USERS (if you have auth) ────────────────────────────────────────────
exports.getUserById = async (id) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
};