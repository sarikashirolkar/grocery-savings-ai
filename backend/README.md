# Grocery Savings AI Backend

## Run

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python -m app.bootstrap migrate
python -m app.bootstrap seed-demo --force
uvicorn app.main:app --reload
```

Demo credentials:

- Email: `demo@grocerysavings.ai`
- Password: `Demo@12345`

By default the app no longer migrates or seeds implicitly on startup. Use the bootstrap commands above, or opt back into startup behavior with:

```bash
RUN_MIGRATIONS_ON_STARTUP=true
SEED_DEMO_ON_STARTUP=true
```

By default it uses `sqlite:///./grocery_savings.db`. Set `DATABASE_URL` to a PostgreSQL URL when you want to switch to Postgres.
