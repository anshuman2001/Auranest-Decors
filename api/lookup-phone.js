// api/lookup-phone.js
// Server-side "does this phone already have an account?" check for the login
// flow. Replaces the previous PUBLIC Firestore read of the customers collection
// (which exposed all customer PII). Uses the Admin SDK and returns ONLY a
// boolean — never any customer data — so phone numbers can't be harvested for PII.
//
// Rate-limited to deter phone-number enumeration.

const { getDb } = require('../lib/firebaseAdmin');
const { rateLimit, clientIp } = require('../lib/rateLimit');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.auranestdecors.com');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { phone } = req.body || {};
  if (!phone || !/^\d{10}$/.test(String(phone))) {
    return res.status(400).json({ error: 'Invalid phone' });
  }

  // Rate limit: max 20 lookups per IP per 10 min (generous for real use,
  // throttles enumeration).
  const rl = await rateLimit(`lookup:${clientIp(req)}`, 20, 10 * 60 * 1000);
  if (!rl.allowed) {
    return res.status(429).json({ error: 'Too many attempts. Please wait a few minutes.' });
  }

  try {
    const db   = getDb();
    const snap = await db.collection('customers').where('mobile', '==', String(phone)).limit(1).get();
    // Return ONLY existence — no names, emails or addresses.
    return res.status(200).json({ exists: !snap.empty });
  } catch (e) {
    console.error('[lookup-phone] error:', e.message);
    // Fail safe: report not-found so the user can still register/continue.
    return res.status(200).json({ exists: false, degraded: true });
  }
};
