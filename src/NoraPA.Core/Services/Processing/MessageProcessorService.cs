using Microsoft.Extensions.Logging;
using NoraPA.Core.Interfaces;
using NoraPA.Core.Models;
using NoraPA.Core.Models.AI;

namespace NoraPA.Core.Services.Processing;

/// <summary>
/// Service for processing messages through the AI extraction pipeline
/// </summary>
public class MessageProcessorService
{
    private readonly IAIExtractionService _aiService;
    private readonly ILogger<MessageProcessorService> _logger;

    public MessageProcessorService(
        IAIExtractionService aiService,
        ILogger<MessageProcessorService> logger)
    {
        _aiService = aiService;
        _logger = logger;
    }

    /// <summary>
    /// Process a message through the complete pipeline
    /// </summary>
    public async Task<ProcessingResult> ProcessMessageAsync(
        Message message,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Processing message {MessageId} from {Source}", 
                message.Id, message.Source);

            // Step 1: Extract information using AI
            var extraction = await _aiService.ExtractAsync(message, cancellationToken);
            
            _logger.LogInformation("AI extraction completed with confidence {Confidence}", 
                extraction.Confidence.ConfidenceScore);

            // Step 2: Create obligations from extraction
            var obligations = CreateObligations(message, extraction);
            
            _logger.LogInformation("Created {Count} obligations", obligations.Count);

            // Step 3: Create deadlines from extraction
            var deadlines = CreateDeadlines(message, extraction);
            
            _logger.LogInformation("Created {Count} deadlines", deadlines.Count);

            // Step 4: Create tasks from high-confidence mandatory obligations
            var tasks = CreateTasks(obligations, extraction);
            
            _logger.LogInformation("Auto-created {Count} tasks", tasks.Count);

            // Step 5: Update message with extracted information
            message.LifeDomain = extraction.Classification.LifeDomain;
            message.Importance = extraction.Classification.Importance;
            message.ProcessedAt = DateTime.UtcNow;

            return new ProcessingResult
            {
                Success = true,
                Extraction = extraction,
                Obligations = obligations,
                Deadlines = deadlines,
                Tasks = tasks,
                Message = "Processing completed successfully"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing message {MessageId}", message.Id);
            
            return new ProcessingResult
            {
                Success = false,
                Message = $"Processing failed: {ex.Message}"
            };
        }
    }

    private List<Obligation> CreateObligations(Message message, ExtractionSchema extraction)
    {
        var obligations = new List<Obligation>();

        foreach (var item in extraction.Obligations.Obligations)
        {
            var obligation = new Obligation
            {
                MessageId = message.Id,
                Action = item.Action,
                TriggerType = ParseTriggerType(item.Trigger),
                TriggerValue = item.Trigger,
                Mandatory = item.Mandatory,
                Consequence = item.ConsequenceIfIgnored,
                EstimatedTime = ParseEstimatedTime(item.EstimatedTime),
                Priority = item.Priority,
                ConfidenceScore = extraction.Confidence.ConfidenceScore,
                Status = "pending"
            };

            obligations.Add(obligation);
        }

        return obligations;
    }

    private List<Deadline> CreateDeadlines(Message message, ExtractionSchema extraction)
    {
        var deadlines = new List<Deadline>();

        // Absolute deadlines
        foreach (var item in extraction.Deadlines.AbsoluteDeadlines)
        {
            if (DateTime.TryParse(item.Date, out var deadlineDate))
            {
                var deadline = new Deadline
                {
                    MessageId = message.Id,
                    DeadlineType = "absolute",
                    DeadlineDate = deadlineDate,
                    Description = item.Description,
                    Critical = extraction.Classification.Importance == "critical",
                    Status = "active"
                };

                deadlines.Add(deadline);
            }
        }

        // Relative deadlines
        foreach (var item in extraction.Deadlines.RelativeDeadlines)
        {
            var deadline = new Deadline
            {
                MessageId = message.Id,
                DeadlineType = "relative",
                RelativeTrigger = item.TriggerEvent,
                RelativeDuration = ParseDuration(item.Duration),
                Description = item.Description,
                Critical = item.Critical,
                Status = "active"
            };

            deadlines.Add(deadline);
        }

        return deadlines;
    }

    private List<NoraTask> CreateTasks(List<Obligation> obligations, ExtractionSchema extraction)
    {
        var tasks = new List<NoraTask>();

        foreach (var obligation in obligations)
        {
            // Auto-create task if confidence >= 0.85 AND mandatory
            if (extraction.Confidence.ConfidenceScore >= 0.85m && obligation.Mandatory)
            {
                var task = new NoraTask
                {
                    Title = obligation.Action,
                    Description = obligation.Consequence,
                    DueDate = ParseTriggerDate(obligation.TriggerValue),
                    Priority = obligation.Priority,
                    Status = "pending"
                };

                tasks.Add(task);
                
                _logger.LogInformation("Auto-created task: {Title}", task.Title);
            }
        }

        return tasks;
    }

    private string ParseTriggerType(string trigger)
    {
        if (trigger.StartsWith("date:", StringComparison.OrdinalIgnoreCase))
            return "date";
        if (trigger.StartsWith("event:", StringComparison.OrdinalIgnoreCase))
            return "event";
        return "immediate";
    }

    private TimeSpan? ParseEstimatedTime(string? estimatedTime)
    {
        if (string.IsNullOrEmpty(estimatedTime))
            return null;

        // Simple parsing - can be enhanced
        if (estimatedTime.Contains("minute", StringComparison.OrdinalIgnoreCase))
        {
            var minutes = int.TryParse(new string(estimatedTime.Where(char.IsDigit).ToArray()), out var m) ? m : 15;
            return TimeSpan.FromMinutes(minutes);
        }
        if (estimatedTime.Contains("hour", StringComparison.OrdinalIgnoreCase))
        {
            var hours = int.TryParse(new string(estimatedTime.Where(char.IsDigit).ToArray()), out var h) ? h : 1;
            return TimeSpan.FromHours(hours);
        }

        return null;
    }

    private TimeSpan? ParseDuration(string duration)
    {
        // Parse durations like "45 days", "2 weeks", etc.
        var parts = duration.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length < 2)
            return null;

        if (!int.TryParse(parts[0], out var value))
            return null;

        var unit = parts[1].ToLowerInvariant();
        return unit switch
        {
            "day" or "days" => TimeSpan.FromDays(value),
            "week" or "weeks" => TimeSpan.FromDays(value * 7),
            "month" or "months" => TimeSpan.FromDays(value * 30),
            "year" or "years" => TimeSpan.FromDays(value * 365),
            _ => null
        };
    }

    private DateTime? ParseTriggerDate(string? triggerValue)
    {
        if (string.IsNullOrEmpty(triggerValue))
            return null;

        if (triggerValue.StartsWith("date:", StringComparison.OrdinalIgnoreCase))
        {
            var dateStr = triggerValue.Substring(5);
            if (DateTime.TryParse(dateStr, out var date))
                return date;
        }

        return null;
    }
}

/// <summary>
/// Result of message processing
/// </summary>
public class ProcessingResult
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public ExtractionSchema? Extraction { get; set; }
    public List<Obligation> Obligations { get; set; } = new();
    public List<Deadline> Deadlines { get; set; } = new();
    public List<NoraTask> Tasks { get; set; } = new();
}
