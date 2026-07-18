// api/phonepe-status.js
// PhonePe Standard Checkout v2 — Step 2 (after the customer returns)
//   1. Gets an OAuth token
//   2. Checks the order status
//   3. If COMPLETED, creates the Shiprocket shipment order
// Returns the payment state so the browser can show success / failure.

const axios = require('axios');

const ENV = (process.env.PHONEPE_ENV || 'production').toLowerCase();

const HOSTS = ENV === 'sandbox'
  ? {
      oauth:  'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token',
      status: 'https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/order',
    }
  : {
      oauth:  'https://api.phonepe.com/apis/identity-manager/v1/oauth/token',
      status: 'https://api.phonepe.com/apis/pg/checkout/v2/order',
    };

const SHIPROCKET_API = 'https://apiv2.shiprocket.in/v1/external';

let _tokenCache = { token: null, expiresAt: 0 };

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (_tokenCache.token && _tokenCache.expiresAt - 60 > now) return _tokenCache.token;

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

// Create a Shiprocket order — mirrors the Razorpay verify-payment flow
async function createShiprocketOrder(orderData) {
  const authRes = await axios.post(`${SHIPROCKET_API}/auth/login`, {
    email:    process.env.SHIPROCKET_EMAIL,
    password: process.env.SHIPROCKET_PASSWORD,
  });
  const token = authRes.data.token;

  const orderItems = (orderData.items || []).map(item => ({
    name:          item.name,
    sku:           item.id || String(Math.random()).slice(2, 10),
    units:         item.qty,
    selling_price: item.price,
    discount:      0, tax: 0, hsn: 0,
  }));

  const now       = new Date();
  const orderDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const c = orderData.customer;

  const shipPayload = {
    order_id:              orderData.orderId,
    order_date:            orderDate,
    pickup_location:       'Primary',
    billing_customer_name: c.name,
    billing_last_name:     '',
    billing_address:       c.address,
    billing_city:          c.city,
    billing_pincode:       String(c.pincode),
    billing_state:         c.state || 'Delhi',
    billing_country:       'India',
    billing_email:         c.email || 'customer@auranestdecors.com',
    billing_phone:         String(c.phone),
    shipping_is_billing:   1,
    order_items:           orderItems,
    payment_method:        'Prepaid',
    sub_total:             orderData.subtotal,
    length: 15, breadth: 15, height: 10, weight: 0.5,
  };

  const shipRes = await axios.post(
    `${SHIPROCKET_API}/orders/create/adhoc`,
    shipPayload,
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  );
  return { orderId: shipRes.data.order_id, shipmentId: shipRes.data.shipment_id };
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

  const { merchantOrderId, orderData } = req.body || {};
  if (!merchantOrderId) {
    return res.status(400).json({ error: 'Missing merchantOrderId' });
  }

  try {
    const token = await getAccessToken();

    const statusRes = await axios.get(
      `${HOSTS.status}/${encodeURIComponent(merchantOrderId)}/status`,
      { headers: { Authorization: `O-Bearer ${token}` } }
    );

    const state = statusRes.data.state; // COMPLETED | FAILED | PENDING
    const paid  = state === 'COMPLETED';

    // Pull the PhonePe transaction id if present
    let phonepeTxnId = null;
    const pd = statusRes.data.paymentDetails;
    if (Array.isArray(pd) && pd.length) phonepeTxnId = pd[0].transactionId || null;

    // On success, create the Shiprocket shipment (non-fatal if it fails)
    let shiprocketOrderId = null, shiprocketShipmentId = null, shiprocketError = null;
    if (paid && orderData) {
      try {
        const sr = await createShiprocketOrder(orderData);
        shiprocketOrderId    = sr.orderId;
        shiprocketShipmentId = sr.shipmentId;
      } catch (e) {
        shiprocketError = e?.response?.data?.message || e.message;
        console.error('[phonepe-status] Shiprocket error:', shiprocketError);
      }
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
      success: paid,
      state,
      merchantOrderId,
      phonepeTxnId,
      shiprocketOrderId,
      shiprocketShipmentId,
      shiprocketError,
    });

  } catch (err) {
    const detail = err?.response?.data || err.message;
    console.error('[phonepe-status] error:', detail);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: 'Status check failed', detail });
  }
};
