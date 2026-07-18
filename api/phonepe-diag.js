// api/phonepe-diag.js
// TEMPORARY diagnostic endpoint — reports whether required env vars are present
// and whether Firebase Admin can initialise + write. Exposes NO secret values,
// only booleans / lengths / error messages. Delete after setup is verified.

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const out = { env: {}, firebaseAdmin: {}, firestoreWrite: {} };

  const has = (k) => !!process.env[k];
  out.env = {
    PHONEPE_CLIENT_ID:        has('PHONEPE_CLIENT_ID'),
    PHONEPE_CLIENT_SECRET:    has('PHONEPE_CLIENT_SECRET'),
    PHONEPE_CLIENT_VERSION:   process.env.PHONEPE_CLIENT_VERSION || '(unset)',
    PHONEPE_ENV:              process.env.PHONEPE_ENV || '(unset)',
    PHONEPE_WEBHOOK_USERNAME: has('PHONEPE_WEBHOOK_USERNAME'),
    PHONEPE_WEBHOOK_PASSWORD: has('PHONEPE_WEBHOOK_PASSWORD'),
    FIREBASE_SERVICE_ACCOUNT: has('FIREBASE_SERVICE_ACCOUNT'),
    FIREBASE_SERVICE_ACCOUNT_length: (process.env.FIREBASE_SERVICE_ACCOUNT || '').length,
  };

  // Try to init Firebase Admin + do a throwaway write
  try {
    const { getDb } = require('../lib/firebaseAdmin');
    const db = getDb();
    out.firebaseAdmin = { ok: true };
    try {
      await db.collection('_diag').doc('ping').set({ at: Date.now() });
      out.firestoreWrite = { ok: true };
    } catch (e) {
      out.firestoreWrite = { ok: false, error: e.message };
    }
  } catch (e) {
    out.firebaseAdmin = { ok: false, error: e.message };
  }

  return res.status(200).json(out);
};
