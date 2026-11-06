using MBMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MBMS.Infrastructure.Data;

public class MBMSDbContext : DbContext
{
    public MBMSDbContext(DbContextOptions<MBMSDbContext> options) : base(options)
    {
    }

    public DbSet<Department> Departments => Set<Department>();
    public DbSet<ProductionSection> ProductionSections => Set<ProductionSection>();
    public DbSet<Shift> Shifts => Set<Shift>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<User> Users => Set<User>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<MechanicSpecialization> MechanicSpecializations => Set<MechanicSpecialization>();
    public DbSet<Mechanic> Mechanics => Set<Mechanic>();
    public DbSet<MachineCategory> MachineCategories => Set<MachineCategory>();
    public DbSet<Machine> Machines => Set<Machine>();
    public DbSet<BreakdownCategory> BreakdownCategories => Set<BreakdownCategory>();
    public DbSet<BreakdownTicket> BreakdownTickets => Set<BreakdownTicket>();
    public DbSet<TicketAssignment> TicketAssignments => Set<TicketAssignment>();
    public DbSet<MaintenanceAction> MaintenanceActions => Set<MaintenanceAction>();
    public DbSet<TicketWorkSession> TicketWorkSessions => Set<TicketWorkSession>();
    public DbSet<SparePart> SpareParts => Set<SparePart>();
    public DbSet<PartUsed> PartsUsed => Set<PartUsed>();
    public DbSet<TicketAttachment> TicketAttachments => Set<TicketAttachment>();
    public DbSet<TicketApproval> TicketApprovals => Set<TicketApproval>();
    public DbSet<TicketSignature> TicketSignatures => Set<TicketSignature>();
    public DbSet<TicketComment> TicketComments => Set<TicketComment>();
    public DbSet<TicketStatusHistory> TicketStatusHistory => Set<TicketStatusHistory>();
    public DbSet<MachineDowntime> MachineDowntime => Set<MachineDowntime>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<SLAConfiguration> SLAConfigurations => Set<SLAConfiguration>();
    public DbSet<MachineQRRecord> MachineQRRecords => Set<MachineQRRecord>();
    public DbSet<SystemSetting> SystemSettings => Set<SystemSetting>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Explicit Primary Keys
        modelBuilder.Entity<Department>().HasKey(e => e.DepartmentId);
        modelBuilder.Entity<ProductionSection>().HasKey(e => e.SectionId);
        modelBuilder.Entity<Shift>().HasKey(e => e.ShiftId);
        modelBuilder.Entity<Employee>().HasKey(e => e.EmployeeId);
        modelBuilder.Entity<Role>().HasKey(e => e.RoleId);
        modelBuilder.Entity<User>().HasKey(e => e.UserId);
        modelBuilder.Entity<MechanicSpecialization>().HasKey(e => e.SpecializationId);
        modelBuilder.Entity<Mechanic>().HasKey(e => e.MechanicId);
        modelBuilder.Entity<MachineCategory>().HasKey(e => e.MachineCategoryId);
        modelBuilder.Entity<Machine>().HasKey(e => e.MachineId);
        modelBuilder.Entity<BreakdownCategory>().HasKey(e => e.CategoryId);
        modelBuilder.Entity<SparePart>().HasKey(e => e.PartId);
        modelBuilder.Entity<TicketAttachment>().HasKey(e => e.AttachmentId);
        modelBuilder.Entity<TicketComment>().HasKey(e => e.CommentId);
        modelBuilder.Entity<TicketStatusHistory>().HasKey(e => e.HistoryId);
        modelBuilder.Entity<AuditLog>().HasKey(e => e.AuditId);
        modelBuilder.Entity<SLAConfiguration>().HasKey(e => e.SLAId);
        modelBuilder.Entity<MachineQRRecord>().HasKey(e => e.QRRecordId);

        // UserRole Composite Key
        modelBuilder.Entity<UserRole>()
            .HasKey(ur => new { ur.UserId, ur.RoleId });

        modelBuilder.Entity<UserRole>()
            .HasOne(ur => ur.User)
            .WithMany(u => u.UserRoles)
            .HasForeignKey(ur => ur.UserId);

        modelBuilder.Entity<UserRole>()
            .HasOne(ur => ur.Role)
            .WithMany(r => r.UserRoles)
            .HasForeignKey(ur => ur.RoleId);

