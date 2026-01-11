namespace NoraPA.Core.Models.AI;

/// <summary>
/// Complete 8-section extraction schema for AI analysis
/// </summary>
public class ExtractionSchema
{
    public required ClassificationSection Classification { get; set; }
    public required KeyEntitiesSection KeyEntities { get; set; }
    public required ObligationsSection Obligations { get; set; }
    public required DeadlinesSection Deadlines { get; set; }
    public required FinancialSignificanceSection FinancialSignificance { get; set; }
    public required AttachmentsSection Attachments { get; set; }
    public required StorageSection Storage { get; set; }
    public required ConfidenceSection Confidence { get; set; }
}

/// <summary>
/// Section 1: Classification
/// </summary>
public class ClassificationSection
{
    public required string[] Type { get; set; }
    public required string LifeDomain { get; set; }
    public required string Importance { get; set; }
    public required string Reason { get; set; }
}

/// <summary>
/// Section 2: Key Entities
/// </summary>
public class KeyEntitiesSection
{
    public string[] People { get; set; } = Array.Empty<string>();
    public string[] Organizations { get; set; } = Array.Empty<string>();
    public string[] ProductsOrServices { get; set; } = Array.Empty<string>();
    public Dictionary<string, string> Identifiers { get; set; } = new();
    public Dictionary<string, string> Amounts { get; set; } = new();
}

/// <summary>
/// Section 3: Obligations & Actions
/// </summary>
public class ObligationsSection
{
    public ObligationItem[] Obligations { get; set; } = Array.Empty<ObligationItem>();
}

public class ObligationItem
{
    public required string Action { get; set; }
    public required string Trigger { get; set; }
    public bool Mandatory { get; set; }
    public string? ConsequenceIfIgnored { get; set; }
    public string? EstimatedTime { get; set; }
    public int Priority { get; set; }
}

/// <summary>
/// Section 4: Deadlines & Dates
/// </summary>
public class DeadlinesSection
{
    public AbsoluteDeadline[] AbsoluteDeadlines { get; set; } = Array.Empty<AbsoluteDeadline>();
    public RelativeDeadline[] RelativeDeadlines { get; set; } = Array.Empty<RelativeDeadline>();
    public RecurringDate? RecurringDates { get; set; }
}

public class AbsoluteDeadline
{
    public required string Date { get; set; }
    public required string Description { get; set; }
    public string[] ReminderTriggers { get; set; } = Array.Empty<string>();
}

public class RelativeDeadline
{
    public required string TriggerEvent { get; set; }
    public required string Duration { get; set; }
    public required string Description { get; set; }
    public bool Critical { get; set; }
}

public class RecurringDate
{
    public required string Frequency { get; set; }
    public required string NextOccurrence { get; set; }
    public required string Description { get; set; }
}

/// <summary>
/// Section 5: Financial & Legal Significance
/// </summary>
public class FinancialSignificanceSection
{
    public FinancialImpact? FinancialImpact { get; set; }
    public string[] LegalObligations { get; set; } = Array.Empty<string>();
    public string[] Conditions { get; set; } = Array.Empty<string>();
    public string[] Exclusions { get; set; } = Array.Empty<string>();
    public string? RiskLevel { get; set; }
    public string? RiskExplanation { get; set; }
}

public class FinancialImpact
{
    public string? CoverageAmount { get; set; }
    public string? Cost { get; set; }
    public string? PotentialLossIfIgnored { get; set; }
}

/// <summary>
/// Section 6: Attachments & Links
/// </summary>
public class AttachmentsSection
{
    public AttachmentItem[] Attachments { get; set; } = Array.Empty<AttachmentItem>();
    public LinkItem[] Links { get; set; } = Array.Empty<LinkItem>();
}

public class AttachmentItem
{
    public required string Filename { get; set; }
    public required string Type { get; set; }
    public required string Importance { get; set; }
    public required string RequiredAction { get; set; }
    public required string Reason { get; set; }
}

public class LinkItem
{
    public required string Url { get; set; }
    public required string Description { get; set; }
    public required string RequiredAction { get; set; }
    public required string Reason { get; set; }
    public string[] TriggerPhrases { get; set; } = Array.Empty<string>();
    public bool Critical { get; set; }
}

/// <summary>
/// Section 7: Storage & Organization
/// </summary>
public class StorageSection
{
    public required string Category { get; set; }
    public required string Subcategory { get; set; }
    public required string SpecificFolder { get; set; }
    public required string Retention { get; set; }
    public string[] IndexFields { get; set; } = Array.Empty<string>();
    public string[] Tags { get; set; } = Array.Empty<string>();
    public RelatedRecord[] RelatedRecords { get; set; } = Array.Empty<RelatedRecord>();
}

public class RelatedRecord
{
    public required string Type { get; set; }
    public required string Identifier { get; set; }
}

/// <summary>
/// Section 8: Confidence & Follow-Up
/// </summary>
public class ConfidenceSection
{
    public decimal ConfidenceScore { get; set; }
    public ConfidenceBreakdown? ConfidenceBreakdown { get; set; }
    public string[] MissingInformation { get; set; } = Array.Empty<string>();
    public string[] AssumptionsMade { get; set; } = Array.Empty<string>();
    public bool FollowUpNeeded { get; set; }
    public string[] FollowUpActions { get; set; } = Array.Empty<string>();
}

public class ConfidenceBreakdown
{
    public decimal Classification { get; set; }
    public decimal EntityExtraction { get; set; }
    public decimal ObligationDetection { get; set; }
    public decimal DeadlineParsing { get; set; }
}
