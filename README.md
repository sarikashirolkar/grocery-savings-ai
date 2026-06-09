# Grocery Savings AI

Full-stack MVP for grocery receipt ingestion, purchase pattern analysis, next-basket prediction, store price comparison, and savings recommendations.

## Stack

- Frontend: Next.js, TypeScript, Tailwind CSS, Recharts, TanStack Query, React Hook Form
- Backend: FastAPI, SQLAlchemy, JWT auth, seedable SQLite or PostgreSQL

## Project Structure

- [backend](/Users/windsofoctober/grocery_proj/backend)
- [frontend](/Users/windsofoctober/grocery_proj/frontend)
- [demo_synthetic_data.json](/Users/windsofoctober/grocery_proj/demo_synthetic_data.json)

## Local Run

Backend:

```bash
cd backend
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Demo login:

- Email: `demo@grocerysavings.ai`
- Password: `Demo@12345`

## Notes

- The backend defaults to SQLite for immediate local testing.
- Set `DATABASE_URL` to a PostgreSQL connection string when you want to run against Postgres.
- The OCR adapter is modular. The current implementation is a placeholder parser for local MVP testing and can be replaced with Tesseract or a cloud OCR provider.
