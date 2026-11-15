'use strict';

// Protects the admin API. A request must carry a Supabase Auth access token
// (the dashboard sends it after the admin logs in), and the user's email must
// be in ADMIN_EMAILS (comma-separated) in backend/.env.
//
//   ADMIN_EMAILS=owner@club.co.ke,treasurer@club.co.ke
//
// Add admins in Supabase > Authentication > Users > "Add user", then list
// their email here. Anyone else who signs in is refused.

const supabase = require('../config/supabase');

function adminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

module.exports = async function requireAdmin(req, res, next) {
  if (req.method === 'OPTIONS') return next(); // CORS preflight

  const allowed = adminEmails();
  if (!allowed.length) {
    console.error('ADMIN_EMAILS is not set: refusing all admin requests.');
    return res.status(503).json({ error: 'Admin access is not configured yet.' });
  }

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return res.status(401).json({ error: 'Please sign in.' });

  try {
    const { data, error } = await supabase.auth.getUser(token);
    const user = data?.user;
    if (error || !user) return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });

    if (!allowed.includes(String(user.email || '').toLowerCase())) {
      return res.status(403).json({ error: 'This account is not an admin.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth check failed:', error.message);
    res.status(503).json({ error: 'Could not check your sign-in. Please try again.' });
  }
};
