# 🚔 WhatsApp Civic Complaint System

A full-stack civic complaint portal — citizens file complaints via WhatsApp, officers manage them via a web dashboard.

```
Citizens → WhatsApp → Twilio Webhook → Backend API → PostgreSQL
                                              ↕
                                    Admin Dashboard (React)
```

---

## 📁 Project Structure

```
civic-complaint-system/
├── backend/                  # Node.js + Express API + WhatsApp webhook
│   ├── src/
│   │   ├── db/               # PostgreSQL connection + migration runner
│   │   ├── middleware/       # JWT auth middleware
│   │   ├── routes/
│   │   │   ├── auth.js       # Login, create officers
│   │   │   ├── complaints.js # CRUD, filters, stats
│   │   │   └── webhook.js    # Twilio WhatsApp handler
│   │   └── utils/
│   │       ├── complaintId.js # KA-2026-00421 generator
│   │       └── strings.js     # EN / KN / HI translations
│   ├── migrations/
│   │   └── 001_initial.sql   # Full DB schema
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                 # React + Vite dashboard
│   ├── src/
│   │   ├── api/client.js     # Axios API wrapper
│   │   ├── context/          # Auth context
│   │   ├── components/       # Layout, Badges
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Dashboard.jsx # Stats + charts
│   │       ├── Complaints.jsx # Table + filters
│   │       ├── ComplaintDetail.jsx # Full detail + actions
│   │       └── Officers.jsx  # Manage officer accounts
│   ├── Dockerfile
│   └── nginx.conf
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🚀 Quick Start (Docker — Recommended)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed
- [ngrok](https://ngrok.com/) for exposing webhook to Twilio (dev only)

### Step 1 — Clone and configure

```bash
git clone <repo-url>
cd civic-complaint-system

# Copy and edit the environment file
cp .env.example .env
nano .env   # or open in your editor
```

Fill in `.env`:
```env
DB_PASSWORD=your_secure_db_password
JWT_SECRET=a_random_64_char_string_use_openssl_rand_hex_32
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
STATE_CODE=KA
```

### Step 2 — Start all services

```bash
docker-compose up --build -d
```

This starts:
- **PostgreSQL** on port `5432` (auto-migrated on first run)
- **Backend API** on port `3001`
- **Frontend Dashboard** on port `80`

### Step 3 — Access the dashboard

Open **http://localhost** in your browser.

Default login:
- Email: `admin@police.gov.in`
- Password: `Admin@1234`

> ⚠️ **Change the default password immediately** after first login via the Officers page.

---

## 💻 Local Development (No Docker)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your local DB credentials

npm install

# Run database migrations
npm run migrate

# Start dev server (with hot reload)
npm run dev
```

Backend runs at `http://localhost:3001`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Dashboard runs at `http://localhost:5173`
(API calls are proxied to `localhost:3001` via Vite config)

---

## 📱 WhatsApp Chatbot Setup (Twilio)

### Step 1 — Create a Twilio account

