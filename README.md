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
