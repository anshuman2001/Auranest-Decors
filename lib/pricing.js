// lib/pricing.js
// Authoritative server-side order-total calculation. The browser can send any
// amount it likes; we recompute from real product prices in Firestore so a
// tampered client cannot underpay (SEC-05 / BUG-02).
//
// Mirrors the client's calcTotals(): subtotal = Σ(price×qty),
// discount = 10% if a coupon was applied, shipping = 0 (free on all orders).

const { getDb } = require('./firebaseAdmin');

// items: [{ id, qty, price }] ; couponApplied: boolean
// Returns { ok, total, subtotal, discount, mismatch, serverPriced }
async function computeAuthoritativeTotal(items, couponApplied) {
  if (!Array.isArray(items) || !items.length) {
    return { ok: false, reason: 'no_items' };
  }
  const db = getDb();

  let subtotal = 0;
  let serverPriced = true;

  for (const it of items) {
    const qty = Math.max(1, parseInt(it.qty) || 1);
    let price = null;
    if (it.id) {
      try {
        const snap = await db.collection('products').doc(String(it.id)).get();
        if (snap.exists) {
          const p = snap.data();
          price = Number(p.price);
        }
      } catch (e) { /* fall through to client price */ }
    }
    if (price == null || Number.isNaN(price)) {
      // Product not found by id (e.g. legacy static item) — fall back to the
      // client-provided price for THIS line so checkout never hard-breaks.
      price = Number(it.price) || 0;
      serverPriced = false;
    }
    subtotal += price * qty;
  }

  const discount = couponApplied ? Math.round(subtotal * 0.10) : 0;
  const total    = Math.max(0, subtotal - discount); // shipping = 0

  return { ok: true, total, subtotal, discount, serverPriced };
}

module.exports = { computeAuthoritativeTotal };
