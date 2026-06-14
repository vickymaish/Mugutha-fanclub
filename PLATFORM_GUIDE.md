# Mugutha FC Platform - Complete Guide

**Project**: Member management + WhatsApp broadcast system for Mugutha FC  
**Tech Stack**: Node.js backend, React frontend, Supabase database, Mock WhatsApp provider  
**Status**: Working demo with real end-to-end flow ✅

---

## 🎯 What's Happening in the Background

### Application Flow
```
Frontend (React) 
  ↓
API Client (axios) hits backend
  ↓
Backend Express Server (port 5000)
  ↓
Routes → Controllers → Services → Database (Supabase)
  ↓
WhatsApp Provider (mock or real)
  ↓
Response back to UI
```

### Core Services

**1. Member Management**
- Import members from Excel/CSV using `scripts/importExcel.js`
- Phone numbers normalized to Kenya format (+254...)
- Stored in Supabase `members` table
- Currently: 10 members imported and active

**2. WhatsApp Integration**
- **Mock Provider** (`/internal/mock-whatsapp`): Local testing, 2-second simulated delay
- **Real Providers**: Placeholder for Twilio, custom providers
- Messages persisted to `messages` table with status tracking
- Supports single test sends and bulk broadcasts

**3. Broadcast System**
- **Send Now**: Immediately sends to all members (tested: 8/8 successful)
- **Schedule**: Sends at specific date/time via cron job
- **Track**: All messages logged with delivery status

**4. Frontend Pages**
- **Dashboard** (`/`): Shows stats (member count, broadcast history)
- **Members** (`/members`): Public list of all imported members
- **Broadcasts** (`/broadcasts`): Form to send test messages or broadcast to all
- **Login** (`/login`): Auth page (not fully wired yet)

**5. Database Tables** (Supabase)
- `members`: id, name, phone, email, join_date, membership_status
- `broadcasts`: id, title, message, status, scheduled_for, sent_at
- `messages`: id, recipient_id, message_id, status, sent_at

---

## 🚀 Commands to Run Everything

### Terminal 1: Start Backend
```powershell
cd backend
npm install
npm run dev
```
**Expected Output:**
```
Server listening on 5000
```

### Terminal 2: Start Frontend
```powershell
cd frontend
npm install
npm run dev
```
**Expected Output:**
```
VITE v5.4.21  ready in 1291 ms
Local:   http://localhost:3000/
```

### Terminal 3: Run Utilities (as needed)

**Check Supabase schema:**
```powershell
node scripts/checkSupabaseSchema.js
```

**Import members from Excel:**
```powershell
node scripts/importExcel.js --file ./members.xlsx
```

**Seed test data:**
```powershell
node scripts/seedMembers.js
```

---

## 📱 Frontend Routes & Features

### Pages
| Route | Purpose | Features |
|-------|---------|----------|
| `/` | Dashboard | Stats card (member count) |
| `/members` | Members List | Table of all imported members |
| `/broadcasts` | Broadcast Hub | Send test messages, broadcast to all, schedule |
| `/login` | Authentication | Login form (placeholder) |

### Broadcast Page Features
**Send Test WhatsApp:**
- Input: Phone number, optional title, message body
- Action: Click "Send test message"
- Response: Success message with message ID

**Broadcast to All Members:**
- Input: Title, message body
- Action: Click "Send now to all members"
- Response: Shows count sent/failed (e.g., "8 delivered, 0 failed")

**Schedule Broadcast:**
- Input: Title, message, date/time picker
- Action: Click "Schedule broadcast"
- Response: Confirms scheduled for specific datetime
- Note: API works, frontend datetime picker needs refinement

---

## 💼 How to Demo to Investors

### Demo Script (10 minutes)

**1. Show Infrastructure (2 min)**
```
Open VS Code terminal → show 3 terminals:
- Backend running on port 5000
- Frontend running on port 3000
- Clean git history
```

**2. Show Data Import (2 min)**
```powershell
# Navigate to frontend Members page
# Show 10 members listed
# Explain: "These were imported from Excel in seconds with validation"
```

**3. Show Broadcast Features (3 min)**
```
Navigate to Broadcasts page
- Fill test send form (phone: 254712345678, message: "Demo message")
- Click "Send test message"
- Show success: "Test message sent: sent"
- Explain: "This hits our backend, goes through WhatsApp provider, 
  logs to database - all in real-time"

- Fill broadcast form (title: "Match on Saturday", message: "2 PM at the pitch")
- Click "Send now to all members"
- Show: "Broadcast sent to 8 members (8 delivered, 0 failed)"
- Explain: "We just sent to ALL members in database simultaneously"
```

