const { supabaseAdmin, createUserClient } = require('../config/supabase');

/**
 * Verifies the Supabase JWT and attaches:
 *  - req.user: the verified user
 *  - req.supabase: a client scoped to this user's token (RLS enforced)
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token missing or malformed.' });
    }

    const token = authHeader.split(' ')[1];

    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired authentication token.' });
    }

    req.user = data.user;
    req.supabase = createUserClient(token);

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Internal authentication error.' });
  }
};

module.exports = requireAuth;