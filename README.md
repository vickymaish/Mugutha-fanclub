# Mugutha FC Platform

Full-stack member management and WhatsApp broadcast platform for Mugutha FC. Built with Node.js (backend), React (frontend), and Supabase (database).

## Quick Start

### Prerequisites
- Node.js 18+ (tested on v24.x)
- Supabase account with API key & service role key
- Database schema applied (see [schema.sql](./schema.sql))

### Setup Backend
```bash
cd backend
npm install
cp .env.example .env  # or use provided .env with demo defaults
npm run dev
```

Backend runs on `http://localhost:5000`.

### Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` (Vite default).

## Demo: Local Testing with Mock WhatsApp

The backend includes a mock WhatsApp provider for local testing without real credentials.

### Configuration
In `backend/.env`, set:
```
WHATSAPP_PROVIDER=mock
WHATSAPP_API_URL=http://localhost:5000/internal/mock-whatsapp
MOCK_WHATSAPP_DELAY_MS=2000
```

### Test Send
Send a message via the Broadcasts page UI (http://localhost:5173/broadcasts) or via curl:
```bash
curl -X POST http://localhost:5000/api/whatsapp/send-test \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "254712345678",
    "message": "Hello from demo",
    "title": "Test"
  }'
```

Expected response:
```json
{
  "success": true,
  "status": "sent",
  "whatsapp_message_id": "mock-1234567890"
}
```

## Member Import

Import members from Excel or CSV:
```bash
node scripts/importExcel.js --file ./members.xlsx
```

The script will:
- Normalize phone numbers (Kenyan format)
- Validate Supabase schema
- Insert records into the `members` table
- Output success/error counts

## Architecture

- **Backend** (`backend/src`):
  - Express server on port 5000
  - Routes: `/api/members`, `/api/broadcasts`, `/api/whatsapp`, `/internal` (mock)
  - Services: WhatsApp send, broadcasts, scheduler
  - Database: Supabase (PostgreSQL)
  
- **Frontend** (`frontend/src`):
  - React + Vite on port 5173
  - Pages: Dashboard, Members, Broadcasts, Login
  - Supabase real-time client

- **Scripts** (`scripts/`):
  - `importExcel.js` - bulk member import
  - `seedMembers.js` - seed sample data
  - `checkSupabaseSchema.js` - validate DB structure

## Git Workflow

We use Conventional Commits. Use the commit helper:

**PowerShell:**
```powershell
.\git-commit.ps1 -Type feat -Scope api
```

**Bash/Git Bash:**
```bash
./git-commit.sh feat api
```

Follow the prompts to write your commit message.

Examples:
- `feat: add mock WhatsApp provider`
- `fix: normalize phone numbers in import`
- `docs: update setup guide`

## Environment Variables

See `backend/.env` for all available settings:
- `PORT` - server port (default: 5000)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` - database
- `WHATSAPP_PROVIDER` - provider type (`mock`, `twilio`, etc.)
- `WHATSAPP_API_URL`, `WHATSAPP_API_TOKEN` - provider credentials
- `MOCK_WHATSAPP_DELAY_MS` - simulated network delay (demo only)

## Next Steps

1. **Real Provider Setup** - Replace mock with actual WhatsApp provider (Twilio, etc.)
2. **Authentication** - Enable API key auth or JWT
3. **Scalability** - Add message queue (Bull/Redis) for large broadcasts
4. **Tests** - Add unit and integration tests

For more details, see [CONTRIBUTING.md](./CONTRIBUTING.md) and [docs/](./docs/).
