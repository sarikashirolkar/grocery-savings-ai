# Grocery Savings AI

Grocery Savings AI is a full-stack grocery planning application that turns receipt history into a predicted shopping basket, compares live store pricing, and helps households reduce spend without losing visibility into budget, substitutions, and monthly savings.

The project includes:

- Receipt ingestion with stored uploads, OCR support, and optional Claude-based line-item extraction
- Purchase pattern analysis and next-basket prediction
- Store-by-store price comparison and recommendation scoring
- Budget tracking, savings reporting, price alerts, and prediction-accuracy feedback
- CSV export for savings reports and buy plans
- Demo region switching for India and Australia datasets

## Stack

### Frontend

- Next.js 14
- TypeScript
- Tailwind CSS
- TanStack Query
- React Hook Form
- Recharts

### Backend

- FastAPI
- SQLAlchemy 2
- Alembic
- Pydantic Settings
- JWT auth with `httpOnly` cookie support
- SQLite by default, PostgreSQL-ready via `DATABASE_URL`
- Optional Anthropic integration for LLM extraction

## Repository Layout

```text
backend/                 FastAPI app, database models, services, tests, Alembic
frontend/                Next.js app
demo_synthetic_data.json Seed/demo dataset source
front/                   Uploaded design/prototype bundle used as a design reference
```

## Current Product Capabilities

### Receipt ingestion

- Manual receipt entry
- Image, PDF, and text receipt upload
- Stored receipt files for audit and re-processing
- OCR pipeline with validation for size and content type
- Optional Claude-powered line-item extraction when `ANTHROPIC_API_KEY` is configured

### Shopping workflow

- Predicted basket generation from receipt history
- Item-level store comparison across seeded store prices
- Cheapest-plan and single-store bulk actions
- Budget progress and over-budget warnings
- Substitution suggestions when a cheaper equivalent category match is available

### Analytics

- Monthly savings trend
- Category spend
- Store-wise spend
- Top savings opportunities
- Savings leaderboard
- Prediction accuracy against completed months
- Price-drop and availability notifications

### Export

- Buy plan CSV export
- Monthly savings report CSV export

## Security and Runtime Notes

- In non-debug mode, `SECRET_KEY` is required at startup.
- CORS is restricted to configured frontend origins.
- Browser auth now uses an `httpOnly` cookie. Bearer tokens are still accepted for API clients and tests.
- Alembic is the migration path. The app no longer drops and recreates tables on startup.

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and adjust values as needed.

Important variables:

```bash
APP_NAME=Grocery Savings AI API
DEBUG=true
SECRET_KEY=replace-this-with-a-real-secret
DATABASE_URL=sqlite:///./grocery_savings.db
DEMO_REGION=india
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
MAX_UPLOAD_SIZE_BYTES=10485760
RECEIPT_UPLOAD_DIR=./storage/receipts
ANTHROPIC_API_KEY=
RECEIPT_EXTRACTION_MODEL=claude-opus-4-8
```

Notes:

- `ANTHROPIC_API_KEY` is optional. Without it, the app falls back to the local parser.
- For production or shared environments, set `DEBUG=false`, configure a real `SECRET_KEY`, and use explicit `CORS_ORIGINS`.

## Local Development

### Backend

```bash
cd backend
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

The backend runs on `http://127.0.0.1:8000`.

### Frontend

```bash
cd frontend
npm install
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000 npm run dev
```

The frontend runs on `http://localhost:3000`.

## Demo Account

- Email: `demo@grocerysavings.ai`
- Password: `Demo@12345`

## Tests and Build

### Backend tests

```bash
cd backend
./.venv/bin/pytest -q
```

### Frontend production build

```bash
cd frontend
npm run build
```

## API Surface Overview

Main route groups:

- `/auth` - login, logout, current user
- `/receipts` - upload, preview, list, update, delete
- `/patterns` - purchase-pattern analysis
- `/prediction` - predicted basket generation
- `/prices` - search and comparison
- `/recommendations` - savings recommendation generation
- `/shopping` - active buy plan, store selection, exports
- `/dashboard` - summary, savings trends, leaderboard, report export
- `/demo` - active seeded region switching

## Design Notes

The active frontend design uses the uploaded `front/` prototype bundle as a reference and maps that visual system onto the production Next.js application instead of serving the prototype directly.

## Known Gaps

The current codebase still has room for follow-on work:

- Pantry and depletion-based timing
- Multi-user household collaboration
- PDF export
- Richer historical model versioning and retraining workflow
- Full production cookie/session hardening across all deployment environments
