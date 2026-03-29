# 🪺 Auranest Decors – Complete Connected Project
## Store + Admin Dashboard + Firebase Backend

---

## 📁 Project Structure
```
AuraNestFinal/
├── store/
│   └── index.html        ← Customer Store (connected to Firebase)
├── admin/
│   └── index.html        ← Admin Dashboard (connected to Firebase)
├── assets/
│   ├── logo.jpg          ← Put your logo here
│   ├── banner1.jpg       ← Put banner 1 here
│   └── banner2.jpg       ← Put banner 2 here
└── README.md
```

---

## 🔥 How Store & Admin are Connected

```
Customer visits store        Admin opens dashboard
       │                              │
       │ places order                 │ sees order instantly (real-time)
       ▼                              ▼
  ┌─────────────────────────────────────────┐
  │           FIREBASE (Cloud)              │
  │                                         │
  │  📦 products  (collection)              │
  │  🛍️  orders    (collection) ← real-time │
  │  👥 users     (collection)              │
  └─────────────────────────────────────────┘
       ▲                              ▲
       │ loads products               │ updates order status
       │                              │
  Customer Store                Admin Dashboard
```

### What is LIVE / Real-time:
- ✅ Customer places order → Admin sees it INSTANTLY
- ✅ Admin updates order status → Customer's "My Orders" updates
- ✅ Admin adds product → Product appears on store immediately
- ✅ Admin deletes product → Removed from store immediately

---

## 🚀 Setup in 10 Minutes

### Step 1 — Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click **"Add Project"** → Name: `auranest-decors`
3. Disable Google Analytics → **Create Project**

### Step 2 — Enable Firestore Database
1. Left menu → **Build → Firestore Database**
2. Click **"Create Database"**
3. Mode: **"Start in test mode"** (allows read/write)
4. Region: **asia-south1 (Mumbai)**
5. Click **"Enable"**

### Step 3 — Enable Authentication
1. Left menu → **Build → Authentication**
2. Click **"Get Started"**
3. **Sign-in Method** tab → Click **"Email/Password"**
4. Toggle Enable → **Save**

### Step 4 — Create Admin Account
1. In Authentication → **Users** tab
2. Click **"Add User"**
3. Email: `admin@auranestdecors.com`
4. Password: `Admin@2026`
5. Click **"Add User"**

### Step 5 — Get Firebase Config
1. Click **gear icon** → **Project Settings**
2. Scroll to **"Your apps"**
3. Click **"</>"** (Web icon)
4. App nickname: `auranest-web` → **Register app**
5. Copy the config object:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXX",
  authDomain: "auranest-decors.firebaseapp.com",
  projectId: "auranest-decors",
  storageBucket: "auranest-decors.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### Step 6 — Paste Config in BOTH Files
**In `store/index.html`** → Find this near the bottom:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",       ← Replace all these
  ...
};
```

**In `admin/index.html`** → Find the same section → Paste same config

### Step 7 — Run the Project
```
npx serve .
```

Open:
- 🛍️ Store → http://localhost:3000/store/index.html
- ⚙️ Admin → http://localhost:3000/admin/index.html

### Step 8 — First Time Setup
1. Open the **Store** first → it will automatically seed all 22 products to Firebase
2. Then open **Admin** → login with your admin email/password
3. You should see all 22 products loaded from Firebase!

---

## 🔑 Admin Login
- **Email:** admin@auranestdecors.com
- **Password:** Admin@2026

---

## 🖼️ Adding Product Images

### Option A — Local Files
1. Put image in `assets/` folder
2. In Admin → Edit product → Image URL field → type: `../assets/your-image.jpg`

### Option B — Firebase Storage (Recommended for live site)
1. Firebase Console → **Storage** → Upload images
2. Right-click uploaded image → **Copy download URL**
3. Paste that URL in Admin → Edit product → Image URL field

### Option C — Any online image URL
Just paste any public image URL (from your website, Cloudinary, etc.)

---

## 🌐 Deploy Live

### Option 1 — Netlify (Free)
1. Go to netlify.com → Sign up
2. Drag and drop the `AuraNestFinal` folder
3. Done! Your site is live.

### Option 2 — Vercel (Free)
```
npm install -g vercel
vercel
```

---

## 📊 Firebase Free Limits

| Resource | Free Limit | Your Usage |
|---|---|---|
| Firestore reads | 50,000/day | ~100/day |
| Firestore writes | 20,000/day | ~50/day |
| Storage | 5 GB | ~50 MB |
| Hosting | 10 GB/month | ~1 GB |

**You won't hit these limits for a long time!** ✅

---

## 🔧 How to Modify

### Change Colors
In `store/index.html` → find `:root {` → change CSS variables

### Add New Product
- Via Admin Dashboard (recommended) — adds to Firebase
- Or add to `PRODUCTS` array in `store/index.html`

### Change Firebase Config
Both `store/index.html` and `admin/index.html` have:
```javascript
const firebaseConfig = { ... }
```
Update both files with same config.

---

*© 2026 Auranest Decors – Feel the Beauty of Home*
