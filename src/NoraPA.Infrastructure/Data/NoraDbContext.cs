using Microsoft.EntityFrameworkCore;
using NoraPA.Core.Models;

namespace NoraPA.Infrastructure.Data;

/// <summary>
/// Database context for Nora Personal Assistant
/// </summary>
public class NoraDbContext : DbContext
{
    public NoraDbContext(DbContextOptions<NoraDbContext> options) : base(options)
    {
    }

    // DbSets
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<Obligation> Obligations => Set<Obligation>();
    public DbSet<Deadline> Deadlines => Set<Deadline>();
    public DbSet<Entity> Entities => Set<Entity>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<FinancialRecord> FinancialRecords => Set<FinancialRecord>();
    public DbSet<NoraTask> Tasks => Set<NoraTask>();
    public DbSet<AIAnalysis> AIAnalyses => Set<AIAnalysis>();
    public DbSet<EntityRelationship> EntityRelationships => Set<EntityRelationship>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Enable pgvector extension
        modelBuilder.HasPostgresExtension("vector");

        // Configure Message
        modelBuilder.Entity<Message>(entity =>
        {
            entity.ToTable("messages");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            
            entity.HasIndex(e => new { e.Source, e.SourceId }).IsUnique();
            entity.HasIndex(e => e.ReceivedAt);
            entity.HasIndex(e => e.LifeDomain);
            entity.HasIndex(e => e.Importance);
            
            entity.Property(e => e.Source).IsRequired().HasMaxLength(50);
            entity.Property(e => e.SourceId).IsRequired().HasMaxLength(255);
            entity.Property(e => e.FromAddress).HasMaxLength(255);
            entity.Property(e => e.FromName).HasMaxLength(255);
            entity.Property(e => e.Subject).HasMaxLength(500);
            entity.Property(e => e.LifeDomain).HasMaxLength(50);
            entity.Property(e => e.Importance).HasMaxLength(20);
            
            entity.Property(e => e.ToAddresses).HasColumnType("jsonb");
        });

        // Configure Obligation
        modelBuilder.Entity<Obligation>(entity =>
        {
            entity.ToTable("obligations");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.Priority);
            entity.HasIndex(e => new { e.Status, e.Priority });
            entity.HasIndex(e => e.CreatedAt);
            
            entity.Property(e => e.Action).IsRequired().HasMaxLength(500);
            entity.Property(e => e.TriggerType).HasMaxLength(50);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20).HasDefaultValue("pending");
            entity.Property(e => e.ConfidenceScore).HasPrecision(3, 2);
            
