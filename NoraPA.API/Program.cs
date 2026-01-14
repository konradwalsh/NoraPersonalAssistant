
using Microsoft.EntityFrameworkCore;
using NoraPA.API;
using NoraPA.API.Services;
using NoraPA.Core;
using OpenAI;
using OpenAI.Chat;

namespace NoraPA.API;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        // Add log collector service (singleton for shared state)
        var logCollector = new LogCollectorService(maxLogs: 500);
        builder.Services.AddSingleton(logCollector);

        // Add custom logger provider to capture all logs
        builder.Logging.AddProvider(new CollectorLoggerProvider(logCollector));

        // Add services to the container.
        builder.Services.AddAuthorization();

        // Add CORS policy
        builder.Services.AddCors(options =>
        {
            options.AddDefaultPolicy(policy =>
            {
                policy.WithOrigins("http://localhost:7002")
                      .AllowAnyMethod()
                      .AllowAnyHeader();
            });
        });

        // Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
        builder.Services.AddOpenApi();

        // Add database context with provider selection
        var dbProvider = builder.Configuration.GetValue<string>("DatabaseProvider") ?? "SQLite";
        builder.Services.AddDbContext<NoraDbContext>(options =>
        {
            if (dbProvider == "PostgreSQL")
                options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
            else
                options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection"));
        });

        // Add AI analysis service
        builder.Services.AddScoped<AiAnalysisService>();
        builder.Services.AddHttpClient();
        
        // Configure JSON options to handle circular references
        builder.Services.ConfigureHttpJsonOptions(options => {
            options.SerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        });
        
        // Add smart AI routing services
        builder.Services.AddSingleton<TaskClassifier>();
        builder.Services.AddSingleton<AiUsageTracker>();

        // Add Google/Gmail services
        builder.Services.AddScoped<GoogleAuthService>();
        builder.Services.AddScoped<GmailSyncService>();
        builder.Services.AddScoped<GoogleCalendarSyncService>();
        builder.Services.AddHostedService<GmailBackgroundWorker>();

        // Configure to listen on port 7001
        builder.WebHost.UseUrls("http://localhost:7001");

        var app = builder.Build();

        // Initialize Database
        using (var scope = app.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<NoraDbContext>();
            db.Database.Migrate();

            // Create AppSettings table manually if strictly needed (resiliency)
            try 
            {
                var scopeDbProvider = scope.ServiceProvider.GetRequiredService<IConfiguration>().GetValue<string>("DatabaseProvider") ?? "SQLite";
                var createTableSql = scopeDbProvider == "PostgreSQL"  
                    ? @"CREATE TABLE IF NOT EXISTS ""app_settings"" (""key"" text NOT NULL, ""value"" text, ""updated_at"" timestamp with time zone NOT NULL, CONSTRAINT ""PK_app_settings"" PRIMARY KEY (""key""));"
                    : @"CREATE TABLE IF NOT EXISTS ""app_settings"" (""key"" TEXT NOT NULL CONSTRAINT ""PK_app_settings"" PRIMARY KEY, ""value"" TEXT, ""updated_at"" TEXT NOT NULL);";
                db.Database.ExecuteSqlRaw(createTableSql);
            }
            catch (Exception ex)
            {
                // Ignore if table exists or other minor issue, EnsureCreated usually handles it for SQLite
                Console.WriteLine($"Table creation check: {ex.Message}");
            }

            

        }

        // Configure the HTTP request pipeline.
        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
        }

        app.UseHttpsRedirection();
        app.UseCors(); // Enable CORS
        app.UseAuthorization();

        // API Routes
        var messages = app.MapGroup("/api/messages");
        messages.MapGet("/", async (NoraDbContext db) =>
            await db.Messages
                .Include(m => m.AiAnalyses.OrderByDescending(a => a.Id))
                .Include(m => m.Attachments)
                .OrderByDescending(m => m.ReceivedAt)
                .ToListAsync());

        messages.MapGet("/{id:long}", async (long id, NoraDbContext db) =>
            await db.Messages
                .Include(m => m.AiAnalyses.OrderByDescending(a => a.Id))
                .Include(m => m.Attachments)
                .FirstOrDefaultAsync(m => m.Id == id) is Message message
                ? Results.Ok(message)
                : Results.NotFound());

        messages.MapPost("/", async (Message message, NoraDbContext db) =>
        {
            db.Messages.Add(message);
            await db.SaveChangesAsync();
            return Results.Created($"/api/messages/{message.Id}", message);
        });

        messages.MapPatch("/{id:long}", async (long id, MessageUpdate update, NoraDbContext db) =>
        {
            var message = await db.Messages.FindAsync(id);
            if (message == null)
            {
                return Results.NotFound(new { error = "Message not found" });
            }

            if (update.ProcessedAt != null)
            {
                message.ProcessedAt = DateTime.Parse(update.ProcessedAt);
            }
            if (update.Importance != null)
            {
                message.Importance = update.Importance;
            }
            if (update.LifeDomain != null)
            {
                message.LifeDomain = update.LifeDomain;
            }

            await db.SaveChangesAsync();
            return Results.Ok(message);
        });


        messages.MapPost("/{id:long}/analyze", async (long id, AnalyzeRequest? request, NoraDbContext db, IServiceScopeFactory scopeFactory, AiAnalysisService aiService) =>
        {
            var message = await db.Messages.FindAsync(id);
            if (message == null) return Results.NotFound();

            // Create placeholder record synchronously for UI feedback
            var analysis = new AiAnalysis
            {
                MessageId = id,
                Status = "processing",
                AnalyzedAt = DateTime.UtcNow
            };
            db.AiAnalyses.Add(analysis);
            await db.SaveChangesAsync();

            // Run full analysis in background
            var instructions = request?.Instructions;
            _ = System.Threading.Tasks.Task.Run(async () =>
            {
                using var scope = scopeFactory.CreateScope();
                var backgroundAiService = scope.ServiceProvider.GetRequiredService<AiAnalysisService>();
                await backgroundAiService.PerformFullAnalysisAsync(id, analysis.Id, instructions);
            });

            return Results.Ok(analysis);
        });

        messages.MapPost("/{id:long}/draft", async (long id, DraftReplyRequest? request, AiAnalysisService ai) =>
        {
            try {
                var draft = await ai.DraftReplyAsync(id, request?.Instructions);
                return Results.Ok(new { draft });
            } catch (Exception ex) {
                return Results.Problem(ex.Message);
            }
        });


        messages.MapGet("/{id:long}/extraction", async (long id, NoraDbContext db) =>
        {
            var analysis = await db.AiAnalyses
                .Where(a => a.MessageId == id)
                .OrderByDescending(a => a.AnalyzedAt)
                .FirstOrDefaultAsync();

            if (analysis == null)
            {
                return Results.NotFound(new { error = "No analysis found for this message" });
            }

            if (analysis.Status == "processing")
            {
                return Results.Ok(new { status = "processing", analysisId = analysis.Id, message = "Analysis is still in progress" });
            }

            if (analysis.Status == "failed")
            {
                return Results.BadRequest(new { error = "Analysis failed", details = analysis.RawResponse });
            }

            return Results.Ok(new
            {
                analysis.Id,
                analysis.MessageId,
                analysis.Summary,
                analysis.ObligationsAnalysis,
                analysis.DeadlinesAnalysis,
                analysis.DocumentsAnalysis,
                analysis.FinancialRecordsAnalysis,
                analysis.LifeDomainAnalysis,
                analysis.ImportanceAnalysis,
                analysis.GeneralAnalysis,
                analysis.ContactsAnalysis,
                analysis.EventsAnalysis,
                analysis.Status,
                analysis.AnalyzedAt
            });
        });

        // Contacts & Calendar
        app.MapGet("/api/contacts", async (NoraDbContext db) => await db.Contacts.OrderBy(c => c.Name).ToListAsync());
        app.MapPost("/api/contacts", async (Contact contact, NoraDbContext db) =>
        {
            db.Contacts.Add(contact);
            await db.SaveChangesAsync();
            return Results.Created($"/api/contacts/{contact.Id}", contact);
        });

        app.MapGet("/api/calendar/events", async (NoraDbContext db) => await db.CalendarEvents.OrderBy(e => e.StartTime).ToListAsync());
        app.MapPost("/api/calendar/events", async (CalendarEvent evt, NoraDbContext db) =>
        {
            evt.CreatedAt = DateTime.UtcNow;
            db.CalendarEvents.Add(evt);
            await db.SaveChangesAsync();
            return Results.Created($"/api/calendar/events/{evt.Id}", evt);
        });

        // Tasks, Obligations, Deadlines, Attachments
        app.MapGet("/api/attachments", async (NoraDbContext db) => 
        {
            return await db.Attachments
                .Include(a => a.Message)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();
        });

        app.MapGet("/api/attachments/{id:long}/download", async (long id, NoraDbContext db) =>
        {
            var attachment = await db.Attachments.FindAsync(id);
            if (attachment == null || string.IsNullOrEmpty(attachment.LocalPath)) return Results.NotFound();
            
            if (!System.IO.File.Exists(attachment.LocalPath)) return Results.NotFound("File not found on disk");
            
            return Results.File(attachment.LocalPath, attachment.MimeType, attachment.Filename);
        });

        app.MapGet("/api/profile", async (NoraDbContext db) =>
            await db.UserProfiles.FirstOrDefaultAsync() is UserProfile profile
                ? Results.Ok(profile)
                : Results.NotFound());

        app.MapPost("/api/profile", async (UserProfile profile, NoraDbContext db) =>
        {
            var existing = await db.UserProfiles.FirstOrDefaultAsync();
            if (existing != null)
            {
                existing.FullName = profile.FullName;
                existing.Bio = profile.Bio;
                existing.CareerContext = profile.CareerContext;
                existing.HouseholdContext = profile.HouseholdContext;
                existing.ExclusionInstructions = profile.ExclusionInstructions;
                existing.AiDirectives = profile.AiDirectives;
                existing.UpdatedAt = DateTime.UtcNow;
                await db.SaveChangesAsync();
                return Results.Ok(existing);
            }
            
            profile.UpdatedAt = DateTime.UtcNow;
            db.UserProfiles.Add(profile);
            await db.SaveChangesAsync();
            return Results.Created("/api/profile", profile);
        });

        var obligations = app.MapGroup("/api/obligations");
        obligations.MapGet("/", async (NoraDbContext db) =>
            await db.Obligations.Include(o => o.Message).ToListAsync());

        obligations.MapGet("/{id:long}", async (long id, NoraDbContext db) =>
            await db.Obligations.Include(o => o.Message).FirstOrDefaultAsync(o => o.Id == id) is Obligation obligation
                ? Results.Ok(obligation)
                : Results.NotFound());

        var tasks = app.MapGroup("/api/tasks");
        tasks.MapGet("/", async (NoraDbContext db) =>
            await db.Tasks.Include(t => t.Obligation).ToListAsync());

        tasks.MapPost("/", async (NoraPA.Core.Task task, NoraDbContext db) =>
        {
            db.Tasks.Add(task);
            await db.SaveChangesAsync();
            return Results.Created($"/api/tasks/{task.Id}", task);
        });

        var deadlines = app.MapGroup("/api/deadlines");
        deadlines.MapGet("/", async (NoraDbContext db) =>
            await db.Deadlines.Include(d => d.Message).ToListAsync());

        // ============ LOGS API ============
        var logs = app.MapGroup("/api/logs");
        
        logs.MapGet("/", (LogCollectorService collector, int? limit, int? minLevel, string? source) =>
        {
            try {
                var logLevel = minLevel.HasValue ? (NoraPA.API.Services.LogLevel)minLevel.Value : (NoraPA.API.Services.LogLevel?)null;
                // Safely materialize to list to catch errors here
                var entries = collector.GetLogs(logLevel, source, limit ?? 100).ToList();
                return Results.Ok(entries);
            } catch (Exception ex) {
                return Results.Problem($"Log retrieval failed: {ex.Message}");
            }
        });

        logs.MapGet("/count", (LogCollectorService collector) =>
        {
            return Results.Ok(new { count = collector.Count });
        });

        logs.MapDelete("/", (LogCollectorService collector) =>
        {
            collector.Clear();
            return Results.Ok(new { message = "Logs cleared" });
        });

        // ============ AI USAGE API ============
        var usage = app.MapGroup("/api/ai/usage");
        
        usage.MapGet("/stats", async (AiUsageTracker tracker) =>
        {
            return Results.Ok(await tracker.GetStats());
        });
        
        usage.MapGet("/recent", async (AiUsageTracker tracker, int? limit) =>
        {
            return Results.Ok(await tracker.GetRecentUsage(limit ?? 50));
        });

        // ============ SETTINGS API ============
        var settings = app.MapGroup("/api/settings");

        // Get available AI providers with their models
        settings.MapGet("/providers", () =>
        {
            var providers = new List<AiProviderConfig>
            {
                new AiProviderConfig
                {
                    Id = "openai",
                    Name = "OpenAI",
                    Description = "Industry-leading models for complex reasoning and analysis.",
                    Recommendation = "Best for Logic & Reasoning",
                    RequiresApiKey = true,
                    SignUpUrl = "https://platform.openai.com/signup",
                    SupportsCustomEndpoint = false,
                    DefaultEndpoint = "https://api.openai.com/v1",
                    Models = new List<AiModelConfig>
                    {
                        new() { Id = "gpt-5-turbo", Name = "GPT-5 Turbo", Description = "Next-gen reasoning engine", ContextWindow = 256000, IsRecommended = true },
                        new() { Id = "gpt-4o-2025", Name = "GPT-4o (v2)", Description = "Optimized multimodal flagship", ContextWindow = 128000 },
                        new() { Id = "o1-pro", Name = "o1 Pro", Description = "Advanced reasoning chain", ContextWindow = 200000 },
                        new() { Id = "gpt-4.5-turbo", Name = "GPT-4.5 Turbo", Description = "High speed, high intelligence", ContextWindow = 128000 }
                    }
                },
                new AiProviderConfig
                {
                    Id = "anthropic",
                    Name = "Anthropic Claude",
                    Description = "Excels at nuanced understanding and following complex instructions.",
                    Recommendation = "Best for Coding & Nuance",
                    RequiresApiKey = true,
                    SignUpUrl = "https://console.anthropic.com/",
                    SupportsCustomEndpoint = false,
                    DefaultEndpoint = "https://api.anthropic.com",
                    Models = new List<AiModelConfig>
                    {
                        new() { Id = "claude-4-5-sonnet", Name = "Claude 4.5 Sonnet", Description = "Latest state-of-the-art capability", ContextWindow = 500000, IsRecommended = true },
                        new() { Id = "claude-4-5-opus", Name = "Claude 4.5 Opus", Description = "Maximum intelligence for deep tasks", ContextWindow = 500000 },
                        new() { Id = "claude-4-haiku", Name = "Claude 4 Haiku", Description = "Ultra-fast and efficient", ContextWindow = 200000 }
                    }
                },
                new AiProviderConfig
                {
                    Id = "google",
                    Name = "Google Gemini",
                    Description = "Massive context windows and multimodal capabilities.",
                    Recommendation = "Best for Massive Context",
                    RequiresApiKey = true,
                    SignUpUrl = "https://aistudio.google.com/",
                    SupportsCustomEndpoint = false,
                    DefaultEndpoint = "https://generativelanguage.googleapis.com",
                    Models = new List<AiModelConfig>
                    {
                        new() { Id = "gemini-3-pro", Name = "Gemini 3 Pro", Description = "Next-generation multimodal leader", ContextWindow = 10000000, IsRecommended = true },
                        new() { Id = "gemini-3-flash", Name = "Gemini 3 Flash", Description = "Sub-50ms latency", ContextWindow = 2000000 },
                        new() { Id = "gemini-2-pro", Name = "Gemini 2.0 Pro", Description = "Previous stable generation", ContextWindow = 2000000 }
                    }
                },
                new AiProviderConfig
                {
                    Id = "deepseek",
                    Name = "DeepSeek API",
                    Description = "Leading open-weight models with strong reasoning and coding capabilities.",
                    Recommendation = "Best for Coding & Value",
                    RequiresApiKey = true,
                    SignUpUrl = "https://platform.deepseek.com/",
                    SupportsCustomEndpoint = false,
                    DefaultEndpoint = "https://api.deepseek.com",
                    Models = new List<AiModelConfig>
                    {
                        new() { Id = "deepseek-chat", Name = "DeepSeek V3", Description = "SOTA coding and general tasks", ContextWindow = 64000, IsRecommended = true },
                        new() { Id = "deepseek-reasoner", Name = "DeepSeek R1", Description = "Advanced reasoning (CoT)", ContextWindow = 64000 }
                    }
                },
                new AiProviderConfig
                {
                    Id = "ollama",
                    Name = "Ollama (Local)",
                    Description = "Run models locally for privacy and zero API costs.",
                    Recommendation = "Best for Privacy & Offline",
                    RequiresApiKey = false,
                    SignUpUrl = "https://ollama.com/download",
                    SupportsCustomEndpoint = true,
                    DefaultEndpoint = "http://localhost:11434",
                    Models = new List<AiModelConfig>
                    {
                        new() { Id = "llama-4-70b", Name = "Llama 4 (70B)", Description = "Meta's 2025 frontier model", ContextWindow = 128000, IsRecommended = true },
                        new() { Id = "mistral-large-2", Name = "Mistral Large 2", Description = "European champion model", ContextWindow = 32000 },
                        new() { Id = "deepseek-coder-v3", Name = "DeepSeek Coder V3", Description = "SOTA coding capabilities", ContextWindow = 64000 },
                        new() { Id = "phi-4", Name = "Phi-4", Description = "Microsoft's reasoning SLM", ContextWindow = 128000 }
                    }
                },
                new AiProviderConfig
                {
                    Id = "openrouter",
                    Name = "OpenRouter",
                    Description = "Unified interface for all major models (Claude, GPT, Llama) with one key.",
                    Recommendation = "Best for Flexibility",
                    RequiresApiKey = true,
                    SignUpUrl = "https://openrouter.ai/settings/keys",
                    SupportsCustomEndpoint = false,
                    DefaultEndpoint = "https://openrouter.ai/api/v1",
                    Models = new List<AiModelConfig>
                    {
                        new() { Id = "openai/gpt-4o", Name = "OpenRouter: GPT-4o", Description = "Via OpenRouter", ContextWindow = 128000, IsRecommended = true },
                        new() { Id = "anthropic/claude-3.5-sonnet", Name = "OpenRouter: Claude 3.5 Sonnet", Description = "Via OpenRouter", ContextWindow = 200000 },
                        new() { Id = "google/gemini-pro-1.5", Name = "OpenRouter: Gemini 1.5 Pro", Description = "Via OpenRouter", ContextWindow = 2000000 },
                        new() { Id = "meta-llama/llama-3-70b-instruct", Name = "OpenRouter: Llama 3 70B", Description = "Via OpenRouter", ContextWindow = 8192 }
                    }
                }
            };
            return Results.Ok(providers);
        });

        // Get current AI settings
        settings.MapGet("/ai", async (NoraDbContext db) =>
        {
            var activeSettings = await db.AiSettings
                .OrderByDescending(s => s.UpdatedAt)
                .ToListAsync();

            if (!activeSettings.Any())
            {
                // Return default settings if none exist
                return Results.Ok(new List<object>
                {
                    new
                    {
                        id = 0,
                        provider = "openai",
                        model = "gpt-4o",
                        hasApiKey = false,
                        apiEndpoint = (string?)null,
                        temperature = 0.7m,
                        maxTokens = 4096,
                        isActive = true,
                        crossProviderEnabled = false
                    }
                });
            }

            // Return settings but mask API keys
            return Results.Ok(activeSettings.Select(s => new
            {
                s.Id,
                s.Provider,
                s.Model,
                HasApiKey = !string.IsNullOrEmpty(s.ApiKey),
                ApiKeyPreview = string.IsNullOrEmpty(s.ApiKey) ? null : $"{s.ApiKey[..8]}...{s.ApiKey[^4..]}",
                s.ApiEndpoint,
                s.Temperature,
                s.MaxTokens,
                s.IsActive,
                s.CrossProviderEnabled,
                s.UpdatedAt
            }));
        });

        // Save/Update AI settings
        settings.MapPost("/ai", async (AiSettingsRequest request, NoraDbContext db) =>
        {
            // Find existing settings for this provider or create new
            var existing = await db.AiSettings.FirstOrDefaultAsync(s => s.Provider == request.Provider);

            if (existing != null)
            {
                existing.Model = request.Model;
                if (!string.IsNullOrEmpty(request.ApiKey))
                {
                    existing.ApiKey = request.ApiKey;
                }
                existing.ApiEndpoint = request.ApiEndpoint;
                existing.Temperature = request.Temperature ?? 0.7m;
                existing.MaxTokens = request.MaxTokens ?? 4096;
                existing.IsActive = request.IsActive ?? true;
                existing.CrossProviderEnabled = request.CrossProviderEnabled ?? false;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                var newSettings = new AiSettings
                {
                    Provider = request.Provider,
                    Model = request.Model,
                    ApiKey = request.ApiKey,
                    ApiEndpoint = request.ApiEndpoint,
                    Temperature = request.Temperature ?? 0.7m,
                    MaxTokens = request.MaxTokens ?? 4096,
                    IsActive = request.IsActive ?? true,
                    CrossProviderEnabled = request.CrossProviderEnabled ?? false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                db.AiSettings.Add(newSettings);
            }

            await db.SaveChangesAsync();
            return Results.Ok(new { success = true, message = $"Settings for {request.Provider} saved successfully" });
        });

        // Set active provider
        settings.MapPost("/ai/activate/{provider}", async (string provider, NoraDbContext db) =>
        {
            var settings = await db.AiSettings.FirstOrDefaultAsync(s => s.Provider == provider);
            if (settings == null)
            {
                return Results.NotFound(new { error = $"No settings found for provider: {provider}" });
            }

            // Deactivate all other providers
            await db.AiSettings.Where(s => s.Provider != provider).ExecuteUpdateAsync(s => s.SetProperty(x => x.IsActive, false));
            
            // Activate the selected one
            settings.IsActive = true;
            settings.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            return Results.Ok(new { success = true, activeProvider = provider });
        });

        // Delete provider settings
        settings.MapDelete("/ai/{provider}", async (string provider, NoraDbContext db) =>
        {
            var settings = await db.AiSettings.FirstOrDefaultAsync(s => s.Provider == provider);
            if (settings == null)
            {
                return Results.NotFound(new { error = $"No settings found for provider: {provider}" });
            }

            db.AiSettings.Remove(settings);
            await db.SaveChangesAsync();

            return Results.Ok(new { success = true, message = $"Settings for {provider} deleted" });
        });

        // Get usage stats
        settings.MapGet("/ai/usage", async (NoraDbContext db) =>
        {
            try
            {
                var usageLogs = await db.AiUsageLogs
                    .Where(l => l.Timestamp >= DateTime.UtcNow.AddMonths(-1)) // Current month/period
                    .ToListAsync();
                
                var totalCost = usageLogs.Sum(l => l.CostUsd);
                var totalTokens = usageLogs.Sum(l => l.InputTokens + l.OutputTokens);
                var completed = usageLogs.Count;
                var analyses = await db.AiAnalyses.ToListAsync();
                var failed = analyses.Count(a => a.Status == "failed"); // Still count failed analyses from main table
                var total = completed + failed;

                return Results.Ok(new AiUsageStats
                {
                    TokensUsed = totalTokens,
                    TokensRemaining = 10000000 - totalTokens, // Assuming 10M token limit/budget
                    CostMtd = totalCost,
                    AnalysesCompleted = completed,
                    AnalysesFailed = failed,
                    SuccessRate = total > 0 ? Math.Round((decimal)completed / total * 100, 1) : 100
                });
            }
            catch
            {
                // Return zeros if table doesn't exist yet
                return Results.Ok(new AiUsageStats
                {
                    TokensRemaining = 10000000,
                    SuccessRate = 100
                });
            }
        });

        // Get Budget Mode
        settings.MapGet("/ai/budget-mode", async (NoraDbContext db) =>
        {
            var mode = await db.AppSettings.FindAsync("AiBudgetMode");
            return Results.Ok(new { mode = mode?.Value ?? "Balanced" });
        });

        // Set Budget Mode
        settings.MapPost("/ai/budget-mode", async (BudgetModeRequest request, NoraDbContext db) =>
        {
            var setting = await db.AppSettings.FindAsync("AiBudgetMode");
            if (setting == null)
            {
                setting = new AppSettings { Key = "AiBudgetMode", Value = request.Mode, UpdatedAt = DateTime.UtcNow };
                db.AppSettings.Add(setting);
            }
            else
            {
                setting.Value = request.Mode;
                setting.UpdatedAt = DateTime.UtcNow;
            }
            
            await db.SaveChangesAsync();
            return Results.Ok(new { success = true, mode = request.Mode });
        });

        // Test connection to a provider
        settings.MapPost("/ai/test", async (AiTestRequest request) =>
        {
            try
            {
                // Real connection testing logic
                using var httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };

                // 1. Ollama (Local)
                if (request.Provider == "ollama")
                {
                    var endpoint = request.ApiEndpoint ?? "http://localhost:11434";
                    var response = await httpClient.GetAsync($"{endpoint}/api/tags");
                    if (response.IsSuccessStatusCode) return Results.Ok(new { success = true, message = "Ollama is reachable." });
                    return Results.Ok(new { success = false, error = "Could not reach Ollama." });
                }

                // 2. OpenAI (Official)
                if (request.Provider == "openai")
                {
                    if (string.IsNullOrWhiteSpace(request.ApiKey)) return Results.Ok(new { success = false, error = "API Key required." });
                    
                    var client = new ChatClient("gpt-3.5-turbo", request.ApiKey); // Use cheap model for ping
                    var response = await client.CompleteChatAsync("Hi"); // Minimal token usage
                    return Results.Ok(new { success = true, message = "Authorized & working." });
                }

                // 3. DeepSeek (OpenAI Compatible)
                if (request.Provider == "deepseek")
                {
                    if (string.IsNullOrWhiteSpace(request.ApiKey)) return Results.Ok(new { success = false, error = "API Key required." });

                    var client = new ChatClient("deepseek-chat", new System.ClientModel.ApiKeyCredential(request.ApiKey), new OpenAIClientOptions { Endpoint = new Uri("https://api.deepseek.com") });
                    await client.CompleteChatAsync("Hi");
                    return Results.Ok(new { success = true, message = "Authorized & working." });
                }

                // 4. OpenRouter (OpenAI Compatible)
                if (request.Provider == "openrouter")
                {
                    if (string.IsNullOrWhiteSpace(request.ApiKey)) return Results.Ok(new { success = false, error = "API Key required." });

                    var client = new ChatClient("openai/gpt-3.5-turbo", new System.ClientModel.ApiKeyCredential(request.ApiKey), new OpenAIClientOptions { Endpoint = new Uri("https://openrouter.ai/api/v1") });
                    // OpenRouter might need headers (HTTP Referer), but basic auth usually works for raw checks
                    await client.CompleteChatAsync("Hi");
                    return Results.Ok(new { success = true, message = "Authorized & working." });
                }

                // 5. Anthropic (REST Check)
                if (request.Provider == "anthropic")
                {
                    if (string.IsNullOrWhiteSpace(request.ApiKey)) return Results.Ok(new { success = false, error = "API Key required." });

                    var req = new HttpRequestMessage(HttpMethod.Post, "https://api.anthropic.com/v1/messages");
                    req.Headers.Add("x-api-key", request.ApiKey);
                    req.Headers.Add("anthropic-version", "2023-06-01");
                    req.Content = JsonContent.Create(new 
                    { 
                        model = "claude-3-haiku-20240307", 
                        max_tokens = 1, 
                        messages = new[] { new { role = "user", content = "Hi" } } 
                    });

                    var res = await httpClient.SendAsync(req);
                    if (res.IsSuccessStatusCode) return Results.Ok(new { success = true, message = "Authorized & working." });
                    var error = await res.Content.ReadAsStringAsync();
                    return Results.Ok(new { success = false, error = $"Refused: {res.StatusCode}" });
                }

                // 6. Google Gemini (REST Check - List Models)
                if (request.Provider == "google")
                {
                    if (string.IsNullOrWhiteSpace(request.ApiKey)) return Results.Ok(new { success = false, error = "API Key required." });

                    // Simple GET to list models authenticates the key
                    var res = await httpClient.GetAsync($"https://generativelanguage.googleapis.com/v1beta/models?key={request.ApiKey}");
                    
                    if (res.IsSuccessStatusCode) return Results.Ok(new { success = true, message = "Authorized & working." });
                    return Results.Ok(new { success = false, error = $"Refused: {res.StatusCode}" });
                }

                return Results.Ok(new { success = false, error = "Provider test not implemented." });
            }
            catch (Exception ex)
            {
                return Results.Ok(new { success = false, error = ex.Message });
            }
        });

        // Keep the weather forecast for testing
        var summaries = new[]
        {
            "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
        };

        app.MapGet("/weatherforecast", (HttpContext httpContext) =>
        {
            var forecast =  Enumerable.Range(1, 5).Select(index =>
                new WeatherForecast
                {
                    Date = DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
                    TemperatureC = Random.Shared.Next(-20, 55),
                    Summary = summaries[Random.Shared.Next(summaries.Length)]
                })
                .ToArray();
            return forecast;
        })
        .WithName("GetWeatherForecast");

        settings.MapGet("/app", async (NoraDbContext db) =>
        {
            var appSettings = await db.AppSettings.ToDictionaryAsync(s => s.Key, s => s.Value);
            // Ensure default for DemoMode if missing
            if (!appSettings.ContainsKey("DemoMode"))
            {
                appSettings["DemoMode"] = "false";
            }
            return Results.Ok(appSettings);
        });

        settings.MapPost("/app", async (AppSettingRequest request, NoraDbContext db) =>
        {
             var setting = await db.AppSettings.FindAsync(request.Key);
             if (setting == null)
             {
                 setting = new AppSettings { Key = request.Key };
                 db.AppSettings.Add(setting);
             }
             
             setting.Value = request.Value;
             setting.UpdatedAt = DateTime.UtcNow;
             
             await db.SaveChangesAsync();
             return Results.Ok(setting);
        });

        // Google Integrations
        var integrations = app.MapGroup("/api/integrations");
        
        integrations.MapGet("/google/auth", (GoogleAuthService auth) => 
        {
            var url = auth.GetAuthUrl(Guid.NewGuid().ToString());
            return Results.Ok(new { url });
        });

        integrations.MapGet("/google/callback", async (string code, string state, GoogleAuthService auth) => 
        {
            await auth.ExchangeCodeAsync(code);
            return Results.Redirect("http://localhost:7002/settings?tab=integrations&status=connected");
        });

        integrations.MapPost("/google/disconnect", async (NoraDbContext db) => 
        {
            // Remove all Google OAuth tokens
            var tokensToRemove = await db.AppSettings
                .Where(s => s.Key == "GoogleAccessToken" || s.Key == "GoogleRefreshToken" || s.Key == "GoogleTokenExpiry")
                .ToListAsync();
            
            db.AppSettings.RemoveRange(tokensToRemove);
            await db.SaveChangesAsync();
            
            return Results.Ok(new { success = true, message = "Google account disconnected. Please reconnect to grant new permissions." });
        });

        integrations.MapPost("/google/sync", async (GmailSyncService sync) => 
        {
            var count = await sync.SyncInboxAsync(triggerAnalysis: true);
            return Results.Ok(new { success = true, syncedCount = count });
        });

        // Calendar Sync
        integrations.MapPost("/google/calendar/sync", async (GoogleCalendarSyncService calSync) => 
        {
            try {
                var count = await calSync.SyncEventsAsync();
                return Results.Ok(new { success = true, syncedCount = count });
            } catch (Exception ex) {
                return Results.Problem($"Calendar sync failed: {ex.Message}");
            }
        });

        integrations.MapGet("/google/calendar/status", async (NoraDbContext db) => 
        {
            var eventCount = await db.CalendarEvents.CountAsync();
            var upcomingCount = await db.CalendarEvents.Where(e => e.StartTime >= DateTime.UtcNow).CountAsync();
            return Results.Ok(new { 
                totalEvents = eventCount, 
                upcomingEvents = upcomingCount,
                lastSynced = await db.AppSettings.FindAsync("CalendarLastSync") 
            });
        });

        // Get available calendars from Google
        integrations.MapGet("/google/calendar/list", async (GoogleCalendarSyncService calSync) => 
        {
            var calendars = await calSync.GetCalendarListAsync();
            return Results.Ok(calendars);
        });

        // Get/Set selected calendars
        integrations.MapGet("/google/calendar/selected", async (NoraDbContext db) => 
        {
            var setting = await db.AppSettings.FindAsync("SelectedCalendars");
            if (string.IsNullOrEmpty(setting?.Value))
                return Results.Ok(new List<string> { "primary" });
            
            try {
                var list = System.Text.Json.JsonSerializer.Deserialize<List<string>>(setting.Value);
                return Results.Ok(list ?? new List<string> { "primary" });
            } catch {
                return Results.Ok(new List<string> { "primary" });
            }
        });

        integrations.MapPost("/google/calendar/selected", async (SelectedCalendarsRequest request, NoraDbContext db) => 
        {
            var setting = await db.AppSettings.FindAsync("SelectedCalendars");
            if (setting == null)
            {
                setting = new AppSettings { Key = "SelectedCalendars" };
                db.AppSettings.Add(setting);
            }
            setting.Value = System.Text.Json.JsonSerializer.Serialize(request.CalendarIds);
            setting.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
            return Results.Ok(new { success = true, selected = request.CalendarIds });
        });

        // Calendar Events API
        app.MapGet("/api/events", async (NoraDbContext db, int? days) => 
        {
            var daysToShow = days ?? 30;
            var now = DateTime.UtcNow;
            var endDate = now.AddDays(daysToShow);
            
            var events = await db.CalendarEvents
                .Where(e => e.StartTime >= now && e.StartTime <= endDate)
                .OrderBy(e => e.StartTime)
                .ToListAsync();
                
            return Results.Ok(events);
        });

        app.MapGet("/api/events/today", async (NoraDbContext db) => 
        {
            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1);
            
            var events = await db.CalendarEvents
                .Where(e => e.StartTime >= today && e.StartTime < tomorrow)
                .OrderBy(e => e.StartTime)
                .ToListAsync();
                
            return Results.Ok(events);
        });

        app.MapGet("/api/events/upcoming", async (NoraDbContext db, int? count) => 
        {
            var limit = count ?? 10;
            var now = DateTime.UtcNow;
            
            var events = await db.CalendarEvents
                .Where(e => e.StartTime >= now)
                .OrderBy(e => e.StartTime)
                .Take(limit)
                .ToListAsync();
                
            return Results.Ok(events);
        });

        // Chat
        // Chat
        app.MapPost("/api/chat", async (ChatRequest request, AiAnalysisService ai) => 
        {
             Console.WriteLine($"[CHAT] Request received: {request.Message}");
             try 
             {
                 var response = await ai.ChatAsync(request.Message);
                 return Results.Ok(new { response });
             } 
             catch (Exception ex)
             {
                 Console.WriteLine($"[CHAT ERROR] {ex.GetType().Name}: {ex.Message} \nStack: {ex.StackTrace}");
                 if (ex.InnerException != null) Console.WriteLine($"[CHAT INNER ERROR] {ex.InnerException.Message}");
                 return Results.Problem(ex.Message);
             }
        });

        integrations.MapGet("/google/status", async (NoraDbContext db) => 
        {
            var refreshToken = await db.AppSettings.FindAsync("GoogleRefreshToken");
            var autoSync = await db.AppSettings.FindAsync("GoogleAutoSyncEnabled");
            var interval = await db.AppSettings.FindAsync("GoogleSyncInterval");
            
            return Results.Ok(new { 
                connected = refreshToken != null,
                lastSyncTime = (await db.AppSettings.FindAsync("GoogleLastSync"))?.UpdatedAt,
                autoSyncEnabled = autoSync?.Value?.ToLower() == "true",
                syncInterval = int.TryParse(interval?.Value, out var i) ? i : 15
            });
        });

        // ============ ANALYTICS ============
        var analytics = app.MapGroup("/api/analytics");
        
        analytics.MapGet("/stats", async (NoraDbContext db) => 
        {
            var logs = await db.AiUsageLogs.ToListAsync();
            var totalRequests = logs.Count;
            var totalCost = logs.Sum(l => l.CostUsd);
            var avgLatency = totalRequests > 0 ? logs.Average(l => (double)l.ResponseTimeMs) : 0;
            
            var modelBreakdown = logs
                .GroupBy(l => l.ModelName)
                .ToDictionary(g => g.Key, g => g.Count());
                
            return Results.Ok(new { 
                totalRequests, 
                totalCost, 
                avgLatency,
                modelBreakdown 
            });
        });

        analytics.MapGet("/throughput", async (NoraDbContext db, string? timeframe) => 
        {
            var days = timeframe == "30d" ? 30 : (timeframe == "24h" ? 1 : 7);
            var cutoff = DateTime.UtcNow.AddDays(-days);
            
            var logs = await db.AiUsageLogs
                .Where(l => l.Timestamp >= cutoff)
                .ToListAsync();
                
            var dailyData = logs
                .GroupBy(l => l.Timestamp.Date)
                .OrderBy(g => g.Key)
                .Select(g => new { 
                    date = g.Key.ToString("yyyy-MM-dd"), 
                    count = g.Count(),
                    cost = g.Sum(l => l.CostUsd)
                })
                .ToList();
                
            return Results.Ok(dailyData);
        });

        // ============ SYSTEM BACKUP ============
        var system = app.MapGroup("/api/system");
        
        system.MapGet("/backup", () => 
        {
            var dbPath = "nora.db";
            if (!System.IO.File.Exists(dbPath)) return Results.NotFound("Database not found");
            
            var bytes = System.IO.File.ReadAllBytes(dbPath);
            return Results.File(bytes, "application/x-sqlite3", $"nora_backup_{DateTime.Now:yyyyMMdd_HHmm}.db");
        });

        system.MapDelete("/reset-demo-data", async (NoraDbContext db) =>
        {
             // Clear transactional data but keep configuration
             db.Messages.RemoveRange(db.Messages);
             db.Contacts.RemoveRange(db.Contacts);
             db.CalendarEvents.RemoveRange(db.CalendarEvents);
             db.Obligations.RemoveRange(db.Obligations);
             db.Deadlines.RemoveRange(db.Deadlines);
             db.Tasks.RemoveRange(db.Tasks);
             db.AiAnalyses.RemoveRange(db.AiAnalyses);
             db.Attachments.RemoveRange(db.Attachments);
             db.AiUsageLogs.RemoveRange(db.AiUsageLogs);
             
             await db.SaveChangesAsync();
             return Results.Ok(new { message = "Demo data and transactional records cleared successfully." });
        });

        system.MapPost("/restore", async (IFormFile file, NoraDbContext db) => 
        {
            if (file == null || file.Length == 0) 
                return Results.BadRequest("No file uploaded.");

            var dbPath = "nora.db";
            
            // 1. Force release of file locks
            Microsoft.Data.Sqlite.SqliteConnection.ClearAllPools();
            
            // 2. Backup current just in case (optional, maybe overwrite a .bak)
            if (System.IO.File.Exists(dbPath))
            {
                System.IO.File.Copy(dbPath, "nora.db.bak", true);
            }

            // 3. Save new file
            try 
            {
                using var stream = System.IO.File.Create(dbPath);
                await file.CopyToAsync(stream);
                return Results.Ok(new { message = "Database restored successfully. Please refresh." });
            }
            catch (Exception ex)
            {
                return Results.Problem($"Failed to restore database: {ex.Message}. Try restarting the application if this persists.");
            }
        });

        app.Run();
    }
}

public record MessageUpdate(string? ProcessedAt, string? Importance, string? LifeDomain);
public record AnalyzeRequest(string? Instructions);

public record AiSettingsRequest(
    string Provider,
    string? Model,
    string? ApiKey,
    string? ApiEndpoint,
    decimal? Temperature,
    int? MaxTokens,
    bool? IsActive,
    bool? CrossProviderEnabled
);

public record AiTestRequest(
    string Provider,
    string? ApiKey,
    string? ApiEndpoint
);


public record AppSettingRequest(string Key, string Value);
public record BudgetModeRequest(string Mode);
public record ChatRequest(string Message);
public record DraftReplyRequest(string? Instructions);
public record SelectedCalendarsRequest(List<string> CalendarIds);
