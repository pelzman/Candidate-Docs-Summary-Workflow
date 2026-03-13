# Assessment Notes - TS Service

## Design Decisions
- **Provider Abstraction**: Introduced a `SummarizationProvider` interface. The `SummaryWorker` depends on this interface rather than a concrete implementation. This makes swapping between the live `GeminiProvider` and the local `FakeSummarizationProvider` seamless via dependency injection.
- **Worker/Queue Separation**: Summary generation is decoupled from the HTTP request lifecycle. The API immediately returns a `202 Accepted` after inserting a `pending` summary tracker and enqueuing the background job via `QueueService`. A polling interval in `SummaryWorker` safely picks up and processes these jobs.
- **Access Control via Decorators**: Implemented a `FakeAuthGuard` alongside a custom `@CurrentUser()` decorator. This ensures that controllers receive an `AuthUser` object (which includes a `workspaceId`), passing it directly to the service layer so that every single database query is tightly scoped to the correct workspace boundary.

## Schema Decisions
- **State Tracking in Summaries**: The `CandidateSummary` entity uses a `status` column (`pending`, `completed`, `failed`). This is essential for asynchronous job tracking, allowing the frontend to poll for completion. It also stores `errorMessage` to help debug failures.
- **Postgres JSONB Integration**: The `strengths` and `concerns` lists returned by the LLM are mapped to `jsonb` array columns (`@Column({ type: 'jsonb' })`). This leverages native Postgres schema-less storage for dynamic arrays, making it easily queryable without requiring separate one-to-many relationship tables for strings.

## Future Improvements (With More Time)
1. **Durable Queuing**: Replace the ephemeral, in-memory `QueueService` with Redis and BullMQ. This would guarantee that enqueued tasks are not lost if the NestJS server restarts and would allow for built-in retry mechanisms and exponential backoff on API rate limits.
2. **Real Blob Storage Integration**: Implement an adapter for AWS S3 (or a local MinIO container) to actually store the uploaded document binaries using the `storageKey`, rather than simply passing the raw text in the payload.
3. **Robust Auth**: Replace the `x-workspace-id` header mocking with full JWT validation and Role-Based Access Control (RBAC).
