// api/verify-otp.js
// Verifies the OTP entered by the user against the signed HMAC token.
// No database — everything is self-contained in the token.
//
// ENV VARS required (same as send-otp.js):
//   OTP_SECRET  — must match the value used when the token was created

const crypto = require('crypto');
const { rateLimit, clientIp } = require('../lib/rateLimit');

const SECRET     = process.env.OTP_SECRET; // no fallback — fail closed if unset
const OTP_TTL_MS = 10 * 60 * 1000;

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.auranestdecors.com');
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

  if (!SECRET) {
    console.error('[verify-otp] OTP_SECRET not configured');
    return res.status(503).json({ error: 'OTP service is not configured. Please contact support.' });
  }

  const { token, otp } = req.body || {};

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Missing session token.' });
  }
  if (!otp || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ error: 'Enter the complete 6-digit OTP.' });
  }

  // Attempt cap: max 8 verify attempts per IP / 10 min. Makes online brute-force
  // of the 6-digit code (1,000,000 combinations) infeasible within the TTL.
  const rl = await rateLimit(`otp-verify-ip:${clientIp(req)}`, 8, 10 * 60 * 1000);
  if (!rl.allowed) {
    return res.status(429).json({ error: 'Too many incorrect attempts. Please request a new OTP in a few minutes.' });
  }

  const result = checkToken(token, otp);
  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }

  return res.status(200).json({ success: true, phone: result.phone });
};
