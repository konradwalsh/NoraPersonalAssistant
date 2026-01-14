using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace NoraPA.Core;

[Table("deadlines")]
public class Deadline
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [ForeignKey("Message")]
    [Column("message_id")]
    public long MessageId { get; set; }

    [ForeignKey("Obligation")]
    [Column("obligation_id")]
    public long? ObligationId { get; set; }

    [Column("deadline_type")]
    [MaxLength(20)]
    public string DeadlineType { get; set; } = "absolute";

    [Column("deadline_date")]
    public DateTime? DeadlineDate { get; set; }

    [Column("relative_trigger")]
    [MaxLength(255)]
    public string? RelativeTrigger { get; set; }

    [Column("relative_duration")]
    public TimeSpan? RelativeDuration { get; set; }

    [Column("description")]
    public string? Description { get; set; }

    [Column("reminders")]
    public Dictionary<string, object>? Reminders { get; set; }

    [Column("critical")]
    public bool Critical { get; set; } = false;

    [Column("status")]
    [MaxLength(20)]
    public string Status { get; set; } = "active";

    // Navigation properties
    [JsonIgnore]
    public virtual Message Message { get; set; } = null!;
    [JsonIgnore]
    public virtual Obligation? Obligation { get; set; }
}