using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using NoraPA.Core.Models;
using NoraPA.Core.Models.AI;

namespace NoraPA.Core.Services.AI;

/// <summary>
/// Claude AI extraction service implementation
/// </summary>
public class ClaudeExtractionService : AIExtractionService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly string _model;

    public ClaudeExtractionService(
        HttpClient httpClient,
        string apiKey,
        string model = "claude-sonnet-4.5",
        ILogger<ClaudeExtractionService>? logger = null)
        : base(logger ?? Microsoft.Extensions.Logging.Abstractions.NullLogger<AIExtractionService>.Instance)
    {
        _httpClient = httpClient;
        _apiKey = apiKey;
        _model = model;
        
        _httpClient.DefaultRequestHeaders.Add("x-api-key", _apiKey);
        _httpClient.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");
    }

    public override async Task<ExtractionSchema> ExtractFromTextAsync(string text, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Starting Claude AI extraction for text of length {Length}", text.Length);

            var request = new
            {
                model = _model,
                max_tokens = 4096,
                system = GetSystemPrompt(),
                messages = new[]
                {
                    new { role = "user", content = text }
                },
                tools = new[]
                {
                    new
                    {
                        name = "extract_message_information",
                        description = "Extract structured information from a message using the 8-section schema",
                        input_schema = GetExtractionFunctionSchema()
                    }
                },
                tool_choice = new { type = "tool", name = "extract_message_information" }
            };

            var response = await _httpClient.PostAsJsonAsync(
                "https://api.anthropic.com/v1/messages",
                request,
                cancellationToken);

            response.EnsureSuccessStatusCode();

            var result = await response.Content.ReadFromJsonAsync<ClaudeResponse>(cancellationToken);
            
            if (result?.Content == null || result.Content.Length == 0)
            {
                throw new InvalidOperationException("No content in Claude response");
            }

            // Find the tool use content
            var toolUse = result.Content.FirstOrDefault(c => c.Type == "tool_use");
            if (toolUse?.Input == null)
            {
                throw new InvalidOperationException("No tool use in Claude response");
            }

            // Deserialize the extraction result
            var extraction = JsonSerializer.Deserialize<ExtractionSchema>(
                toolUse.Input.ToString()!,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (extraction == null)
            {
                throw new InvalidOperationException("Failed to deserialize extraction result");
            }

            _logger.LogInformation("Claude AI extraction completed successfully. Confidence: {Confidence}", 
                extraction.Confidence.ConfidenceScore);

            return extraction;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during Claude AI extraction");
            throw;
        }
    }

    // Claude API response models
    private class ClaudeResponse
    {
        public string? Id { get; set; }
        public string? Type { get; set; }
        public string? Role { get; set; }
        public ContentItem[]? Content { get; set; }
        public string? Model { get; set; }
        public string? StopReason { get; set; }
        public Usage? Usage { get; set; }
    }

    private class ContentItem
    {
        public string? Type { get; set; }
        public string? Text { get; set; }
        public string? Id { get; set; }
        public string? Name { get; set; }
        public object? Input { get; set; }
    }

    private class Usage
    {
        public int InputTokens { get; set; }
        public int OutputTokens { get; set; }
    }
}
