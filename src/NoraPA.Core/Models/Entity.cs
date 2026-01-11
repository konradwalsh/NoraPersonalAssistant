using System.Text.Json;

namespace NoraPA.Core.Models;

/// <summary>
/// Represents an entity extracted from messages (person, organization, product, vehicle, property)
/// </summary>
public class Entity
{
    public long Id { get; set; }
    
    /// <summary>
    /// Type: 'person', 'organization', 'product', 'vehicle', 'property'
    /// </summary>
    public required string EntityType { get; set; }
    
    /// <summary>
    /// Name of the entity
    /// </summary>
    public required string Name { get; set; }
    
    /// <summary>
    /// Identifiers (JSON object)
    /// Example: {"policy_ref": "123", "vin": "ABC", "account_number": "456"}
    /// </summary>
    public JsonDocument? Identifiers { get; set; }
    
    /// <summary>
    /// Additional metadata (JSON object)
    /// </summary>
    public JsonDocument? Metadata { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public ICollection<EntityRelationship> RelationshipsAsA { get; set; } = new List<EntityRelationship>();
    public ICollection<EntityRelationship> RelationshipsAsB { get; set; } = new List<EntityRelationship>();
}
