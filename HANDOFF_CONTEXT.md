# Mugutha FC Platform — Handoff Context
**Date:** 3 August 2026  
**Status:** MVP working end-to-end. Tier-based WhatsApp broadcasts are currently functional. Active UI is `frontend-v2`; legacy `frontend/` is deprecated.

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

## Key implementation files

### Backend

- `backend/src/config/env.js` — loads Supabase and WhatsApp settings from `.env`
- `backend/src/config/whatsapp.js` — exports Meta provider settings, `phoneNumberId`, and `businessAccountId`
- `backend/src/services/whatsappService.js` — text and template WhatsApp send logic using Meta Cloud API
- `backend/src/services/mediaService.js` — uploads images to Meta and sends WhatsApp image messages
- `backend/src/services/imageService.js` — generates tier-branded member card JPEGs with `sharp`
- `backend/src/services/broadcastService.js` — sends tier-based broadcasts and updates broadcast status
- `backend/src/controllers/broadcastController.js` — handles broadcast listing, creation, and `POST /api/broadcasts/send`
- `backend/src/controllers/memberController.js` — handles member CRUD, tier counts, and `POST /api/members/:id/send-card`
- `backend/src/controllers/whatsappController.js` — handles `/api/whatsapp/send-test` and `/api/whatsapp/send-template`
- `backend/src/routes/memberRoutes.js` — public `GET /`, public `GET /tierCounts`, protected CRUD routes, and `POST /:id/send-card`
- `backend/src/routes/broadcastRoutes.js` — `GET /`, `POST /`, and `POST /send`
- `backend/src/routes/whatsappRoutes.js` — `POST /send-test`, `POST /send-template`
- `backend/src/app.js` — mounts `/api/*` routes, internal routes, webhook routes, and error middleware
- `backend/src/controllers/webhookController.js` — webhook handling exists but needs production readiness and further review

### Frontend

- `frontend-v2/vite.config.js` — proxies `/api` to `http://localhost:5000`
- `frontend-v2/src/main.jsx` — app bootstrap with `BrowserRouter`
- `frontend-v2/src/App.jsx` — React Router routes for Dashboard, Members, Fixtures, Broadcasts, Templates, Analytics, Settings
- `frontend-v2/src/pages/Dashboard.jsx` — dashboard UI using `useMembers` and `useFixtures`
- `frontend-v2/src/pages/Broadcasts.jsx` — broadcasts list UI, fetches members to derive tier counts, opens `BroadcastModal`
- `frontend-v2/src/components/BroadcastModal.jsx` — modal UI posting to `/api/broadcasts/send`
- `frontend-v2/src/services/members.js` — member fetch helpers using `VITE_API_URL`
- `frontend-v2/src/services/broadcasts.js` — broadcast fetch/send helpers using `VITE_API_URL`
- `frontend-v2/src/hooks/useMembers.js` — loads member list
- `frontend-v2/src/hooks/useBroadcasts.js` — loads broadcast list

### Database

- `members` table includes `tier` and `amount_paid`
- `broadcasts` table includes `tier` and `status`
- `messages` table logs WhatsApp send status and errors

### Frontend notes

- Active UI is `frontend-v2/`
- Legacy `frontend/` is not the current implementation and should be ignored
- `frontend-v2` uses `react-router-dom` and a dashboard route-based layout

### Backend notes

- WhatsApp text sends only deliver if the recipient has an open 24-hour conversation window
- Admin must use template sends to open first contact with new numbers

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

1. **Permanent Meta System User token** — highest priority, daily token refresh is not sustainable.
2. **Webhooks** — webhook handling exists but needs production-grade verification, payload parsing, and business flow wiring for inbound WhatsApp replies.
3. **Scheduled jobs audit** — `backend/src/jobs/` likely still assumes old mock send behavior and must be reviewed before use.
4. **Recent broadcasts panel** — Dashboard still uses static broadcast sample data; should fetch from `GET /api/broadcasts`.
5. **Broadcast UI result handling** — confirm UI handles `failed > 0` cases accurately and surfaces send status clearly.
6. **Membership import / tier sync** — verify database tier assignment rules and member import logic are aligned with business tiers.
7. **Featherless AI integration** — planned for AI-generated broadcast copy; not started.

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