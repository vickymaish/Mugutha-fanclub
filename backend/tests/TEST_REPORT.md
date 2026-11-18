# Backend Test Report

## Results

- Passing: 33
- Skipped: 0
- Failing: 0

## Issue fixed

- **File/function:** `src/services/matchAlertService.js`, `getFixture`; `src/controllers/fixtureController.js`, `previewFixtureAlert` and `sendFixtureAlert`.
- **Change:** UUID-formatted fixture IDs that do not exist now return HTTP 404 with `{"error":"Fixture not found"}` for both alert preview and send. IDs that are not UUID-formatted return HTTP 400 with `{"error":"Invalid fixture id"}`.
- **Coverage:** Supertest tests exercise missing and malformed IDs for both routes.

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
