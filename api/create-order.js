// api/create-order.js
// Creates a Razorpay order — called before opening the payment popup

const Razorpay = require('razorpay');

module.exports = async function handler(req, res) {
  console.log('[create-order] invoked, method:', req.method);

  // Allow CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, orderId } = req.body;
  console.log('[create-order] amount:', amount, 'orderId:', orderId);

  if (!amount || amount < 1) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  console.log('[create-order] keyId present:', !!keyId, '| keySecret present:', !!keySecret);

  try {
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    console.log('[create-order] Razorpay instance created, calling orders.create...');

    // Wrap with 8-second timeout so we don't hang
    const orderPromise = razorpay.orders.create({
      amount:   Math.round(amount * 100),
      currency: 'INR',
      receipt:  orderId || ('AN' + Date.now().toString().slice(-8)),
      notes:    { store: 'AuraNest Decors' },
    });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Razorpay API call timed out after 8s')), 8000)
    );

    const order = await Promise.race([orderPromise, timeoutPromise]);
    console.log('[create-order] order created:', order.id);

    return res.status(200).json({
      razorpayOrderId: order.id,
      amount:          order.amount,
      currency:        order.currency,
      keyId:           keyId,
    });

  } catch (err) {
    console.error('[create-order] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
