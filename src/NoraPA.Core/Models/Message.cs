using System.Text.Json;

namespace NoraPA.Core.Models;

/// <summary>
/// Represents a message from any source (Gmail, WhatsApp, SMS, Slack)
/// </summary>
public class Message
{
    public long Id { get; set; }
    
    /// <summary>
    /// Source of the message: 'gmail', 'whatsapp', 'sms', 'slack'
    /// </summary>
    public required string Source { get; set; }
    
    /// <summary>
    /// Unique identifier from the source system
    /// </summary>
    public required string SourceId { get; set; }
    
    /// <summary>
    /// Sender's email/phone/username
    /// </summary>
    public string? FromAddress { get; set; }
    
    /// <summary>
    /// Sender's display name
    /// </summary>
    public string? FromName { get; set; }
    
    /// <summary>
    /// Recipients (JSON array)
    /// </summary>
    public JsonDocument? ToAddresses { get; set; }
    
    /// <summary>
    /// Message subject (email) or first line (chat)
    /// </summary>
    public string? Subject { get; set; }
    
    /// <summary>
    /// Plain text body
    /// </summary>
    public string? BodyPlain { get; set; }
    
    /// <summary>
    /// HTML body (for emails)
    /// </summary>
    public string? BodyHtml { get; set; }
    
    /// <summary>
    /// When the message was received
    /// </summary>
    public DateTime ReceivedAt { get; set; }
    
    /// <summary>
    /// When the message was processed by AI
    /// </summary>
    public DateTime? ProcessedAt { get; set; }
    
    /// <summary>
    /// Life domain: 'vehicle', 'health', 'home', 'work', 'legal', 'financial', 'family'
    /// </summary>
    public string? LifeDomain { get; set; }
    
    /// <summary>
    /// Importance: 'critical', 'high', 'medium', 'low'
    /// </summary>
    public string? Importance { get; set; }
    
    // Navigation properties
    public ICollection<Obligation> Obligations { get; set; } = new List<Obligation>();
    public ICollection<Deadline> Deadlines { get; set; } = new List<Deadline>();
    public ICollection<Document> Documents { get; set; } = new List<Document>();
    public ICollection<FinancialRecord> FinancialRecords { get; set; } = new List<FinancialRecord>();
    public ICollection<AIAnalysis> AIAnalyses { get; set; } = new List<AIAnalysis>();
}
