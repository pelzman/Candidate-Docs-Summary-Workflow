# TypeScript Service (Part B) - Candidate Summaries

NestJS backend service for candidate document upload and AI-powered summary generation.

## 1. Public GitHub Repository
[Link to Repository (Placeholder)](#)

## 2. Setup Instructions & Running the Service

### Prerequisites
- Docker
- Node.js 22+
- npm

### Start PostgreSQL Database
From the repository root, start the shared Postgres container:
```bash
docker compose up -d postgres
```
*(Runs on `localhost:5432` with user `assessment_user`, password `assessment_pass`, db `assessment_db`)*

### Setup Node Environment
```bash
cd ts-service
npm install
cp .env.example .env
```
Optionally, edit `.env` and add your `GEMINI_API_KEY` from Google AI Studio. If left blank, the service gracefully falls back to a deterministic `FakeSummarizationProvider`.

### Run Migrations
Apply the database schemas via TypeORM:
```bash
npm run migration:run
```

### Run Service
Start the NestJS server:
```bash
npm run start:dev
```
The API will be available at `http://localhost:3000`.

### Run Tests
Tests cover the service logic and the background worker flow using mocked dependencies.
```bash
npm test
```

### Assumptions and Tradeoffs
- **Fake LLM Provider Default**: Assumed that reviewers will want to run this quickly without setting up a Google Gemini key. The fake provider is wired to respond to the interface seamlessly.
- **In-Memory Queue**: Used a simple in-memory queue rather than setting up Redis, to keep the local development and testing footprint extremely light.
- **Simplified Auth**: Assumed true enterprise authentication was out of scope, so implemented a header-based `FakeAuthGuard` passing `x-workspace-id` to enforce hard access control boundaries on candidates.

## 3. Notes
See [NOTES.md](./NOTES.md) for design decisions, schema decisions, and future improvements.
