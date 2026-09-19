// api/notify-order.js
// Alerts the owner for orders that never touch a server-side payment step
// (currently: Cash on Delivery). Razorpay and PhonePe orders are notified
// from their own verified server-side flows instead — see lib/notify.js.
//
// Rate-limited by IP since this is reachable from the browser with
// client-supplied data; a bad actor can at worst spam a few extra alerts,
// never create a real order (that still goes through Firestore's own rules).

const { notifyNewOrder } = require('../lib/notify');
const { rateLimit, clientIp } = require('../lib/rateLimit');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.auranestdecors.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { orderData } = req.body || {};
  if (!orderData || !orderData.orderId || !orderData.customer) {
    return res.status(400).json({ error: 'Invalid order data' });
  }

  const perIp = await rateLimit(`notify-order:${clientIp(req)}`, 10, 10 * 60 * 1000);
  if (!perIp.allowed) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  notifyNewOrder(orderData).catch(e => console.error('[notify-order] notify:', e.message));

  return res.status(200).json({ ok: true });
};
