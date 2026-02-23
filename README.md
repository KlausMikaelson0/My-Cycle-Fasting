# My Cycle & Fasting / دورتي وصيامي

Complete full-stack prototype for menstrual cycle tracking + Ramadan/Qada fasting tracking with bilingual UI (Arabic/English), RTL/LTR support, location settings, and prayer-time-aware fasting validity logic.

## Stack

- **Frontend:** React + Vite + TypeScript (`frontend/`)
- **Backend:** Node.js + Express + TypeScript (`backend/`)
- **Database:** MongoDB + Mongoose
- **Auth:** Email/password + JWT
- **Shared types:** `shared/types.ts`

## Core Features

- User registration/login with hashed passwords.
- User settings:
  - language (`ar` / `en`)
  - location mode (`gps` / `manual city`)
- Period tracking:
  - create/edit/delete periods
  - period summary endpoint with average cycle length + next expected period
- Fasting tracking:
  - create/update/delete fasting records
  - Ramadan/Qada summary with:
    - `ramadanDaysFasted`
    - `missedDaysInRamadan`
    - `qadaDaysDone`
    - `remainingQada`
  - `isFastValid` logic based on period-start time compared to Fajr/Maghrib
- Prayer times service:
  - auto-fills Fajr/Maghrib when location is available
  - currently stubbed with TODO for real external API integration
- Frontend pages:
  - first-time language selection
  - login/register
  - home dashboard (period + fasting cards)
  - monthly calendar with color rules
  - settings (language/location + calculation explanation)

## Color System

- Active period days: **dark red**
- Predicted period days: **light transparent red**
- Confirmed fasting days: **dark green**
- Qada/planned fasting days: **light transparent green**

## Prerequisites

- Node.js 20+ (recommended)
- MongoDB running locally or remotely

## Quick Start (single command from root)

```bash
npm install
npm run dev
```

This starts both:

- backend on `http://localhost:4000`
- frontend on `http://localhost:5173`

If this is your first run, also generate local env files:

```bash
npm run bootstrap
```

## 1) Backend Setup (`backend/`)

```bash
cd backend
npm install
cp .env.example .env
```

Fill `.env` values:

- `MONGODB_URI`
- `JWT_SECRET`
- `FRONTEND_ORIGIN`
- optional `PRAYER_API_URL`

Run backend:

```bash
npm run dev
```

Backend runs on `http://localhost:4000` by default.

## 2) Frontend Setup (`frontend/`)

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs on `http://localhost:5173` by default.

## VS Code launch helper

This repo includes:

- `.vscode/tasks.json`
- `.vscode/launch.json`

### Recommended in VS Code

1. Run task: **Setup (install + env)** (first time only)
2. Run task: **Run Full App**
3. Launch config: **Open Frontend (localhost:5173)**

Or directly run launch compound:

- **Run Full Stack + Browser**

Browser target:

- `http://localhost:5173`

Before pressing Run/Debug in VS Code, make sure backend + frontend dev servers are already running.

## MongoDB local check

If backend fails with `ECONNREFUSED 127.0.0.1:27017`, MongoDB is not running.

For Homebrew installations:

```bash
brew services start mongodb/brew/mongodb-community@7.0
brew services list | grep mongo
```

## API Base Path

All API routes are prefixed with:

`/api`

Main route groups:

- `/api/auth`
- `/api/user`
- `/api/periods`
- `/api/fasting`

## Security Basics Implemented

- bcrypt password hashing
- JWT-based route protection
- secrets configured through environment variables
- CORS configured to frontend origin
- no password/token logging

## Notes

- Ramadan day detection in backend currently includes a stub helper (`inferRamadanDay`) and should be replaced with accurate Hijri calendar logic in production.
- Prayer times integration is intentionally stubbed and clearly marked for real provider integration.
- Period creation now prevents creating a new period while another active period is still open.

## Vercel SPA note

If deploying the frontend to Vercel, set project root to `frontend/`.
The `frontend/vercel.json` rewrite routes all paths to `index.html` so browser refresh on nested routes does not return 404.
