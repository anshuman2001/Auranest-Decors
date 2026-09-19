// lib/notify.js
// Alerts the store owner (email + WhatsApp) whenever a new order comes in.
// Both channels are best-effort and independent — one failing never blocks
// the other, and neither ever blocks order fulfilment (see callers).
//
// ENV required — see NOTIFICATIONS_SETUP.md for how to obtain these:
//   GMAIL_USER          — sender Gmail address
//   GMAIL_APP_PASSWORD  — 16-char Google App Password (not your normal password)
//   ADMIN_EMAIL         — where order alerts should land (defaults to GMAIL_USER)
//   CALLMEBOT_PHONE     — admin's WhatsApp number with country code, e.g. 91XXXXXXXXXX
//   CALLMEBOT_APIKEY    — issued by CallMeBot after the one-time activation message

const nodemailer = require('nodemailer');

let _transporter;
function getTransporter() {
  if (_transporter !== undefined) return _transporter;
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    _transporter = null;
  } else {
    _transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
  }
  return _transporter;
}

function money(n) {
  return `Rs.${Number(n || 0).toLocaleString('en-IN')}`;
}

function orderRef(order) {
  return order.orderId || order.merchantOrderId || 'unknown';
}

function emailBody(order) {
  const c = order.customer || {};
  const items = (order.items || [])
    .map(i => `  - ${i.name} x${i.qty} (${money(i.price)})`)
    .join('\n') || '  (no item details)';
  return [
    `New order: ${orderRef(order)}`,
    `Payment: ${order.paymentMethod || 'unknown'} (${order.paymentStatus || order.orderStatus || 'unknown'})`,
    `Amount: ${money(order.totalAmount ?? order.subtotal)}`,
    '',
    `Customer: ${c.name || ''}`,
    `Phone: ${c.phone || ''}`,
    `Address: ${[c.address, c.address2, c.city, c.state, c.pincode].filter(Boolean).join(', ')}`,
    '',
    'Items:',
    items,
  ].join('\n');
}

function whatsappText(order) {
  const c = order.customer || {};
  return [
    `New order ${orderRef(order)}`,
    `${money(order.totalAmount ?? order.subtotal)} - ${order.paymentMethod || ''}`,
    `${c.name || ''} - ${c.phone || ''}`,
    `${c.city || ''} ${c.pincode || ''}`,
  ].join('\n').slice(0, 300);
}

async function sendOrderEmail(order) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[notify] Gmail not configured — skipping email alert');
    return;
  }
  const to = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;
  await transporter.sendMail({
    from: `"Auranest Decors" <${process.env.GMAIL_USER}>`,
    to,
    subject: `New order — ${money(order.totalAmount ?? order.subtotal)} (${orderRef(order)})`,
    text: emailBody(order),
  });
}

async function sendOrderWhatsApp(order) {
  const phone  = process.env.CALLMEBOT_PHONE;
  const apikey = process.env.CALLMEBOT_APIKEY;
  if (!phone || !apikey) {
    console.warn('[notify] CallMeBot not configured — skipping WhatsApp alert');
    return;
  }
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(whatsappText(order))}&apikey=${encodeURIComponent(apikey)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`CallMeBot ${res.status}: ${body.slice(0, 200)}`);
  }
}

// Runs both channels, never throws — a notification failure must never break
// order placement or payment fulfilment for the customer.
async function notifyNewOrder(order) {
  if (!order) return;
  const results = await Promise.allSettled([sendOrderEmail(order), sendOrderWhatsApp(order)]);
  const labels = ['email', 'whatsapp'];
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`[notify] ${labels[i]} failed:`, r.reason?.message || r.reason);
    }
  });
}

module.exports = { notifyNewOrder };
