// api/create-order.js
// Lazy-require Razorpay inside handler to catch module-load hangs

module.exports = async function handler(req, res) {
  console.log('[create-order] handler entered, method:', req.method);

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
  console.log('[create-order] body parsed, amount:', amount);

  if (!amount || amount < 1) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  console.log('[create-order] env: keyId=', keyId ? keyId.slice(0,10) + '...' : 'MISSING');

  try {
    console.log('[create-order] loading razorpay module...');
    const Razorpay = require('razorpay');
    console.log('[create-order] razorpay loaded, creating instance...');

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    console.log('[create-order] instance created, calling orders.create...');

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Razorpay API timeout after 8s')), 8000)
    );
    const order = await Promise.race([
      razorpay.orders.create({
        amount:   Math.round(amount * 100),
        currency: 'INR',
        receipt:  orderId || ('AN' + Date.now().toString().slice(-8)),
        notes:    { store: 'AuraNest Decors' },
      }),
      timeoutPromise,
    ]);

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
