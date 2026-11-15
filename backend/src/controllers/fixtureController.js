const  supabase  = require('../config/supabase');
const matchAlerts = require('../services/matchAlertService');
// Map pin numbers from the form: empty -> null.
function coord(value) {
  if (value === '' || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// Get all fixtures
exports.getAllFixtures = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('fixtures')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching fixtures:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get single fixture by ID
exports.getFixtureById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('fixtures')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Fixture not found' });
    }
    res.json(data);
  } catch (error) {
    console.error('Error fetching fixture:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create a new fixture
exports.createFixture = async (req, res) => {
  try {
    const { home_team, away_team, venue, date, time, competition, status, venue_lat, venue_lng } = req.body;
    
    const { data, error } = await supabase
      .from('fixtures')
      .insert([{ 
        home_team, 
        away_team, 
        venue, 
        date, 
        time, 
        competition, 
        status: status || 'upcoming',
        venue_lat: coord(venue_lat),
        venue_lng: coord(venue_lng)
      }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error creating fixture:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update a fixture
exports.updateFixture = async (req, res) => {
  try {
    const { id } = req.params;
    const { home_team, away_team, venue, date, time, competition, status, home_score, away_score, venue_lat, venue_lng } = req.body;
    
    const { data, error } = await supabase
      .from('fixtures')
      .update({ 
        home_team, 
        away_team, 
        venue, 
        date, 
        time, 
        competition, 
        status,
        home_score,
        away_score,
        venue_lat: venue_lat === undefined ? undefined : coord(venue_lat),
        venue_lng: venue_lng === undefined ? undefined : coord(venue_lng)
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Fixture not found' });
    }
    res.json(data[0]);
  } catch (error) {
    console.error('Error updating fixture:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete a fixture
exports.deleteFixture = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('fixtures')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting fixture:', error);
    res.status(500).json({ error: error.message });
  }
};

// ─── MATCH ALERTS (see services/matchAlertService.js) ───

// Preview: the message, the weather forecast and how many members will get it.
exports.previewFixtureAlert = async (req, res, next) => {
  try {
    res.json(await matchAlerts.previewAlert(req.params.id));
  } catch (error) {
    next(error);
  }
};

// Send the match-day alert to every active member who hasn't replied STOP.
exports.sendFixtureAlert = async (req, res, next) => {
  try {
    const result = await matchAlerts.sendFixtureAlert(req.params.id, { kind: 'manual' });
    if (!result.total) {
      return res.status(400).json({ error: 'No active members to alert yet.' });
    }
    res.json({ success: true, ...result, message: `Alert sent to ${result.sent} members` });
  } catch (error) {
    next(error);
  }
};
