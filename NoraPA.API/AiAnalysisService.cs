using OpenAI;
using OpenAI.Chat;
using System.Text.Json;
using NoraPA.Core;
using NoraPA.API.Services;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;
using System.Text;
using System.Net.Http;
using System.Net.Http.Json;

namespace NoraPA.API;

/// <summary>
/// Core service responsible for processing messages using Large Language Models (LLMs).
/// Handles task classification, model selection (smart routing), prompt engineering,
/// and parsing of structured JSON responses into domain entities (Obligations, Deadlines, etc.).
/// </summary>
public class AiAnalysisService
{
    private readonly ILogger<AiAnalysisService> _logger;
    private readonly TaskClassifier _taskClassifier;
    private readonly AiUsageTracker _usageTracker;
    private readonly bool _configDemoMode;
    private readonly IConfiguration _configuration;
    private readonly NoraDbContext _db;
    private readonly IHttpClientFactory _httpClientFactory;

    public async Task<string> ChatAsync(string userMessage, string? history = null)
    {
        // 1. Get Context (Simple RAG)
        var contextStr = await GetUserContextAsync();
        
        // Fetch Data
        var recentDeadlines = await _db.Deadlines.Where(d => d.Status == "active").OrderBy(d => d.DeadlineDate).Take(5).ToListAsync();
        var recentObligations = await _db.Obligations.Where(o => o.Status == "pending").OrderByDescending(o => o.Priority).Take(5).ToListAsync();
        var upcomingEvents = await _db.CalendarEvents.Where(e => e.StartTime >= DateTime.UtcNow).OrderBy(e => e.StartTime).Take(5).ToListAsync();
        var recentMessages = await _db.Messages.OrderByDescending(m => m.ReceivedAt).Take(5).Select(m => new { m.Subject, m.FromName, m.ReceivedAt }).ToListAsync();

        var ragContext = new StringBuilder();
        
        if (recentObligations.Any()) {
            ragContext.AppendLine("PENDING OBLIGATIONS:");
            foreach(var o in recentObligations) ragContext.AppendLine($"- [Priority {o.Priority}] {o.Action} ({o.TriggerValue})");
            ragContext.AppendLine();
        }

        if (recentDeadlines.Any()) {
            ragContext.AppendLine("UPCOMING DEADLINES:");
            foreach(var d in recentDeadlines) ragContext.AppendLine($"- {d.Description} (Due: {d.DeadlineDate:yyyy-MM-dd})");
            ragContext.AppendLine();
        }

        if (upcomingEvents.Any()) {
            ragContext.AppendLine("UPCOMING EVENTS:");
            foreach(var e in upcomingEvents) ragContext.AppendLine($"- {e.Title} at {e.StartTime:g} ({e.Location ?? "No Loc"})");
            ragContext.AppendLine();
        }

        if (recentMessages.Any()) {
            ragContext.AppendLine("RECENT EMAILS:");
            foreach(var m in recentMessages) ragContext.AppendLine($"- From {m.FromName}: '{m.Subject}' ({m.ReceivedAt:g})");
        }

        // 2. Build Messages
        var messages = new List<ChatMessage>
        {
            ChatMessage.CreateSystemMessage($"You are Nora, a highly intelligent personal assistant. You have access to the user's data.\n\nUSER IDENTITY:\n{contextStr}\n\nDATA CONTEXT:\n{ragContext}\n\nAnswer the user's question accurately based on this context. Be concise and helpful. if the user asks about something not in the context, politely say you don't see it in the recent data."),
        };
        
        // Add history if present (simplistic approach, ideally we parse a proper history object)
        if (!string.IsNullOrEmpty(history))
        {
             // For now, we assume history is just previous text, but ideally would be formatted
             // messages.Add(ChatMessage.CreateUserMessage($"Previous Context: {history}"));
        }

        messages.Add(ChatMessage.CreateUserMessage(userMessage));

        // 3. Get Provider - Check for task-specific routing first
        var chatProviderSetting = await _db.AppSettings.FindAsync("ChatProvider");
        AiSettings? targetSettings = null;
        
        if (!string.IsNullOrEmpty(chatProviderSetting?.Value))
        {
            // Use the specific Chat Provider
            targetSettings = await _db.AiSettings.FirstOrDefaultAsync(s => s.Provider == chatProviderSetting.Value);
            _logger.LogInformation("Using Task Router: ChatProvider = {Provider}", chatProviderSetting.Value);
        }
        
        if (targetSettings == null)
        {
            // Fallback to active provider
            targetSettings = await _db.AiSettings.FirstOrDefaultAsync(s => s.IsActive);
        }

        var apiKey = targetSettings?.ApiKey ?? _configuration["OpenAI:ApiKey"];
        var model = targetSettings?.Model ?? "gpt-4o-mini";
        var providerName = targetSettings?.Provider ?? "openai";

        string responseText = "I'm sorry, I couldn't process that.";

        // Demo Mode Check
        var demoSetting = await _db.AppSettings.FindAsync("DemoMode");
        bool isDemoMode = (demoSetting?.Value?.ToLower() == "true") || _configuration.GetValue<bool>("OpenAI:DemoMode");

        if (isDemoMode)
        {
            await System.Threading.Tasks.Task.Delay(1000); // Simulate typing
            return $"[DEMO MODE] I received your message: '{userMessage}'. \n\nI can see you have {recentObligations.Count} pending obligations and {recentDeadlines.Count} deadlines coming up.";
        }

        if (string.IsNullOrEmpty(apiKey) && providerName != "ollama") 
            throw new Exception($"AI Provider '{providerName}' not configured. Go to Settings > AI > {providerName} and add your API key.");

        // Execute (Refactor this execution logic later to shared method)
        if (providerName == "deepseek")
        {
             var client = new ChatClient(model, new System.ClientModel.ApiKeyCredential(apiKey), new OpenAIClientOptions { Endpoint = new Uri("https://api.deepseek.com") });
             var res = await client.CompleteChatAsync(messages);
             responseText = res.Value.Content[0].Text;
        }
        else if (providerName == "ollama")
        {
             var endpoint = targetSettings?.ApiEndpoint ?? "http://localhost:11434";
             using var httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(60) };
             var requestBody = new { 
                 model = model, 
                 messages = new object[] { 
                     new { role = "system", content = messages[0].Content[0].Text },
                     new { role = "user", content = userMessage } 
                 }, 
                 stream = false 
             };
             var res = await httpClient.PostAsJsonAsync($"{endpoint}/api/chat", requestBody);
             var result = await res.Content.ReadFromJsonAsync<JsonElement>();
             responseText = result.GetProperty("message").GetProperty("content").GetString() ?? "";
        }
        else 
        {
             // OpenAI / Default
             var client = new ChatClient(model, apiKey);
             var res = await client.CompleteChatAsync(messages);
             responseText = res.Value.Content[0].Text;
        }

        // Log Usage
        await _usageTracker.LogUsage(model, TaskType.GeneralChat, TaskComplexity.Simple, userMessage.Length, responseText.Length, TimeSpan.FromSeconds(1));

