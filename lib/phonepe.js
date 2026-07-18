// lib/phonepe.js
// Shared PhonePe Standard Checkout v2 helpers: OAuth token, host resolution,
// Shiprocket order creation, and webhook auth validation.

const crypto = require('crypto');
const axios  = require('axios');

const ENV = (process.env.PHONEPE_ENV || 'production').toLowerCase();

const HOSTS = ENV === 'sandbox'
  ? {
      oauth:  'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token',
      pay:    'https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay',
      status: 'https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/order',
    }
  : {
      oauth:  'https://api.phonepe.com/apis/identity-manager/v1/oauth/token',
      pay:    'https://api.phonepe.com/apis/pg/checkout/v2/pay',
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
  const c = orderData.customer || {};

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

// PhonePe webhook auth: header value = SHA256(username:password) in hex.
function verifyWebhookAuth(authHeader) {
  const user = process.env.PHONEPE_WEBHOOK_USERNAME;
  const pass = process.env.PHONEPE_WEBHOOK_PASSWORD;
  if (!user || !pass || !authHeader) return false;
  const expected = crypto.createHash('sha256').update(`${user}:${pass}`).digest('hex');
  const got = String(authHeader).replace(/^SHA256\s+/i, '').trim().toLowerCase();
  try {
    return crypto.timingSafeEqual(
      Buffer.from(got, 'hex'),
      Buffer.from(expected.toLowerCase(), 'hex')
    );
  } catch { return false; }
}

module.exports = { HOSTS, getAccessToken, createShiprocketOrder, verifyWebhookAuth };
