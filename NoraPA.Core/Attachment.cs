using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NoraPA.Core;

[Table("attachments")]
public class Attachment
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("message_id")]
    public long MessageId { get; set; }

    [Required]
    [Column("filename")]
    [MaxLength(255)]
    public string Filename { get; set; } = string.Empty;

    [Column("mime_type")]
    [MaxLength(100)]
    public string? MimeType { get; set; }

    [Column("size_bytes")]
    public long SizeBytes { get; set; }

    [Column("local_path")]
    [MaxLength(512)]
    public string? LocalPath { get; set; }

    [Column("source_id")]
    [MaxLength(255)]
    public string? SourceId { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("MessageId")]
    public virtual Message? Message { get; set; }
}
