// api/verify-payment.js
// 1. Verifies Razorpay payment signature
// 2. Creates order on Shiprocket
// Called after user completes payment

const crypto = require('crypto');
const axios  = require('axios');

const SHIPROCKET_API = 'https://apiv2.shiprocket.in/v1/external';

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

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderData,           // { orderId, customer, items, subtotal, totalAmount }
  } = req.body;

  // ── 1. VERIFY RAZORPAY SIGNATURE ──────────────────────────────────────────
  const sign    = razorpay_order_id + '|' + razorpay_payment_id;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(sign)
    .digest('hex');

  if (expected !== razorpay_signature) {
    return res.status(400).json({ success: false, error: 'Payment verification failed' });
  }

  // ── 2. CREATE SHIPROCKET ORDER ────────────────────────────────────────────
  let shiprocketOrderId   = null;
  let shiprocketShipmentId = null;
  let shiprocketError     = null;

  try {
    // Get auth token
    const authRes = await axios.post(`${SHIPROCKET_API}/auth/login`, {
      email:    process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    });
    const token = authRes.data.token;

    // Build order items for Shiprocket
    const orderItems = (orderData.items || []).map(item => ({
      name:          item.name,
      sku:           item.id || String(Math.random()).slice(2, 10),
      units:         item.qty,
      selling_price: item.price,
      discount:      0,
      tax:           0,
      hsn:           0,
    }));

    const now       = new Date();
    const orderDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    const c = orderData.customer;

    const shipPayload = {
      order_id:                orderData.orderId,
      order_date:              orderDate,
      pickup_location:         'Primary',
      billing_customer_name:   c.name,
      billing_last_name:       '',
      billing_address:         c.address,
      billing_city:            c.city,
      billing_pincode:         String(c.pincode),
      billing_state:           c.state || 'Delhi',
      billing_country:         'India',
      billing_email:           c.email || 'customer@auranestdecors.com',
      billing_phone:           String(c.phone),
      shipping_is_billing:     1,
      order_items:             orderItems,
      payment_method:          'Prepaid',
      sub_total:               orderData.subtotal,
      length:                  15,
      breadth:                 15,
      height:                  10,
      weight:                  0.5,
    };

    const shipRes = await axios.post(
      `${SHIPROCKET_API}/orders/create/adhoc`,
      shipPayload,
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );

    shiprocketOrderId    = shipRes.data.order_id;
    shiprocketShipmentId = shipRes.data.shipment_id;

  } catch (err) {
    console.error('Shiprocket error:', err?.response?.data || err.message);
    shiprocketError = err?.response?.data?.message || err.message;
    // Don't fail the whole response — payment is verified, just log the issue
  }

  return res.status(200).json({
    success:            true,
    paymentId:          razorpay_payment_id,
    shiprocketOrderId,
    shiprocketShipmentId,
    shiprocketError,
  });
};
