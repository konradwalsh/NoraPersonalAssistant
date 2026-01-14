using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace NoraPA.Core;

[Table("obligations")]
public class Obligation
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [ForeignKey("Message")]
    [Column("message_id")]
    public long MessageId { get; set; }

    [Required]
    [Column("action")]
    public string Action { get; set; } = string.Empty;

    [Column("trigger_type")]
    [MaxLength(50)]
    public string? TriggerType { get; set; }

    [Column("trigger_value")]
    public string? TriggerValue { get; set; }

    [Column("mandatory")]
    public bool Mandatory { get; set; } = false;

    [Column("consequence")]
    public string? Consequence { get; set; }

    [Column("estimated_time")]
    public TimeSpan? EstimatedTime { get; set; }

    [Column("priority")]
    public int? Priority { get; set; }

    [Column("status")]
    [MaxLength(20)]
    public string Status { get; set; } = "pending";

    [Column("confidence_score")]
    public decimal? ConfidenceScore { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("completed_at")]
    public DateTime? CompletedAt { get; set; }

    // Navigation properties
    [JsonIgnore]
    public virtual Message Message { get; set; } = null!;
    public virtual ICollection<Deadline> Deadlines { get; set; } = new List<Deadline>();
    [JsonIgnore]
    public virtual Task? Task { get; set; }
}