1. Go to [twilio.com](https://twilio.com) and sign up (free trial works)
2. Navigate to **Messaging → Try it out → Send a WhatsApp message**
3. Note your **Account SID** and **Auth Token** from the Console dashboard

### Step 2 — Expose your backend to the internet

For development, use **ngrok**:

```bash
# Install ngrok: https://ngrok.com/download
ngrok http 3001
```

Copy the HTTPS URL it gives you, e.g.:
`https://abc123.ngrok-free.app`

### Step 3 — Configure Twilio Webhook

1. In Twilio Console → **Messaging → Settings → WhatsApp Sandbox Settings**
2. Set **"When a message comes in"** to:
   ```
   https://abc123.ngrok-free.app/api/webhook
   ```
   Method: `HTTP POST`
3. Save

### Step 4 — Test the chatbot

1. Send "join <sandbox-keyword>" to Twilio's sandbox number (shown in Console)
2. Then send "Hi" to start the conversation
3. The bot will respond with the language selection menu

### Step 5 — Conversation Flow

```
Citizen sends "Hi"
    → Language Selection (EN / KN / HI)
    → Main Menu:
        1. Register Complaint
           → Category → Description → Location → Name → Photo → Confirm
           → "Your complaint ID: KA-2026-00421"
        2. Emergency Help
           → Shows helpline numbers (100, 108, 1091, 101)
        3. Track Complaint
           → Enter ID → Shows current status
        4. Contact Department
           → Shows department contacts
```

**Global shortcuts:** Type `MENU` at any time to return to the main menu.

---

## 🏛️ Admin Dashboard Features

### Dashboard (`/dashboard`)
- Total / Pending / In Progress / Resolved counts
- Line chart: complaints filed in last 7 days
- Pie chart: breakdown by category
- Recent complaints table

### Complaints List (`/complaints`)
- Search by ID, name, or description
- Filter by: Status, Category, Date range
- Paginated table (20 per page)
- Click any row to open detail view

### Complaint Detail (`/complaints/:id`)
- Full complaint info (description, location, GPS link, phone)
- Attachment preview (photos submitted via WhatsApp)
- Status actions: **In Progress → Resolved → Rejected** (with reason)
- Assign to officer (Super Admin only)
- Internal notes (visible only to officers)

### Officers (`/officers`) — Super Admin only
- List all officer accounts
- Add new officer with role (Officer / Super Admin), department, badge number

---

## 🔐 Roles & Permissions

| Feature | Officer | Super Admin |
|---------|---------|-------------|
| View all complaints | ✅ | ✅ |
| Update complaint status | ✅ | ✅ |
| Add internal notes | ✅ | ✅ |
| Assign complaints to officer | ❌ | ✅ |
| Create / manage officers | ❌ | ✅ |
| View all officer accounts | ❌ | ✅ |

---

## 🗄️ Database Schema

| Table | Purpose |
|-------|---------|
| `complaints` | All submitted complaints |
| `officers` | Admin users (bcrypt passwords) |
| `complaint_notes` | Internal officer notes per complaint |
| `whatsapp_sessions` | Stateless session state by phone number |
| `complaint_counters` | Atomic counter for ID generation |

**Complaint ID format:** `{STATE}-{YEAR}-{5-digit-count}`
Examples: `KA-2026-00001`, `KA-2026-00421`, `MH-2026-01200`

---

## 📡 API Reference

### Auth
```
POST   /api/auth/login           Body: { email, password }
GET    /api/auth/me              Header: Authorization: Bearer <token>
POST   /api/auth/officers        Create officer (super_admin only)
GET    /api/auth/officers        List officers (super_admin only)
```

### Complaints
```
GET    /api/complaints           ?status=&category=&from=&to=&search=&page=&limit=
GET    /api/complaints/stats     Dashboard stats
GET    /api/complaints/:id       Full complaint + notes
PATCH  /api/complaints/:id/status  Body: { status, rejection_reason? }
PATCH  /api/complaints/:id/assign  Body: { officer_id }
POST   /api/complaints/:id/notes   Body: { note }
```

### Webhook
```
POST   /api/webhook              Twilio WhatsApp webhook
POST   /api/webhook/test         Dev simulation endpoint
```

---

## 🌐 Supported Languages

| Language | Code | Status |
|----------|------|--------|
| English | `en` | ✅ Full support |
| Kannada (ಕನ್ನಡ) | `kn` | ✅ Full support |
| Hindi (हिंदी) | `hi` | ✅ Full support |

To add more languages, edit `backend/src/utils/strings.js` and add entries for the language code.

---

## ☁️ Production Deployment

### Option 1: Docker on a VPS (e.g. DigitalOcean, AWS EC2)

```bash
# On your server
git clone <repo> && cd civic-complaint-system
cp .env.example .env && nano .env   # Set all secrets

docker-compose up -d --build

# Set up a reverse proxy (nginx/Caddy) with SSL
# Point your domain → localhost:80
# Point Twilio webhook → https://yourdomain.com/api/webhook
```

### Option 2: Railway / Render
- Backend: Deploy as a Node.js web service
- Database: Use the platform's managed PostgreSQL
- Frontend: Deploy as a static site (after `npm run build`)

### Environment Variables for Production
```env
NODE_ENV=production
DB_HOST=<managed-db-host>
DB_PASSWORD=<strong-password>
JWT_SECRET=<64-char-random-string>
TWILIO_ACCOUNT_SID=<real-sid>
TWILIO_AUTH_TOKEN=<real-token>
TWILIO_WHATSAPP_NUMBER=whatsapp:+<your-number>
FRONTEND_URL=https://yourdomain.com
```

---

## 🔧 Customization

### Change State Code
In `.env`: `STATE_CODE=MH` → complaint IDs become `MH-2026-00001`

### Add a Language
In `backend/src/utils/strings.js`:
```js
strings.ta = {
  welcome: `வணக்கம்...`,
  mainMenu: `...`,
  // ... all keys
};
```
Then map `'4': 'ta'` in the webhook's `LANGUAGE_SELECT` case.

### Add a Complaint Category
1. In `backend/migrations/` — add new value to the `CHECK` constraint
2. In `backend/src/utils/strings.js` — add entry in `categoryMap`
3. Re-run migration or `ALTER TABLE` for existing DBs

---

## 🐛 Troubleshooting

| Issue | Fix |
|-------|-----|
| Webhook not receiving messages | Ensure ngrok is running, URL is correct in Twilio Console |
| "Invalid credentials" on login | Run `npm run migrate` to seed the default admin |
| DB connection error | Check `DB_HOST`, `DB_PASSWORD` in `.env` |
| Frontend shows blank page | Check browser console; ensure backend is running |
| Twilio sends but bot doesn't respond | Check `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` in `.env` |

---

## 📄 License

MIT License — Free to use and modify for civic/government projects.

---


Stack: Node.js · PostgreSQL · React · Twilio WhatsApp API
