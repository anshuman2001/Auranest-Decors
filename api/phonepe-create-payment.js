// api/phonepe-create-payment.js
// PhonePe Standard Checkout v2 — Step 1
//   1. Saves the full pending order to Firebase (keyed by merchantOrderId)
//      so the webhook / status-check can fulfil it even if the customer never
//      returns to the site.
//   2. Gets an OAuth token and creates the payment.
//   3. Returns the PhonePe-hosted checkout URL for the browser to redirect to.

const { HOSTS, getAccessToken } = require('../lib/phonepe');
const { savePendingOrder }      = require('../lib/firebaseAdmin');
const axios = require('axios');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { amount, merchantOrderId, redirectUrl, orderData } = req.body || {};
  if (!amount || amount < 1)   return res.status(400).json({ error: 'Invalid amount' });
  if (!merchantOrderId)        return res.status(400).json({ error: 'Missing merchantOrderId' });
  if (!redirectUrl)            return res.status(400).json({ error: 'Missing redirectUrl' });

  try {
    // 1. Persist the pending order (best-effort — don't block payment on it)
    if (orderData) {
      try { await savePendingOrder(merchantOrderId, orderData); }
      catch (e) { console.error('[phonepe-create-payment] savePendingOrder failed:', e.message); }
    }

    // 2. OAuth + create payment
    const token = await getAccessToken();
    const payload = {
      merchantOrderId,
      amount: Math.round(amount * 100), // rupees → paise
      expireAfter: 1200,
      metaInfo: { udf1: 'AuraNest Decors' },
      paymentFlow: {
        type: 'PG_CHECKOUT',
        message: 'Auranest Decors order payment',
        merchantUrls: { redirectUrl },
      },
    };

    const payRes = await axios.post(HOSTS.pay, payload, {
      headers: { Authorization: `O-Bearer ${token}`, 'Content-Type': 'application/json' },
    });

    return res.status(200).json({
      merchantOrderId,
      orderId:     payRes.data.orderId,
      state:       payRes.data.state,
      redirectUrl: payRes.data.redirectUrl,
    });

  } catch (err) {
    const detail = err?.response?.data || err.message;
    console.error('[phonepe-create-payment] error:', detail);
    return res.status(500).json({ error: 'Payment initiation failed', detail });
  }
};
