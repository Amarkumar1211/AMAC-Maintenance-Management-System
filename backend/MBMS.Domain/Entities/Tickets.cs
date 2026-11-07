namespace MBMS.Domain.Entities;

public class BreakdownTicket
{
    public long TicketId { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public int MachineId { get; set; }
    public int SupervisorId { get; set; }
    public int CategoryId { get; set; }
    public DateTime BreakdownOccurredAt { get; set; }
    public DateTime ReportedAt { get; set; } = DateTime.UtcNow;
    public string BreakdownReason { get; set; } = string.Empty;
    public string BreakdownDescription { get; set; } = string.Empty;
    public string? MachineCondition { get; set; }
    public string ProductionImpact { get; set; } = "MEDIUM";
    public string Priority { get; set; } = "MEDIUM";
    public string CurrentStatus { get; set; } = "NEW";
    public int CurrentApprovalRound { get; set; } = 1;
    public DateTime? RepairCompletedAt { get; set; }
    public DateTime? ProductionRestoredAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public byte[]? RowVersion { get; set; }

    public Machine? Machine { get; set; }
    public Employee? Supervisor { get; set; }
    public BreakdownCategory? Category { get; set; }

    public ICollection<TicketAssignment> Assignments { get; set; } = new List<TicketAssignment>();
    public ICollection<MaintenanceAction> Actions { get; set; } = new List<MaintenanceAction>();
    public ICollection<TicketWorkSession> WorkSessions { get; set; } = new List<TicketWorkSession>();
    public ICollection<TicketAttachment> Attachments { get; set; } = new List<TicketAttachment>();
    public ICollection<TicketApproval> Approvals { get; set; } = new List<TicketApproval>();
    public ICollection<TicketComment> Comments { get; set; } = new List<TicketComment>();
    public ICollection<TicketStatusHistory> StatusHistory { get; set; } = new List<TicketStatusHistory>();
    public ICollection<MachineDowntime> Downtimes { get; set; } = new List<MachineDowntime>();
}

public class TicketAssignment
{
    public long AssignmentId { get; set; }
    public long TicketId { get; set; }
    public int MechanicId { get; set; }
    public int AssignedBy { get; set; }
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    public DateTime? AcceptedAt { get; set; }
    public string? AssignmentRemarks { get; set; }
    public bool IsCurrent { get; set; } = true;

    public BreakdownTicket? Ticket { get; set; }
    public Mechanic? Mechanic { get; set; }
    public Employee? Assigner { get; set; }
}

public class MaintenanceAction
{
    public long ActionId { get; set; }
    public long TicketId { get; set; }
    public int MechanicId { get; set; }
    public int ApprovalRound { get; set; } = 1;
    public string? InspectionFindings { get; set; }
    public string? ActualRootCause { get; set; }
    public string ActionTaken { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public string? MachineConditionAfterRepair { get; set; }
    public string? MechanicRemarks { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public BreakdownTicket? Ticket { get; set; }
    public Mechanic? Mechanic { get; set; }
    public ICollection<PartUsed> PartsUsed { get; set; } = new List<PartUsed>();
    public ICollection<TicketAttachment> Attachments { get; set; } = new List<TicketAttachment>();
    public ICollection<TicketWorkSession> WorkSessions { get; set; } = new List<TicketWorkSession>();
}

public class TicketWorkSession
{
    public long SessionId { get; set; }
    public long TicketId { get; set; }
    public long? ActionId { get; set; }
    public int MechanicId { get; set; }
    public string SessionType { get; set; } = "WORK"; // WORK or ON_HOLD
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? EndedAt { get; set; }
    public string? HoldReason { get; set; }
    public string? Notes { get; set; }

    public BreakdownTicket? Ticket { get; set; }
    public MaintenanceAction? Action { get; set; }
    public Mechanic? Mechanic { get; set; }
}

public class SparePart
{
    public int PartId { get; set; }
    public string PartCode { get; set; } = string.Empty;
    public string PartName { get; set; } = string.Empty;
    public string? Unit { get; set; }
    public string? Description { get; set; }
    public decimal UnitPrice { get; set; } = 0.00m;
    public decimal StockQuantity { get; set; } = 0.00m;
    public bool IsActive { get; set; } = true;

    public ICollection<PartUsed> PartsUsed { get; set; } = new List<PartUsed>();
}

public class PartUsed
{
    public long PartsUsedId { get; set; }
    public long ActionId { get; set; }
    public int PartId { get; set; }
    public decimal Quantity { get; set; }
    public string? Remarks { get; set; }

    public MaintenanceAction? Action { get; set; }
    public SparePart? Part { get; set; }
}

public class SparePartTransaction
{
    public long TransactionId { get; set; }
    public int PartId { get; set; }
    public string TransactionType { get; set; } = "INWARD"; // INWARD or OUTWARD
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; } = 0.00m;
    public string? ReferenceNo { get; set; }
    public string? SupplierOrSource { get; set; }
    public string? Remarks { get; set; }
    public int? MachineId { get; set; }
    public int? MechanicId { get; set; }
    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }

