// api/phonepe-create-payment.js
// PhonePe Standard Checkout v2 — Step 1
//   1. Gets an OAuth access token (client_credentials)
//   2. Creates a payment and returns the PhonePe-hosted checkout URL
// The browser then redirects the customer to that URL.

const axios = require('axios');

// ── Environment base URLs ────────────────────────────────────────────────
// PHONEPE_ENV = 'production' (default) or 'sandbox'
const ENV = (process.env.PHONEPE_ENV || 'production').toLowerCase();

const HOSTS = ENV === 'sandbox'
  ? {
      oauth: 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token',
      pay:   'https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay',
    }
  : {
      oauth: 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token',
      pay:   'https://api.phonepe.com/apis/pg/checkout/v2/pay',
    };

// ── Simple in-memory token cache (survives warm lambda invocations) ───────
let _tokenCache = { token: null, expiresAt: 0 };

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  // Reuse cached token if it still has > 60s of life
  if (_tokenCache.token && _tokenCache.expiresAt - 60 > now) {
    return _tokenCache.token;
  }

  const params = new URLSearchParams();
  params.append('client_id',      process.env.PHONEPE_CLIENT_ID);
  params.append('client_version', process.env.PHONEPE_CLIENT_VERSION || '1');
  params.append('client_secret',  process.env.PHONEPE_CLIENT_SECRET);
  params.append('grant_type',     'client_credentials');

  const res = await axios.post(HOSTS.oauth, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  const token     = res.data.access_token;
  const expiresAt = res.data.expires_at || (now + 3000);
  _tokenCache = { token, expiresAt };
  return token;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, merchantOrderId, redirectUrl } = req.body || {};

  if (!amount || amount < 1) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  if (!merchantOrderId) {
    return res.status(400).json({ error: 'Missing merchantOrderId' });
  }
  if (!redirectUrl) {
    return res.status(400).json({ error: 'Missing redirectUrl' });
  }

  try {
    const token = await getAccessToken();

    const payload = {
      merchantOrderId,
      amount: Math.round(amount * 100), // rupees → paise
      expireAfter: 1200,                // 20 minutes
      metaInfo: { udf1: 'AuraNest Decors' },
      paymentFlow: {
        type: 'PG_CHECKOUT',
        message: 'Auranest Decors order payment',
        merchantUrls: { redirectUrl },
      },
    };

    const payRes = await axios.post(HOSTS.pay, payload, {
      headers: {
        Authorization: `O-Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
      merchantOrderId,
      orderId:     payRes.data.orderId,
      state:       payRes.data.state,
      redirectUrl: payRes.data.redirectUrl, // PhonePe-hosted checkout page
    });

  } catch (err) {
    const detail = err?.response?.data || err.message;
    console.error('[phonepe-create-payment] error:', detail);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: 'Payment initiation failed', detail });
  }
};
