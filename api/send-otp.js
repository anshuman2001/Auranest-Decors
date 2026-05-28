// api/send-otp.js
// Generates a 6-digit OTP, sends via Fast2SMS, returns a signed HMAC token.
// No database needed — token is self-verifying.
//
// ENV VARS required in Vercel dashboard:
//   FAST2SMS_API_KEY  — your Fast2SMS API key (get at fast2sms.com, free signup credits)
//   OTP_SECRET        — any random 32+ char string for HMAC signing

const crypto = require('crypto');

const SECRET       = process.env.OTP_SECRET || 'auranest-otp-secret-change-me-2026';
const F2S_KEY      = process.env.FAST2SMS_API_KEY || '';
const OTP_TTL_MS   = 10 * 60 * 1000; // 10 minutes

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function makeOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Token = base64(JSON({ phone, ts, sig }))
// sig   = HMAC-SHA256( "phone:otp:ts", SECRET )
function signToken(phone, otp) {
  const ts  = Date.now();
  const sig = crypto.createHmac('sha256', SECRET)
    .update(`${phone}:${otp}:${ts}`)
    .digest('hex');
  return Buffer.from(JSON.stringify({ phone, ts, sig })).toString('base64url');
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { phone } = req.body || {};
  if (!phone || !/^\d{10}$/.test(phone)) {
    return res.status(400).json({ error: 'Enter a valid 10-digit mobile number.' });
  }

  const otp   = makeOtp();
  const token = signToken(phone, otp);

  // ── Send via Fast2SMS ───────────────────────────────────────
  if (F2S_KEY) {
    try {
      const r = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: F2S_KEY,
          'Content-Type': 'application/json',
          'cache-control': 'no-cache',
        },
        body: JSON.stringify({
          route:            'otp',
          variables_values: otp,
          numbers:          phone,
          flash:            0,
        }),
      });
      const data = await r.json();
      if (!data.return) {
        console.error('[send-otp] Fast2SMS error:', JSON.stringify(data));
        return res.status(502).json({ error: 'SMS could not be sent. Please try again.' });
      }
    } catch (err) {
      console.error('[send-otp] fetch failed:', err.message);
      return res.status(502).json({ error: 'SMS service unavailable. Please try again.' });
    }
  } else {
    // DEV / local: log OTP so you can test without Fast2SMS key
    console.log(`[DEV] OTP for ${phone} → ${otp}  (token: ${token})`);
  }

  // Return token — client stores it and sends back with the OTP digits
  return res.status(200).json({ token, ttl: OTP_TTL_MS });
};
