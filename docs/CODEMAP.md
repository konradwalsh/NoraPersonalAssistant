# NoraAssistant Code Map

## Project Structure

### Root

* `NoraPA.sln`: Visual Studio Solution file.
* `docs/`: Documentation folder.

### Backend (`NoraPA.API`)

* **`Program.cs`**: Entry point.Configures services, DB, API routes, and middleware.
* **`NoraDbContext.cs`**: Entity Framework Core database context. Defines DbSets.
* **`Services/`**:
  * `AiAnalysisService.cs`: Core logic for AI processing, prompt engineering, and LLM interaction.
  * `LogCollectorService.cs`: In-memory log capture for UI display.
  * `GmailSyncService.cs`: Logic for fetching emails from Google API.
  * `GoogleAuthService.cs`: OAuth2 flow handling.
  * `TaskClassifier.cs`: Smart routing logic for AI tasks.
  * `AiUsageTracker.cs`: Tracks token usage and costs.
* **`Migrations/`**: Database schema history.

### Frontend (`NoraPA.Web`)

* **`src/`**:
  * **`main.tsx`**: Entry point. Renders App component.
  * **`App.tsx`**: Main router configuration.
  * **`lib/`**:
    * `api.ts`: Typed API client for backend communication.
    * `types.ts`: TypeScript interfaces mirroring backend models.
    * `utils.ts`: Helper functions (e.g., class name merging).
  * **`components/`**:
    * `Layout.tsx`: Main application shell (Sidebar + Header).
    * `AiAnalysisDisplay.tsx`: Complex component for rendering AI results (Entities, Obligations, etc.).
    * `AiAnalyticsDashboard.tsx`: Charts and stats for AI usage.
    * `ui/`: Reusable primitive components (Button, Badge, etc.).
  * **`pages/`**:
    * `Dashboard.tsx`: Home landing page.
    * `Inbox.tsx`: Email processing interface.
    * `Settings.tsx`: Configuration center (AI providers, Identity, System).
    * `Tasks.tsx`, `Obligations.tsx`, `Deadlines.tsx`: Specific view controllers.

## Key Data Models

* **Message**: an email or input text.
* **AiAnalysis**: The result of an AI pass. Contains structured JSON fields (Summary, Entities, etc.).
* **AiSettings**: Configuration for a specific AI provider.
* **UserProfile**: User's identity context for personalization.
