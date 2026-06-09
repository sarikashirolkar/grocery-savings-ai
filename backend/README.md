# Grocery Savings AI Backend

## Run

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Demo credentials:

- Email: `demo@grocerysavings.ai`
- Password: `Demo@12345`

The app seeds synthetic demo data on startup. By default it uses `sqlite:///./grocery_savings.db`.
Set `DATABASE_URL` to a PostgreSQL URL when you want to switch to Postgres.