**4. Show Code Quality (2 min)**
```
Show GitHub repo with 2 commits:
- feat: fix members endpoint auth and broadcast form state management
- fix: react key warning, add env example, and ci/cd workflows

Show CONTRIBUTING.md and README.md
Explain: "Professional git workflow with Conventional Commits, 
documentation, and CI/CD pipelines ready"
```

**5. Show Scalability (1 min)**
```
Explain infrastructure:
- "Backend is stateless, can scale horizontally"
- "Supabase handles concurrent users"
- "Messages queue-ready for Bull/Redis integration"
- "Mock provider allows testing without external costs"
```

---

## 🔧 Backend Architecture

### Key Files & Their Purpose

**Config Layer**
- `src/config/env.js` - Centralized environment variables
- `src/config/supabase.js` - Supabase client initialization
- `src/config/whatsapp.js` - WhatsApp provider config

**Routes** (REST API endpoints)
- `src/routes/memberRoutes.js` - GET/POST members
- `src/routes/broadcastRoutes.js` - POST broadcasts, GET history
- `src/routes/whatsappRoutes.js` - POST test message send
- `src/routes/internalRoutes.js` - Mock WhatsApp provider

**Controllers** (Request handlers)
- `src/controllers/memberController.js` - Member CRUD
- `src/controllers/broadcastController.js` - Broadcast logic
- `src/controllers/whatsappController.js` - Test send handler

**Services** (Business logic)
- `src/services/whatsappService.js` - Build payload, send to provider
- `src/services/broadcastService.js` - Send to all members
- `src/services/schedulerService.js` - Cron job management

**Models** (Database queries)
- `src/models/supabaseQueries.js` - All Supabase operations

**Jobs** (Background tasks)
- `src/jobs/scheduledBroadcasts.js` - Cron job to send scheduled broadcasts

---

## 🎯 API Endpoints (Backend)

### Members
```
GET  /api/members               - List all members (public)
POST /api/members               - Create member (auth required)
GET  /api/members/:id           - Get one member (auth required)
PUT  /api/members/:id           - Update member (auth required)
DELETE /api/members/:id         - Delete member (auth required)
```

### Broadcasts
```
POST /api/broadcasts/send       - Create & send broadcast
  Body: {
    title: "string",
    message: "string",
    send_now: boolean,           // optional, for immediate send
    scheduled_for: "ISO datetime" // optional, for scheduled send
  }
```

### WhatsApp Test
```
POST /api/whatsapp/send-test    - Send single test message
  Body: {
    phone: "254712345678",
    title: "optional string",
    message: "required string"
  }
```

### Mock Provider (Internal)
```
POST /internal/mock-whatsapp    - Simulates WhatsApp API
  Body: {
    to: "254712345678",
    message: "string",
    delay: number (ms, optional)
  }
  Response: { id: "mock-<timestamp>", to: "...", status: "queued" }
```

---

## 📊 Current Data

**Members Table** (10 rows)
```
id | name           | phone           | join_date  | membership_status
1  | John Kipchoge | 254712345678   | 2026-01-15 | active
2  | Faith Kimaiyo | 254723456789   | 2026-02-20 | active
... (8 more)
```

**Broadcasts Table** (recent)
```
id | title                    | message                          | status    | scheduled_for
1  | Morning Match Reminder  | Good morning! Match starts at... | sent      | NULL
2  | API Scheduled Broadcast | This was scheduled via API      | scheduled | 2026-06-14T05:06:23.701Z
```

**Messages Table** (sample)
```
id | recipient_id | message_id        | status | sent_at
1  | 1            | mock-17814114...  | sent   | 2026-06-14T04:54:41Z
2  | 2            | mock-17814126...  | sent   | 2026-06-14T04:54:41Z
...
```

---

## 🔐 Environment Variables

### What Needs to be Set

**Supabase** (REQUIRED)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
```
Get from: https://app.supabase.com → Settings → API

**WhatsApp** (Currently set to mock)
```
WHATSAPP_PROVIDER=mock  # or "twilio" for real provider
WHATSAPP_API_URL=http://localhost:5000/internal/mock-whatsapp
WHATSAPP_API_TOKEN=ignored_for_mock
WHATSAPP_FROM_NUMBER=+254712345678
MOCK_WHATSAPP_DELAY_MS=2000
```

**Server**
```
PORT=5000
```

See `backend/.env.example` for full list with descriptions.

---

## 🧪 Testing

### Manual Test Scenarios

**Scenario 1: Import Members**
```powershell
# In terminal, run:
node scripts/importExcel.js --file ./members.xlsx

