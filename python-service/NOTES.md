# Assessment Notes

## Design Decisions
- **Python Service Layer**: Abstracted the core logic out of the FastAPI `routers` into a dedicated `BriefingService`. This cleanly separates the HTTP concerns (routing, status codes) from the database transactional logic and keeps the controllers minimal.
- **Report Formatting**: Extended the `ReportFormatter` class to process the `Briefing` SQLAlchemy object and transform it into a flat, well-structured dictionary view-model. Placing sorting logic (`display_order`) and filtering (`point_type`) here keeps the Jinja2 templates completely logic-less and purely focused on presentation.
- **Testing Approach**: Leveraged pytest with a memory-backed SQLite database for integration-style unit tests on the API payload validation, ensuring fast execution times without the complexity of tearing down a heavy Docker Postgres instance before each isolated test.

## Schema Decisions
- **Single Points Table (Python)**: Utilized a single `briefing_points` table to store both `key_points` and `risks` by introducing a `point_type` discriminator column. This avoids unnecessary table bloat while keeping shared attributes (like `display_order` and the foreign key logic) perfectly uniform.
- **Separate Metrics Table (Python)**: Created `briefing_metrics` as its own separate entity since metrics require a unique two-column structure (name and value) and have unique constraint requirements per briefing, unlike simple text points.

## Future Improvements (With More Time)
1. **Authentication / Authorization**: Secure the endpoints using standard JWT patterns across both applications to match real-world SaaS environments.
2. **True Integration Tests**: Utilize `Testcontainers` (or an equivalent setup) to spin up ephemeral Postgres instances dynamically. This would replace the SQLite mock approach to ensure full dialect compatibility (especially regarding Postgres-specifics like UUID generation) inside tests.
3. **HTML to PDF Export**: The final step of HTML report generation could be bundled using a headless browser (like Puppeteer) or `WeasyPrint` to provide user-downloadable PDF endpoints.
4. **Robust Job Queuing**: Switch the in-memory queue inside the TS service to a durable backing store like Redis with `BullMQ` so that generated summary jobs survive server restarts and support retry logic for LLM API failures.
