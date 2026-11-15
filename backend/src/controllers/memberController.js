const path = require("path");
const {
  listMembers,
  listAllMembers,
  createMember,
  getMember,
  updateMember,
  deleteMember
} = require('../models/supabaseQueries');

const { sendMemberCard } = require('../services/memberCardService');
const { sendMessage } = require('../services/whatsappService');

exports.list = async (req, res, next) => {
  try {
    const members = await listMembers();
    res.json(members);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      join_date: req.body.join_date || new Date().toISOString().slice(0, 10),
      membership_status: req.body.membership_status || 'active'
    };
    const member = await createMember(payload);
    res.status(201).json(member);
  } catch (err) {
    next(err);
  }
};

exports.get = async (req, res, next) => {
  try {
    const member = await getMember(req.params.id);
    if (!member) return res.status(404).json({ error: 'Member not found' });
    res.json(member);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const member = await updateMember(req.params.id, req.body);
    res.json(member);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await deleteMember(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

// Returns tier counts for the dashboard — public, no auth required
exports.tierCounts = async (req, res, next) => {
  try {
    const members = await listAllMembers('active');
    res.json({
      total:  members.length,
      gold:   members.filter(m => m.tier === 'gold').length,
      silver: members.filter(m => m.tier === 'silver').length,
      bronze: members.filter(m => m.tier === 'bronze').length,
    });
  } catch (err) {
    next(err);
  }
};

exports.sendWelcomeCard = async (req, res, next) => {
  try {
    const member = await getMember(req.params.id);
    if (!member) return res.status(404).json({ error: "Member not found" });
    if (!member.phone) return res.status(400).json({ error: "Member has no phone number" });

    // Delivers only if the member messaged the club in the last 24 hours.
    const messageId = await sendMemberCard(member);
    res.json({ success: true, tier: member.tier, type: "image", messageId });
  } catch (err) {
    next(err);
  }
};

