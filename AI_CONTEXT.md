# Context for Claude/ChatGPT - Mugutha FC Platform

**Use this file to brief AI assistants about our project.**

---

## Project Overview

**Name:** Mugutha FC Platform  
**Purpose:** Member management + WhatsApp broadcast system  
**Status:** MVP working, ready for production setup  
**Tech Stack:** Node.js, Express, React, Vite, Supabase, WhatsApp API  

---

## Current Architecture

### Backend (Node.js + Express)
- **Port:** 5000
- **Entry:** `backend/src/server.js`
- **Structure:**
  - `routes/` - REST API endpoints
  - `controllers/` - Request handlers
  - `services/` - Business logic
  - `models/` - Database queries
  - `config/` - Environment and external service config
  - `middleware/` - Auth, error handling
  - `jobs/` - Scheduled tasks (cron)

### Frontend (React + Vite)
- **Port:** 3000
- **Entry:** `frontend/src/main.jsx`
- **Structure:**
  - `pages/` - Full pages (Dashboard, Members, Broadcasts, Login)
  - `components/` - Reusable UI (BroadcastForm, MemberTable, etc.)
  - `services/` - API client (axios)
  - `context/` - State management (AuthContext)
  - `lib/` - Utilities (supabaseClient)

### Database (Supabase)
- **Type:** PostgreSQL
- **Auth:** Service role key (backend), Anon key (frontend)
- **Tables:**
  - `members` - id, name, phone, email, join_date, membership_status
  - `broadcasts` - id, title, message, status, scheduled_for, sent_at, created_at
  - `messages` - id, recipient_id, message_id, status, sent_at

---

## API Endpoints

### Members
```
GET    /api/members              → List all members (public, no auth)
POST   /api/members              → Create member (needs auth)
GET    /api/members/:id          → Get one member (needs auth)
PUT    /api/members/:id          → Update member (needs auth)
DELETE /api/members/:id          → Delete member (needs auth)
```

### Broadcasts
```
POST /api/broadcasts/send
  Payload: {
    title: string,
    message: string,
    send_now?: boolean,           // Immediate send
    scheduled_for?: "ISO datetime" // Scheduled send
  }
  Returns: { recipients: number, sent: number, failed: number }
```

### WhatsApp
```
POST /api/whatsapp/send-test
  Payload: {
    phone: "254712345678",
    title?: string,
    message: string
  }
  Returns: { success: boolean, status: string, whatsapp_message_id: string }
```

### Internal (Mock Provider)
```
POST /internal/mock-whatsapp
  Payload: { to: string, message: string, delay?: number }
  Returns: { id: string, to: string, status: "queued" }
  Purpose: Simulates WhatsApp API for testing without real credentials
```

---

## Data Flow Examples

### Scenario 1: Send Test Message
```
Frontend: User fills form (phone, message)
    ↓
API Call: POST /api/whatsapp/send-test
    ↓
Controller: whatsappController.sendTest()
    ↓
Service: whatsappService.sendMessage(phone, message)
    ↓
Decision: Is WHATSAPP_PROVIDER = "mock"?
    ↓
If Mock: POST to /internal/mock-whatsapp (2s delay simulated)
    ↓
If Real: POST to Twilio/provider API
    ↓
Service: Save message to `messages` table
    ↓
Response: { success: true, status: "sent", whatsapp_message_id: "..." }
    ↓
Frontend: Display success message
```

### Scenario 2: Broadcast to All Members
```
Frontend: User fills form (title, message) → Click "Send now to all members"
    ↓
API Call: POST /api/broadcasts/send { title, message, send_now: true }
    ↓
Controller: broadcastController.sendBroadcast()
    ↓
Service: broadcastService.sendBroadcastToMembers()
    ↓
Query: Get all members from `members` table
    ↓
Loop: For each member, call whatsappService.sendMessage()
    ↓
For Each Member:
  - Build WhatsApp payload
  - Send to provider (mock or real)
  - Log to `messages` table
    ↓
Response: { recipients: 8, sent: 8, failed: 0 }
    ↓
Frontend: Display "Broadcast sent to 8 members (8 delivered, 0 failed)"
```

