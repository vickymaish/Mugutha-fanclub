# Backend Test Report

## Results

- Passing: 29
- Skipped: 1
- Failing: 0

## BUG found

- **File/function:** `src/controllers/fixtureController.js`, `previewFixtureAlert` (with the missing-fixture error originating in `src/services/matchAlertService.js`, `getFixture`).
- **What happens:** Requesting an alert preview for an unknown fixture returns HTTP 500. `getFixture` throws the Supabase `PGRST116` error and `previewFixtureAlert` forwards it to the error middleware.
- **What should happen:** Return a client error (preferably 404) for a fixture that does not exist.
- **How to reproduce:** `GET /api/fixtures/unknown/alert-preview` with an authenticated admin in the running API. The isolated Supertest route test reproduces the same status without authentication.
- A test for the expected 4xx is retained as `test.skip` with a `BUG:` description; application behavior was not changed.

## Not tested

- Live Supabase, Daraja/M-Pesa, WhatsApp, geocoding, and cron integrations were not called; those dependencies are mocked to keep the suite offline and key-free.
- The Supertest route checks mount the requested routers directly, so admin authentication itself is not covered.

## Commands

From the repository root on Windows:

```powershell
Set-Location backend
npm test
```

To run one test file:

```powershell
Set-Location backend
npm test -- --runTestsByPath tests/apiRoutes.test.js
```
