# NoraAssistant Developer Guide

## Core Principles

1. **Aesthetics First**: The UI must be premium, responsive, and visually engaging ("wow" factor).
2. **Safety & Privacy**: User data is paramount. Always ensure data integrity and provide backup mechanisms.
3. **Modular Architecture**: Features should be built as independent modules where possible (e.g., Plugins, Integrations).

## Feature Development Workflow

To ensure stability and maintainability, follow these rules when introducing new features:

1. **Phase 1: Specification**
    * Create a markdown file in `docs/` describing the feature, its goals, and technical approach.
    * Define the data models and API endpoints required.

2. **Phase 2: Backend Implementation**
    * Implement database migrations (if any).
    * Create service layer logic.
    * Expose API endpoints.
    * **Rule**: Always backup `nora.db` before running migrations on production data.

3. **Phase 3: Frontend Implementation**
    * Build UI components in `src/components`.
    * Integrate with API using `src/lib/api.ts`.
    * Ensure responsive design and error handling.

4. **Phase 4: Verification**
    * Test happy paths and edge cases.
    * Verify no regressions in existing features (e.g., Dashboard, Inbox).

## Data Management & Backups

* **Database**: The system uses SQLite (`nora.db`).
* **Backup**: Users can download a full snapshot via `Settings -> System -> Export Database`.
* **Restore**: (Planned) A restore feature should be implemented to allow uploading a `.db` file to replace the current one.
* **Recommendation**: Before major updates, advise the user to export their database.

### 4. Port Architecture && Networking

To ensure consistent communication between services, strict port assignments are used:
* **Backend (API)**: `http://localhost:7001`
  * All API requests are proxied here.
  * Swagger UI: `http://localhost:7001/swagger`
* **Frontend (Web)**: `http://localhost:7002`
  * Vite Development Server.
  * Proxies `/api` requests to port 7001.

**Networking Rules:**
* NEVER hardcode ports in component files; use relative paths (e.g., `/api/...`).
* `vite.config.ts` MUST proxy to `7001`.
* `Program.cs` MUST listen on `7001`.

### 5. System Architecture

* **Backend**: ASP.NET Core 8.0 Web API.
* **Frontend**: React + Vite + Tailwind CSS.
* **AI Engine**: Multi-provider support (OpenAI, Anthropic, Google, Ollama) routed via `AiAnalysisService`.
* **Integration**: Google Workspace (Gmail) sync logic resides in `GmailSyncService`.

## Logs & Debugging

* Logs are accessed via `Settings -> System & Logs`.
* Backend logs are collected in-memory by `LogCollectorService` and exposed via API.
* **Critical**: Never expose full API keys in logs. Use masked values.
