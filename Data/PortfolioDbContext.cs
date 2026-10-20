using Microsoft.EntityFrameworkCore;

namespace PortfolioWeb.Data;

public sealed class PortfolioDbContext(DbContextOptions<PortfolioDbContext> options)
    : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<UserSession> UserSessions => Set<UserSession>();
    public DbSet<ChatConversation> ChatConversations => Set<ChatConversation>();
    public DbSet<ConversationParticipant> ConversationParticipants => Set<ConversationParticipant>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<ChatAttachment> ChatAttachments => Set<ChatAttachment>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Skill> Skills => Set<Skill>();
    public DbSet<ProjectSkill> ProjectSkills => Set<ProjectSkill>();
    public DbSet<Education> Education => Set<Education>();
    public DbSet<Experience> Experience => Set<Experience>();
    public DbSet<ContactMessage> ContactMessages => Set<ContactMessage>();
    public DbSet<VirtualSpaceItem> VirtualSpaceItems => Set<VirtualSpaceItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e =>
        {
            e.ToTable("Users");
            e.HasKey(x => x.UserId);
            e.HasIndex(x => x.Username).IsUnique();
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.Username).HasMaxLength(50).IsRequired();
            e.Property(x => x.Email).HasMaxLength(255).IsRequired();
            e.Property(x => x.PasswordHash).HasMaxLength(255).IsRequired();
            e.Property(x => x.DisplayName).HasMaxLength(100);
            e.Property(x => x.Role).HasMaxLength(20).HasDefaultValue("User");
            e.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
        });

        modelBuilder.Entity<UserSession>(e =>
        {
            e.ToTable("UserSessions");
            e.HasKey(x => x.SessionId);
            e.HasIndex(x => x.TokenHash).IsUnique();
            e.Property(x => x.TokenHash).HasMaxLength(255).IsRequired();
            e.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId);
        });

        modelBuilder.Entity<ChatConversation>(e =>
        {
            e.ToTable("ChatConversations");
            e.HasKey(x => x.ConversationId);
            e.Property(x => x.Status).HasMaxLength(20).HasDefaultValue("Open");
            e.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.HasOne(x => x.CreatedByUser).WithMany()
                .HasForeignKey(x => x.CreatedByUserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ConversationParticipant>(e =>
        {
            e.ToTable("ConversationParticipants");
            e.HasKey(x => new { x.ConversationId, x.UserId });
            e.Property(x => x.JoinedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.HasOne(x => x.Conversation).WithMany().HasForeignKey(x => x.ConversationId);
            e.HasOne(x => x.User).WithMany()
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ChatMessage>(e =>
        {
            e.ToTable("ChatMessages");
            e.HasKey(x => x.MessageId);
            e.Property(x => x.MessageType).HasMaxLength(20).HasDefaultValue("Text");
            e.Property(x => x.SentAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.HasOne(x => x.Conversation).WithMany().HasForeignKey(x => x.ConversationId);
            e.HasOne(x => x.Sender).WithMany()
                .HasForeignKey(x => x.SenderUserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ChatAttachment>(e =>
        {
            e.ToTable("ChatAttachments");
            e.HasKey(x => x.AttachmentId);
            e.Property(x => x.S3Key).HasMaxLength(1024).IsRequired();
            e.Property(x => x.FileName).HasMaxLength(255).IsRequired();
            e.Property(x => x.ContentType).HasMaxLength(150).IsRequired();
            e.Property(x => x.MediaType).HasMaxLength(20).IsRequired();
            e.Property(x => x.ThumbnailS3Key).HasMaxLength(1024);
            e.Property(x => x.UploadedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.HasOne(x => x.Message).WithMany().HasForeignKey(x => x.MessageId);
        });

        modelBuilder.Entity<Project>(e =>
        {
            e.ToTable("Projects");
            e.HasKey(x => x.ProjectId);
            e.HasIndex(x => x.Slug).IsUnique();
            e.Property(x => x.Title).HasMaxLength(150).IsRequired();
            e.Property(x => x.Slug).HasMaxLength(180).IsRequired();
            e.Property(x => x.ProjectUrl).HasMaxLength(1000);
            e.Property(x => x.GithubUrl).HasMaxLength(1000);
            e.Property(x => x.ImageS3Key).HasMaxLength(1024);
            e.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
        });

        modelBuilder.Entity<Skill>(e =>
        {
            e.ToTable("Skills");
            e.HasKey(x => x.SkillId);
            e.HasIndex(x => x.Name).IsUnique();
            e.Property(x => x.Name).HasMaxLength(100).IsRequired();
            e.Property(x => x.Category).HasMaxLength(100);
        });

        modelBuilder.Entity<ProjectSkill>(e =>
        {
            e.ToTable("ProjectSkills");
            e.HasKey(x => new { x.ProjectId, x.SkillId });
            e.HasOne(x => x.Project).WithMany().HasForeignKey(x => x.ProjectId);
            e.HasOne(x => x.Skill).WithMany().HasForeignKey(x => x.SkillId);
        });

        modelBuilder.Entity<Education>(e =>
        {
            e.ToTable("Education");
            e.HasKey(x => x.EducationId);
            e.Property(x => x.Institution).HasMaxLength(200).IsRequired();
            e.Property(x => x.Degree).HasMaxLength(200);
            e.Property(x => x.FieldOfStudy).HasMaxLength(200);
            e.Property(x => x.Grade).HasMaxLength(50);
        });

        modelBuilder.Entity<Experience>(e =>
        {
            e.ToTable("Experience");
            e.HasKey(x => x.ExperienceId);
            e.Property(x => x.Company).HasMaxLength(200).IsRequired();
            e.Property(x => x.JobTitle).HasMaxLength(200).IsRequired();
            e.Property(x => x.EmploymentType).HasMaxLength(100);
            e.Property(x => x.Location).HasMaxLength(200);
        });

        modelBuilder.Entity<ContactMessage>(e =>
        {
            e.ToTable("ContactMessages");
            e.HasKey(x => x.ContactMessageId);
            e.Property(x => x.SenderName).HasMaxLength(100).IsRequired();
            e.Property(x => x.SenderEmail).HasMaxLength(255).IsRequired();
            e.Property(x => x.Subject).HasMaxLength(200);
            e.Property(x => x.Status).HasMaxLength(20).HasDefaultValue("New");
            e.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.HasOne(x => x.User).WithMany()
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<VirtualSpaceItem>(e =>
        {
            e.ToTable("VirtualSpaceItems");
            e.HasKey(x => x.ItemId);
            e.Property(x => x.Title).HasMaxLength(150).IsRequired();
            e.Property(x => x.ItemType).HasMaxLength(50).IsRequired();
            e.Property(x => x.TargetUrl).HasMaxLength(1000);
            e.Property(x => x.Description).HasMaxLength(500);
        });
    }
}

public sealed class User
{
    public long UserId { get; set; }
    public string Username { get; set; } = "";
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string? DisplayName { get; set; }
    public string Role { get; set; } = "User";
    public bool IsEmailVerified { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public sealed class UserSession
{
    public long SessionId { get; set; }
    public long UserId { get; set; }
    public string TokenHash { get; set; } = "";
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public User? User { get; set; }
}

public sealed class ChatConversation
{
    public long ConversationId { get; set; }
    public long CreatedByUserId { get; set; }
    public string Status { get; set; } = "Open";
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public User? CreatedByUser { get; set; }
}

public sealed class ConversationParticipant
{
    public long ConversationId { get; set; }
    public long UserId { get; set; }
    public DateTime JoinedAt { get; set; }
    public DateTime? LastReadAt { get; set; }
    public ChatConversation? Conversation { get; set; }
    public User? User { get; set; }
}

public sealed class ChatMessage
{
    public long MessageId { get; set; }
    public long ConversationId { get; set; }
    public long SenderUserId { get; set; }
    public string? MessageText { get; set; }
    public string MessageType { get; set; } = "Text";
    public DateTime SentAt { get; set; }
    public DateTime? EditedAt { get; set; }
    public DateTime? DeletedAt { get; set; }
    public ChatConversation? Conversation { get; set; }
    public User? Sender { get; set; }
}

public sealed class ChatAttachment
{
    public long AttachmentId { get; set; }
    public long MessageId { get; set; }
    public string S3Key { get; set; } = "";
    public string FileName { get; set; } = "";
    public string ContentType { get; set; } = "";
    public long FileSizeBytes { get; set; }
    public string MediaType { get; set; } = "";
    public string? ThumbnailS3Key { get; set; }
    public DateTime UploadedAt { get; set; }
    public ChatMessage? Message { get; set; }
}

public sealed class Project
{
    public long ProjectId { get; set; }
    public string Title { get; set; } = "";
    public string Slug { get; set; } = "";
    public string? Description { get; set; }
    public string? TechStack { get; set; }
    public string? ProjectUrl { get; set; }
    public string? GithubUrl { get; set; }
    public string? ImageS3Key { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsPublished { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class Skill
{
    public long SkillId { get; set; }
    public string Name { get; set; } = "";
    public string? Category { get; set; }
    public byte? Proficiency { get; set; }
    public int DisplayOrder { get; set; }
}

public sealed class ProjectSkill
{
    public long ProjectId { get; set; }
    public long SkillId { get; set; }
    public Project? Project { get; set; }
    public Skill? Skill { get; set; }
}

public sealed class Education
{
    public long EducationId { get; set; }
    public string Institution { get; set; } = "";
    public string? Degree { get; set; }
    public string? FieldOfStudy { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string? Grade { get; set; }
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }
}

public sealed class Experience
{
    public long ExperienceId { get; set; }
    public string Company { get; set; } = "";
    public string JobTitle { get; set; } = "";
    public string? EmploymentType { get; set; }
    public string? Location { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public bool IsCurrent { get; set; }
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }
}

public sealed class ContactMessage
{
    public long ContactMessageId { get; set; }
    public long? UserId { get; set; }
    public string SenderName { get; set; } = "";
    public string SenderEmail { get; set; } = "";
    public string? Subject { get; set; }
    public string Message { get; set; } = "";
    public string Status { get; set; } = "New";
    public DateTime CreatedAt { get; set; }
    public User? User { get; set; }
}

public sealed class VirtualSpaceItem
{
    public long ItemId { get; set; }
    public string Title { get; set; } = "";
    public string ItemType { get; set; } = "";
    public string? TargetUrl { get; set; }
    public string? Description { get; set; }
    public decimal? PositionX { get; set; }
    public decimal? PositionY { get; set; }
    public decimal? PositionZ { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsVisible { get; set; }
}
