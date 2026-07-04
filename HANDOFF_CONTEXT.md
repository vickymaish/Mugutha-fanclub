# Mugutha FC Platform — Handoff Context
**Date:** 2 July 2026  
**Status:** MVP working end-to-end. Tier-based WhatsApp broadcasts proven. Branded image delivery proven.

---

## What this project is

A member management + WhatsApp automation platform for Mugutha FC (Ruiru, Kenya, Mt. Kenya Regional League). Members pay annually and receive automated WhatsApp messages — match alerts, renewal reminders, merch drops, investment updates — gated by membership tier (Bronze/Silver/Gold).

---

## Stack

| Layer | Tech | Location |
|---|---|---|
| Backend | Node.js + Express | `backend/` |
| Frontend | React + Vite | `frontend-v2/` |
| Database | Supabase (PostgreSQL) | hosted, ref `pauanfwuxivrcwsboaxs` |
| WhatsApp | Meta Cloud API (NOT mock, NOT Twilio) | graph.facebook.com/v25.0 |
| Images | sharp (Node.js) | `backend/src/services/imageService.js` |

---

## Ports

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`
- Vite proxies `/api/*` → `localhost:5000/api/*` (configured in `frontend-v2/vite.config.js`)

---

## Files changed in this session (the important ones)

### Backend

**`src/config/env.js`**  
Added `phoneNumberId` and `businessAccountId` to the `whatsapp` object so the Meta API URL can be constructed correctly.

**`src/config/whatsapp.js`**  
Now exports `phoneNumberId` and `businessAccountId` in addition to the original fields.

**`src/services/whatsappService.js`**  
Fully rewritten. Now supports Meta Cloud API (not mock/Twilio). Exports:
- `sendMessage({ phone, message, title })` — plain text, only works inside a 24hr conversation window
- `sendTemplate({ phone, templateName, languageCode })` — for first contact, opens the window

**`src/services/mediaService.js`** ← NEW FILE  
Two functions only:
- `uploadImage(buffer)` — uploads JPEG Buffer to Meta media API, returns `media_id`
- `sendImage(phone, mediaId, caption)` — sends image message via WhatsApp

**`src/services/imageService.js`** ← NEW FILE  
- `generateMemberCard({ masterplatePath, name, tier, memberId })` — overlays member info onto a masterplate JPEG using `sharp`, returns Buffer
- Gold/Silver get branded image cards; Bronze gets text only

**`src/services/broadcastService.js`**  
Implemented `sendBroadcastNow` and `sendBroadcastToMembers`. Filters by tier using `listMembersByTier`. Calls `whatsappService.sendMessage` per member. Updates broadcast status to `sent` or `no_recipients`.

**`src/controllers/broadcastController.js`**  
`sendBroadcast` accepts `{ title, message, tier, send_now }`, stores `tier` in DB, returns `{ broadcast, tier, recipients, sent, failed, failures[] }`.

**`src/controllers/memberController.js`**  
Added `exports.tierCounts` — returns `{ total, gold, silver, bronze }` counts from active members. Added `listAllMembers` to imports. Also added `exports.sendWelcomeCard` which sends tier-appropriate WhatsApp (image for Gold/Silver, text for Bronze).

**`src/routes/memberRoutes.js`**  
Added `/tierCounts` route BEFORE `/:id` (critical — Express would otherwise treat "tierCounts" as a member ID and hit auth middleware).  
Added `POST /:id/send-card` route for welcome card sends.

**`src/models/supabaseQueries.js`**  
Added `listMembersByTier(tier, status)`. Added `tier` to `BROADCAST_FIELDS`.

### Database migrations run (in Supabase SQL editor)

```sql
ALTER TABLE members ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'bronze';
ALTER TABLE members ADD COLUMN IF NOT EXISTS amount_paid INTEGER DEFAULT 300;
UPDATE members SET tier = 'gold'   WHERE amount_paid >= 800;
UPDATE members SET tier = 'silver' WHERE amount_paid >= 500 AND amount_paid < 800;
UPDATE members SET tier = 'bronze' WHERE amount_paid < 500;
ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'all';
```

### Frontend

**`frontend-v2/vite.config.js`**  
Added proxy: `/api` → `http://localhost:5000`. Without this, BroadcastModal's relative `/api/broadcasts/send` hits Vite (5173) and gets 404.

**`frontend-v2/src/main.jsx`**  
Complete rewrite (was duplicate-mounted, causing Vite parse errors). Now:
- Single `ReactDOM.createRoot` at the bottom
- Fetches members from `GET /api/members` (public, no auth)
- Derives tier counts from members array (no separate `tierCounts` endpoint call needed)
- `openModal(tier)` wires all QuickAction buttons to `BroadcastModal`
- Toast notification system for user feedback
- No `fetchTierCounts` function (was causing `ReferenceError` — removed entirely)

**`frontend-v2/src/components/BroadcastModal.jsx`**  
New component. Tier selector (All/Gold/Silver/Bronze with counts), message type dropdown, textarea with char count, posts to `/api/broadcasts/send`. Shows success/failure result.

### Assets

**`backend/assets/masterplate-gold.jpg`** — base image for Gold member cards  
**`backend/assets/masterplate-silver.jpg`** — base image for Silver member cards

---

## Environment variables (backend/.env)

```
SUPABASE_URL=https://pauanfwuxivrcwsboaxs.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<secret — never share>
SUPABASE_ANON_KEY=<secret>
PORT=5000
WHATSAPP_PROVIDER=meta
WHATSAPP_API_URL=https://graph.facebook.com/v25.0
WHATSAPP_API_TOKEN=<TEMPORARY — expires every 24hrs, must refresh from Meta dashboard>
WHATSAPP_PHONE_NUMBER_ID=1200484046487914
WHATSAPP_BUSINESS_ACCOUNT_ID=1054613950336252
WHATSAPP_FROM_NUMBER=+15556575499
SCHEDULER_ENABLED=true
```

---

## The most important operational gotcha

**Meta temporary access tokens expire every 24 hours.**  
When they expire: API returns 401, broadcasts show `sent: 0, failed: N`, backend logs show `Request failed with status code 401`.  
Fix: Meta dashboard → Muguthafc platform app → WhatsApp → API Setup → Generate access token → paste into `backend/.env` as `WHATSAPP_API_TOKEN`.  

**Permanent fix needed:** Create a System User token in Meta Business Settings → System Users. This never expires. This has NOT been done yet.

---

## The 24-hour conversation window rule

WhatsApp will NOT deliver plain text messages to a number unless that number has messaged the business first (or replied to a template) within the last 24 hours. The API returns 200 success with a message ID, but delivery is silently dropped.

Flow for first contact:
1. `POST /api/whatsapp/send-template` with `{ phone }` — sends `hello_world` template
2. Recipient replies to it (anything)
3. Now `POST /api/whatsapp/send-test` with `{ phone, message }` will actually deliver

This affects broadcasts — members who haven't interacted recently may not receive plain text messages. Template-based broadcasts are the production solution (requires Meta template approval).

---

## What's working (confirmed with real messages delivered)

- ✅ Single WhatsApp text message via `/api/whatsapp/send-test`
- ✅ Template message via `/api/whatsapp/send-template`  
- ✅ Branded JPEG generated with member name/tier/ID overlay (sharp)
- ✅ Image uploaded to Meta media API → `media_id` returned
- ✅ Branded image delivered to WhatsApp via `media_id`
- ✅ Tier-based broadcast from frontend modal → Gold members targeted
- ✅ Frontend shows live member count from Supabase
- ✅ Supabase logging of every message sent/failed

---

## What's NOT done yet

1. **Permanent Meta System User token** — highest priority, daily token refresh is not sustainable
2. **Webhooks** — no inbound message handling yet; needed for RENEW/ORDER/INFO keyword replies and for tracking which members have open conversation windows
3. **Broadcast result accuracy in frontend** — currently shows "sent" even when `failed > 0`; needs to check `data.sent` not `data.recipients`
4. **Scheduled jobs audit** — `matchReminderJob.js`, `renewalReminderJob.js`, `dailyCheckJob.js` exist in `backend/src/jobs/` but were scaffolded in an earlier session and likely call old mock-shaped `sendMessage`. Need auditing before enabling.
5. **Recent broadcasts panel** — dashboard shows static hardcoded data; should fetch from `GET /api/broadcasts` 
6. **Members page** — nav links in sidebar don't route anywhere yet (no router installed)
7. **Featherless AI integration** — planned for AI-generated broadcast message copy; not started

---

## How to start the project

```bash
# Terminal 1 — backend
cd backend
npm run dev

# Terminal 2 — frontend
cd frontend-v2
npm run dev
```

Open `http://localhost:5173`

---

## Key test commands

```powershell
# Test plain text send
Invoke-WebRequest -Uri "http://localhost:5000/api/whatsapp/send-test" -Method POST -ContentType "application/json" -Body '{"phone":"254736506027","message":"test"}'

# Test template send (opens conversation window)
Invoke-WebRequest -Uri "http://localhost:5000/api/whatsapp/send-template" -Method POST -ContentType "application/json" -Body '{"phone":"254736506027"}'

# Test tier counts
Invoke-WebRequest -Uri "http://localhost:5000/api/members/tierCounts"

# Test broadcast to gold
Invoke-WebRequest -Uri "http://localhost:5000/api/broadcasts/send" -Method POST -ContentType "application/json" -Body '{"title":"Test","message":"Hello Gold","tier":"gold","send_now":true}'

# Generate and send branded image (run from backend/ folder)
node test-image-send.js
```