using System.Text.Json;

namespace NoraPA.Core.Models;

/// <summary>
/// Represents a task auto-created from an obligation
/// </summary>
public class NoraTask
{
    public long Id { get; set; }
    
    /// <summary>
    /// Reference to the source obligation
    /// </summary>
    public long? ObligationId { get; set; }
    public Obligation? Obligation { get; set; }
    
    /// <summary>
    /// Task title
    /// </summary>
    public required string Title { get; set; }
    
    /// <summary>
    /// Task description
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// Due date
    /// </summary>
    public DateTime? DueDate { get; set; }
    
    /// <summary>
    /// Priority (1-5, where 1 is highest)
    /// </summary>
    public int Priority { get; set; }
    
    /// <summary>
    /// Status: 'pending', 'in_progress', 'completed', 'cancelled'
    /// </summary>
    public string Status { get; set; } = "pending";
    
    /// <summary>
    /// Checklist items (JSON array)
    /// Example: [{"text": "Download policy", "completed": false}, {"text": "Read terms", "completed": false}]
    /// </summary>
    public JsonDocument? Checklist { get; set; }
    
    /// <summary>
    /// Link back to the source message
    /// </summary>
    public string? ContextLink { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}
