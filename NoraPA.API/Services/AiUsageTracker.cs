using Microsoft.EntityFrameworkCore;
using NoraPA.Core;

namespace NoraPA.API.Services;

/// <summary>
/// Tracks AI model usage, costs, and provides analytics
/// </summary>
public class AiUsageTracker
{
    private readonly ILogger<AiUsageTracker> _logger;
    private readonly IServiceScopeFactory _scopeFactory;
    
    public AiUsageTracker(ILogger<AiUsageTracker> logger, IServiceScopeFactory scopeFactory)
    {
        _logger = logger;
        _scopeFactory = scopeFactory;
    }
    
    /// <summary>
    /// Log an AI model usage event
    /// </summary>
    public async System.Threading.Tasks.Task LogUsage(string modelName, TaskType taskType, TaskComplexity complexity, 
        int inputTokens, int outputTokens, TimeSpan responseTime, int? qualityRating = null)
    {
        var cost = AiModelRegistry.CalculateCost(modelName, inputTokens, outputTokens);
        
        try 
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<NoraDbContext>();
            
            var record = new AiUsageLog
            {
                Timestamp = DateTime.UtcNow,
                ModelName = modelName,
                TaskType = taskType,
                Complexity = complexity,
                InputTokens = inputTokens,
                OutputTokens = outputTokens,
                CostUsd = cost,
                ResponseTimeMs = (int)responseTime.TotalMilliseconds,
                QualityRating = qualityRating
            };
            
            db.AiUsageLogs.Add(record);
            await db.SaveChangesAsync();
            
            _logger.LogInformation(
                "AI Usage: {Model} for {TaskType} ({Complexity}) - {InputTokens}in/{OutputTokens}out tokens, ${Cost:F4}, {Time}ms",
                modelName, taskType, complexity, inputTokens, outputTokens, cost, record.ResponseTimeMs);
        }
        catch (Exception ex)
        {
             _logger.LogError(ex, "Failed to log AI usage to database");
        }
    }
    
    /// <summary>
    /// Get usage statistics for a time period
    /// </summary>
    public async Task<UsageStats> GetStats(DateTime? since = null)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<NoraDbContext>();
        
        var startDate = since ?? DateTime.UtcNow.AddMonths(-1);
        var relevantRecords = await db.AiUsageLogs
            .Where(r => r.Timestamp >= startDate)
            .ToListAsync();
        
        if (!relevantRecords.Any())
        {
            return new UsageStats
            {
                TotalCost = 0,
                TotalRequests = 0,
                Period = $"Since {startDate:yyyy-MM-dd}"
            };
        }
        
        // Calculate what would have been spent if always using gpt-4o
        var baselineCost = relevantRecords.Sum(r => 
            AiModelRegistry.CalculateCost("gpt-4o", r.InputTokens, r.OutputTokens));
        
        return new UsageStats
        {
            TotalCost = relevantRecords.Sum(r => r.CostUsd),
            BaselineCost = baselineCost,
            TotalSavings = baselineCost - relevantRecords.Sum(r => r.CostUsd),
            TotalRequests = relevantRecords.Count,
            AvgResponseTimeMs = (int)relevantRecords.Average(r => r.ResponseTimeMs),
            ModelBreakdown = relevantRecords.GroupBy(r => r.ModelName)
                .ToDictionary(g => g.Key, g => g.Count()),
            TaskTypeBreakdown = relevantRecords.GroupBy(r => r.TaskType)
                .ToDictionary(g => g.Key.ToString(), g => g.Count()),
            Period = $"{startDate:yyyy-MM-dd} to {DateTime.UtcNow:yyyy-MM-dd}"
        };
    }
    
    /// <summary>
    /// Get recent usage records
    /// </summary>
    public async Task<List<AiUsageLog>> GetRecentUsage(int count = 50)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<NoraDbContext>();
        
        return await db.AiUsageLogs
            .OrderByDescending(r => r.Timestamp)
            .Take(count)
            .ToListAsync();
    }
}

public class UsageStats
{
    public decimal TotalCost { get; set; }
    public decimal BaselineCost { get; set; }
    public decimal TotalSavings { get; set; }
    public int TotalRequests { get; set; }
    public int AvgResponseTimeMs { get; set; }
    public Dictionary<string, int> ModelBreakdown { get; set; } = new();
    public Dictionary<string, int> TaskTypeBreakdown { get; set; } = new();
    public string Period { get; set; } = string.Empty;
}
