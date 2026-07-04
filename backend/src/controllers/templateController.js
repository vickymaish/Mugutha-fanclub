const supabase = require('../config/supabase');

// ─── LIST ALL TEMPLATES ───
exports.list = async (req, res) => {
  try {
    const { tier } = req.query;
    let query = supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (tier && tier !== 'all') {
      query = query.eq('tier', tier);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error listing templates:', error);
    res.status(500).json({ error: error.message });
  }
};

// ─── GET SINGLE TEMPLATE ───
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(data);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: error.message });
  }
};

// ─── CREATE TEMPLATE ───
exports.create = async (req, res) => {
  try {
    const { name, category, subject, message, tier } = req.body;

    if (!name || !message) {
      return res.status(400).json({ error: 'name and message are required' });
    }

    const { data, error } = await supabase
      .from('templates')
      .insert([{
        name,
        category: category || 'general',
        subject: subject || null,
        message,
        tier: tier || 'all',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: error.message });
  }
};

// ─── UPDATE TEMPLATE ───
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, subject, message, tier } = req.body;

    // Check if template exists
    const { data: existing, error: findError } = await supabase
      .from('templates')
      .select('id')
      .eq('id', id)
      .single();

    if (findError || !existing) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (category !== undefined) updates.category = category;
    if (subject !== undefined) updates.subject = subject;
    if (message !== undefined) updates.message = message;
    if (tier !== undefined) updates.tier = tier;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('templates')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: error.message });
  }
};

// ─── DELETE TEMPLATE ───
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: error.message });
  }
};