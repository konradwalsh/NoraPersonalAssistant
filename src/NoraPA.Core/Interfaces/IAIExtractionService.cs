using NoraPA.Core.Models;
using NoraPA.Core.Models.AI;

namespace NoraPA.Core.Interfaces;

/// <summary>
/// Service for extracting structured information from messages using AI
/// </summary>
public interface IAIExtractionService
{
    /// <summary>
    /// Extract structured information from a message using the 8-section schema
    /// </summary>
    /// <param name="message">The message to analyze</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Extracted information</returns>
    Task<ExtractionSchema> ExtractAsync(Message message, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Extract information from raw text (for testing or manual input)
    /// </summary>
    /// <param name="text">The text to analyze</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Extracted information</returns>
    Task<ExtractionSchema> ExtractFromTextAsync(string text, CancellationToken cancellationToken = default);
}