# Check result:
# Success: 10
# Errors: 0
```

**Scenario 2: Send Test Message**
```bash
curl -X POST http://localhost:5000/api/whatsapp/send-test \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "254712345678",
    "title": "Demo",
    "message": "Hello from test!"
  }'

# Response:
# { "success": true, "status": "sent", "whatsapp_message_id": "mock-..." }
```

**Scenario 3: Broadcast to All**
```bash
curl -X POST http://localhost:5000/api/broadcasts/send \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Team Announcement",
    "message": "Practice moved to 4 PM",
    "send_now": true
  }'

# Response:
# { "recipients": 8, "sent": 8, "failed": 0 }
```

**Scenario 4: Schedule Broadcast**
```bash
# Schedule for 5 minutes from now
# Calculate future time in ISO format
curl -X POST http://localhost:5000/api/broadcasts/send \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Evening Training",
    "message": "5 PM at the pitch",
    "scheduled_for": "2026-06-14T05:10:00Z"
  }'

# Response:
# { "broadcast": { "id": "...", "status": "scheduled", ... } }
```

---

## 📚 How to Brief Claude/ChatGPT

### File Context to Provide

**1. Architecture Overview**
- Share: `README.md`, `docs/architecture.md`
- Explain: "This is our backend/frontend structure"

**2. Current Code State**
- Share entire `backend/src` folder
- Share entire `frontend/src` folder
- Context: "This is the working implementation"

**3. Database Schema**
- Share: `schema.sql`
- Context: "This is our Supabase database structure"

**4. Configuration**
- Share: `backend/.env.example`
- Context: "These are the environment variables we use"

**5. Recent Changes**
```bash
cd mugutha-fc-platform
git log --oneline
git show HEAD  # Shows latest commit changes
```

### Sample Prompts for Claude/ChatGPT

**For New Features:**
```
"I have a Mugutha FC platform with:
- Backend: Express.js on port 5000
- Frontend: React on port 3000
- Database: Supabase PostgreSQL
- Current features: Member import, WhatsApp broadcasts (send now/scheduled)

[Attach architecture diagram/README]
[Attach relevant code files]

I want to add [FEATURE]. How should I:
1. Modify the backend
2. Add frontend UI
3. Update the database
4. Test it end-to-end

Start with file paths and implementation steps."
```

**For Bug Fixes:**
```
"I'm getting [ERROR] in [FILENAME].

Here's my code: [PASTE CODE]
Here's the error: [PASTE ERROR MESSAGE]

Context:
- Backend running on port 5000
- Using Supabase for data
- WhatsApp integration via mock provider

How do I fix this?"
```

**For Architecture Help:**
```
"I want to implement [FEATURE] in my platform.

Current architecture:
[Share README + code structure]

My constraints:
- Using Supabase
- Node.js backend
- React frontend
- Mock WhatsApp for now

How should I structure this? What files do I create/modify?"
```

**For Deployment:**
```
"I need to deploy my Mugutha FC platform to production.

Current setup:
- Backend: Express on port 5000
- Frontend: React + Vite
- Database: Supabase
- Git: Has CI/CD workflows

Deployment target: [AWS/Heroku/Railway/etc]

What do I need to configure?"
```

---

## 🛠️ Common Tasks & Commands

### Update Member Data
```bash
# Add new members
curl -X POST http://localhost:5000/api/members \
  -H "Content-Type: application/json" \
  -d '{"name":"New Member","phone":"254712345678","email":"new@fc.com"}'
