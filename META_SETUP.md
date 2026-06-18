# 📱 WhatsApp Setup via Meta for Developers (Free)

This guide connects your own WhatsApp number using the Meta WhatsApp Cloud API.
No Twilio needed. No monthly fee for the first 1,000 conversations/month.

---

## Step 1 — Create a Meta Developer App

1. Go to **https://developers.facebook.com**
2. Click **My Apps → Create App**
3. Choose **Business** as the app type
4. Give it a name (e.g. "KSP Complaint Bot") and click **Create App**

---

## Step 2 — Add WhatsApp to your App

1. In your app dashboard, scroll to find **WhatsApp** and click **Set up**
2. You'll land on the **WhatsApp → API Setup** page — keep this tab open

---

## Step 3 — Get your credentials

On the **API Setup** page, copy these three values into your `.env`:

```
WA_ACCESS_TOKEN     → "Temporary access token" (top of the page)
                       For production use a System User permanent token (see below)

WA_PHONE_NUMBER_ID  → Under "From", the numeric Phone Number ID
                       (NOT the +91 number itself — it's a long number like 123456789012345)

WA_VERIFY_TOKEN     → You choose this yourself — any string you like
                       e.g.  my_ksp_webhook_secret_2026
                       You'll paste this same value in the Meta Console later
```

Your `.env` should look like:
```env
WA_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxx
WA_PHONE_NUMBER_ID=1234567890123456
WA_VERIFY_TOKEN=my_ksp_webhook_secret_2026
```

---

## Step 4 — Add your own number as a test recipient

On the **API Setup** page:

1. Under **"To"** → click **Manage phone number list**
2. Add your personal WhatsApp number (the one you want to test with)
3. You'll receive a WhatsApp message with a code — enter it to verify

---

## Step 5 — Expose your local backend to the internet

Meta needs a public HTTPS URL to send messages to. Use **ngrok** (free):

```bash
# Install: https://ngrok.com/download
ngrok http 3001
```

Copy the HTTPS URL — it looks like:
```
https://abc123.ngrok-free.app
```

Your webhook URL will be:
```
https://abc123.ngrok-free.app/api/webhook
```

> For production deploy your backend to a server with a real domain + SSL.

---

## Step 6 — Register the webhook in Meta Console

1. In the Meta App dashboard → **WhatsApp → Configuration**
2. Under **Webhook**, click **Edit**
3. Fill in:
   - **Callback URL:** `https://abc123.ngrok-free.app/api/webhook`
   - **Verify Token:** the same string you put in `WA_VERIFY_TOKEN` in `.env`
4. Click **Verify and Save** — Meta will call your GET `/api/webhook` endpoint
5. Under **Webhook Fields**, subscribe to **`messages`**

✅ If verify succeeds, you'll see a green checkmark.

---

## Step 7 — Start the backend and test

```bash
cd backend
npm run dev
```

Send **"Hi"** from your WhatsApp to the test number shown in the Meta Console.
The bot should reply with the language selection menu.

---

## Step 8 — Permanent Access Token (for production)

The temporary token expires in ~24 hours. For production:

1. In Meta Console → **Business Settings → System Users**
2. Create a System User → assign it the WhatsApp app with `whatsapp_business_messaging` permission
3. Generate a **permanent token** → paste it as `WA_ACCESS_TOKEN` in `.env`

---

## Conversation flow

```
User: "Hi"
Bot:  Language selection (English / Kannada / Hindi)

User: "1"  (English)
Bot:  Main Menu
       1. Register Complaint
       2. Emergency Help
       3. Track Complaint
       4. Contact Department

User: "1"  (Register)
Bot:  Select category (1-7)
  → Description → Location (text or 📍 GPS pin) → Name → Photo (optional)
  → Confirm with YES/NO
  → "Your Complaint ID: KA-2026-00001 ✅"

User: "MENU"   ← works at any point to restart
```

---

## Free tier limits

| Metric | Free allowance |
|--------|---------------|
| Conversations / month | 1,000 free (then ~$0.005 each) |
| Messages per second | 80 |
| Countries | All |
| Your own number | ✅ Yes |

For a civic complaint portal at district scale, 1,000 free conversations/month is plenty to start.