            entity.HasOne(e => e.Message)
                  .WithMany(m => m.Obligations)
                  .HasForeignKey(e => e.MessageId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Configure Deadline
        modelBuilder.Entity<Deadline>(entity =>
        {
            entity.ToTable("deadlines");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            
            entity.HasIndex(e => e.DeadlineDate);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => new { e.Status, e.DeadlineDate });
            
            entity.Property(e => e.DeadlineType).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20).HasDefaultValue("active");
            entity.Property(e => e.Reminders).HasColumnType("jsonb");
            
            entity.HasOne(e => e.Message)
                  .WithMany(m => m.Deadlines)
                  .HasForeignKey(e => e.MessageId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasOne(e => e.Obligation)
                  .WithMany(o => o.Deadlines)
                  .HasForeignKey(e => e.ObligationId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // Configure Entity
        modelBuilder.Entity<Entity>(entity =>
        {
            entity.ToTable("entities");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            
            entity.HasIndex(e => new { e.EntityType, e.Name }).IsUnique();
            entity.HasIndex(e => e.EntityType);
            
            entity.Property(e => e.EntityType).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Identifiers).HasColumnType("jsonb");
            entity.Property(e => e.Metadata).HasColumnType("jsonb");
        });

        // Configure Document
        modelBuilder.Entity<Document>(entity =>
        {
            entity.ToTable("documents");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            
            entity.HasIndex(e => e.Category);
            entity.HasIndex(e => e.DocumentType);
            entity.HasIndex(e => e.CreatedAt);
            
            // Vector index for semantic search
            entity.HasIndex(e => e.Embedding)
                  .HasMethod("ivfflat")
                  .HasOperators("vector_cosine_ops");
            
            entity.Property(e => e.Filename).HasMaxLength(255);
            entity.Property(e => e.MimeType).HasMaxLength(100);
            entity.Property(e => e.DocumentType).HasMaxLength(50);
            entity.Property(e => e.Importance).HasMaxLength(20);
            entity.Property(e => e.Category).HasMaxLength(50);
            entity.Property(e => e.Subcategory).HasMaxLength(50);
            entity.Property(e => e.RetentionPolicy).HasMaxLength(50);
            entity.Property(e => e.IndexFields).HasColumnType("jsonb");
            entity.Property(e => e.Tags).HasColumnType("text[]");
            entity.Property(e => e.Embedding).HasColumnType("vector(1536)");
            
            entity.HasOne(e => e.Message)
                  .WithMany(m => m.Documents)
                  .HasForeignKey(e => e.MessageId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Configure FinancialRecord
        modelBuilder.Entity<FinancialRecord>(entity =>
        {
            entity.ToTable("financial_records");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            
            entity.HasIndex(e => e.RecordType);
            entity.HasIndex(e => e.RiskLevel);
            entity.HasIndex(e => new { e.ValidFrom, e.ValidUntil });
            
            entity.Property(e => e.RecordType).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Amount).HasPrecision(12, 2);
            entity.Property(e => e.Currency).HasMaxLength(3).HasDefaultValue("EUR");
            entity.Property(e => e.RiskLevel).HasMaxLength(20);
            entity.Property(e => e.Conditions).HasColumnType("jsonb");
            entity.Property(e => e.Exclusions).HasColumnType("jsonb");
            
            entity.HasOne(e => e.Message)
                  .WithMany(m => m.FinancialRecords)
                  .HasForeignKey(e => e.MessageId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Configure NoraTask
        modelBuilder.Entity<NoraTask>(entity =>
        {
            entity.ToTable("tasks");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.DueDate);
            entity.HasIndex(e => new { e.Status, e.DueDate });
            entity.HasIndex(e => e.Priority);
            
            entity.Property(e => e.Title).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20).HasDefaultValue("pending");
            entity.Property(e => e.Checklist).HasColumnType("jsonb");
            
            entity.HasOne(e => e.Obligation)
                  .WithMany(o => o.Tasks)
                  .HasForeignKey(e => e.ObligationId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // Configure AIAnalysis
        modelBuilder.Entity<AIAnalysis>(entity =>
        {
            entity.ToTable("ai_analyses");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            
            entity.HasIndex(e => e.MessageId);
            entity.HasIndex(e => e.Provider);
            entity.HasIndex(e => e.CreatedAt);
            
            entity.Property(e => e.Provider).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Model).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Cost).HasPrecision(8, 6);
            entity.Property(e => e.ExtractionResult).HasColumnType("jsonb");
            entity.Property(e => e.ConfidenceScores).HasColumnType("jsonb");
            
            entity.HasOne(e => e.Message)
                  .WithMany(m => m.AIAnalyses)
                  .HasForeignKey(e => e.MessageId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Configure EntityRelationship
        modelBuilder.Entity<EntityRelationship>(entity =>
        {
            entity.ToTable("entity_relationships");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            
            entity.HasIndex(e => new { e.EntityAId, e.EntityBId, e.RelationshipType }).IsUnique();
            entity.HasIndex(e => e.RelationshipType);
            
            entity.Property(e => e.RelationshipType).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Metadata).HasColumnType("jsonb");
            
            entity.HasOne(e => e.EntityA)
                  .WithMany(ent => ent.RelationshipsAsA)
                  .HasForeignKey(e => e.EntityAId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasOne(e => e.EntityB)
                  .WithMany(ent => ent.RelationshipsAsB)
                  .HasForeignKey(e => e.EntityBId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
