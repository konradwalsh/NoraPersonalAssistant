using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NoraPA.Core;

[Table("ai_settings")]
public class AiSettings
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("provider")]
    [MaxLength(50)]
    public string Provider { get; set; } = "openai"; // openai, anthropic, google, ollama

    [Column("model")]
    [MaxLength(100)]
    public string? Model { get; set; }

    [Column("api_key")]
    public string? ApiKey { get; set; } // Encrypted in production

    [Column("api_endpoint")]
    public string? ApiEndpoint { get; set; } // For custom endpoints like Ollama

    [Column("temperature")]
    public decimal Temperature { get; set; } = 0.7m;

    [Column("max_tokens")]
    public int MaxTokens { get; set; } = 4096;

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("cross_provider_enabled")]
    public bool CrossProviderEnabled { get; set; } = false;

    [Column("budget_mode")]
    public BudgetMode BudgetMode { get; set; } = BudgetMode.Balanced;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class AiProviderConfig
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Recommendation { get; set; } = string.Empty;
    public List<AiModelConfig> Models { get; set; } = new();
    public bool RequiresApiKey { get; set; } = true;
    public bool SupportsCustomEndpoint { get; set; } = false;
    public string DefaultEndpoint { get; set; } = string.Empty;
    public string? SignUpUrl { get; set; }
}

public class AiModelConfig
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int ContextWindow { get; set; }
    public bool IsRecommended { get; set; } = false;
}

public class AiUsageStats
{
    public long TokensUsed { get; set; }
    public long TokensRemaining { get; set; }
    public decimal CostMtd { get; set; }
    public int AnalysesCompleted { get; set; }
    public int AnalysesFailed { get; set; }
    public decimal SuccessRate { get; set; }
}
