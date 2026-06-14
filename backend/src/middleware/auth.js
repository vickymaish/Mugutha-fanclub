const supabase = require('../config/supabase');

module.exports = async function auth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (!token) {
    return res.status(401).json({ error: 'Missing access token' });
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return res.status(401).json({ error: error?.message || 'Invalid auth token' });
  }

  req.user = data.user;
  next();
};
