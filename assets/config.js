// ════════════════════════════════════════════════════
//  AURANEST DECORS — Shared Firebase Config
//  Used by BOTH: index.html (store) and admin/index.html
//  HOW TO SETUP:
//  1. Go to https://console.firebase.google.com
//  2. Create project → Firestore → Authentication → Web App
//  3. Replace the values below with YOUR project values
// ════════════════════════════════════════════════════

window.FIREBASE_CONFIG = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

// Admin email — change this to your admin email
window.ADMIN_EMAIL = "admin@auranestdecors.com";
