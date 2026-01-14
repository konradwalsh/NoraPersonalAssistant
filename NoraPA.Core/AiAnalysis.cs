using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace NoraPA.Core;

[Table("ai_analyses")]
public class AiAnalysis
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [ForeignKey("Message")]
    [Column("message_id")]
    public long MessageId { get; set; }

    [Column("summary")]
    public string? Summary { get; set; }

    [Column("obligations_analysis")]
    public string? ObligationsAnalysis { get; set; }

    [Column("deadlines_analysis")]
    public string? DeadlinesAnalysis { get; set; }

    [Column("documents_analysis")]
    public string? DocumentsAnalysis { get; set; }

    [Column("financial_records_analysis")]
    public string? FinancialRecordsAnalysis { get; set; }

    [Column("life_domain_analysis")]
    public string? LifeDomainAnalysis { get; set; }

    [Column("importance_analysis")]
    public string? ImportanceAnalysis { get; set; }

    [Column("general_analysis")]
    public string? GeneralAnalysis { get; set; }

    [Column("contacts_analysis")]
    public string? ContactsAnalysis { get; set; }

    [Column("events_analysis")]
    public string? EventsAnalysis { get; set; }

    [Column("raw_response")]
    public string? RawResponse { get; set; }

    [Column("analyzed_at")]
    public DateTime AnalyzedAt { get; set; } = DateTime.UtcNow;

    [Column("status")]
    [MaxLength(20)]
    public string Status { get; set; } = "pending";

    [Column("task_complexity")]
    public TaskComplexity Complexity { get; set; } = TaskComplexity.Medium;

    [Column("model_used")]
    [MaxLength(100)]
    public string? ModelUsed { get; set; }

    [Column("cost_usd")]
    public decimal CostUsd { get; set; }

    [Column("processing_time_ms")]
    public int ProcessingTimeMs { get; set; }

    // Navigation property
    [JsonIgnore]
    public virtual Message Message { get; set; } = null!;
}