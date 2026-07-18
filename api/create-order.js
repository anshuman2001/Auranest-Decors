// api/create-order.js
// Creates a Razorpay order — called before opening the payment popup

const Razorpay = require('razorpay');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', 'https://www.auranestdecors.com');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, orderId } = req.body;

  if (!amount || amount < 1) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    const razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount:   Math.round(amount * 100),
      currency: 'INR',
      receipt:  orderId || ('AN' + Date.now().toString().slice(-8)),
      notes:    { store: 'AuraNest Decors' },
    });

    return res.status(200).json({
      razorpayOrderId: order.id,
      amount:          order.amount,
      currency:        order.currency,
      keyId:           process.env.RAZORPAY_KEY_ID,
    });

  } catch (err) {
    console.error('[create-order] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
