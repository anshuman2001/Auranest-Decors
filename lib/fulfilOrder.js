// lib/fulfilOrder.js
// Single idempotent "confirm a paid order" path, shared by the webhook and the
// browser return status-check. Whichever fires first does the real work; the
// second is a safe no-op (no duplicate Shiprocket shipments).

const { createShiprocketOrder } = require('./phonepe');
const { confirmOrderPaidOnce, attachShiprocket, markOrderFailed } = require('./firebaseAdmin');

// state: 'COMPLETED' | 'FAILED' | 'PENDING'
async function fulfil(merchantOrderId, state, phonepeTxnId) {
  if (state === 'FAILED') {
    try { await markOrderFailed(merchantOrderId); } catch (e) { console.error('[fulfil] markFailed:', e.message); }
    return { success: false, state };
  }
  if (state !== 'COMPLETED') {
    return { success: false, state }; // PENDING — leave as-is
  }

  // COMPLETED — flip to paid exactly once
  const result = await confirmOrderPaidOnce(merchantOrderId, phonepeTxnId);

  // First confirmer creates the Shiprocket shipment
  let shiprocketOrderId = null, shiprocketError = null;
  if (!result.alreadyConfirmed && result.order) {
    try {
      const sr = await createShiprocketOrder({ ...result.order, orderId: merchantOrderId });
      shiprocketOrderId = sr.orderId;
      await attachShiprocket(merchantOrderId, sr);
    } catch (e) {
      shiprocketError = e?.response?.data?.message || e.message;
      console.error('[fulfil] Shiprocket:', shiprocketError);
    }
  }

  return { success: true, state, phonepeTxnId, shiprocketOrderId, shiprocketError, alreadyConfirmed: result.alreadyConfirmed };
}

module.exports = { fulfil };
