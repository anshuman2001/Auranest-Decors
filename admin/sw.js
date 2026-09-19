// admin/sw.js
// Minimal service worker — its only job is to make the admin dashboard
// installable as a PWA (home-screen icon, standalone window). Orders load
// live from Firestore, so this intentionally does not cache or serve
// offline data — a stale cached dashboard showing wrong order status would
// be worse than no offline support at all.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {}); // required for installability, no-op
