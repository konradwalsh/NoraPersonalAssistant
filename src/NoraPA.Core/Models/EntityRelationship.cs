using System.Text.Json;

namespace NoraPA.Core.Models;

/// <summary>
/// Represents a relationship between two entities
/// </summary>
public class EntityRelationship
{
    public long Id { get; set; }
    
    /// <summary>
    /// First entity in the relationship
    /// </summary>
    public long EntityAId { get; set; }
    public Entity? EntityA { get; set; }
    
    /// <summary>
    /// Second entity in the relationship
    /// </summary>
    public long EntityBId { get; set; }
    public Entity? EntityB { get; set; }
    
    /// <summary>
    /// Type of relationship: 'owns', 'insured_by', 'related_to', 'works_for', 'lives_at'
    /// </summary>
    public required string RelationshipType { get; set; }
    
    /// <summary>
    /// Additional metadata about the relationship (JSON object)
    /// </summary>
    public JsonDocument? Metadata { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
