using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NoraPA.Core;

[Table("user_profiles")]
public class UserProfile
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("full_name")]
    [MaxLength(255)]
    public string FullName { get; set; } = string.Empty;

    [Column("bio")]
    public string? Bio { get; set; } // General "Who am I"

    [Column("career_context")]
    public string? CareerContext { get; set; } // Work, Roles, Companies

    [Column("household_context")]
    public string? HouseholdContext { get; set; } // Family, Address, etc.

    [Column("exclusion_instructions")]
    public string? ExclusionInstructions { get; set; } // "Ignore my own name in contacts"

    [Column("ai_directives")]
    public string? AiDirectives { get; set; } // "Be concise," "Flag all finance stuff"

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