        // BreakdownTicket
        modelBuilder.Entity<BreakdownTicket>(entity =>
        {
            entity.HasKey(e => e.TicketId);
            entity.Property(e => e.RowVersion)
                .IsRowVersion();

            entity.HasOne(e => e.Machine)
                .WithMany(m => m.Tickets)
                .HasForeignKey(e => e.MachineId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Supervisor)
                .WithMany()
                .HasForeignKey(e => e.SupervisorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Category)
                .WithMany(c => c.Tickets)
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // TicketAssignment Filtered Unique Index: Only one current assignment per ticket
        modelBuilder.Entity<TicketAssignment>(entity =>
        {
            entity.HasKey(e => e.AssignmentId);

            entity.HasIndex(e => e.TicketId)
                .HasFilter("[IsCurrent] = 1")
                .IsUnique();

            entity.HasOne(e => e.Ticket)
                .WithMany(t => t.Assignments)
                .HasForeignKey(e => e.TicketId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Mechanic)
                .WithMany(m => m.Assignments)
                .HasForeignKey(e => e.MechanicId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Assigner)
                .WithMany()
                .HasForeignKey(e => e.AssignedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // MachineDowntime Filtered Unique Index: Only one open downtime per ticket
        modelBuilder.Entity<MachineDowntime>(entity =>
        {
            entity.HasKey(e => e.DowntimeId);

            entity.HasIndex(e => e.TicketId)
                .HasFilter("[RestoredAt] IS NULL")
                .IsUnique();

            entity.HasOne(e => e.Ticket)
                .WithMany(t => t.Downtimes)
                .HasForeignKey(e => e.TicketId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Machine)
                .WithMany(m => m.Downtimes)
                .HasForeignKey(e => e.MachineId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // TicketApprovals Unique per Round and Stage
        modelBuilder.Entity<TicketApproval>(entity =>
        {
            entity.HasKey(e => e.ApprovalId);

            entity.HasIndex(e => new { e.TicketId, e.ApprovalRound, e.ApprovalStage })
                .IsUnique();

            entity.HasOne(e => e.Ticket)
                .WithMany(t => t.Approvals)
                .HasForeignKey(e => e.TicketId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Approver)
                .WithMany()
                .HasForeignKey(e => e.ApproverId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // TicketSignatures 1-to-1 with Approval
        modelBuilder.Entity<TicketSignature>(entity =>
        {
            entity.HasKey(e => e.SignatureId);

            entity.HasOne(e => e.Approval)
                .WithOne(a => a.Signature)
                .HasForeignKey<TicketSignature>(e => e.ApprovalId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Signer)
                .WithMany()
                .HasForeignKey(e => e.SignedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // MaintenanceAction
        modelBuilder.Entity<MaintenanceAction>(entity =>
        {
            entity.HasKey(e => e.ActionId);

            entity.HasOne(e => e.Ticket)
                .WithMany(t => t.Actions)
                .HasForeignKey(e => e.TicketId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Mechanic)
                .WithMany(m => m.Actions)
                .HasForeignKey(e => e.MechanicId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // PartsUsed
        modelBuilder.Entity<PartUsed>(entity =>
        {
            entity.HasKey(e => e.PartsUsedId);

            entity.HasOne(e => e.Action)
                .WithMany(a => a.PartsUsed)
                .HasForeignKey(e => e.ActionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Part)
                .WithMany(p => p.PartsUsed)
                .HasForeignKey(e => e.PartId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // TicketWorkSession
        modelBuilder.Entity<TicketWorkSession>(entity =>
        {
            entity.HasKey(e => e.SessionId);

            entity.HasOne(e => e.Ticket)
                .WithMany(t => t.WorkSessions)
                .HasForeignKey(e => e.TicketId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Action)
                .WithMany(a => a.WorkSessions)
                .HasForeignKey(e => e.ActionId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Mechanic)
                .WithMany(m => m.WorkSessions)
                .HasForeignKey(e => e.MechanicId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // TicketStatusHistory
        modelBuilder.Entity<TicketStatusHistory>(entity =>
        {
            entity.HasKey(e => e.HistoryId);
            entity.HasOne(e => e.Changer)
                .WithMany()
                .HasForeignKey(e => e.ChangedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // TicketAttachment
        modelBuilder.Entity<TicketAttachment>(entity =>
        {
            entity.HasKey(e => e.AttachmentId);
            entity.HasOne(e => e.Uploader)
                .WithMany()
                .HasForeignKey(e => e.UploadedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // SystemSettings
        modelBuilder.Entity<SystemSetting>()
            .HasKey(s => s.SettingKey);
    }
}
