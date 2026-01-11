using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using NoraPA.Core.Interfaces;
using NoraPA.Core.Models;
using NoraPA.Core.Models.AI;

namespace NoraPA.Core.Services.AI;

/// <summary>
/// AI extraction service that uses function calling to extract structured information
/// This is a base implementation that should be extended by provider-specific implementations
/// </summary>
public abstract class AIExtractionService : IAIExtractionService
{
    protected readonly ILogger<AIExtractionService> _logger;
    
    protected AIExtractionService(ILogger<AIExtractionService> logger)
    {
        _logger = logger;
    }
    
    public async Task<ExtractionSchema> ExtractAsync(Message message, CancellationToken cancellationToken = default)
    {
        var text = BuildMessageText(message);
        return await ExtractFromTextAsync(text, cancellationToken);
    }
    
    public abstract Task<ExtractionSchema> ExtractFromTextAsync(string text, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Build the system prompt for AI extraction
    /// </summary>
    protected string GetSystemPrompt()
    {
        return @"You are Nora, an intelligent life management assistant that extracts obligations, deadlines, and risks from messages.

Your mission: Never let users miss an obligation, deadline, or important detail.

You MUST analyze every message through this 8-section extraction schema:

1. CLASSIFICATION
   - Type: Array of types (insurance, policy, legal, financial, medical, personal)
   - LifeDomain: vehicle | health | home | work | legal | financial | family
   - Importance: critical | high | medium | low
   - Reason: Why this importance level?

2. KEY ENTITIES
   - People: Names of individuals
   - Organizations: Companies, institutions
   - ProductsOrServices: What's being discussed
   - Identifiers: Policy numbers, account numbers, VINs, etc.
   - Amounts: Financial amounts with context

3. OBLIGATIONS & ACTIONS
   - For each obligation:
     * Action: What must be done
     * Trigger: immediate | date:YYYY-MM-DD | event:description
     * Mandatory: true/false
     * ConsequenceIfIgnored: What happens if ignored
     * EstimatedTime: How long it takes
     * Priority: 1-5 (1 is highest)

4. DEADLINES & DATES
   - AbsoluteDeadlines: Specific dates
   - RelativeDeadlines: ""X days from event Y""
   - RecurringDates: Annual, monthly, etc.

5. FINANCIAL & LEGAL SIGNIFICANCE
   - FinancialImpact: Coverage, costs, potential losses
   - LegalObligations: Legal requirements
   - Conditions: What conditions apply
   - Exclusions: What's excluded
   - RiskLevel: high | medium | low
   - RiskExplanation: Why this risk level

6. ATTACHMENTS & LINKS
   - Attachments: Files attached to the message
   - Links: URLs referenced
   - CRITICAL: If message says ""in conjunction with"", ""please refer to"", ""full terms at"" - mark link as REQUIRED

7. STORAGE & ORGANIZATION
   - Category: Top-level category
   - Subcategory: Sub-category
   - SpecificFolder: Recommended folder path
   - Retention: How long to keep
   - IndexFields: Key fields for indexing
   - Tags: Tags for categorization
   - RelatedRecords: Links to related records

8. CONFIDENCE & FOLLOW-UP
   - ConfidenceScore: 0.00-1.00
   - ConfidenceBreakdown: Scores for each section
   - MissingInformation: What's missing
   - AssumptionsMade: What assumptions were made
   - FollowUpNeeded: true/false
   - FollowUpActions: What follow-up is needed

CRITICAL RULES:
- If confidence >= 0.85 AND mandatory == true, task will be auto-created
- If message says ""read in conjunction with [link]"", mark link as REQUIRED and critical
- Extract ALL obligations, even small ones
- Parse dates carefully (consider context, time zones)
- Identify risks and consequences
- Be specific in actions (not ""review policy"" but ""read policy documents and verify coverage limits"")

Return ONLY valid JSON matching the ExtractionSchema structure.";
    }
    
    /// <summary>
    /// Build text representation of message for AI analysis
    /// </summary>
    protected string BuildMessageText(Message message)
    {
        var sb = new StringBuilder();
        
        if (!string.IsNullOrEmpty(message.FromName) || !string.IsNullOrEmpty(message.FromAddress))
        {
            sb.AppendLine($"From: {message.FromName ?? message.FromAddress}");
        }
        
        if (!string.IsNullOrEmpty(message.Subject))
        {
            sb.AppendLine($"Subject: {message.Subject}");
        }
        
        sb.AppendLine($"Date: {message.ReceivedAt:yyyy-MM-dd HH:mm:ss}");
        sb.AppendLine();
        
        // Prefer plain text, fall back to HTML
        var body = message.BodyPlain ?? message.BodyHtml ?? "";
        sb.AppendLine(body);
        
        return sb.ToString();
    }
    
    /// <summary>
    /// Get the JSON schema for function calling
    /// </summary>
    protected object GetExtractionFunctionSchema()
    {
        return new
        {
            name = "extract_message_information",
            description = "Extract structured information from a message using the 8-section schema",
            parameters = new
            {
                type = "object",
                properties = new
                {
                    classification = new
                    {
                        type = "object",
                        properties = new
                        {
                            type = new { type = "array", items = new { type = "string" } },
                            lifeDomain = new { type = "string", @enum = new[] { "vehicle", "health", "home", "work", "legal", "financial", "family" } },
                            importance = new { type = "string", @enum = new[] { "critical", "high", "medium", "low" } },
                            reason = new { type = "string" }
                        },
                        required = new[] { "type", "lifeDomain", "importance", "reason" }
                    },
                    keyEntities = new
                    {
                        type = "object",
                        properties = new
                        {
                            people = new { type = "array", items = new { type = "string" } },
                            organizations = new { type = "array", items = new { type = "string" } },
                            productsOrServices = new { type = "array", items = new { type = "string" } },
                            identifiers = new { type = "object", additionalProperties = new { type = "string" } },
                            amounts = new { type = "object", additionalProperties = new { type = "string" } }
                        }
                    },
                    obligations = new
                    {
                        type = "object",
                        properties = new
                        {
                            obligations = new
                            {
                                type = "array",
                                items = new
                                {
                                    type = "object",
                                    properties = new
                                    {
                                        action = new { type = "string" },
                                        trigger = new { type = "string" },
                                        mandatory = new { type = "boolean" },
                                        consequenceIfIgnored = new { type = "string" },
                                        estimatedTime = new { type = "string" },
                                        priority = new { type = "integer", minimum = 1, maximum = 5 }
                                    },
                                    required = new[] { "action", "trigger", "mandatory", "priority" }
                                }
                            }
                        }
                    },
                    deadlines = new
                    {
                        type = "object",
                        properties = new
                        {
                            absoluteDeadlines = new
                            {
                                type = "array",
                                items = new
                                {
                                    type = "object",
                                    properties = new
                                    {
                                        date = new { type = "string" },
                                        description = new { type = "string" },
                                        reminderTriggers = new { type = "array", items = new { type = "string" } }
                                    },
                                    required = new[] { "date", "description" }
                                }
                            },
                            relativeDeadlines = new
                            {
                                type = "array",
                                items = new
                                {
                                    type = "object",
                                    properties = new
                                    {
                                        triggerEvent = new { type = "string" },
                                        duration = new { type = "string" },
                                        description = new { type = "string" },
                                        critical = new { type = "boolean" }
                                    },
                                    required = new[] { "triggerEvent", "duration", "description" }
                                }
                            },
                            recurringDates = new
                            {
                                type = "object",
                                properties = new
                                {
                                    frequency = new { type = "string" },
                                    nextOccurrence = new { type = "string" },
                                    description = new { type = "string" }
                                },
                                required = new[] { "frequency", "nextOccurrence", "description" }
                            }
                        }
                    },
                    financialSignificance = new
                    {
                        type = "object",
                        properties = new
                        {
                            financialImpact = new
                            {
                                type = "object",
                                properties = new
                                {
                                    coverageAmount = new { type = "string" },
                                    cost = new { type = "string" },
                                    potentialLossIfIgnored = new { type = "string" }
                                }
                            },
                            legalObligations = new { type = "array", items = new { type = "string" } },
                            conditions = new { type = "array", items = new { type = "string" } },
                            exclusions = new { type = "array", items = new { type = "string" } },
                            riskLevel = new { type = "string", @enum = new[] { "high", "medium", "low" } },
                            riskExplanation = new { type = "string" }
                        }
                    },
                    attachments = new
                    {
                        type = "object",
                        properties = new
                        {
                            attachments = new
                            {
                                type = "array",
                                items = new
                                {
                                    type = "object",
                                    properties = new
                                    {
                                        filename = new { type = "string" },
                                        type = new { type = "string" },
                                        importance = new { type = "string" },
                                        requiredAction = new { type = "string" },
                                        reason = new { type = "string" }
                                    },
                                    required = new[] { "filename", "type", "importance", "requiredAction", "reason" }
                                }
                            },
                            links = new
                            {
                                type = "array",
                                items = new
                                {
                                    type = "object",
                                    properties = new
                                    {
                                        url = new { type = "string" },
                                        description = new { type = "string" },
                                        requiredAction = new { type = "string" },
                                        reason = new { type = "string" },
                                        triggerPhrases = new { type = "array", items = new { type = "string" } },
                                        critical = new { type = "boolean" }
                                    },
                                    required = new[] { "url", "description", "requiredAction", "reason" }
                                }
                            }
                        }
                    },
                    storage = new
                    {
                        type = "object",
                        properties = new
                        {
                            category = new { type = "string" },
                            subcategory = new { type = "string" },
                            specificFolder = new { type = "string" },
                            retention = new { type = "string" },
                            indexFields = new { type = "array", items = new { type = "string" } },
                            tags = new { type = "array", items = new { type = "string" } },
                            relatedRecords = new
                            {
                                type = "array",
                                items = new
                                {
                                    type = "object",
                                    properties = new
                                    {
                                        type = new { type = "string" },
                                        identifier = new { type = "string" }
                                    },
                                    required = new[] { "type", "identifier" }
                                }
                            }
                        },
                        required = new[] { "category", "subcategory", "specificFolder", "retention" }
                    },
                    confidence = new
                    {
                        type = "object",
                        properties = new
                        {
                            confidenceScore = new { type = "number", minimum = 0, maximum = 1 },
                            confidenceBreakdown = new
                            {
                                type = "object",
                                properties = new
                                {
                                    classification = new { type = "number" },
                                    entityExtraction = new { type = "number" },
                                    obligationDetection = new { type = "number" },
                                    deadlineParsing = new { type = "number" }
                                }
                            },
                            missingInformation = new { type = "array", items = new { type = "string" } },
                            assumptionsMade = new { type = "array", items = new { type = "string" } },
                            followUpNeeded = new { type = "boolean" },
                            followUpActions = new { type = "array", items = new { type = "string" } }
                        },
                        required = new[] { "confidenceScore", "followUpNeeded" }
                    }
                },
                required = new[] { "classification", "keyEntities", "obligations", "deadlines", "financialSignificance", "attachments", "storage", "confidence" }
            }
        };
    }
}
