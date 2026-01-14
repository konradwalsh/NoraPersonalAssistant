using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace NoraPA.Core;

[Table("tasks")]
public class Task
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [ForeignKey("Obligation")]
    [Column("obligation_id")]
    public long? ObligationId { get; set; }

    [Required]
    [Column("title")]
    public string Title { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Column("due_date")]
    public DateTime? DueDate { get; set; }

    [Column("priority")]
    public int? Priority { get; set; }

    [Column("status")]
    [MaxLength(20)]
    public string Status { get; set; } = "pending";

    [Column("checklist")]
    public Dictionary<string, object>? Checklist { get; set; }

    [Column("context_link")]
    public string? ContextLink { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("completed_at")]
    public DateTime? CompletedAt { get; set; }

    // Navigation property
    [JsonIgnore]
    public virtual Obligation? Obligation { get; set; }
}