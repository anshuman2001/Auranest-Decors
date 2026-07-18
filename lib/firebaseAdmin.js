// lib/firebaseAdmin.js
// Initializes the Firebase Admin SDK once (privileged — bypasses security rules)
// and exposes the Firestore handle plus an idempotent "confirm order" helper.
//
// ENV required: FIREBASE_SERVICE_ACCOUNT — the full service-account JSON
// (Firebase Console → Project Settings → Service Accounts → Generate new
// private key), pasted as a single-line string.

const admin = require('firebase-admin');

let _db = null;

function getDb() {
  if (_db) return _db;
  if (!admin.apps.length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT env var is not set');
    const serviceAccount = typeof raw === 'string' ? JSON.parse(raw) : raw;
    admin.initializeApp({ credential: admin.cert(serviceAccount) });
  }
  _db = admin.firestore();
  return _db;
}

// Save the pending order (called from create-payment, before redirect).
// Doc id = merchantOrderId so both webhook and status-check can find it.
async function savePendingOrder(merchantOrderId, orderData) {
  const db = getDb();
  await db.collection('orders').doc(merchantOrderId).set({
    ...orderData,
    orderId:       merchantOrderId,
    merchantOrderId,
    paymentMethod: 'PhonePe',
    paymentStatus: 'pending',
    orderStatus:   'pending_payment',
    createdAt:     admin.firestore.FieldValue.serverTimestamp(),
    updatedAt:     admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
}

// Idempotently mark an order paid. Returns { alreadyConfirmed, order } so the
// caller knows whether IT should create the Shiprocket shipment (only the first
// caller — webhook or status-check — gets alreadyConfirmed=false).
async function confirmOrderPaidOnce(merchantOrderId, phonepeTxnId) {
  const db  = getDb();
  const ref = db.collection('orders').doc(merchantOrderId);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return { alreadyConfirmed: false, missing: true, order: null };
    const order = snap.data();
    if (order.paymentStatus === 'paid') {
      return { alreadyConfirmed: true, order };
    }
    tx.update(ref, {
      paymentStatus: 'paid',
      orderStatus:   'confirmed',
      phonepeTxnId:  phonepeTxnId || order.phonepeTxnId || '',
      updatedAt:     admin.firestore.FieldValue.serverTimestamp(),
    });
    return { alreadyConfirmed: false, order };
  });
}

// Record Shiprocket result + mark it created (guards against double shipments).
async function attachShiprocket(merchantOrderId, sr) {
  const db = getDb();
  await db.collection('orders').doc(merchantOrderId).set({
    shiprocketOrderId:    sr.orderId || null,
    shiprocketShipmentId: sr.shipmentId || null,
    shiprocketCreated:    true,
    updatedAt:            admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
}

async function markOrderFailed(merchantOrderId) {
  const db = getDb();
  const ref = db.collection('orders').doc(merchantOrderId);
  const snap = await ref.get();
  if (snap.exists && snap.data().paymentStatus === 'paid') return; // don't overwrite a success
  await ref.set({
    paymentStatus: 'failed',
    orderStatus:   'payment_failed',
    updatedAt:     admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
}

module.exports = { getDb, savePendingOrder, confirmOrderPaidOnce, attachShiprocket, markOrderFailed };
