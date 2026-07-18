// api/grant-admin.js
// ONE-TIME setup endpoint: grants the { admin: true } custom claim to a user by
// email, so the hardened Firestore rules (isAdmin()) recognise the admin account.
//
// Protected by a shared secret you set in Vercel as ADMIN_SETUP_SECRET.
// Usage (run once, then you may delete this file + the env var):
//   POST /api/grant-admin  { "secret": "<ADMIN_SETUP_SECRET>", "email": "info@aurnestdecors.com" }
//
// After granting, the admin must SIGN OUT and SIGN IN again for the new claim
// to appear in their token.

const admin = require('firebase-admin');
const { getDb } = require('../lib/firebaseAdmin'); // ensures the app is initialised

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { secret, email } = req.body || {};
  const expected = process.env.ADMIN_SETUP_SECRET;

  if (!expected) {
    return res.status(503).json({ error: 'ADMIN_SETUP_SECRET is not configured.' });
  }
  if (!secret || secret !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  try {
    getDb(); // initialise the default app
    const user = await admin.auth().getUserByEmail(String(email));
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    return res.status(200).json({ ok: true, uid: user.uid, email, claim: { admin: true },
      note: 'Sign out and back in on the admin panel for the claim to take effect.' });
  } catch (e) {
    console.error('[grant-admin] error:', e.message);
    return res.status(500).json({ error: e.message });
  }
};