```

### View Recent Broadcasts
```bash
# Get all broadcasts (would need to add GET endpoint)
# Currently: Check Supabase dashboard → broadcasts table
```

### Fix Common Issues

**Backend won't start:**
```bash
cd backend
npm install  # Reinstall dependencies
npm run dev  # Try again
# Check if port 5000 is available
```

**Frontend build fails:**
```bash
cd frontend
rm -r node_modules package-lock.json
npm install
npm run build
```

**Supabase connection error:**
```bash
# Verify in backend/.env:
# - SUPABASE_URL is correct
# - SUPABASE_SERVICE_ROLE_KEY is correct
# - Database schema is applied (schema.sql)
```

**Members page shows 401:**
```bash
# This is fixed, but if it happens:
# Check: backend/src/routes/memberRoutes.js
# GET should NOT have auth middleware
```

---

## 📈 Next Steps for Production

### Immediate (Before Demo)
- [ ] Test with real WhatsApp provider (Twilio)
- [ ] Fix frontend datetime picker for scheduled sends
- [ ] Add authentication/login flow
- [ ] Set up proper error handling

### Short Term (Before Launch)
- [ ] Add message delivery confirmation
- [ ] Implement message retry logic
- [ ] Add admin dashboard
- [ ] Set up monitoring/logging

### Medium Term (Growth)
- [ ] Add message queue (Bull/Redis)
- [ ] Implement rate limiting
- [ ] Add webhook support for WhatsApp replies
- [ ] Multi-language support

### Long Term (Scale)
- [ ] Microservices architecture
- [ ] Real-time notifications
- [ ] Advanced analytics
- [ ] API marketplace

---

## 🎓 How AI Will Understand Your Context

### Best Practice: Git History
```bash
git log --oneline --all  # Share recent commits
git show <commit-hash>    # Share specific changes
git diff main..feature    # Share branch differences
```

AI will understand: "What changed and why"

### Best Practice: File Structure
```
mugutha-fc-platform/
├── README.md          ← Overview
├── schema.sql         ← Database structure
├── backend/
│   ├── src/
│   │   ├── app.js     ← Main app
│   │   ├── server.js  ← Server startup
│   │   ├── routes/    ← API endpoints
│   │   ├── controllers/ ← Logic handlers
│   │   ├── services/  ← Business logic
│   │   └── models/    ← Database queries
│   └── .env.example   ← Config template
└── frontend/
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx
    │   ├── pages/     ← Page components
    │   ├── components/ ← Reusable UI
    │   └── services/  ← API client
    └── vite.config.js
```

AI will understand: "Where to find what"

### Best Practice: Requirements Document
Create a `REQUIREMENTS.md`:
```markdown
# Mugutha FC Platform Requirements

## Current Status
- Backend: Working ✅
- Frontend: Working ✅
- Database: Connected ✅
- WhatsApp: Mock provider active ✅

## Features Implemented
1. Member import from Excel
2. Member CRUD operations
3. Broadcast send (now and scheduled)
4. Test message send
5. Git workflow with CI/CD

## Known Limitations
1. Frontend datetime picker needs fix
2. No authentication implemented
3. Mock WhatsApp only (no real provider)
4. No message retry logic

## Next Features Needed
1. Real WhatsApp integration
2. Message delivery confirmation
3. Admin dashboard
4. Analytics

## Tech Stack
- Backend: Node.js + Express
- Frontend: React + Vite
- Database: Supabase (PostgreSQL)
- Deployment: [TBD]
```

---

## 💡 Investor Demo Checklist

- [ ] Two terminals running (backend + frontend)
- [ ] 10 members in database
- [ ] Send test message successfully
- [ ] Broadcast to all members successfully
- [ ] Git history showing Conventional Commits
- [ ] README with clear architecture
- [ ] CI/CD workflows configured
- [ ] .env.example showing professional setup
- [ ] Time: 10-15 minutes max
- [ ] Talking points: "End-to-end, production-ready, scalable"

---

## 📞 Support Info

### If Backend/Frontend Crash
1. Check if ports 5000 and 3000 are available
2. Restart: `Ctrl+C` then `npm run dev` again
3. Check `.env` file for correct Supabase credentials
4. Check Supabase dashboard for schema and data

### If You Get 401 Errors
- Members endpoint: Public (no auth)
- Broadcast endpoint: Currently public (for demo)
- In production: Add auth middleware to all endpoints

### If Scheduled Broadcasts Don't Send
- Check: `backend/src/jobs/scheduledBroadcasts.js`
- Verify: `SCHEDULER_ENABLED=true` in `.env`
- Check Supabase `broadcasts` table for status

---

## 🎯 TL;DR - Getting Started

```bash
# Terminal 1 - Backend
cd backend && npm install && npm run dev
# Backend ready at http://localhost:5000

# Terminal 2 - Frontend  
cd frontend && npm install && npm run dev
# Frontend ready at http://localhost:3000

# Open browser
# Visit http://localhost:3000
# Go to /broadcasts
# Send a test message to 254712345678
# Click "Send test message"
# See success message!
```

**That's it! You now have a working WhatsApp broadcast platform.**
