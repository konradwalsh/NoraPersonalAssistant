using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NoraPA.Core;

[Table("messages")]
public class Message
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("source")]
    [MaxLength(50)]
    public string Source { get; set; } = string.Empty;

    [Required]
    [Column("source_id")]
    [MaxLength(255)]
    public string SourceId { get; set; } = string.Empty;

    [Column("from_address")]
    [MaxLength(255)]
    public string? FromAddress { get; set; }

    [Column("from_name")]
    [MaxLength(255)]
    public string? FromName { get; set; }

    [Column("to_addresses")]
    public string[]? ToAddresses { get; set; }

    [Column("subject")]
    public string? Subject { get; set; }

    [Column("body_plain")]
    public string? BodyPlain { get; set; }

    [Column("body_html")]
    public string? BodyHtml { get; set; }

    [Required]
    [Column("received_at")]
    public DateTime ReceivedAt { get; set; }

    [Column("processed_at")]
    public DateTime? ProcessedAt { get; set; }

    [Column("life_domain")]
    [MaxLength(50)]
    public string? LifeDomain { get; set; }

    [Column("importance")]
    [MaxLength(20)]
    public string? Importance { get; set; }

    // Navigation properties
    public virtual ICollection<Obligation> Obligations { get; set; } = new List<Obligation>();
    public virtual ICollection<Deadline> Deadlines { get; set; } = new List<Deadline>();
    // public virtual ICollection<Document> Documents { get; set; } = new List<Document>();
    // public virtual ICollection<FinancialRecord> FinancialRecords { get; set; } = new List<FinancialRecord>();
    public virtual ICollection<AiAnalysis> AiAnalyses { get; set; } = new List<AiAnalysis>();
    public virtual ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
}