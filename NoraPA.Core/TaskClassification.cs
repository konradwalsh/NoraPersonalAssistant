namespace NoraPA.Core;

/// <summary>
/// Classification of AI task complexity to determine appropriate model selection
/// </summary>
public enum TaskComplexity
{
    /// <summary>
    /// Simple extraction tasks - dates, names, basic pattern matching
    /// </summary>
    Simple = 1,
    
    /// <summary>
    /// Medium complexity - classification, summarization
    /// </summary>
    Medium = 2,
    
    /// <summary>
    /// Complex analysis requiring reasoning and nuance
    /// </summary>
    Complex = 3,
    
    /// <summary>
    /// Multi-step reasoning requiring deep thinking
    /// </summary>
    VeryComplex = 4
}

/// <summary>
/// Types of AI tasks that can be performed
/// </summary>
public enum TaskType
{
    SimpleExtraction,
    Classification,
    Summarization,
    ComplexAnalysis,
    MultiStepReasoning,
    GeneralChat
}

/// <summary>
/// User preference for balancing cost vs quality
/// </summary>
public enum BudgetMode
{
    /// <summary>
    /// Always use best/most capable model
    /// </summary>
    Premium,
    
    /// <summary>
    /// Use cheaper models when appropriate based on task type
    /// </summary>
    Balanced,
    
    /// <summary>
    /// Maximize savings, accept some quality tradeoff
    /// </summary>
    Economy
}
