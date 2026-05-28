// api/verify-otp.js
// Verifies the OTP entered by the user against the signed HMAC token.
// No database — everything is self-contained in the token.
//
// ENV VARS required (same as send-otp.js):
//   OTP_SECRET  — must match the value used when the token was created

const crypto = require('crypto');

const SECRET     = process.env.OTP_SECRET || 'auranest-otp-secret-change-me-2026';
const OTP_TTL_MS = 10 * 60 * 1000;

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function checkToken(token, otp) {
  let parsed;
  try {
    parsed = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
  } catch {
    return { ok: false, error: 'Invalid session. Please request a new OTP.' };
  }

  const { phone, ts, sig } = parsed;
  if (!phone || !ts || !sig) {
    return { ok: false, error: 'Invalid session. Please request a new OTP.' };
  }
  if (Date.now() - ts > OTP_TTL_MS) {
    return { ok: false, error: 'OTP expired. Please request a new one.' };
  }

  const expected = crypto.createHmac('sha256', SECRET)
    .update(`${phone}:${otp}:${ts}`)
    .digest('hex');

  // Constant-time comparison prevents timing attacks
  let match = false;
  try {
    match = crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    match = false;
  }

  if (!match) {
    return { ok: false, error: 'Incorrect OTP. Please check and retry.' };
  }
  return { ok: true, phone };
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { token, otp } = req.body || {};

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Missing session token.' });
  }
  if (!otp || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ error: 'Enter the complete 6-digit OTP.' });
  }

  const result = checkToken(token, otp);
  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }

  return res.status(200).json({ success: true, phone: result.phone });
};
