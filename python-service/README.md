# Python Service (Part A) - Mini Briefing Report Generator

FastAPI backend service for generating briefing reports, built over the InsightOps starter project.

## 1. Public GitHub Repository
[Link to Repository (Placeholder)](#)

## 2. Setup Instructions & Running the Service

### Prerequisites
- Docker
- Python 3.12

### Start PostgreSQL Database
From the repository root, start the shared Postgres container:
```bash
docker compose up -d postgres
```
*(Runs on `localhost:5432` with user `assessment_user`, password `assessment_pass`, db `assessment_db`)*

### Setup Python Environment
```bash
cd python-service
python3.12 -m venv .venv
# On Windows: .\.venv\Scripts\activate
# On Unix/macOS: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

### Run Migrations
Apply the database schemas for briefings, key points, risks, and metrics:
```bash
python -m app.db.run_migrations up
```

### Run Service
Start the FastAPI server:
```bash
python -m uvicorn app.main:app --reload --port 8000
```
The API will be available at `http://localhost:8000/briefings`.

### Run Tests
Tests utilize an in-memory SQLite database and test the full API flow.
```bash
python -m pytest tests/
```

### Assumptions and Tradeoffs
- **HTML Rendering**: Assumed that basic inline/internal CSS was sufficient for the HTML report generation without needing an external asset pipeline.
- **SQLite vs Postgres**: Set up a SQLite mock for `gen_random_uuid()` in tests to allow fast test execution without requiring a live Postgres instance for CI/CD checks.

## 3. Notes
See [NOTES.md](./NOTES.md) for design decisions, schema decisions, and future improvements.