### Scenario 3: Schedule Broadcast
```
Frontend: User fills form → Click "Schedule broadcast"
    ↓
API Call: POST /api/broadcasts/send { title, message, scheduled_for: "2026-06-14T05:10:00Z" }
    ↓
Service: Create broadcast record with status: "scheduled"
    ↓
Cron Job: Runs every minute (src/jobs/scheduledBroadcasts.js)
    ↓
When scheduled_for <= now:
  - Get broadcast
  - Call sendBroadcastToMembers()
  - Update status to "sent"
  - Set sent_at timestamp
    ↓
Result: Message sent to all members at exact scheduled time
```

---

## Environment Setup

### Required Variables (backend/.env)

**Supabase (REQUIRED)**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_actual_key
SUPABASE_ANON_KEY=your_anon_key
```

**WhatsApp Provider (Set to mock for demo)**
```
WHATSAPP_PROVIDER=mock                                    # or "twilio"
WHATSAPP_API_URL=http://localhost:5000/internal/mock-whatsapp
WHATSAPP_API_TOKEN=your_token_here
WHATSAPP_FROM_NUMBER=+254712345678
MOCK_WHATSAPP_DELAY_MS=2000                              # Simulate network delay
```

**Server**
```
PORT=5000
SCHEDULER_ENABLED=true
```

See `backend/.env.example` for full list with descriptions.

---

## Key Implementation Details

### Phone Number Normalization
- Location: `backend/src/utils/formatPhone.js`
- Logic: Converts to +254 format (Kenya)
- Example: "0712345678" → "254712345678"

### Message Persistence
- Location: `backend/src/services/whatsappService.js`
- Saves every message sent to `messages` table
- Tracks: recipient_id, message_id, status, sent_at

### Scheduled Broadcasts
- Location: `backend/src/jobs/scheduledBroadcasts.js`
- Cron: Runs every minute
- Logic: Find broadcasts with scheduled_for <= now and status != "sent"
- Sends to all members, then marks as sent

### Mock WhatsApp Provider
- Location: `backend/src/routes/internalRoutes.js`
- Simulates: Real WhatsApp provider behavior
- Delay: Configurable via MOCK_WHATSAPP_DELAY_MS (default 2000ms)
- Response: Returns mock message ID (format: "mock-<timestamp>")
- Purpose: Local testing without real credentials/costs

---

## Current Test Data

**10 Members Imported**
- Source: `members.xlsx` (10 rows)
- Status: All active
- Sample: John Kipchoge (254712345678), Faith Kimaiyo (254723456789), etc.

**Broadcasts Sent**
- "Morning Match Reminder" → 8 delivered
- "API Scheduled Broadcast" → Scheduled for future
- All messages logged in `messages` table

---

## Git History

```
e1fbbe7 fix: react key warning, add env example, and ci/cd workflows
  - Fix React key prop in MemberTable (use id instead of _id)
  - Create backend/.env.example with documented config
  - Add GitHub Actions CI/CD workflows

3c6221b feat: fix members endpoint auth and broadcast form state management
  - Allow public GET access to /api/members (no auth for demo)
  - Separate state variables in BroadcastForm (fix cross-field pollution)
  - Verify broadcast-to-all working (8/8 delivered)
