// api/send-otp.js
// Generates a 6-digit OTP, sends via Fast2SMS, returns a signed HMAC token.
// No database needed — token is self-verifying.
//
// ENV VARS required in Vercel dashboard:
//   FAST2SMS_API_KEY  — your Fast2SMS API key (get at fast2sms.com, free signup credits)
//   OTP_SECRET        — any random 32+ char string for HMAC signing

const crypto = require('crypto');
const { rateLimit, clientIp } = require('../lib/rateLimit');

const SECRET       = process.env.OTP_SECRET; // no fallback — fail closed if unset
const F2S_KEY      = process.env.FAST2SMS_API_KEY || '';
const OTP_TTL_MS   = 10 * 60 * 1000; // 10 minutes

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.auranestdecors.com');
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

  if (!SECRET) {
    console.error('[send-otp] OTP_SECRET not configured — refusing to issue tokens');
    return res.status(503).json({ error: 'OTP service is not configured. Please contact support.' });
  }

  const { phone } = req.body || {};
  if (!phone || !/^\d{10}$/.test(phone)) {
    return res.status(400).json({ error: 'Enter a valid 10-digit mobile number.' });
  }

  // Rate limit: max 3 OTPs per phone / 10 min, and 10 per IP / 10 min.
  // Prevents SMS-bombing and direct Fast2SMS cost abuse.
  const perPhone = await rateLimit(`otp-send:${phone}`, 3, 10 * 60 * 1000);
  if (!perPhone.allowed) {
    return res.status(429).json({ error: 'Too many OTP requests. Please wait 10 minutes before trying again.' });
  }
  const perIp = await rateLimit(`otp-send-ip:${clientIp(req)}`, 10, 10 * 60 * 1000);
  if (!perIp.allowed) {
    return res.status(429).json({ error: 'Too many requests from this network. Please try again later.' });
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
  } else if (process.env.VERCEL === '1') {
    // Production on Vercel but FAST2SMS_API_KEY not set — fail clearly
    console.error('[send-otp] FAST2SMS_API_KEY not configured in Vercel environment variables');
    return res.status(503).json({ error: 'OTP service is not set up yet. Please continue as guest or contact support.' });
  } else {
    // DEV / local: log OTP so you can test without Fast2SMS key
    console.log(`[DEV] OTP for ${phone} → ${otp}  (token: ${token})`);
  }

  // Return token — client stores it and sends back with the OTP digits
  return res.status(200).json({ token, ttl: OTP_TTL_MS });
};
