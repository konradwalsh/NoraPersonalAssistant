using System.Text.Json;

namespace NoraPA.Core.Models;

/// <summary>
/// Represents a document attached to or referenced in a message
/// </summary>
public class Document
{
    public long Id { get; set; }
    
    /// <summary>
    /// Reference to the source message
    /// </summary>
    public long MessageId { get; set; }
    public Message? Message { get; set; }
    
    /// <summary>
    /// Original filename
    /// </summary>
    public string? Filename { get; set; }
    
    /// <summary>
    /// Path to the stored file
    /// </summary>
    public string? FilePath { get; set; }
    
    /// <summary>
    /// File size in bytes
    /// </summary>
    public long FileSize { get; set; }
    
    /// <summary>
    /// MIME type
    /// </summary>
    public string? MimeType { get; set; }
    
    /// <summary>
    /// Document type: 'policy', 'receipt', 'contract', 'statement', 'legal_document', 'financial_statement'
    /// </summary>
    public string? DocumentType { get; set; }
    
    /// <summary>
    /// Importance: 'critical', 'important', 'reference'
    /// </summary>
    public string? Importance { get; set; }
    
    /// <summary>
    /// Category for organization
    /// </summary>
    public string? Category { get; set; }
    
    /// <summary>
    /// Subcategory for organization
    /// </summary>
    public string? Subcategory { get; set; }
    
    /// <summary>
    /// Retention policy: 'permanent', '7_years', '1_year', 'until_superseded'
    /// </summary>
    public string? RetentionPolicy { get; set; }
    
    /// <summary>
    /// Index fields for quick lookup (JSON object)
    /// </summary>
    public JsonDocument? IndexFields { get; set; }
    
    /// <summary>
    /// Tags for categorization
    /// </summary>
    public string[]? Tags { get; set; }
    
    /// <summary>
    /// Extracted text content (from OCR or PDF parsing)
    /// </summary>
    public string? ExtractedText { get; set; }
    
    /// <summary>
    /// Vector embedding for semantic search (1536 dimensions for OpenAI)
    /// </summary>
    public float[]? Embedding { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