```

---

## Frontend Pages & Routes

| Route | Component | Features |
|-------|-----------|----------|
| `/` | Dashboard | Stats card (member count) |
| `/members` | Members page | Table with all members, no auth |
| `/broadcasts` | Broadcasts page | Send test message, broadcast to all, schedule |
| `/login` | Login page | Auth form (not yet integrated) |

**Key Component: BroadcastForm** (`frontend/src/components/BroadcastForm.jsx`)
- Separate state for broadcast section and test message section
- Form validation (requires title + message for broadcast)
- API calls to backend with error handling
- Success/error feedback messages

---

## Known Limitations & Considerations

1. **Authentication**: Currently public endpoints for demo. Add auth middleware in production.
2. **WhatsApp Provider**: Using mock locally. Needs real provider (Twilio, etc.) for production.
3. **Frontend DateTime**: Form datetime picker has issues. Use API directly for scheduling.
4. **Message Retries**: No automatic retry logic. Consider adding with exponential backoff.
5. **Rate Limiting**: Not implemented. Add before public launch.
6. **Message Queue**: Broadcasts currently synchronous. Consider Bull/Redis for large broadcasts.

---

## File-by-File Summary

### Backend Key Files

**Config**
- `src/config/env.js` - Load environment variables
- `src/config/supabase.js` - Initialize Supabase client
- `src/config/whatsapp.js` - WhatsApp provider config

**Routes**
- `src/routes/memberRoutes.js` - GET /api/members (public)
- `src/routes/broadcastRoutes.js` - POST /api/broadcasts/send
- `src/routes/whatsappRoutes.js` - POST /api/whatsapp/send-test
- `src/routes/internalRoutes.js` - Mock provider at /internal/mock-whatsapp

**Controllers**
- `src/controllers/memberController.js` - CRUD operations
- `src/controllers/broadcastController.js` - Send broadcasts
- `src/controllers/whatsappController.js` - Test send handler

**Services**
- `src/services/whatsappService.js` - Send message, build payload, persist
- `src/services/broadcastService.js` - Send to all members
- `src/services/schedulerService.js` - Schedule cron jobs

**Models**
- `src/models/supabaseQueries.js` - All database queries

**Jobs**
- `src/jobs/scheduledBroadcasts.js` - Cron job for scheduled sends

### Frontend Key Files

**Pages**
- `src/pages/Dashboard.jsx` - Home page with stats
- `src/pages/Members.jsx` - Member list
- `src/pages/Broadcasts.jsx` - Broadcast form
- `src/pages/Login.jsx` - Auth form

**Components**
- `src/components/BroadcastForm.jsx` - Main form (test send + broadcast)
- `src/components/MemberTable.jsx` - Member list table
- `src/components/Navbar.jsx` - Navigation
- `src/components/Sidebar.jsx` - Sidebar menu

**Services**
- `src/services/api.js` - Axios client (baseURL: http://localhost:5000/api)

---

## How to Debug

### Backend Issues
1. Check `npm run dev` output for errors
2. Check browser DevTools → Network tab for API responses
3. Check Supabase dashboard → Data tab for records
4. Add `console.log()` in services to trace execution

### Frontend Issues
1. Check browser DevTools → Console for JavaScript errors
2. Check Network tab for API response status
3. Check state in React DevTools extension
4. Test API endpoints directly with curl/Postman

### Database Issues
1. Go to Supabase dashboard → SQL Editor
2. Check tables exist: `SELECT * FROM members;`
3. Check data: `SELECT * FROM broadcasts ORDER BY created_at DESC;`
4. Run schema: Copy `schema.sql` into SQL Editor and execute

---

## Production Checklist

- [ ] Replace WHATSAPP_PROVIDER with real provider
- [ ] Add authentication middleware to protected routes
- [ ] Set up .env with production secrets
- [ ] Run database backups
- [ ] Add error logging/monitoring
- [ ] Set up HTTPS/TLS
- [ ] Configure CORS properly
- [ ] Add rate limiting
- [ ] Test with real WhatsApp numbers
- [ ] Create admin dashboard for monitoring
- [ ] Set up message retry logic
- [ ] Deploy to production hosting

---

## How to Ask for Help

**When sharing with AI:**

1. **Share this entire file** - Gives full context
2. **Share relevant code** - The specific files being modified
3. **Describe the problem** - What you want to add or fix
4. **Include error messages** - Exact error output
5. **Specify constraints** - "Must work with Supabase", "No external dependencies", etc.

**Example prompt:**

```
I have a Mugutha FC platform (see context below).
I want to add [FEATURE].
Currently, [WHAT DOESN'T WORK].
Error: [ERROR MESSAGE].

[Paste context file]

How do I:
1. Modify backend files
2. Update frontend
3. Handle in database
```

---

## Quick Commands Reference

```bash
# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev

# Import members
node scripts/importExcel.js --file ./members.xlsx

# Check Supabase schema
node scripts/checkSupabaseSchema.js

# Git operations
git log --oneline
git add . && git commit -m "feat: your feature"
git push origin main

# Test API endpoints
curl -X POST http://localhost:5000/api/whatsapp/send-test \
  -H "Content-Type: application/json" \
  -d '{"phone":"254712345678","message":"test"}'
```

---

**End of context file. Everything needed to understand Mugutha FC Platform is above.**
