using NoraPA.Core;



namespace NoraPA.API.Services;

/// <summary>
/// Service that classifies AI tasks to determine complexity and recommend appropriate models
/// </summary>
public class TaskClassifier
{
    private readonly ILogger<TaskClassifier> _logger;
    
    public TaskClassifier(ILogger<TaskClassifier> logger)
    {
        _logger = logger;
    }
    
    /// <summary>
    /// Classifies a task based on type, content length, and complexity indicators
    /// </summary>
    public TaskComplexity ClassifyMessageAnalysis(string content, string? instructions = null)
    {
        var combinedText = $"{content} {instructions}".ToLower();
        
        // Very simple heuristics for initial implementation
        // TODO: Replace with ML model or more sophisticated analysis
        
        // Check content length
        if (content.Length < 300)
        {
            _logger.LogDebug("Short content ({Length} chars) - classifying as Simple", content.Length);
            return TaskComplexity.Simple;
        }
        
        // Check for complex reasoning indicators
        var complexKeywords = new[]
        {
            "analyze",
            "why",
            "how does",
            "reasoning",
            "consequence",
            "risk",
            "compare",
            "evaluate",
            "justify",
            "implication"
        };
        
        var complexCount = complexKeywords.Count(k => combinedText.Contains(k));
        
        if (complexCount >= 3)
        {
            _logger.LogDebug("Multiple complex indicators found - classifying as VeryComplex");
            return TaskComplexity.VeryComplex;
        }
        
        if (complexCount >= 1 || content.Length > 2000)
        {
            _logger.LogDebug("Some complexity indicators - classifying as Complex");
            return TaskComplexity.Complex;
        }
        
        // Check for simple extraction patterns
        var simpleKeywords = new[] {  "extract", "list", "find", "identify", "what is" };
        if (simpleKeywords.Any(k => combinedText.Contains(k)))
        {
            _logger.LogDebug("Simple extraction pattern detected - classifying as Simple");
            return TaskComplexity.Simple;
        }
        
        // Default to medium
        _logger.LogDebug("No clear indicators - defaulting to Medium complexity");
        return TaskComplexity.Medium;
    }
    
    /// <summary>
    /// Determines the task type based on what analysis is being requested
    /// </summary>
    public TaskType DetermineTaskType(string analysisType)
    {
        return analysisType.ToLower() switch
        {
            "extraction" or "extract" => TaskType.SimpleExtraction,
            "classification" or "classify" or "categorize" => TaskType.Classification,
            "summary" or "summarize" => TaskType.Summarization,
            "analysis" or "analyze" => TaskType.ComplexAnalysis,
            "reasoning" or "reason" or "think" => TaskType.MultiStepReasoning,
            _ => TaskType.Summarization // Default
        };
    }
    
    /// <summary>
    /// Recommends a model based on task complexity and user budget mode
    /// </summary>
    public string RecommendModel(TaskComplexity complexity, BudgetMode budgetMode = BudgetMode.Balanced)
    {
        _logger.LogInformation("Recommending model for {Complexity} task with {BudgetMode} mode", complexity, budgetMode);
        
        return (complexity, budgetMode) switch
        {
            // Premium mode - always use best
            (_, BudgetMode.Premium) => "gpt-4o",
            
            // Economy mode - always use cheapest
            (TaskComplexity.Simple, BudgetMode.Economy) => "gemini-1.5-flash",
            (TaskComplexity.Medium, BudgetMode.Economy) => "gpt-4o-mini",
            (TaskComplexity.Complex, BudgetMode.Economy) => "gpt-4o-mini",
            (TaskComplexity.VeryComplex, BudgetMode.Economy) => "gpt-4o", // Can't compromise on very complex
            
            // Balanced mode - smart selection
            (TaskComplexity.Simple, BudgetMode.Balanced) => "gemini-1.5-flash",
            (TaskComplexity.Medium, BudgetMode.Balanced) => "gpt-4o-mini",
            (TaskComplexity.Complex, BudgetMode.Balanced) => "gpt-4o",
            (TaskComplexity.VeryComplex, BudgetMode.Balanced) => "gpt-4o",
            
            _ => "gpt-4o-mini" // Fallback
        };
    }
    
    /// <summary>
    /// Estimates cost savings from using recommended model vs. always using premium
    /// </summary>
    public decimal EstimateSavings(TaskComplexity complexity, BudgetMode budgetMode, int estimatedInputTokens = 1000, int estimatedOutputTokens = 500)
    {
        var recommendedModel = RecommendModel(complexity, budgetMode);
        var premiumModel = "gpt-4o";
        
        var recommendedCost = AiModelRegistry.CalculateCost(recommendedModel, estimatedInputTokens, estimatedOutputTokens);
        var premiumCost = AiModelRegistry.CalculateCost(premiumModel, estimatedInputTokens, estimatedOutputTokens);
        
        return premiumCost - recommendedCost;
    }
}
