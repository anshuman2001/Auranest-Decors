# Order Notifications Setup (Email + WhatsApp)

Whenever a new order comes in — Razorpay, PhonePe, or Cash on Delivery — the
store now sends you an alert by **email** and **WhatsApp**. Both are free.
This only needs a one-time setup of 4 environment variables in Vercel.

Where orders get notified from (for reference, no action needed):
- Razorpay → [api/verify-payment.js](api/verify-payment.js) (after payment is verified)
- PhonePe → [lib/fulfilOrder.js](lib/fulfilOrder.js) (after the webhook confirms payment)
- Cash on Delivery → [api/notify-order.js](api/notify-order.js) (called right after the order is placed)
- Shared logic → [lib/notify.js](lib/notify.js)

---

## 1. Email (Gmail — free, no signup limits)

1. Go to your Google Account → **Security** → turn on **2-Step Verification** (required for App Passwords).
2. Go to https://myaccount.google.com/apppasswords
3. App name: type anything, e.g. `Auranest Orders` → **Create**.
4. Google shows a 16-character password like `abcd efgh ijkl mnop`. Copy it (remove the spaces).

You now have two values:
- `GMAIL_USER` = your Gmail address (the one you generated the App Password from)
- `GMAIL_APP_PASSWORD` = the 16-character code from step 4

Optional: `ADMIN_EMAIL` = a different email address to receive alerts (defaults to `GMAIL_USER` if not set).

## 2. WhatsApp (CallMeBot — free, personal number)

1. Save this contact on your phone's WhatsApp: **+34 644 59 71 68** (CallMeBot's number).
2. Send it this exact message on WhatsApp: `I allow callmebot to send me messages`
3. Wait for a reply with your personal API key (a number, e.g. `123456`).

You now have two values:
- `CALLMEBOT_PHONE` = your WhatsApp number **with country code, no + or spaces**, e.g. `91XXXXXXXXXX`
- `CALLMEBOT_APIKEY` = the number CallMeBot replied with

If you don't get a reply within a few minutes, resend the activation message — CallMeBot is a free community service and occasionally slow.

## 3. Add the 4 variables to Vercel

1. Open your project on https://vercel.com → **Settings** → **Environment Variables**.
2. Add each of these (Production + Preview):
   - `GMAIL_USER`
   - `GMAIL_APP_PASSWORD`
   - `CALLMEBOT_PHONE`
   - `CALLMEBOT_APIKEY`
   - `ADMIN_EMAIL` (optional)
3. Redeploy the project (Vercel → Deployments → ⋯ → Redeploy) so the new variables take effect.

That's it — place a test order and you should get both an email and a WhatsApp message within a few seconds.

If a channel isn't configured, that channel is silently skipped (check Vercel's function logs for `[notify] ... not configured` if you don't receive an alert) — it never blocks the order or the other channel.

---

# Admin Dashboard as a Phone App (PWA)

The admin dashboard (`/admin/`) can now be installed like an app on your phone's
home screen, so you can open it daily without a browser bar. No extra app was
built — this is the same real-time dashboard, just installable.

**On Android (Chrome):**
1. Open `https://www.auranestdecors.com/admin/` in Chrome.
2. Tap the **⋮** menu → **Add to Home screen** (or you'll see an automatic "Install app" prompt).

**On iPhone (Safari):**
1. Open the admin URL in Safari.
2. Tap the **Share** icon → **Add to Home Screen**.

Once added, it opens full-screen like a native app and still updates orders live.

**Note:** the icon uses `/assets/logo.jpg` — if that file isn't present in the deployed site yet, add a square logo image at `assets/logo.jpg` (ideally 512x512) so the home-screen icon looks right instead of a generic placeholder.
