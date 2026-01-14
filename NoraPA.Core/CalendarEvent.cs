using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NoraPA.Core;

[Table("calendar_events")]
public class CalendarEvent
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("title")]
    [MaxLength(255)]
    public string Title { get; set; }

    [Column("description")]
    public string? Description { get; set; }

    [Required]
    [Column("start_time")]
    public DateTime StartTime { get; set; }

    [Column("end_time")]
    public DateTime? EndTime { get; set; }

    [Column("location")]
    [MaxLength(255)]
    public string? Location { get; set; }

    [Column("is_all_day")]
    public bool IsAllDay { get; set; }

    [Column("status")]
    [MaxLength(20)]
    public string Status { get; set; } = "confirmed";

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("source_message_id")]
    public long? SourceMessageId { get; set; }

    [Column("google_calendar_id")]
    [MaxLength(255)]
    public string? GoogleCalendarId { get; set; }
}
