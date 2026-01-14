namespace NoraPA.Core;

/// <summary>
/// Metadata about an AI model including costs and capabilities
/// </summary>
public class AiModelInfo
{
    public string Name { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    
    /// <summary>
    /// Cost per 1 million input tokens in USD
    /// </summary>
    public decimal InputCostPer1M { get; set; }
    
    /// <summary>
    /// Cost per 1 million output tokens in USD
    /// </summary>
    public decimal OutputCostPer1M { get; set; }
    
    /// <summary>
    /// Average response time in milliseconds
    /// </summary>
    public int AvgResponseTimeMs { get; set; }
    
    /// <summary>
    /// Quality tier (1-5, higher is better)
    /// </summary>
    public int QualityTier { get; set; }
    
    /// <summary>
    /// Task types this model excels at
    /// </summary>
    public List<TaskType> BestFor { get; set; } = new();
    
    /// <summary>
    /// Maximum context window in tokens
    /// </summary>
    public int MaxContextTokens { get; set; }
}

/// <summary>
/// Hard-coded registry of AI models and their characteristics
/// In production, this would be loaded from database or config
/// </summary>
public static class AiModelRegistry
{
    public static readonly List<AiModelInfo> Models = new()
    {
        // OpenAI Models
        new AiModelInfo
        {
            Name = "gpt-4o-mini",
            Provider = "OpenAI",
            InputCostPer1M = 0.15m,
            OutputCostPer1M = 0.60m,
            AvgResponseTimeMs = 800,
            QualityTier = 3,
            MaxContextTokens = 128000,
            BestFor = new() { TaskType.SimpleExtraction, TaskType.Classification, TaskType.Summarization }
        },
        new AiModelInfo
        {
            Name = "gpt-4o",
            Provider = "OpenAI",
            InputCostPer1M = 2.50m,
            OutputCostPer1M = 10.00m,
            AvgResponseTimeMs = 1500,
            QualityTier = 5,
            MaxContextTokens = 128000,
            BestFor = new() { TaskType.ComplexAnalysis, TaskType.MultiStepReasoning }
        },
        new AiModelInfo
        {
            Name = "gpt-4-turbo",
            Provider = "OpenAI",
            InputCostPer1M = 10.00m,
            OutputCostPer1M = 30.00m,
            AvgResponseTimeMs = 2000,
            QualityTier = 5,
            MaxContextTokens = 128000,
            BestFor = new() { TaskType.ComplexAnalysis, TaskType.MultiStepReasoning }
        },
        
        // Anthropic Models
        new AiModelInfo
        {
            Name = "claude-3-haiku",
            Provider = "Anthropic",
            InputCostPer1M = 0.25m,
            OutputCostPer1M = 1.25m,
            AvgResponseTimeMs = 600,
            QualityTier = 3,
            MaxContextTokens = 200000,
            BestFor = new() { TaskType.SimpleExtraction, TaskType.Classification }
        },
        new AiModelInfo
        {
            Name = "claude-3.5-sonnet",
            Provider = "Anthropic",
            InputCostPer1M = 3.00m,
            OutputCostPer1M = 15.00m,
            AvgResponseTimeMs = 1800,
            QualityTier = 5,
            MaxContextTokens = 200000,
            BestFor = new() { TaskType.ComplexAnalysis, TaskType.MultiStepReasoning }
        },
        
        // Google Models
        new AiModelInfo
        {
            Name = "gemini-1.5-flash",
            Provider = "Google",
            InputCostPer1M = 0.075m,
            OutputCostPer1M = 0.30m,
            AvgResponseTimeMs = 500,
            QualityTier = 2,
            MaxContextTokens = 1000000,
            BestFor = new() { TaskType.SimpleExtraction, TaskType.Classification, TaskType.Summarization }
        },
        new AiModelInfo
        {
            Name = "gemini-1.5-pro",
            Provider = "Google",
            InputCostPer1M = 1.25m,
            OutputCostPer1M = 5.00m,
            AvgResponseTimeMs = 1200,
            QualityTier = 4,
            MaxContextTokens = 2000000,
            BestFor = new() { TaskType.Summarization, TaskType.ComplexAnalysis }
        },
        new AiModelInfo
        {
            Name = "gemini-2.0-flash-exp",
            Provider = "Google",
            InputCostPer1M = 0.00m, // Free in experimental
            OutputCostPer1M = 0.00m,
            AvgResponseTimeMs = 600,
            QualityTier = 3,
            MaxContextTokens = 1000000,
            BestFor = new() { TaskType.SimpleExtraction, TaskType.Summarization }
        }
    };
    
    public static AiModelInfo? GetModel(string name)
    {
        return Models.FirstOrDefault(m => m.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
    }
    
    public static List<AiModelInfo> GetModelsFor(TaskType taskType)
    {
        return Models.Where(m => m.BestFor.Contains(taskType)).OrderBy(m => m.InputCostPer1M).ToList();
    }
    
    public static decimal CalculateCost(string modelName, int inputTokens, int outputTokens)
    {
        var model = GetModel(modelName);
        if (model == null) return 0;
        
        var inputCost = (inputTokens / 1_000_000m) * model.InputCostPer1M;
        var outputCost = (outputTokens / 1_000_000m) * model.OutputCostPer1M;
        
        return inputCost + outputCost;
    }
}
