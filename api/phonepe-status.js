// api/phonepe-status.js
// PhonePe Standard Checkout v2 — called by the browser when the customer
// returns from PhonePe. Checks the order status and runs the shared idempotent
// fulfilment (mark paid + Shiprocket), then reports the state to the browser.

const { HOSTS, getAccessToken } = require('../lib/phonepe');
const { fulfil } = require('../lib/fulfilOrder');
const axios = require('axios');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { merchantOrderId } = req.body || {};
  if (!merchantOrderId) return res.status(400).json({ error: 'Missing merchantOrderId' });

  try {
    const token = await getAccessToken();
    const statusRes = await axios.get(
      `${HOSTS.status}/${encodeURIComponent(merchantOrderId)}/status`,
      { headers: { Authorization: `O-Bearer ${token}` } }
    );

    const state = statusRes.data.state; // COMPLETED | FAILED | PENDING
    let phonepeTxnId = null;
    const pd = statusRes.data.paymentDetails;
    if (Array.isArray(pd) && pd.length) phonepeTxnId = pd[0].transactionId || null;

    const result = await fulfil(merchantOrderId, state, phonepeTxnId);
    return res.status(200).json({ ...result, merchantOrderId });

  } catch (err) {
    const detail = err?.response?.data || err.message;
    console.error('[phonepe-status] error:', detail);
    return res.status(500).json({ error: 'Status check failed', detail });
  }
};
