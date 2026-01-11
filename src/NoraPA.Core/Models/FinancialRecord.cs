using System.Text.Json;

namespace NoraPA.Core.Models;

/// <summary>
/// Represents financial or legal significance extracted from a message
/// </summary>
public class FinancialRecord
{
    public long Id { get; set; }
    
    /// <summary>
    /// Reference to the source message
    /// </summary>
    public long MessageId { get; set; }
    public Message? Message { get; set; }
    
    /// <summary>
    /// Type: 'coverage', 'payment', 'refund', 'fine', 'premium', 'deductible'
    /// </summary>
    public required string RecordType { get; set; }
    
    /// <summary>
    /// Amount
    /// </summary>
    public decimal Amount { get; set; }
    
    /// <summary>
    /// Currency code (ISO 4217)
    /// </summary>
    public string Currency { get; set; } = "EUR";
    
    /// <summary>
    /// Conditions that apply (JSON array)
    /// </summary>
    public JsonDocument? Conditions { get; set; }
    
    /// <summary>
    /// Exclusions that apply (JSON array)
    /// </summary>
    public JsonDocument? Exclusions { get; set; }
    
    /// <summary>
    /// Risk level: 'high', 'medium', 'low'
    /// </summary>
    public string? RiskLevel { get; set; }
    
    /// <summary>
    /// Explanation of the risk
    /// </summary>
    public string? RiskExplanation { get; set; }
    
    /// <summary>
    /// Valid from date
    /// </summary>
    public DateTime? ValidFrom { get; set; }
    
    /// <summary>
    /// Valid until date
    /// </summary>
    public DateTime? ValidUntil { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
