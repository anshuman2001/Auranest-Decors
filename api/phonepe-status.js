// api/phonepe-status.js
// Called by the browser when the customer returns from PhonePe.
//
// IMPORTANT: the payment verdict comes ONLY from PhonePe's order state.
// Saving to Firebase / creating the Shiprocket shipment is best-effort and must
// NEVER flip a genuinely-successful payment into a "failed" screen for the
// customer (the webhook will retry fulfilment anyway).

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

  // 1. Ask PhonePe for the true payment state (source of truth)
  let state = null, phonepeTxnId = null, statusError = null;
  try {
    const token = await getAccessToken();
    const statusRes = await axios.get(
      `${HOSTS.status}/${encodeURIComponent(merchantOrderId)}/status`,
      { headers: { Authorization: `O-Bearer ${token}` } }
    );
    state = statusRes.data.state; // COMPLETED | FAILED | PENDING
    const pd = statusRes.data.paymentDetails;
    if (Array.isArray(pd) && pd.length) phonepeTxnId = pd[0].transactionId || null;
  } catch (err) {
    statusError = err?.response?.data || err.message;
    console.error('[phonepe-status] status call failed:', statusError);
    // We genuinely don't know the state — tell the browser to retry.
    return res.status(200).json({ success: false, state: 'UNKNOWN', retry: true, merchantOrderId, error: 'status_unavailable' });
  }

  // 2. Fulfil (Firebase + Shiprocket) — best-effort, must not change the verdict
  let fulfilError = null;
  try {
    await fulfil(merchantOrderId, state, phonepeTxnId);
  } catch (e) {
    fulfilError = e.message;
    console.error('[phonepe-status] fulfil failed (payment verdict unaffected):', e.message);
  }

  // 3. Verdict is based purely on PhonePe's state
  return res.status(200).json({
    success: state === 'COMPLETED',
    state,
    retry: state === 'PENDING',
    phonepeTxnId,
    fulfilError,
    merchantOrderId,
  });
};
