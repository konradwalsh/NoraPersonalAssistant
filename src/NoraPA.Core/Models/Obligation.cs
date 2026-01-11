namespace NoraPA.Core.Models;

/// <summary>
/// Represents an extracted obligation or action item from a message
/// </summary>
public class Obligation
{
    public long Id { get; set; }
    
    /// <summary>
    /// Reference to the source message
    /// </summary>
    public long MessageId { get; set; }
    public Message? Message { get; set; }
    
    /// <summary>
    /// The action that must be taken
    /// </summary>
    public required string Action { get; set; }
    
    /// <summary>
    /// Type of trigger: 'immediate', 'date', 'event'
    /// </summary>
    public string? TriggerType { get; set; }
    
    /// <summary>
    /// Value of the trigger (date string, event description, etc.)
    /// </summary>
    public string? TriggerValue { get; set; }
    
    /// <summary>
    /// Whether this obligation is mandatory
    /// </summary>
    public bool Mandatory { get; set; }
    
    /// <summary>
    /// What happens if this obligation is ignored
    /// </summary>
    public string? Consequence { get; set; }
    
    /// <summary>
    /// Estimated time to complete this obligation
    /// </summary>
    public TimeSpan? EstimatedTime { get; set; }
    
    /// <summary>
    /// Priority level (1-5, where 1 is highest)
    /// </summary>
    public int Priority { get; set; }
    
    /// <summary>
    /// Status: 'pending', 'in_progress', 'completed', 'cancelled'
    /// </summary>
    public string Status { get; set; } = "pending";
    
    /// <summary>
    /// AI confidence score (0.00 - 1.00)
    /// </summary>
    public decimal ConfidenceScore { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    
    // Navigation properties
    public ICollection<Deadline> Deadlines { get; set; } = new List<Deadline>();
    public ICollection<NoraTask> Tasks { get; set; } = new List<NoraTask>();
}
