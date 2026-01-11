using System.Text.Json;

namespace NoraPA.Core.Models;

/// <summary>
/// Represents a deadline extracted from a message
/// </summary>
public class Deadline
{
    public long Id { get; set; }
    
    /// <summary>
    /// Reference to the source message
    /// </summary>
    public long MessageId { get; set; }
    public Message? Message { get; set; }
    
    /// <summary>
    /// Reference to the related obligation (optional)
    /// </summary>
    public long? ObligationId { get; set; }
    public Obligation? Obligation { get; set; }
    
    /// <summary>
    /// Type: 'absolute', 'relative', 'recurring'
    /// </summary>
    public required string DeadlineType { get; set; }
    
    /// <summary>
    /// Absolute deadline date (for absolute deadlines)
    /// </summary>
    public DateTime? DeadlineDate { get; set; }
    
    /// <summary>
    /// Trigger event for relative deadlines (e.g., "loss_or_damage")
    /// </summary>
    public string? RelativeTrigger { get; set; }
    
    /// <summary>
    /// Duration from trigger event (for relative deadlines)
    /// </summary>
    public TimeSpan? RelativeDuration { get; set; }
    
    /// <summary>
    /// Description of the deadline
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// Reminder configuration (JSON array of reminder offsets)
    /// Example: [{"offset": "2 weeks", "sent": false}, {"offset": "1 day", "sent": false}]
    /// </summary>
    public JsonDocument? Reminders { get; set; }
    
    /// <summary>
    /// Whether this deadline is critical
    /// </summary>
    public bool Critical { get; set; }
    
    /// <summary>
    /// Status: 'active', 'completed', 'expired', 'cancelled'
    /// </summary>
    public string Status { get; set; } = "active";
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