        return responseText;
    }

    public AiAnalysisService(
        IConfiguration configuration, 
        ILogger<AiAnalysisService> logger,
        TaskClassifier taskClassifier,
        AiUsageTracker usageTracker,
        NoraDbContext db,
        IHttpClientFactory httpClientFactory)
    {
        _configuration = configuration;
        // _defaultApiKey and _chatClient are no longer initialized here to allow dynamic switching and persistence
        _configDemoMode = configuration.GetValue<bool>("OpenAI:DemoMode");
        _taskClassifier = taskClassifier;
        _usageTracker = usageTracker;
        _logger = logger;
        _db = db;
        _httpClientFactory = httpClientFactory;
    }

    /// <summary>
    /// Generates a draft email reply based on the message and user context.
    /// </summary>
    public async Task<string> DraftReplyAsync(long messageId, string? instructions = null)
    {
        var message = await _db.Messages.FindAsync(messageId);
        if (message == null) throw new Exception("Message not found");

        var contextStr = await GetUserContextAsync();
        
        // Build Prompt
        var systemPrompt = $@"You are Nora, a professional personal assistant drafting an email reply for the user.
YOUR USER IDENTITY:
{contextStr}

Be concise, professional, and helpful. Mimic the user's likely tone based on context if obvious, otherwise stick to professional neutral. 
Do NOT include things like 'Subject:' in the body unless asked. Just write the email body.";

        if (!string.IsNullOrEmpty(instructions))
        {
            systemPrompt += $"\n\nUSER INSTRUCTIONS FOR THIS DRAFT:\n{instructions}";
        }

        var userPrompt = $@"Draft a reply to this email:
From: {message.FromName ?? message.FromAddress}
Subject: {message.Subject}
Body:
{message.BodyPlain ?? message.BodyHtml ?? "(No Content)"}";

        var messages = new List<ChatMessage>
        {
            ChatMessage.CreateSystemMessage(systemPrompt),
            ChatMessage.CreateUserMessage(userPrompt)
        };

        // Execution (Simplified version of ChatAsync)
        var activeSettings = await _db.AiSettings.FirstOrDefaultAsync(s => s.IsActive);
        var apiKey = activeSettings?.ApiKey ?? _configuration["OpenAI:ApiKey"];
        var model = activeSettings?.Model ?? "gpt-4o-mini";
        
        // Demo Mode Check
        var demoSetting = await _db.AppSettings.FindAsync("DemoMode");
        bool isDemoMode = (demoSetting?.Value?.ToLower() == "true") || _configDemoMode;

        if (isDemoMode) 
        {
            await System.Threading.Tasks.Task.Delay(1000);
            return $"[DEMO DRAFT]\nHi {message.FromName?.Split(' ')[0] ?? "there"},\n\nThanks for your email regarding '{message.Subject}'. I have received it and will get back to you shortly.\n\nBest regards,\n[User Name]";
        }

        if (string.IsNullOrEmpty(apiKey)) throw new Exception("AI Provider not configured.");

        string draft = "";

        if (activeSettings?.Provider == "deepseek")
        {
            var client = new ChatClient(model, new System.ClientModel.ApiKeyCredential(apiKey), new OpenAIClientOptions { Endpoint = new Uri("https://api.deepseek.com") });
            var res = await client.CompleteChatAsync(messages);
            draft = res.Value.Content[0].Text;
        }
        else if (activeSettings?.Provider == "ollama")
        {
            var endpoint = activeSettings?.ApiEndpoint ?? "http://localhost:11434";
            using var httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(60) };
            var requestBody = new { model = model, messages = new[] { new { role = "user", content = userPrompt }, new { role = "system", content = systemPrompt } }, stream = false };
             var res = await httpClient.PostAsJsonAsync($"{endpoint}/api/chat", requestBody);
             var result = await res.Content.ReadFromJsonAsync<JsonElement>();
             draft = result.GetProperty("message").GetProperty("content").GetString() ?? "";
        }
        else 
        {
             // OpenAI / Default
             var client = new ChatClient(model, apiKey);
             var res = await client.CompleteChatAsync(messages);
             draft = res.Value.Content[0].Text;
        }

        await _usageTracker.LogUsage(model, TaskType.GeneralChat, TaskComplexity.Medium, userPrompt.Length, draft.Length, TimeSpan.FromSeconds(2));

        return draft;
    }

    /// <summary>
    /// Analyzes a single message to extract intelligence.
    /// This method orchestrates the entire pipeline: context loading, model selection,
    /// prompt assembly, LLM execution, and response parsing.
    /// </summary>
    /// <param name="message">The message entity to analyze.</param>
    /// <param name="userInstructions">Optional specific instructions from the user to refine the analysis.</param>
    /// <returns>An AiAnalysis object containing the structured results.</returns>
    public async Task<AiAnalysis> AnalyzeMessageAsync(Message message, string? userInstructions = null)
    {
        _logger.LogInformation("Starting AI analysis for message {MessageId} - Subject: {Subject}", message.Id, message.Subject);
        
        string rawResponse = "";
        string contextStr = await GetUserContextAsync();
        AiSettings? activeSettings = null;
        string? apiKey = null;
        string selectedModelName = "gpt-4o-mini";
        int inputTokens = 0;
        int outputTokens = 0;

        try
        {
            // Check for task-specific routing (AnalysisProvider)
            var analysisProviderSetting = await _db.AppSettings.FindAsync("AnalysisProvider");
            
            if (!string.IsNullOrEmpty(analysisProviderSetting?.Value))
            {
                // Use the specific Analysis Provider
                activeSettings = await _db.AiSettings.FirstOrDefaultAsync(s => s.Provider == analysisProviderSetting.Value);
                _logger.LogInformation("Using Task Router: AnalysisProvider = {Provider}", analysisProviderSetting.Value);
            }
            
            if (activeSettings == null)
            {
                // Fallback to globally active provider
                activeSettings = await _db.AiSettings.FirstOrDefaultAsync(s => s.IsActive);
            }
            
            _logger.LogInformation("Active AI Provider: {Provider} (Model: {Model})", 
                activeSettings?.Provider ?? "None", activeSettings?.Model ?? "None");

            apiKey = activeSettings?.ApiKey;

            // Check runtime Demo Mode setting (combine Config + DB)
            var demoSetting = await _db.AppSettings.FindAsync("DemoMode");
            bool isDemoMode = (demoSetting?.Value?.ToLower() == "true") || _configDemoMode;

            var stopwatch = System.Diagnostics.Stopwatch.StartNew();
            
            // 1. Classify Task
            var complexity = _taskClassifier.ClassifyMessageAnalysis(message.BodyPlain ?? message.BodyHtml ?? "");
            
            // 2. Select Model based on Budget Mode
            var budgetModeSetting = await _db.AppSettings.FindAsync("AiBudgetMode");
            var budgetMode = Enum.TryParse<BudgetMode>(budgetModeSetting?.Value, out var mode) ? mode : BudgetMode.Balanced;
            selectedModelName = _taskClassifier.RecommendModel(complexity, budgetMode);
            var selectedModel = AiModelRegistry.GetModel(selectedModelName);
            
            _logger.LogInformation("Smart Routing: Classified as {Complexity}, selected {Model} ({Provider})", 
                complexity, selectedModelName, selectedModel?.Provider ?? "Unknown");

            // Mapping: If a specific provider is active, map the recommended model to that provider's equivalents
            if (activeSettings != null)
            {
                 var originalModel = selectedModelName;
                 selectedModelName = MapModelToProvider(originalModel, activeSettings.Provider, activeSettings.Model);
                 selectedModel = AiModelRegistry.GetModel(selectedModelName);
                 _logger.LogInformation("Smart Routing Remap: {Original} -> {Mapped} (Provider: {Provider})", 
                     originalModel, selectedModelName, activeSettings.Provider);
            }

            // Fallback to configuration if DB is empty (migration scenario)
            if (string.IsNullOrEmpty(apiKey) && activeSettings == null)
            {
                 apiKey = _configuration["OpenAI:ApiKey"];
            }

            // Fallback strategy
            if (isDemoMode)
            {
                _logger.LogInformation("Using DEMO MODE (Setting enabled)");
                rawResponse = GenerateDemoResponse(message);
                await System.Threading.Tasks.Task.Delay(1500);

                // Token estimation for demo
                inputTokens = (int)((message.BodyPlain?.Length ?? 0) * 0.25);
                outputTokens = (int)(rawResponse.Length * 0.25);
            }
            else if (string.IsNullOrEmpty(apiKey))
            {
                // NO valid key and NO active provider
                _logger.LogError("No active AI provider configured and no fallback API key found.");
                throw new Exception("No active AI provider configured. Please go to Settings and activate a provider (OpenAI, DeepSeek, etc.) first.");
            }
            else
            {
                // Dynamic client initialization using the persistent key
                // TODO: Switch client type based on activeSettings.Provider (OpenAI, Anthropic, Google, etc.)
                // For now, we default to OpenAI client structure but use the stored key
                
                var modelToUse = activeSettings?.Model ?? "gpt-4o"; 
                
                var linkContext = await FetchContentFromLinksAsync(message.BodyPlain ?? message.BodyHtml ?? "");
                var prompt = BuildAnalysisPrompt(message, contextStr, userInstructions);
                
                // Append link context to the user message part of the prompt
                var targetMsg = prompt.Last();
                if (targetMsg != null && !string.IsNullOrEmpty(linkContext))
                {
                    // This is a bit hacky since prompt is List<ChatMessage>, we'll update the last one
                    prompt[prompt.Count - 1] = ChatMessage.CreateUserMessage(targetMsg.Content[0].Text + linkContext);
                }

                // AI Execution Logic - Switch Based on Provider
                if (activeSettings?.Provider == "deepseek")
                {
                     // DeepSeek Cloud API Implementation
                     var client = new ChatClient(selectedModelName, new System.ClientModel.ApiKeyCredential(apiKey), new OpenAIClientOptions { Endpoint = new Uri("https://api.deepseek.com") });
                     
                     _logger.LogDebug("Calling DeepSeek Cloud API for message {MessageId}", message.Id);
                     var response = await client.CompleteChatAsync(prompt);

                     if (response.Value.Content.Count == 0) throw new Exception("No content received from DeepSeek");
                     rawResponse = response.Value.Content[0].Text;
                }
                else if (activeSettings?.Provider == "openrouter")
                {
                     // OpenRouter Implementation
                     var client = new ChatClient(selectedModelName, new System.ClientModel.ApiKeyCredential(apiKey), new OpenAIClientOptions { Endpoint = new Uri("https://openrouter.ai/api/v1") });
                     
                     _logger.LogDebug("Calling OpenRouter API for message {MessageId} with model {Model}", message.Id, selectedModelName);
                     var response = await client.CompleteChatAsync(prompt);

                     if (response.Value.Content.Count == 0) throw new Exception("No content received from OpenRouter");
                     rawResponse = response.Value.Content[0].Text;
                }
                else if (activeSettings?.Provider == "ollama")
                {
                     // Ollama Implementation
                     var endpoint = activeSettings?.ApiEndpoint ?? "http://localhost:11434";
                     using var httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(60) };
                     
                     var systemMsg = prompt[0].Content[0].Text;
                     var userMsg = prompt[1].Content[0].Text;

                     var requestBody = new
                     {
                         model = selectedModelName,
                         messages = new[] 
                         { 
                             new { role = "system", content = systemMsg },
                             new { role = "user", content = userMsg } 
                         },
                         stream = false
                     };
                     
                     _logger.LogDebug("Calling Ollama at {Endpoint} for model {Model}", endpoint, selectedModelName);
                     
                     var response = await httpClient.PostAsJsonAsync($"{endpoint}/api/chat", requestBody);
                     response.EnsureSuccessStatusCode();
                     
                     var result = await response.Content.ReadFromJsonAsync<JsonElement>();
                     rawResponse = result.GetProperty("message").GetProperty("content").GetString() ?? "";
                     
                     if (string.IsNullOrEmpty(rawResponse)) throw new Exception("Empty response from Ollama");
                }
                else if (activeSettings?.Provider == "openai" || (!string.IsNullOrEmpty(apiKey) && activeSettings == null))
                {
                     // OpenAI Implementation (Fallback for migration or explicit)
                     var client = new ChatClient(selectedModelName, apiKey); 
                     
                     _logger.LogDebug("Calling OpenAI for message {MessageId} using {Model}", message.Id, selectedModelName);
                     var response = await client.CompleteChatAsync(prompt);
    
                     if (response.Value.Content.Count == 0) throw new Exception("No content received from AI Provider");
                     rawResponse = response.Value.Content[0].Text;
                }
                else
                {
                    // Catch-all: If we are here, something is wrong with configuration, but to be safe, treat as Demo/Fallback
                    _logger.LogWarning("Execution fell through to catch-all. Defaulting to Demo response.");
                    rawResponse = GenerateDemoResponse(message);
                }
                
                _logger.LogDebug("AI response received, length: {Length} chars", rawResponse.Length);
                
                stopwatch.Stop();
                
                // 3. Track Usage & Cost
                // We track based on what we *wanted* to use to validate the savings logic
                // In production this would track the actual model used
                
                var inputLen = prompt.Sum(m => m.Content.Sum(c => c.Text.Length));
                inputTokens = (int)(inputLen * 0.25);
                outputTokens = (int)(rawResponse.Length * 0.25);
                
                await _usageTracker.LogUsage(
                    selectedModelName, 
                    TaskType.ComplexAnalysis, 
                    complexity, 
                    inputTokens, 
                    outputTokens, 
                    stopwatch.Elapsed);
            }
            
            _logger.LogDebug("Parsing analysis response for message {MessageId}", message.Id);
            var analysisResult = ParseAnalysisResponse(rawResponse);

            return new AiAnalysis
            {
                MessageId = message.Id,
                Summary = analysisResult.Summary?.GetRawText(),
                ObligationsAnalysis = analysisResult.Obligations_Analysis?.GetRawText(),
                DeadlinesAnalysis = analysisResult.Deadlines_Analysis?.GetRawText(),
                DocumentsAnalysis = analysisResult.Documents_Analysis?.GetRawText(),
                FinancialRecordsAnalysis = analysisResult.Financial_Records_Analysis?.GetRawText(),
                LifeDomainAnalysis = analysisResult.Life_Domain_Analysis?.GetRawText(),
                ImportanceAnalysis = analysisResult.Importance_Analysis?.GetRawText(),
                GeneralAnalysis = analysisResult.GeneralAnalysisText ?? analysisResult.General_Analysis?.GetRawText(),
                ContactsAnalysis = analysisResult.Contacts_Analysis?.GetRawText(),
                EventsAnalysis = analysisResult.Events_Analysis?.GetRawText(),
                ModelUsed = selectedModelName,
                CostUsd = (decimal)AiModelRegistry.CalculateCost(selectedModelName, inputTokens, outputTokens),
                RawResponse = rawResponse,
                Status = "completed",
                AnalyzedAt = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error analyzing message {MessageId}", message.Id);

            // Parse error to provide actionable feedback
            var errorMessage = ex.Message;
            var errorType = "unknown";
            var suggestion = "";

            if (errorMessage.Contains("429") || errorMessage.Contains("quota") || errorMessage.Contains("rate_limit"))
            {
                errorType = "quota_exceeded";
                suggestion = "AI provider limit reached. Go to Settings to switch providers or try again later.";
            }
            else if (errorMessage.Contains("401") || errorMessage.Contains("invalid_api_key") || errorMessage.Contains("Unauthorized"))
            {
                errorType = "auth_failed";
                suggestion = "API key is invalid or expired. Go to Settings to update your API key.";
            }
            else if (errorMessage.Contains("timeout") || errorMessage.Contains("timed out"))
            {
                errorType = "timeout";
                suggestion = "Request timed out. The AI provider may be experiencing issues. Try again.";
            }
            else if (errorMessage.Contains("connection") || errorMessage.Contains("network"))
            {
                errorType = "connection_error";
                suggestion = "Unable to connect to AI provider. Check your internet connection.";
            }

            var errorJson = System.Text.Json.JsonSerializer.Serialize(new
            {
                error = errorMessage,
                errorType,
                suggestion,
                provider = activeSettings?.Provider ?? "openai",
                model = selectedModelName,
                timestamp = DateTime.UtcNow
            });

            return new AiAnalysis
            {
                MessageId = message.Id,
                RawResponse = errorJson,
                Status = "failed",
                AnalyzedAt = DateTime.UtcNow
            };
        }
    }

    /// <summary>
    /// Executes the full analysis lifecycle, including persistence to the database.
    /// Manages transaction boundaries, status updates (processing/completed/failed),
    /// and ensures extracted entities (obligations, deadlines) are saved to their respective tables.
    /// </summary>
    /// <param name="messageId">ID of the message to analyze.</param>
    /// <param name="existingAnalysisId">Optional ID of an existing analysis record to update (for retries).</param>
    /// <param name="instructions">User-provided feedback loop instructions.</param>
    /// <returns>The updated AiAnalysis entity.</returns>
    public async System.Threading.Tasks.Task<AiAnalysis?> PerformFullAnalysisAsync(long messageId, long? existingAnalysisId = null, string? instructions = null)
    {
        var message = await _db.Messages.FindAsync(messageId);
        if (message == null) return null;

        // Cleanup stuck analyses for this message
        var stuckAnalyses = await _db.AiAnalyses
            .Where(a => a.MessageId == messageId && a.Status == "processing" && a.AnalyzedAt < DateTime.UtcNow.AddMinutes(-5))
            .ToListAsync();
        
        if (stuckAnalyses.Any())
        {
            _logger.LogWarning("Cleaning up {Count} stuck analyses for message {MessageId}", stuckAnalyses.Count, messageId);
            foreach (var stuck in stuckAnalyses)
            {
                stuck.Status = "failed";
                stuck.RawResponse = "{\"error\": \"Analysis timed out or service restarted\", \"errorType\": \"timeout\", \"suggestion\": \"The analysis took too long or was interrupted. Please try again.\"}";
            }
            await _db.SaveChangesAsync();
        }

        AiAnalysis analysis;
        if (existingAnalysisId.HasValue)
        {
            analysis = await _db.AiAnalyses.FindAsync(existingAnalysisId.Value) 
                       ?? new AiAnalysis { MessageId = messageId, Status = "processing", AnalyzedAt = DateTime.UtcNow };
        }
        else
        {
            analysis = new AiAnalysis
            {
                MessageId = messageId,
                Status = "processing",
                AnalyzedAt = DateTime.UtcNow
            };
            _db.AiAnalyses.Add(analysis);
            await _db.SaveChangesAsync();
        }

        try
        {
            var result = await AnalyzeMessageAsync(message, instructions);

            // Fetch again if context was lost or just use the local one
            // Update the analysis record
            analysis.Summary = result.Summary;
            analysis.ObligationsAnalysis = result.ObligationsAnalysis;
            analysis.DeadlinesAnalysis = result.DeadlinesAnalysis;
            analysis.DocumentsAnalysis = result.DocumentsAnalysis;
            analysis.FinancialRecordsAnalysis = result.FinancialRecordsAnalysis;
            analysis.LifeDomainAnalysis = result.LifeDomainAnalysis;
            analysis.ImportanceAnalysis = result.ImportanceAnalysis;
            analysis.GeneralAnalysis = result.GeneralAnalysis;
            analysis.ContactsAnalysis = result.ContactsAnalysis;
            analysis.EventsAnalysis = result.EventsAnalysis;
            analysis.RawResponse = result.RawResponse;
            analysis.ModelUsed = result.ModelUsed;
            analysis.CostUsd = result.CostUsd;
            analysis.Status = result.Status;
            analysis.AnalyzedAt = result.AnalyzedAt;

            if (result.Status == "completed")
            {
                // Extract and add obligations
                var extractedObligations = ExtractObligations(messageId, result.ObligationsAnalysis);
                if (extractedObligations.Any())
                {
                    _db.Obligations.AddRange(extractedObligations);
                }

                // Extract and add deadlines
                var extractedDeadlines = ExtractDeadlines(messageId, result.DeadlinesAnalysis);
                if (extractedDeadlines.Any())
                {
                    _db.Deadlines.AddRange(extractedDeadlines);
                }

                // Extract and add contacts (Auto-Process)
                var extractedContacts = ExtractContacts(messageId, result.ContactsAnalysis);
                foreach (var contact in extractedContacts)
                {
                    // More robust deduplication: Check if this person exists anywhere in the DB, not just for this message
                    // We compare primarily on Email (if available) or Name
                    bool exists = false;
                    
                    if (!string.IsNullOrEmpty(contact.Email))
                    {
                        exists = await _db.Contacts.AnyAsync(c => c.Email != null && c.Email.ToLower() == contact.Email.ToLower());
                    }
                    else
                    {
                         // If no email, check name
                         exists = await _db.Contacts.AnyAsync(c => c.Name.ToLower() == contact.Name.ToLower());
                    }

                    if (!exists)
                    {
                        _db.Contacts.Add(contact);
                    }
                    else
                    {
                        _logger.LogInformation("Skipping duplicate contact: {Name} ({Email})", contact.Name, contact.Email);
                    }
                }

                // Extract and add events (Auto-Process)
                var extractedEvents = ExtractEvents(messageId, result.EventsAnalysis);
                foreach (var evt in extractedEvents)
                {
                    if (!await _db.CalendarEvents.AnyAsync(e => e.SourceMessageId == messageId && e.Title == evt.Title && e.StartTime == evt.StartTime))
                    {
                        _db.CalendarEvents.Add(evt);
                    }
                }

                // Extract and add documents (Auto-Process)
                // We're mapping extracted 'documents' and 'links' to the single Attachment table
                // with appropriate types.
                var extractedAttachments = ExtractAttachments(messageId, result.DocumentsAnalysis);

                // Deduplicate based on URL (for links) or Name+MessageId (for inferred docs)
                // Note: Inferred docs usually don't have a URL yet, but links do.
                foreach (var att in extractedAttachments)
                {
                    if (!await _db.Attachments.AnyAsync(a => a.MessageId == messageId && a.Filename == att.Filename && (a.LocalPath == null || a.LocalPath == att.LocalPath)))
                    {
                        _db.Attachments.Add(att);
                    }
                }

                // ============ AUTO-TASK CREATION PIPELINE ============
                // Check if auto-task creation is enabled
                var autoTaskSetting = await _db.AppSettings.FindAsync("AutoTaskCreation");
                bool autoTaskEnabled = autoTaskSetting?.Value?.ToLower() != "false"; // Default to enabled
                
                if (autoTaskEnabled && extractedObligations.Any())
                {
                    _logger.LogInformation("Auto-Task Pipeline: Creating tasks from {Count} obligations for message {MessageId}", 
                        extractedObligations.Count, messageId);
                    
                    // Save obligations first to get their IDs
                    await _db.SaveChangesAsync();
                    
                    var createdTasks = await CreateTasksFromObligationsAsync(
                        extractedObligations, 
                        extractedDeadlines, 
                        message);
                    
                    if (createdTasks.Any())
                    {
                        _db.Tasks.AddRange(createdTasks);
                        _logger.LogInformation("Auto-Task Pipeline: Created {Count} tasks from obligations", createdTasks.Count);
                    }
                }

                // Update message metadata
                try {
                    if (result.Summary != null)
                    {
                        var summaryJson = JsonSerializer.Deserialize<JsonElement>(result.Summary);
                        if (summaryJson.TryGetProperty("classification", out var cls) == true) {
                            if (cls.TryGetProperty("importance", out var imp)) message.Importance = imp.GetString();
                        }
                    }
                    
                    if (result.LifeDomainAnalysis != null)
                    {
                        var domainJson = JsonSerializer.Deserialize<JsonElement>(result.LifeDomainAnalysis);
                        if (domainJson.TryGetProperty("domain", out var dom) == true) {
                            message.LifeDomain = dom.GetString();
                        }
                    }
                } catch { /* Best effort */ }
            }

            await _db.SaveChangesAsync();
            return analysis;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Background analysis failed for message {MessageId}", messageId);
            analysis.Status = "failed";
            analysis.RawResponse = $"Error: {ex.Message}";
            await _db.SaveChangesAsync();
            return analysis;
        }
    }

    private string GenerateDemoResponse(Message message)
    {
        var subject = message.Subject ?? "Unknown Subject";
        var sender = message.FromName ?? message.FromAddress ?? "Sender Name";
        
        // Generic demo data that structure-wise matches our expectations but is clearly not real
        return $$"""
{
    "summary": {
        "text": "This is a demonstration summary. The email from {{sender}} regarding '{{subject}}' has been analyzed. This placeholder text simulates an AI summary of key action items.",
        "classification": {
            "type": ["business", "compliance"],
            "importance": "high",
            "confidence": 92,
            "reason": "Simulated high-importance classification based on generic patterns."
        },
        "entities": {
            "people": ["Jane Doe", "John Smith"],
            "organizations": ["Acme Corp", "Global Services Ltd"],
            "identifiers": {
                "referenceNumber": "REF-12345-X",
                "invoiceId": "INV-2024-001"
            }
        }
    },
    "obligations_analysis": {
        "obligations": [
            {
                "action": "Review the attached compliance document",
                "trigger": "Upon receipt",
                "mandatory": true,
                "priority": "high",
                "confidence": 95,
                "consequence": "Potential compliance violation if ignored"
            },
            {
                "action": "Submit feedback via the portal",
                "trigger": "Within 5 business days",
                "mandatory": false,
                "priority": "medium",
                "confidence": 88,
                "consequence": "Feedback may not be included in the next cycle"
            }
        ]
    },
    "deadlines_analysis": {
        "deadlines": [
            {
                "description": "Feedback Submission Deadline",
                "date": null,
                "type": "relative",
                "relativeTrigger": "5 business days from receipt",
                "critical": false,
                "confidence": 90
            },
            {
                "description": "Quarterly Review Meeting",
                "date": "2025-12-15",
                "type": "absolute",
                "relativeTrigger": null,
                "critical": true,
                "confidence": 98
            }
        ]
    },
    "documents_analysis": {
        "documents": [
            {
                "name": "Q4_Compliance_Report.pdf",
                "type": "report",
                "requiredAction": "Review and Sign",
                "importance": "high",
                "confidence": 92
            }
        ],
        "links": []
    },
    "financial_records_analysis": {
        "coverage": {
            "amount": "1,500.00",
            "currency": "USD",
            "conditions": ["Standard Terms apply"],
            "exclusions": []
        },
        "risk": {
            "level": "low",
            "explanation": "Standard invoice for services rendered"
        }
    },
    "life_domain_analysis": {
        "domain": "Professional",
        "subcategory": "Administration",
        "storageRecommendation": {
            "category": "Work",
            "subfolder": "Compliance/2025",
            "retention": "5 years",
            "indexFields": ["referenceNumber", "fullText"]
        }
    },
    "importance_analysis": {
        "level": "High",
        "urgency": "Medium",
        "factors": ["Compliance requirement", "Manager request", "Quarterly deadline"]
    },
    "general_analysis": {
        "missingItems": [],
        "assumptions": ["User has access to the corporate portal"],
        "followUpNeeded": true,
        "confidence": 90
    }
}
""";
    }

    /// <summary>
    /// Constructs the complex prompt for the LLM.
    /// Combines the system persona, user identity context, specific output schema instructions,
    /// and the message content itself.
    /// </summary>
    private List<ChatMessage> BuildAnalysisPrompt(Message message, string userContext, string? userInstructions = null)
    {
        var systemPrompt = $@"You are Nora AI, a premium personal assistant. Analyze the email and provide a DEEPLY STRUCTURED JSON response following the extraction schema.
        
PERSONAL CONTEXT FOR TAILORED ANALYSIS:
{userContext}";

        if (!string.IsNullOrEmpty(userInstructions))
        {
            systemPrompt += $"\n\nCRITICAL: THE USER HAS PROVIDED SPECIFIC INSTRUCTIONS/CORRECTIONS FOR THIS ANALYSIS. PRIORITIZE THESE:\n{userInstructions}";
        }

        systemPrompt += @"
Return a JSON object with these exact keys:
1. ""summary"": { ""text"": ""string"", ""classification"": { ""type"": [""string""], ""importance"": ""high/medium/low"", ""confidence"": 0-100, ""reason"": ""string"" }, ""entities"": { ""people"": [""string""], ""organizations"": [""string""], ""identifiers"": { ""key"": ""value"" } } }
2. ""obligations_analysis"": { ""obligations"": [ { ""action"": ""string"", ""trigger"": ""string"", ""mandatory"": boolean, ""priority"": ""high/medium/low"", ""confidence"": 0-100, ""consequence"": ""string"" } ] }
3. ""deadlines_analysis"": { ""deadlines"": [ { ""description"": ""string"", ""date"": ""ISO8601 string or null"", ""type"": ""absolute/relative"", ""relativeTrigger"": ""string"", ""critical"": boolean, ""confidence"": 0-100 } ] }
4. ""documents_analysis"": { ""documents"": [ { ""name"": ""string"", ""type"": ""string"", ""requiredAction"": ""string"", ""importance"": ""high/medium/low"", ""confidence"": 0-100 } ], ""links"": [ { ""description"": ""string"", ""url"": ""string"", ""requiredAction"": ""string"", ""confidence"": 0-100 } ] }
5. ""financial_records_analysis"": { ""coverage"": { ""amount"": ""string"", ""currency"": ""string"", ""conditions"": [""string""], ""exclusions"": [""string""] }, ""risk"": { ""level"": ""high/medium/low"", ""explanation"": ""string"" } }
6. ""life_domain_analysis"": { ""domain"": ""string"", ""subcategory"": ""string"", ""storageRecommendation"": { ""category"": ""string"", ""subfolder"": ""string"", ""retention"": ""string"", ""indexFields"": [""string""] } }
7. ""importance_analysis"": { ""level"": ""string"", ""urgency"": ""string"", ""factors"": [""string""] }
8. ""general_analysis"": { ""missingItems"": [""string""], ""assumptions"": [""string""], ""followUpNeeded"": boolean, ""confidence"": 0-100 }
9. ""contacts_analysis"": { ""contacts"": [ { ""name"": ""string"", ""email"": ""string"", ""phone"": ""string"", ""organization"": ""string"", ""title"": ""string"", ""notes"": ""string"" } ] }
10. ""events_analysis"": { ""events"": [ { ""title"": ""string"", ""description"": ""string"", ""startTime"": ""ISO8601"", ""endTime"": ""ISO8601 or null"", ""location"": ""string"", ""isAllDay"": boolean } ] }

CRITICAL RULES:
- If no info for a section, return the structure with empty arrays/nulls.
- Do NOT include markdown code blocks (```json ... ```) in your response, return ONLY the raw JSON string.
- Do NOT list the current user (defined in USER IDENTITY) as a 'contact' or 'person' entity.
- Ensure all numbers (confidence, etc.) are integers 0-100.
- Dates should be YYYY-MM-DD format if possible.";

        var userPrompt = $@"Email Subject: {message.Subject ?? "No Subject"}
From: {message.FromName ?? message.FromAddress ?? "Unknown"}
Received: {message.ReceivedAt}

Body:
{message.BodyPlain ?? message.BodyHtml ?? "No body content"}";

        return new List<ChatMessage>
        {
            ChatMessage.CreateSystemMessage(systemPrompt),
            ChatMessage.CreateUserMessage(userPrompt)
        };
    }

    private AnalysisResult ParseAnalysisResponse(string response)
    {
        try
        {
            // Clean common AI noise if present
            var cleanJson = response.Trim();
            if (cleanJson.StartsWith("```json")) cleanJson = cleanJson.Substring(7);
            if (cleanJson.EndsWith("```")) cleanJson = cleanJson.Substring(0, cleanJson.Length - 3);
            cleanJson = cleanJson.Trim();

            var result = JsonSerializer.Deserialize<AnalysisResult>(cleanJson, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            return result ?? new AnalysisResult();
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Failed to parse AI response as JSON. Raw: {Raw}", response);
            return new AnalysisResult { GeneralAnalysisText = response };
        }
    }

    public List<Obligation> ExtractObligations(long messageId, string? obligationsJson)
    {
        if (string.IsNullOrEmpty(obligationsJson)) return new List<Obligation>();
        try
        {
            var data = JsonSerializer.Deserialize<JsonElement>(obligationsJson);
            if (data.TryGetProperty("obligations", out var obligationsList) && obligationsList.ValueKind == JsonValueKind.Array)
            {
                var result = new List<Obligation>();
                foreach (var item in obligationsList.EnumerateArray())
                {
                    result.Add(new Obligation
                    {
                        MessageId = messageId,
                        Action = item.GetProperty("action").GetString() ?? "Unknown Action",
                        TriggerValue = item.TryGetProperty("trigger", out var t) ? t.GetString() : null,
                        Mandatory = item.TryGetProperty("mandatory", out var m) && m.GetBoolean(),
                        Consequence = item.TryGetProperty("consequence", out var c) ? c.GetString() : null,
                        Priority = ParsePriority(item.TryGetProperty("priority", out var p) ? p.GetString() : null),
                        ConfidenceScore = item.TryGetProperty("confidence", out var conf) ? (decimal)conf.GetInt32() / 100 : null,
                        Status = "pending",
                        CreatedAt = DateTime.UtcNow
                    });
                }
                return result;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error extracting obligations from JSON");
        }
        return new List<Obligation>();
    }

    /// <summary>
    /// Auto-Task Creation Pipeline: Creates tasks from obligations with intelligent deadline matching.
    /// Maps priority levels, links back to source message, and attempts to find related deadlines.
    /// </summary>
    private async System.Threading.Tasks.Task<List<NoraPA.Core.Task>> CreateTasksFromObligationsAsync(
        List<Obligation> obligations, 
        List<Deadline> deadlines, 
        Message sourceMessage)
    {
        var tasks = new List<NoraPA.Core.Task>();
        
        foreach (var obligation in obligations)
        {
            // Skip if this obligation doesn't require a task (low confidence or already has a task)
            if (obligation.ConfidenceScore.HasValue && obligation.ConfidenceScore < 0.5m)
            {
                _logger.LogDebug("Skipping low-confidence obligation: {Action} (confidence: {Confidence})", 
                    obligation.Action, obligation.ConfidenceScore);
                continue;
            }
            
            // Check if a task already exists for this obligation
            if (obligation.Id > 0)
            {
                var existingTask = await _db.Tasks.AnyAsync(t => t.ObligationId == obligation.Id);
                if (existingTask) continue;
            }
            
            // Find the best matching deadline for this obligation
            DateTime? dueDate = null;
            if (deadlines.Any())
            {
                // Priority 1: Look for deadlines with matching keywords
                var actionWords = obligation.Action.ToLower().Split(' ', StringSplitOptions.RemoveEmptyEntries);
                var matchingDeadline = deadlines.FirstOrDefault(d => 
                    d.Description != null && actionWords.Any(w => 
                        d.Description.ToLower().Contains(w) && w.Length > 3));
                
                if (matchingDeadline != null && matchingDeadline.DeadlineDate.HasValue)
                {
                    dueDate = matchingDeadline.DeadlineDate;
                }
                else
                {
                    // Priority 2: Use the earliest absolute deadline if obligation is high priority
                    if (obligation.Priority <= 2 || obligation.Mandatory)
                    {
                        var earliestDeadline = deadlines
                            .Where(d => d.DeadlineDate.HasValue)
                            .OrderBy(d => d.DeadlineDate)
                            .FirstOrDefault();
                        dueDate = earliestDeadline?.DeadlineDate;
                    }
                }
            }
            
            // Build task description with context
            var descriptionParts = new List<string>();
            
            if (!string.IsNullOrEmpty(obligation.Consequence))
                descriptionParts.Add($"⚠️ **Risk if ignored:** {obligation.Consequence}");
            
            if (!string.IsNullOrEmpty(obligation.TriggerValue))
                descriptionParts.Add($"📅 **Trigger:** {obligation.TriggerValue}");
            
            descriptionParts.Add($"📧 **From email:** {sourceMessage.Subject}");
            descriptionParts.Add($"👤 **Sender:** {sourceMessage.FromName ?? sourceMessage.FromAddress}");
            
            var task = new NoraPA.Core.Task
            {
                ObligationId = obligation.Id > 0 ? obligation.Id : null,
                Title = TruncateWithEllipsis(obligation.Action, 200),
                Description = string.Join("\n", descriptionParts),
                DueDate = dueDate,
                Priority = MapObligationPriorityToTaskPriority(obligation.Priority, obligation.Mandatory),
                Status = "pending",
                ContextLink = $"/inbox?messageId={sourceMessage.Id}",
                CreatedAt = DateTime.UtcNow
            };
            
            tasks.Add(task);
            _logger.LogInformation("Auto-created task: '{Title}' (Priority: {Priority}, Due: {Due})", 
                task.Title, task.Priority, task.DueDate?.ToString("yyyy-MM-dd") ?? "None");
        }
        
        return tasks;
    }
    
    /// <summary>
    /// Maps obligation priority (1-5) to task priority (1-4) with mandatory flag boosting.
    /// </summary>
    private int MapObligationPriorityToTaskPriority(int? obligationPriority, bool isMandatory)
    {
        // Task priority: 1 = Critical, 2 = High, 3 = Medium, 4 = Low
        int basePriority = obligationPriority switch
        {
            1 => 1, // high -> Critical
            2 => 2, // medium-high -> High
            3 => 3, // medium -> Medium
            4 => 4, // medium-low -> Low
            5 => 4, // low -> Low
            _ => 3  // default to Medium
        };
        
        // Boost priority if mandatory
        if (isMandatory && basePriority > 1)
            basePriority--;
        
        return basePriority;
    }
    
    private string TruncateWithEllipsis(string text, int maxLength)
    {
        if (string.IsNullOrEmpty(text) || text.Length <= maxLength)
            return text;
        return text.Substring(0, maxLength - 3) + "...";
    }

    public List<Deadline> ExtractDeadlines(long messageId, string? deadlinesJson)
    {
        if (string.IsNullOrEmpty(deadlinesJson)) return new List<Deadline>();
        try
        {
            var data = JsonSerializer.Deserialize<JsonElement>(deadlinesJson);
            if (data.TryGetProperty("deadlines", out var deadlinesList) && deadlinesList.ValueKind == JsonValueKind.Array)
            {
                var result = new List<Deadline>();
                foreach (var item in deadlinesList.EnumerateArray())
                {
                    var deadline = new Deadline
                    {
                        MessageId = messageId,
                        Description = item.GetProperty("description").GetString(),
                        DeadlineType = item.TryGetProperty("type", out var t) ? t.GetString() ?? "absolute" : "absolute",
                        RelativeTrigger = item.TryGetProperty("relativeTrigger", out var rt) ? rt.GetString() : null,
                        Critical = item.TryGetProperty("critical", out var c) && c.GetBoolean(),
                        Status = "active"
                    };

                    if (item.TryGetProperty("date", out var d) && d.ValueKind == JsonValueKind.String && DateTime.TryParse(d.GetString(), out var dt))
                    {
                        deadline.DeadlineDate = DateTime.SpecifyKind(dt, DateTimeKind.Utc);
                    }

                    result.Add(deadline);
                }
                return result;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error extracting deadlines from JSON");
        }
        return new List<Deadline>();
    }

    public List<Contact> ExtractContacts(long messageId, string? contactsJson)
    {
        if (string.IsNullOrEmpty(contactsJson)) return new List<Contact>();
        try
        {
            var data = JsonSerializer.Deserialize<JsonElement>(contactsJson);
            if (data.TryGetProperty("contacts", out var contactsList) && contactsList.ValueKind == JsonValueKind.Array)
            {
                var result = new List<Contact>();
                foreach (var item in contactsList.EnumerateArray())
                {
                    result.Add(new Contact
                    {
                        SourceMessageId = (int?)messageId,
                        Name = item.GetProperty("name").GetString() ?? "Unknown",
                        Email = item.TryGetProperty("email", out var e) ? e.GetString() : null,
                        Phone = item.TryGetProperty("phone", out var p) ? p.GetString() : null,
                        Organization = item.TryGetProperty("organization", out var o) ? o.GetString() : null,
                        Title = item.TryGetProperty("title", out var t) ? t.GetString() : null,
                        Notes = item.TryGetProperty("notes", out var n) ? n.GetString() : null,
                        CreatedAt = DateTime.UtcNow
                    });
                }
                return result;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error extracting contacts from JSON");
        }
        return new List<Contact>();
    }

    public List<CalendarEvent> ExtractEvents(long messageId, string? eventsJson)
    {
        if (string.IsNullOrEmpty(eventsJson)) return new List<CalendarEvent>();
        try
        {
            var data = JsonSerializer.Deserialize<JsonElement>(eventsJson);
            if (data.TryGetProperty("events", out var eventsList) && eventsList.ValueKind == JsonValueKind.Array)
            {
                var result = new List<CalendarEvent>();
                foreach (var item in eventsList.EnumerateArray())
                {
                    if (item.TryGetProperty("startTime", out var st) && DateTime.TryParse(st.GetString(), out var startTime))
                    {
                        var evt = new CalendarEvent
                        {
                            SourceMessageId = (int?)messageId,
                            Title = item.GetProperty("title").GetString() ?? "Untitled Event",
                            Description = item.TryGetProperty("description", out var d) ? d.GetString() : null,
                            StartTime = DateTime.SpecifyKind(startTime, DateTimeKind.Utc),
                            Location = item.TryGetProperty("location", out var l) ? l.GetString() : null,
                            IsAllDay = item.TryGetProperty("isAllDay", out var ad) && ad.GetBoolean(),
                            Status = "confirmed",
                            CreatedAt = DateTime.UtcNow
                        };

                        if (item.TryGetProperty("endTime", out var et) && DateTime.TryParse(et.GetString(), out var endTime))
                        {
                            evt.EndTime = DateTime.SpecifyKind(endTime, DateTimeKind.Utc);
                        }

                        result.Add(evt);
                    }
                }
                return result;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error extracting events from JSON");
        }
        return new List<CalendarEvent>();
    }

    public List<Attachment> ExtractAttachments(long messageId, string? documentsJson)
    {
        if (string.IsNullOrEmpty(documentsJson)) return new List<Attachment>();
        try
        {
            var data = JsonSerializer.Deserialize<JsonElement>(documentsJson);
            var result = new List<Attachment>();

            // 1. Process "documents" (inferred files or references)
            if (data.TryGetProperty("documents", out var docList) && docList.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in docList.EnumerateArray())
                {
                    result.Add(new Attachment
                    {
                        MessageId = (int)messageId,
                        Filename = item.GetProperty("name").GetString() ?? "Unknown Document",
                        MimeType = "application/octet-stream", // Default as we don't know exact type
                        SizeBytes = 0, 
                        LocalPath = null, 
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            // 2. Process "links" (URLs)
            if (data.TryGetProperty("links", out var linkList) && linkList.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in linkList.EnumerateArray())
                {
                    result.Add(new Attachment
                    {
                        MessageId = (int)messageId,
                        Filename = item.TryGetProperty("description", out var d) ? d.GetString() ?? "Link" : "Link",
                        MimeType = "text/uri-list", // Marker for links
                        LocalPath = item.GetProperty("url").GetString(), // Store URL in LocalPath
                        SizeBytes = 0,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error extracting attachments/documents from JSON");
        }
        return new List<Attachment>();
    }

    private int ParsePriority(string? priority)
    {
        return priority?.ToLower() switch
        {
            "high" => 1,
            "medium" => 2,
            "low" => 3,
            _ => 2
        };
    }

    private string MapModelToProvider(string recommendedModel, string provider, string? defaultModel)
    {
        // If user forced a specific model, use it
        if (!string.IsNullOrEmpty(defaultModel)) return defaultModel;

        // If the recommended model already belongs to the provider, use it
        if (recommendedModel.Contains("gpt") && provider == "openai") return recommendedModel;
        if (recommendedModel.Contains("gemini") && provider == "google") return recommendedModel;
        if (recommendedModel.Contains("claude") && provider == "anthropic") return recommendedModel;
        if (recommendedModel.Contains("deepseek") && provider == "deepseek") return recommendedModel;
        
        // Map roles
        bool isPremium = recommendedModel.Contains("gpt-4o") || recommendedModel.Contains("pro") || recommendedModel.Contains("opus");
        bool isBudget = recommendedModel.Contains("mini") || recommendedModel.Contains("flash") || recommendedModel.Contains("haiku");

        return provider.ToLower() switch
        {
            "openai" => isBudget ? "gpt-4o-mini" : "gpt-4o",
            "deepseek" => "deepseek-chat", 
            "google" => isBudget ? "gemini-2.0-flash" : "gemini-1.5-pro",
            "anthropic" => isBudget ? "claude-3-haiku-20240307" : "claude-3-7-sonnet-20250219",
            "openrouter" => recommendedModel,
            "ollama" => defaultModel ?? "llama3", 
            _ => recommendedModel
        };
    }

    private class AnalysisResult
    {
        public JsonElement? Summary { get; set; }
        public JsonElement? Obligations_Analysis { get; set; }
        public JsonElement? Deadlines_Analysis { get; set; }
        public JsonElement? Documents_Analysis { get; set; }
        public JsonElement? Financial_Records_Analysis { get; set; }
        public JsonElement? Life_Domain_Analysis { get; set; }
        public JsonElement? Importance_Analysis { get; set; }
        public JsonElement? General_Analysis { get; set; }
        public JsonElement? Contacts_Analysis { get; set; }
        public JsonElement? Events_Analysis { get; set; }

        public string? GeneralAnalysisText { get; set; }
    }

    private async System.Threading.Tasks.Task<string> GetUserContextAsync()
    {
        var profile = await _db.UserProfiles.FirstOrDefaultAsync();
        if (profile == null) return "No specific user persona configured. Extract based on general context.";

        return $@"
USER IDENTITY & CONTEXT:
Name: {profile.FullName}
Biography: {profile.Bio}
Career/Work: {profile.CareerContext}
Life/Household: {profile.HouseholdContext}
Exclusion Rules: {profile.ExclusionInstructions}
Directives: {profile.AiDirectives}";
    }


    /// <summary>
    /// Scrapes content from URLs found within the message body to provide additional context to the AI.
    /// Useful for analyzing linked documents or policy pages.
    /// </summary>
    /// <param name="body">The message body text.</param>
    /// <returns>A string containing snippets of text from the linked external resources.</returns>
    private async System.Threading.Tasks.Task<string> FetchContentFromLinksAsync(string body)
    {
        if (string.IsNullOrEmpty(body)) return "";
        
        // Find URLs that look like documents or important resources
        var urls = Regex.Matches(body, @"(https?://[^\s""<>]+)")
                       .Cast<Match>()
                       .Select(m => m.Value)
                       .Distinct()
                       .Where(u => u.ToLower().Contains("policy") || 
                                   u.ToLower().Contains("download") || 
                                   u.ToLower().Contains("document") ||
                                   u.ToLower().Contains("statement") ||
                                   u.ToLower().Contains("terms"))
                       .Take(2) // Limit to 2 for safety
                       .ToList();

        if (!urls.Any()) return "";

        var sb = new StringBuilder("\n\n--- EXTERNAL RESOURCE CONTEXT ---\n");
        using var client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(8);
        client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoraAssistant/1.0");

        foreach (var url in urls)
        {
            try {
                _logger.LogInformation("Following link for AI context: {Url}", url);
                var response = await client.GetAsync(url);
                if (response.IsSuccessStatusCode) {
                    var content = await response.Content.ReadAsStringAsync();
                    // Strip HTML tags
                    var clean = Regex.Replace(content, "<.*?>", " ").Trim();
                    // Collapse whitespace
                    clean = Regex.Replace(clean, @"\s+", " ");
                    
                    if (clean.Length > 2500) clean = clean.Substring(0, 2500) + "...";
                    sb.Append($"\nRESOURCE: {url}\nCONTENT SNIPPET: {clean}\n");
                }
            } catch (Exception ex) {
                 _logger.LogWarning("Failed to fetch link context for {Url}: {Error}", url, ex.Message);
            }
        }
        return sb.ToString();
    }
}