Contributing and demo notes

Git workflow and commit message conventions
- Use a feature branch per change: `git checkout -b feat/<short-description>` or `git checkout -b fix/<short-description>`
- Commit messages should follow Conventional Commits style. Examples:
  - `feat: add mock WhatsApp provider and demo route`
  - `fix: use backend node_modules for import script dependency resolution`
  - `chore: add contributing and demo docs`

Commit message format (one-line):
<type>(<scope>): <short summary>

Types we use:
- feat: new feature
- fix: bug fix
- docs: documentation only changes
- chore: tooling, build, or dependency changes
- refactor: code change that neither fixes a bug nor adds a feature
- test: adding or updating tests

Example commands
- Stage and commit:

```bash
git add .
git commit -m "feat: add mock WhatsApp endpoint for demo"
```

- Push a branch and open a PR:

```bash
git push origin HEAD
```

Demo: running the local backend with mock WhatsApp provider
1. Configure demo env (already present in `backend/.env`):
   - `WHATSAPP_PROVIDER=mock`
   - `WHATSAPP_API_URL=http://localhost:5000/internal/mock-whatsapp`
   - `MOCK_WHATSAPP_DELAY_MS=2000`
2. Start the backend (from `backend/`):

```powershell
cd backend
npm install
npm run dev
```

3. Open the frontend (from `frontend/`):

```powershell
cd frontend
npm install
npm run dev
```

4. Use the Broadcasts page or POST to `POST /api/whatsapp/send-test` to test sending messages. The mock endpoint will simulate delay and return a fake message id.

Notes
- The demo mock provider is intended for local testing only. For production or integration testing, configure a real WhatsApp provider and credentials in `backend/.env`.
- Keep commits small and descriptive; use `feat:` for features and `fix:` for bug fixes to make history easier to scan.
