# TalentFlow TypeScript Service

NestJS backend service for candidate document upload and AI-powered summary generation.

## Features

- **Candidate Document Upload** — Upload resumes and other documents for a candidate
- **AI Summary Generation** — Async summarization using Gemini (or a fake provider for local dev)
- **Queue-based Workflow** — Summary jobs are enqueued and processed by a background worker
- **Workspace-scoped Access Control** — All endpoints enforce workspace isolation
- **TypeORM + PostgreSQL** — Migrations, entities, and relationships

## Prerequisites

- Node.js 22+
- npm
- PostgreSQL running from repository root:

```bash
docker compose up -d postgres
```

## Setup

```bash
cd ts-service
npm install
cp .env.example .env
```

Edit `.env` and set your values:

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: `3000`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `NODE_ENV` | `development` or `production` |
| `GEMINI_API_KEY` | Google Gemini API key (optional — leave blank to use fake provider) |

> **Note:** Get a free Gemini API key at [Google AI Studio](https://aistudio.google.com/apikey). If left blank, the service uses a `FakeSummarizationProvider` that returns deterministic mock responses.

Do not commit API keys or secrets.

## Run Migrations

```bash
npm run migration:run
```

## Run Service

```bash
npm run start:dev
```

## Run Tests

```bash
npm test
```

## API Endpoints

All endpoints require these headers:

| Header | Description |
|--------|-------------|
| `x-user-id` | Any non-empty string (e.g. `user-1`) |
| `x-workspace-id` | Workspace ID used for access scoping |

### Upload Document

```
POST /candidates/:candidateId/documents
```

**Body:**
```json
{
  "documentType": "resume",
  "fileName": "resume.pdf",
  "storageKey": "uploads/resume.pdf",
  "rawText": "Extracted text content of the document..."
}
```

### Generate Summary (Async)

```
POST /candidates/:candidateId/summaries/generate
```

Returns `202 Accepted` with a `summaryId`. The summary is generated asynchronously by a background worker polling every 5 seconds.

**Response:**
```json
{
  "message": "Summary generation queued",
  "summaryId": "uuid"
}
```

### List Summaries

```
GET /candidates/:candidateId/summaries
```

Returns all summaries for the candidate, ordered by most recent.

### Get Summary

```
GET /candidates/:candidateId/summaries/:summaryId
```

Returns a single summary with its status (`pending`, `completed`, or `failed`), score, strengths, concerns, recommended decision, and metadata.

## Architecture

```
src/
├── auth/           Fake auth guard, user decorator, auth types
├── candidate/      Controller, service, worker, DTOs, unit tests
├── config/         TypeORM configuration
├── entities/       TypeORM entities (candidates, documents, summaries)
├── health/         Health check endpoint
├── llm/            Summarization provider interface + Gemini/Fake implementations
├── migrations/     TypeORM migration files
├── queue/          In-memory queue abstraction
└── sample/         Example module (workspace/candidate CRUD)
```

### Async Summary Flow

1. `POST .../summaries/generate` → creates a `pending` summary record and enqueues a job
2. `SummaryWorker` polls the queue every 5s, dequeues the job
3. Worker fetches candidate documents, calls the LLM provider
4. Summary record is updated to `completed` (with results) or `failed` (with error message)
