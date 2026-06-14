const { sendMessage } = require('../services/whatsappService');
const { getMember } = require('../models/supabaseQueries');

exports.sendTest = async (req, res, next) => {
  try {
    const { memberId, phone, message, title } = req.body;

    if (!message || (!phone && !memberId)) {
      return res.status(400).json({
        error: 'Missing required fields: message and either phone or memberId'
      });
    }

    let recipientPhone = phone;
    let resolvedMemberId = memberId || null;

    if (!recipientPhone && memberId) {
      const member = await getMember(memberId);
      if (!member || !member.phone) {
        return res.status(400).json({ error: 'Member not found or missing phone number' });
      }
      recipientPhone = member.phone;
    }

    const result = await sendMessage({
      broadcastId: null,
      memberId: resolvedMemberId,
      phone: recipientPhone,
      message,
      title
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};
