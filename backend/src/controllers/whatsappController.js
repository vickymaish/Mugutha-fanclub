const { sendMessage, sendTemplate } = require('../services/whatsappService');
const { getMember } = require('../models/supabaseQueries');

exports.sendTest = async (req, res, next) => {
  try {
    const { memberId, phone, message, title } = req.body;
    if (!message || (!phone && !memberId)) {
      return res.status(400).json({
        error: 'Missing required fields: message and either phone or memberId',
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
      title,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * Sends the "hello_world" template to open a conversation window with a
 * new number. Required before sendTest() will actually deliver — see
 * whatsappService.js comments for why.
 *
 * POST /api/whatsapp/send-template
 * Body: { phone: "254712345678" }
 */
exports.sendTemplateTest = async (req, res, next) => {
  try {
    const { phone, memberId, templateName, languageCode } = req.body;
    if (!phone && !memberId) {
      return res.status(400).json({ error: 'Missing required field: phone or memberId' });
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

    const result = await sendTemplate({
      broadcastId: null,
      memberId: resolvedMemberId,
      phone: recipientPhone,
      templateName: templateName || 'hello_world',
      languageCode: languageCode || 'en_US',
    });

    res.json({
      success: true,
      ...result,
      note: 'Template sent. Reply to this WhatsApp message from the recipient phone to open a 24hr window, then /send-test will deliver real text messages.',
    });
  } catch (error) {
    next(error);
  }
};