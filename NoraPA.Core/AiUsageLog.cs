using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NoraPA.Core;

[Table("ai_usage_logs")]
public class AiUsageLog
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Column("timestamp")]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    [Column("model_name")]
    [MaxLength(100)]
    public string ModelName { get; set; } = string.Empty;

    [Column("task_type")]
    public TaskType TaskType { get; set; }

    [Column("complexity")]
    public TaskComplexity Complexity { get; set; }

    [Column("input_tokens")]
    public int InputTokens { get; set; }

    [Column("output_tokens")]
    public int OutputTokens { get; set; }

    [Column("cost_usd")]
    public decimal CostUsd { get; set; }

    [Column("response_time_ms")]
    public int ResponseTimeMs { get; set; }

    [Column("quality_rating")]
    public int? QualityRating { get; set; } // 1-5 stars

    [Column("analysis_id")]
    public long? AnalysisId { get; set; } // Link back to specific analysis if applicable
}
