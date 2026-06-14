const {
  listMembers,
  createMember,
  getMember,
  updateMember,
  deleteMember
} = require('../models/supabaseQueries');

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
