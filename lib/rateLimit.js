// lib/rateLimit.js
// Lightweight Firestore-backed rate limiter (fixed window). Used to protect
// unauthenticated endpoints (OTP send/verify, phone lookup) from abuse.
//
// Fails OPEN on infrastructure error — a Firestore hiccup must never block a
// legitimate customer from logging in. It only ever BLOCKS when it positively
// observes the limit exceeded.

const { getDb } = require('./firebaseAdmin');
const admin = require('firebase-admin');

// key: unique string per action+identifier, e.g. "otp:9997730768"
// limit: max requests allowed within windowMs
// Returns { allowed: boolean, remaining: number }
async function rateLimit(key, limit, windowMs) {
  try {
    const db  = getDb();
    const ref = db.collection('_ratelimit').doc(encodeURIComponent(key));
    const now = Date.now();

    return await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.exists ? snap.data() : null;

      if (!data || now - (data.windowStart || 0) > windowMs) {
        // new window
        tx.set(ref, { windowStart: now, count: 1, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        return { allowed: true, remaining: limit - 1 };
      }

      const count = (data.count || 0) + 1;
      if (count > limit) {
        return { allowed: false, remaining: 0, retryAfterMs: windowMs - (now - data.windowStart) };
      }
      tx.update(ref, { count, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      return { allowed: true, remaining: limit - count };
    });
  } catch (e) {
    console.error('[rateLimit] failed open:', e.message);
    return { allowed: true, remaining: 0, failedOpen: true };
  }
}

// Best-effort client IP from common proxy headers (Vercel sets x-forwarded-for)
function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.headers['x-real-ip'] || 'unknown';
}

module.exports = { rateLimit, clientIp };
