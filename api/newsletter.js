// api/newsletter.js
// Stores newsletter sign-ups via the Admin SDK (bypasses security rules).
// Deduplicates by email (doc id = email). Fails soft — the UI shows success
// regardless, so a backend hiccup never blocks the visitor.

const { getDb } = require('../lib/firebaseAdmin');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.auranestdecors.com');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body || {};
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email))) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  try {
    const db = getDb();
    const id = String(email).toLowerCase().replace(/[^a-z0-9@._-]/g, '_');
    const admin = require('firebase-admin');
    await db.collection('newsletter').doc(id).set({
      email: String(email).toLowerCase(),
      source: 'homepage',
      subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[newsletter] error:', e.message);
    return res.status(200).json({ ok: false }); // fail soft
  }
};
