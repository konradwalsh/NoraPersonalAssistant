using Microsoft.EntityFrameworkCore;
using NoraPA.Core;

namespace NoraPA.API;

public class NoraDbContext : DbContext
{
    public NoraDbContext(DbContextOptions<NoraDbContext> options)
        : base(options)
    {
    }

    public DbSet<Message> Messages { get; set; }
    public DbSet<Obligation> Obligations { get; set; }
    public DbSet<Deadline> Deadlines { get; set; }
    public DbSet<NoraPA.Core.Task> Tasks { get; set; }
    public DbSet<AiAnalysis> AiAnalyses { get; set; }
    public DbSet<AiSettings> AiSettings { get; set; }
    public DbSet<AiUsageLog> AiUsageLogs { get; set; }
    public DbSet<AppSettings> AppSettings { get; set; }
    public DbSet<Contact> Contacts { get; set; }
    public DbSet<Attachment> Attachments { get; set; }
    public DbSet<CalendarEvent> CalendarEvents { get; set; }
    public DbSet<UserProfile> UserProfiles { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure Message
        modelBuilder.Entity<Message>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Source).IsRequired().HasMaxLength(50);
            entity.Property(e => e.SourceId).IsRequired().HasMaxLength(255);
            entity.Property(e => e.FromAddress).HasMaxLength(255);
            entity.Property(e => e.FromName).HasMaxLength(255);
            entity.Property(e => e.LifeDomain).HasMaxLength(50);
            entity.Property(e => e.Importance).HasMaxLength(20);
            entity.Property(e => e.ReceivedAt).IsRequired();
            entity.HasIndex(e => new { e.Source, e.SourceId }).IsUnique();
        });

        // Configure Obligation
        modelBuilder.Entity<Obligation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.MessageId).IsRequired();
            entity.Property(e => e.Action).IsRequired();
            entity.Property(e => e.TriggerType).HasMaxLength(50);
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("pending");

            entity.HasOne(e => e.Message)
                .WithMany(m => m.Obligations)
                .HasForeignKey(e => e.MessageId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Configure Deadline
        modelBuilder.Entity<Deadline>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.MessageId).IsRequired();
            entity.Property(e => e.DeadlineType).HasMaxLength(20).HasDefaultValue("absolute");
            entity.Property(e => e.RelativeTrigger).HasMaxLength(255);
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("active");

            entity.HasOne(e => e.Message)
                .WithMany(m => m.Deadlines)
                .HasForeignKey(e => e.MessageId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Obligation)
                .WithMany(o => o.Deadlines)
                .HasForeignKey(e => e.ObligationId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.Ignore(e => e.Reminders);
        });

        // Configure Task
        modelBuilder.Entity<NoraPA.Core.Task>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("pending");


            entity.HasOne(e => e.Obligation)
                .WithOne(o => o.Task)
                .HasForeignKey<NoraPA.Core.Task>(e => e.ObligationId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.Ignore(e => e.Checklist);
        });

        // Configure AiAnalysis
        modelBuilder.Entity<AiAnalysis>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.MessageId).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("pending");


            entity.HasOne(e => e.Message)
                .WithMany(m => m.AiAnalyses)
                .HasForeignKey(e => e.MessageId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Configure AiSettings
        modelBuilder.Entity<AiSettings>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Provider).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Model).HasMaxLength(100);
            entity.Property(e => e.Temperature).HasDefaultValue(0.7m);
            entity.Property(e => e.MaxTokens).HasDefaultValue(4096);
            entity.Property(x => x.IsActive).HasDefaultValue(true);
            entity.Property(x => x.CrossProviderEnabled).HasDefaultValue(false);
        });

        // Configure Contact
        modelBuilder.Entity<Contact>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Email).HasMaxLength(255);
            entity.Property(e => e.Phone).HasMaxLength(50);
        });

        // Configure CalendarEvent
        modelBuilder.Entity<CalendarEvent>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("confirmed");
        });
    }
}