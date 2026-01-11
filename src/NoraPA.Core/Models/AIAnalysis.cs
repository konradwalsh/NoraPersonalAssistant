using System.Text.Json;

namespace NoraPA.Core.Models;

/// <summary>
/// Represents an AI analysis of a message (for caching and cost tracking)
/// </summary>
public class AIAnalysis
{
    public long Id { get; set; }
    
    /// <summary>
    /// Reference to the analyzed message
    /// </summary>
    public long MessageId { get; set; }
    public Message? Message { get; set; }
    
    /// <summary>
    /// AI provider: 'Claude', 'OpenAI', 'Gemini', 'DeepSeek', 'Ollama'
    /// </summary>
    public required string Provider { get; set; }
    
    /// <summary>
    /// Model used
    /// </summary>
    public required string Model { get; set; }
    
    /// <summary>
    /// Number of prompt tokens used
    /// </summary>
    public int PromptTokens { get; set; }
    
    /// <summary>
    /// Number of completion tokens used
    /// </summary>
    public int CompletionTokens { get; set; }
    
    /// <summary>
    /// Cost in USD
    /// </summary>
    public decimal Cost { get; set; }
    
    /// <summary>
    /// Full extraction result (8-section schema as JSON)
    /// </summary>
    public JsonDocument? ExtractionResult { get; set; }
    
    /// <summary>
    /// Confidence scores for each section (JSON object)
    /// </summary>
    public JsonDocument? ConfidenceScores { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