    public SparePart? Part { get; set; }
    public Machine? Machine { get; set; }
    public Mechanic? Mechanic { get; set; }
}

public class TicketAttachment
{
    public long AttachmentId { get; set; }
    public long TicketId { get; set; }
    public long? ActionId { get; set; }
    public int UploadedBy { get; set; }
    public string AttachmentType { get; set; } = "BREAKDOWN";
    public string? OriginalFileName { get; set; }
    public string StoredFileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public long? FileSize { get; set; }
    public string? ContentType { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    public BreakdownTicket? Ticket { get; set; }
    public MaintenanceAction? Action { get; set; }
    public Employee? Uploader { get; set; }
}

public class TicketApproval
{
    public long ApprovalId { get; set; }
    public long TicketId { get; set; }
    public int ApprovalRound { get; set; } = 1;
    public string ApprovalStage { get; set; } = "SUPERVISOR"; // SUPERVISOR, INCHARGE
    public int ApproverId { get; set; }
    public string ApprovalStatus { get; set; } = "PENDING"; // PENDING, APPROVED, REJECTED
    public string? Remarks { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public BreakdownTicket? Ticket { get; set; }
    public Employee? Approver { get; set; }
    public TicketSignature? Signature { get; set; }
}

public class TicketSignature
{
    public long SignatureId { get; set; }
    public long ApprovalId { get; set; }
    public string SignatureType { get; set; } = "DRAWN"; // DRAWN, UPLOADED
    public string FilePath { get; set; } = string.Empty;
    public string? OriginalFileName { get; set; }
    public int SignedBy { get; set; }
    public DateTime SignedAt { get; set; } = DateTime.UtcNow;

    public TicketApproval? Approval { get; set; }
    public Employee? Signer { get; set; }
}

public class TicketComment
{
    public long CommentId { get; set; }
    public long TicketId { get; set; }
    public int EmployeeId { get; set; }
    public string CommentText { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public BreakdownTicket? Ticket { get; set; }
    public Employee? Employee { get; set; }
}

public class TicketStatusHistory
{
    public long HistoryId { get; set; }
    public long TicketId { get; set; }
    public string? PreviousStatus { get; set; }
    public string NewStatus { get; set; } = string.Empty;
    public int ChangedBy { get; set; }
    public string? ChangeRemarks { get; set; }
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

    public BreakdownTicket? Ticket { get; set; }
    public Employee? Changer { get; set; }
}

public class MachineDowntime
{
    public long DowntimeId { get; set; }
    public long TicketId { get; set; }
    public int MachineId { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? RestoredAt { get; set; }
    public string? RestorationRemarks { get; set; }
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;

    public BreakdownTicket? Ticket { get; set; }
    public Machine? Machine { get; set; }
}

public class AuditLog
{
    public long AuditId { get; set; }
    public int UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? TableName { get; set; }
    public string? RecordId { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string? IPAddress { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}

public class SLAConfiguration
{
    public int SLAId { get; set; }
    public string Priority { get; set; } = "MEDIUM";
    public int ResponseTargetMinutes { get; set; }
    public int ResolutionTargetMinutes { get; set; }
    public bool IsActive { get; set; } = true;
}

public class MachineQRRecord
{
    public long QRRecordId { get; set; }
    public int MachineId { get; set; }
    public string QRCodePayload { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

    public Machine? Machine { get; set; }
}

public class SystemSetting
{
    public string SettingKey { get; set; } = string.Empty;
    public string SettingValue { get; set; } = string.Empty;
    public string? Description { get; set; }
}
