// backend/src/controllers/broadcastController.js

const {
  listBroadcasts,
  createBroadcast
} = require('../models/supabaseQueries');
const { sendBroadcastNow } = require('../services/broadcastService');

exports.list = async (req, res, next) => {
  try {
    const items = await listBroadcasts();
    res.json(items);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      status: req.body.status || 'draft',
      created_by: req.user?.id || null,
      created_at: new Date().toISOString()
    };
    const broadcast = await createBroadcast(payload);
    res.status(201).json(broadcast);
  } catch (err) {
    next(err);
  }
};

exports.sendBroadcast = async (req, res, next) => {
  try {
    const { title, message, tier, scheduled_for, send_now } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'title and message are required' });
    }

    const now = new Date();
    const payload = {
      title,
      message,
      tier: tier || 'all',  // ✅ Store tier
      status: send_now ? 'sent' : scheduled_for ? 'scheduled' : 'draft',
      scheduled_for: scheduled_for ? new Date(scheduled_for).toISOString() : null,
      sent_at: send_now ? now.toISOString() : null,
      created_by: req.user?.id || null,
      created_at: now.toISOString()
    };

    const broadcast = await createBroadcast(payload);

    if (send_now) {
      const result = await sendBroadcastNow(broadcast);
      return res.status(201).json({
        broadcast: result.broadcast,
        tier: result.tier,
        recipients: result.membersSent,
        sent: result.results.sent,
        failed: result.results.failed,
        failures: result.results.failures
      });
    }

    res.status(201).json({ broadcast, scheduled: payload.scheduled_for });
  } catch (err) {
    next(err);
  }
};