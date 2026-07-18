// api/phonepe-webhook.js
// PhonePe Standard Checkout v2 — server-to-server callback (recommended path).
// PhonePe calls this whenever a payment state changes. We validate the auth
// header, then run the same idempotent fulfilment as the browser status-check.
//
// ENV required: PHONEPE_WEBHOOK_USERNAME, PHONEPE_WEBHOOK_PASSWORD
//   (must exactly match the username/password you set in the PhonePe dashboard
//    when configuring the webhook URL: https://<domain>/api/phonepe-webhook)
//
// Events handled: checkout.order.completed, checkout.order.failed

const { verifyWebhookAuth } = require('../lib/phonepe');
const { fulfil } = require('../lib/fulfilOrder');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // 1. Validate the callback is really from PhonePe
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!verifyWebhookAuth(authHeader)) {
    console.warn('[phonepe-webhook] invalid auth header');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const body    = req.body || {};
    const event   = body.event || body.type || '';
    const payload = body.payload || body.data || {};

    const merchantOrderId = payload.merchantOrderId || payload.merchantTransactionId;
    let   state           = payload.state; // COMPLETED | FAILED | PENDING

    // Fall back to deriving state from the event name if not present
    if (!state) {
      if (/completed/i.test(event)) state = 'COMPLETED';
      else if (/failed/i.test(event)) state = 'FAILED';
    }

    if (!merchantOrderId) {
      console.warn('[phonepe-webhook] missing merchantOrderId', body);
      return res.status(200).json({ received: true }); // ack anyway so PhonePe stops retrying
    }

    let phonepeTxnId = null;
    const pd = payload.paymentDetails;
    if (Array.isArray(pd) && pd.length) phonepeTxnId = pd[0].transactionId || null;

    await fulfil(merchantOrderId, state, phonepeTxnId);

    // Always 2xx so PhonePe marks the webhook delivered
    return res.status(200).json({ received: true });

  } catch (err) {
    console.error('[phonepe-webhook] error:', err.message);
    // Return 500 so PhonePe retries later
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
};
