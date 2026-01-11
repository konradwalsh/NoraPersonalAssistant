# Nora Personal Assistant - Implementation Guide

This document provides a step-by-step guide for implementing the complete Nora PA system.

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Current Status](#current-status)
3. [Next Steps](#next-steps)
4. [Implementation Phases](#implementation-phases)
5. [Key Components](#key-components)
6. [Testing Strategy](#testing-strategy)
7. [Deployment](#deployment)

---

## Project Overview

**Nora Personal Assistant** is an intelligent life management system that extracts obligations, deadlines, and risks from digital communications and transforms them into actionable intelligence.

### Core Mission
Never let users miss an obligation, deadline, or important detail.

### Key Differentiators
- **Obligation extraction** (not just summarization)
- **Automatic task creation** from high-confidence obligations
- **Link intelligence** (follows "in conjunction with" references)
- **Context awareness** (deduplication, relationship building)
- **Risk detection** (identifies consequences of inaction)
- **Multi-source** (Gmail, WhatsApp, SMS, Slack)

---

## Current Status

### ✅ Completed

1. **Project Structure**
   - Solution file ([`NoraPA.sln`](../NoraPA.sln))
   - Core library project ([`NoraPA.Core.csproj`](../src/NoraPA.Core/NoraPA.Core.csproj))
   - Comprehensive README ([`README.md`](../README.md))

2. **Domain Models** (Complete 8-section schema)
   - [`Message.cs`](../src/NoraPA.Core/Models/Message.cs) - Unified message model
   - [`Obligation.cs`](../src/NoraPA.Core/Models/Obligation.cs) - Extracted obligations
   - [`Deadline.cs`](../src/NoraPA.Core/Models/Deadline.cs) - Deadline tracking
   - [`Entity.cs`](../src/NoraPA.Core/Models/Entity.cs) - People, orgs, products
   - [`Document.cs`](../src/NoraPA.Core/Models/Document.cs) - Attachments with semantic search
   - [`FinancialRecord.cs`](../src/NoraPA.Core/Models/FinancialRecord.cs) - Financial/legal significance
   - [`NoraTask.cs`](../src/NoraPA.Core/Models/NoraTask.cs) - Auto-created tasks
   - [`AIAnalysis.cs`](../src/NoraPA.Core/Models/AIAnalysis.cs) - AI analysis cache
   - [`EntityRelationship.cs`](../src/NoraPA.Core/Models/EntityRelationship.cs) - Entity graph

3. **AI Extraction Schema**
   - [`ExtractionSchema.cs`](../src/NoraPA.Core/Models/AI/ExtractionSchema.cs) - Complete 8-section schema
   - [`IAIExtractionService.cs`](../src/NoraPA.Core/Interfaces/IAIExtractionService.cs) - Service interface
   - [`AIExtractionService.cs`](../src/NoraPA.Core/Services/AI/AIExtractionService.cs) - Base implementation

4. **Infrastructure**
   - [`docker-compose.yml`](../docker-compose.yml) - PostgreSQL, Redis, MinIO

### 🚧 In Progress

- Database context and migrations
- API project setup
- Frontend scaffolding

### ⏳ Pending

- Message processing pipeline
- Obligation detection and task auto-creation
- Deadline parsing and reminders
- Link intelligence
- Gmail integration
- React frontend with Framer Motion
- Authentication and authorization
- REST and GraphQL APIs
- Background jobs (Hangfire)
- Real-time updates (SignalR)

---

## Next Steps

### Phase 1: Complete Backend Foundation (Week 1-2)

#### 1.1 Infrastructure Project
```bash
# Create Infrastructure project
dotnet new classlib -n NoraPA.Infrastructure -o src/NoraPA.Infrastructure
cd src/NoraPA.Infrastructure
dotnet add reference ../NoraPA.Core/NoraPA.Core.csproj
```

**Add packages:**
```bash
dotnet add package Microsoft.EntityFrameworkCore
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
dotnet add package Pgvector.EntityFrameworkCore
```

**Create DbContext:**
```csharp
// src/NoraPA.Infrastructure/Data/NoraDbContext.cs
public class NoraDbContext : DbContext
{
    public DbSet<Message> Messages { get; set; }
    public DbSet<Obligation> Obligations { get; set; }
    public DbSet<Deadline> Deadlines { get; set; }
    public DbSet<Entity> Entities { get; set; }
    public DbSet<Document> Documents { get; set; }
    public DbSet<FinancialRecord> FinancialRecords { get; set; }
    public DbSet<NoraTask> Tasks { get; set; }
    public DbSet<AIAnalysis> AIAnalyses { get; set; }
    public DbSet<EntityRelationship> EntityRelationships { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Configure relationships, indexes, constraints
        // Enable pgvector extension
        modelBuilder.HasPostgresExtension("vector");
    }
}
```

#### 1.2 API Project
```bash
# Create API project
dotnet new webapi -n NoraPA.API -o src/NoraPA.API
cd src/NoraPA.API
dotnet add reference ../NoraPA.Core/NoraPA.Core.csproj
dotnet add reference ../NoraPA.Infrastructure/NoraPA.Infrastructure.csproj
```

**Add packages:**
```bash
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package Serilog.AspNetCore
dotnet add package Hangfire.AspNetCore
dotnet add package Hangfire.PostgreSql
dotnet add package Microsoft.AspNetCore.SignalR
dotnet add package HotChocolate.AspNetCore
dotnet add package StackExchange.Redis
```

**Configure Program.cs:**
```csharp
var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddDbContext<NoraDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"),
        o => o.UseVector()));

builder.Services.AddScoped<IAIExtractionService, ClaudeExtractionService>();
builder.Services.AddHangfire(config => config.UsePostgreSqlStorage(...));
builder.Services.AddSignalR();
builder.Services.AddGraphQLServer()...;

var app = builder.Build();

// Configure middleware
app.UseHangfireDashboard();
app.MapHub<NotificationHub>("/hubs/notifications");
app.MapGraphQL();

app.Run();
```

#### 1.3 Database Migrations
```bash
cd src/NoraPA.API
dotnet ef migrations add InitialCreate
dotnet ef database update
```

### Phase 2: AI Provider Implementations (Week 2-3)

#### 2.1 Claude Implementation
```csharp
// src/NoraPA.Core/Services/AI/ClaudeExtractionService.cs
public class ClaudeExtractionService : AIExtractionService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    
    public override async Task<ExtractionSchema> ExtractFromTextAsync(
        string text, 
        CancellationToken cancellationToken = default)
    {
        var request = new
        {
            model = "claude-sonnet-4.5",
            max_tokens = 4096,
            system = GetSystemPrompt(),
            messages = new[]
            {
                new { role = "user", content = text }
            },
            tools = new[] { GetExtractionFunctionSchema() }
        };
        
        var response = await _httpClient.PostAsJsonAsync(
            "https://api.anthropic.com/v1/messages",
            request,
            cancellationToken);
            
        // Parse response and extract function call result
        // Deserialize to ExtractionSchema
        return extractedSchema;
    }
}
```

#### 2.2 OpenAI Implementation
Similar pattern for OpenAI, Gemini, DeepSeek, Ollama.

### Phase 3: Message Processing Pipeline (Week 3-4)

#### 3.1 Message Processor Service
```csharp
// src/NoraPA.Core/Services/Processing/MessageProcessorService.cs
public class MessageProcessorService
{
    private readonly IAIExtractionService _aiService;
    private readonly IObligationService _obligationService;
    private readonly ITaskService _taskService;
    
    public async Task ProcessMessageAsync(Message message)
    {
        // 1. Extract information using AI
        var extraction = await _aiService.ExtractAsync(message);
        
        // 2. Save extraction to database
        await SaveExtractionAsync(message, extraction);
        
        // 3. Create obligations
        await _obligationService.CreateFromExtractionAsync(extraction);
        
        // 4. Auto-create tasks (if confidence >= 0.85 && mandatory)
        await _taskService.AutoCreateTasksAsync(extraction);
        
        // 5. Process links (if marked as required)
        await ProcessLinksAsync(extraction.Attachments.Links);
        
        // 6. Send notifications
        await NotifyUserAsync(message, extraction);
    }
}
```

#### 3.2 Obligation Service
```csharp
// src/NoraPA.Core/Services/ObligationService.cs
public class ObligationService
{
    public async Task CreateFromExtractionAsync(ExtractionSchema extraction)
    {
        foreach (var obligationItem in extraction.Obligations.Obligations)
        {
            // Check for duplicates
            var existing = await FindSimilarObligationAsync(obligationItem);
            
            if (existing != null)
            {
                // Update existing
                await UpdateObligationAsync(existing, obligationItem);
            }
            else
            {
                // Create new
                await CreateObligationAsync(obligationItem);
            }
        }
    }
}
```

#### 3.3 Task Auto-Creation Service
```csharp
// src/NoraPA.Core/Services/TaskService.cs
public class TaskService
{
    public async Task AutoCreateTasksAsync(ExtractionSchema extraction)
    {
        foreach (var obligation in extraction.Obligations.Obligations)
        {
            // Check confidence and mandatory flag
            if (extraction.Confidence.ConfidenceScore >= 0.85m && obligation.Mandatory)
            {
                var task = new NoraTask
                {
                    Title = obligation.Action,
                    Description = obligation.ConsequenceIfIgnored,
                    DueDate = ParseTrigger(obligation.Trigger),
                    Priority = obligation.Priority,
                    Status = "pending"
                };
                
                await CreateTaskAsync(task);
            }
        }
    }
}
```

### Phase 4: Frontend Development (Week 4-6)

#### 4.1 React Project Setup
```bash
cd src
npm create vite@latest NoraPA.Web -- --template react-ts
cd NoraPA.Web
npm install
```

**Install dependencies:**
```bash
npm install react-router-dom @tanstack/react-query zustand
npm install framer-motion
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install tailwindcss postcss autoprefixer
npm install -D @types/node
```

#### 4.2 Key Components

**Inbox View:**
```tsx
// src/NoraPA.Web/src/pages/Inbox.tsx
export function Inbox() {
  const { data: messages } = useQuery({
    queryKey: ['messages'],
    queryFn: fetchMessages
  });
  
  return (
    <div className="inbox">
      <SearchBar />
      <FilterBar />
      <motion.div layout>
        {messages?.map(message => (
          <MessageCard key={message.id} message={message} />
        ))}
      </motion.div>
    </div>
  );
}
```

**Message Detail:**
```tsx
// src/NoraPA.Web/src/components/MessageDetail.tsx
export function MessageDetail({ messageId }: Props) {
  const { data: message } = useQuery({
    queryKey: ['message', messageId],
    queryFn: () => fetchMessage(messageId)
  });
  
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25 }}
    >
      <MessageHeader message={message} />
      <MessageBody message={message} />
      <ObligationsSection obligations={message.obligations} />
      <DeadlinesSection deadlines={message.deadlines} />
      <DocumentsSection documents={message.documents} />
      <AIInsightsSection extraction={message.extraction} />
    </motion.div>
  );
}
```

### Phase 5: Integrations (Week 6-8)

#### 5.1 Gmail Integration
```csharp
// src/NoraPA.Core/Services/Integrations/GmailService.cs
public class GmailService
{
    public async Task SyncMessagesAsync()
    {
        // Use Gmail API to fetch messages
        // Convert to Message model
        // Process through pipeline
    }
}
```

#### 5.2 Background Jobs
```csharp
// src/NoraPA.API/Jobs/MessageSyncJob.cs
public class MessageSyncJob
{
    [AutomaticRetry(Attempts = 3)]
    public async Task SyncAllSourcesAsync()
    {
        await _gmailService.SyncMessagesAsync();
        await _whatsappService.SyncMessagesAsync();
        await _smsService.SyncMessagesAsync();
        await _slackService.SyncMessagesAsync();
    }
}

// Schedule in Program.cs
RecurringJob.AddOrUpdate<MessageSyncJob>(
    "sync-messages",
    job => job.SyncAllSourcesAsync(),
    Cron.Every5Minutes);
```

---

## Key Components

### 1. AI Extraction Pipeline

**Flow:**
```
Message → AI Service → ExtractionSchema → Database → Tasks/Notifications
```

**Key Features:**
- Multi-provider support (Claude, OpenAI, Gemini, DeepSeek, Ollama)
- Function calling for structured extraction
- Prompt caching for cost optimization
- Confidence scoring
- Automatic retry with exponential backoff

### 2. Obligation Detection

**Rules:**
- Extract ALL obligations (even small ones)
- Parse trigger types: immediate, date, event
- Identify mandatory vs. optional
- Calculate consequences of inaction
- Estimate time required
- Assign priority (1-5)

**Auto-Task Creation:**
```
IF confidence >= 0.85 AND mandatory == true:
    CREATE task automatically
ELSE:
    FLAG for human review
```

### 3. Link Intelligence

**Detection:**
```
Trigger phrases:
- "in conjunction with"
- "please refer to"
- "full terms available at"
- "read together with"
- "subject to terms at"
```

**Action:**
```
IF trigger phrase detected:
    Mark link as REQUIRED
    Auto-follow link
    Download referenced documents
    Extract text from PDFs
    Re-analyze combined content
    Store complete document set
```

### 4. Context Awareness

**Deduplication:**
```
BEFORE creating new record:
    1. Check for similar records (same entity, org, domain)
    2. IF exists:
        UPDATE existing record
        ADD new information
        LINK to new source
    3. IF new:
        CREATE record
        AUTO-LINK to related records
```

---

## Testing Strategy

### Unit Tests
```csharp
// tests/NoraPA.Tests.Unit/Services/AIExtractionServiceTests.cs
public class AIExtractionServiceTests
{
    [Fact]
    public async Task ExtractAsync_WithInsuranceEmail_ExtractsObligations()
    {
        // Arrange
        var message = CreateTestInsuranceMessage();
        var service = new ClaudeExtractionService(...);
        
        // Act
        var result = await service.ExtractAsync(message);
        
        // Assert
        Assert.NotEmpty(result.Obligations.Obligations);
        Assert.Contains(result.Obligations.Obligations, 
            o => o.Action.Contains("Read policy"));
    }
}
```

### Integration Tests
```csharp
// tests/NoraPA.Tests.Integration/MessageProcessingTests.cs
public class MessageProcessingTests : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task ProcessMessage_CreatesTasksForHighConfidenceObligations()
    {
        // Arrange
        var message = await CreateMessageAsync();
        
        // Act
        await _processor.ProcessMessageAsync(message);
        
        // Assert
        var tasks = await _dbContext.Tasks.Where(t => t.ObligationId != null).ToListAsync();
        Assert.NotEmpty(tasks);
    }
}
```

### E2E Tests
```typescript
// src/NoraPA.Web/tests/e2e/inbox.spec.ts
test('displays messages and allows navigation to detail', async ({ page }) => {
  await page.goto('/inbox');
  await expect(page.locator('.message-card')).toHaveCount(3);
  
  await page.click('.message-card:first-child');
  await expect(page.locator('.message-detail')).toBeVisible();
  await expect(page.locator('.obligations-section')).toBeVisible();
});
```

---

## Deployment

### Development
```bash
# Start infrastructure
docker-compose up -d

# Run migrations
cd src/NoraPA.API
dotnet ef database update

# Start backend
dotnet run

# Start frontend (in another terminal)
cd src/NoraPA.Web
npm run dev
```

### Production (Docker)
```dockerfile
# Dockerfile
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY . .
RUN dotnet restore
RUN dotnet publish -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app .
ENTRYPOINT ["dotnet", "NoraPA.API.dll"]
```

```bash
# Build and run
docker build -t nora-pa .
docker run -p 5000:5000 nora-pa
```

### Cloud Deployment

**Options:**
1. **Railway** - One-click deploy
2. **Render** - Free tier available
3. **Fly.io** - Global edge deployment
4. **AWS ECS** - Production scale
5. **Azure Container Apps** - Enterprise

---

## Resources

- [Architecture Documentation](ARCHITECTURE.md)
- [API Documentation](API.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [Original Vision Document](../README.md)

---

**Next Action:** Implement Phase 1 (Backend Foundation) by creating the Infrastructure project and DbContext.
