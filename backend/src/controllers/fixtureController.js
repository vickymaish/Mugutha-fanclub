const  supabase  = require('../config/supabase');
//const { sendWhatsAppMessage } = require('./webhookController');
const { sendWhatsAppMessage } = require('../controllers/webhookController');
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
    const { home_team, away_team, venue, date, time, competition, status } = req.body;
    
    const { data, error } = await supabase
      .from('fixtures')
      .insert([{ 
        home_team, 
        away_team, 
        venue, 
        date, 
        time, 
        competition, 
        status: status || 'upcoming' 
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
    const { home_team, away_team, venue, date, time, competition, status, home_score, away_score } = req.body;
    
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
        away_score
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

// Send alert for a fixture
// ─── SEND FIXTURE ALERT TO ALL MEMBERS ───
exports.sendFixtureAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    // 1. Get the fixture details (for logging)
    const { data: fixture, error: fixtureError } = await supabase
      .from('fixtures')
      .select('*')
      .eq('id', id)
      .single();

    if (fixtureError) throw fixtureError;
    if (!fixture) {
      return res.status(404).json({ error: 'Fixture not found' });
    }

    // 2. Get all active members
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('phone, name, tier')
      .eq('membership_status', 'active');

    if (membersError) throw membersError;

    if (!members || members.length === 0) {
      return res.status(404).json({ 
        error: 'No active members found. Cannot send alert.' 
      });
    }

    // 3. Send WhatsApp message to each active member
    let sentCount = 0;
    let failedCount = 0;

    for (const member of members) {
      // Build personalized message with member name
      const personalizedMessage = `${message}\n\n👋 ${member.name}, we hope to see you there!`;

      const result = await sendWhatsAppMessage(member.phone, personalizedMessage);
      
      if (result) {
        sentCount++;
      } else {
        failedCount++;
        console.error(`❌ Failed to send to ${member.phone}`);
      }
    }

    // 4. Log the broadcast in the database
    await supabase
      .from('broadcasts')
      .insert([{
        type: 'Match alert',
        audience: 'All active members',
        message: message,
        sent_at: new Date(),
        status: 'sent',
        recipient_count: members.length,
        fixture_id: id,
        fixture_title: `${fixture.home_team} vs ${fixture.away_team}`
      }]);

    console.log(`✅ Match alert sent: ${sentCount} members, ${failedCount} failed`);

    // 5. Return success response
    res.json({
      success: true,
      sent: sentCount,
      failed: failedCount,
      total: members.length,
      message: `Alert sent to ${sentCount} members`
    });

  } catch (error) {
    console.error('❌ Error sending fixture alert:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Check server logs for more info'
    });
  }
};