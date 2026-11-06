namespace MBMS.Application.DTOs;

public class CreateTicketRequest
{
    public int MachineId { get; set; }
    public int CategoryId { get; set; }
    public DateTime BreakdownOccurredAt { get; set; }
    public string BreakdownReason { get; set; } = string.Empty;
    public string BreakdownDescription { get; set; } = string.Empty;
    public string? MachineCondition { get; set; } // STOPPED, PARTIALLY_WORKING, RUNNING_ABNORMALLY
    public string ProductionImpact { get; set; } = "MEDIUM"; // LOW, MEDIUM, HIGH, CRITICAL
    public string Priority { get; set; } = "MEDIUM"; // LOW, MEDIUM, HIGH, CRITICAL
    public List<FileUploadDto>? Attachments { get; set; }
}

public class FileUploadDto
{
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = "image/jpeg";
    public string Base64Data { get; set; } = string.Empty;
    public string AttachmentType { get; set; } = "BREAKDOWN";
}

public class TicketListDto
{
    public long TicketId { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public int MachineId { get; set; }
    public string MachineCode { get; set; } = string.Empty;
    public string MachineName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public DateTime BreakdownOccurredAt { get; set; }
    public DateTime ReportedAt { get; set; }
    public string Priority { get; set; } = "MEDIUM";
    public string CurrentStatus { get; set; } = "NEW";
    public string BreakdownReason { get; set; } = string.Empty;
    public int CurrentApprovalRound { get; set; } = 1;
    public int? AssignedMechanicId { get; set; }
    public string? AssignedMechanicName { get; set; }
    public string? AssignedMechanicMobile { get; set; }
    public string? AssignedMechanicSpecialization { get; set; }
    public DateTime? AssignedAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public double TotalDowntimeMinutes { get; set; }
    public bool IsBreached { get; set; }
}

public class TicketDetailDto
{
    public long TicketId { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public int MachineId { get; set; }
    public string MachineCode { get; set; } = string.Empty;
    public string MachineName { get; set; } = string.Empty;
    public string? MachineLocation { get; set; }
    public string? MachineCategory { get; set; }
    public string MachineCriticality { get; set; } = "MEDIUM";
    public int DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public int SupervisorId { get; set; }
    public string SupervisorName { get; set; } = string.Empty;
    public string? SupervisorMobile { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public DateTime BreakdownOccurredAt { get; set; }
    public DateTime ReportedAt { get; set; }
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
    public byte[]? RowVersion { get; set; }

    // Calculated Durations
    public double TotalDowntimeMinutes { get; set; }
    public double? ResponseTimeMinutes { get; set; }
    public double? ActiveLaborMinutes { get; set; }
    public double? ApprovalDelayMinutes { get; set; }
    public double? MTTRMinutes { get; set; }
    public double? MTTFHours { get; set; }
    public double? MTBFHours { get; set; }

    // Navigation records
    public AssignedMechanicInfoDto? CurrentAssignment { get; set; }
    public List<MaintenanceActionDto> Actions { get; set; } = new();
    public List<TicketWorkSessionDto> WorkSessions { get; set; } = new();
    public List<TicketAttachmentDto> Attachments { get; set; } = new();
    public List<TicketApprovalDto> Approvals { get; set; } = new();
    public List<TicketCommentDto> Comments { get; set; } = new();
    public List<TicketStatusHistoryDto> StatusHistory { get; set; } = new();
    public List<MachineDowntimeDto> Downtimes { get; set; } = new();
}

public class AssignedMechanicInfoDto
{
    public long AssignmentId { get; set; }
    public int MechanicId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public string EmployeeCode { get; set; } = string.Empty;
    public string? MobileNumber { get; set; }
    public string? Specialization { get; set; }
    public string? ShiftName { get; set; }
    public DateTime AssignedAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public string? Remarks { get; set; }
}

public class AssignMechanicRequest
{
    public int MechanicId { get; set; }
    public string? Remarks { get; set; }
}

public class StartWorkRequest
{
    public string? Remarks { get; set; }
}

public class PauseWorkRequest
{
    public string Reason { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public class ResumeWorkRequest
{
    public string? Notes { get; set; }
}

public class PartConsumptionItemDto
{
    public int PartId { get; set; }
    public decimal Quantity { get; set; }
    public string? Remarks { get; set; }
}

public class CompleteWorkRequest
{
    public string? InspectionFindings { get; set; }
    public string? ActualRootCause { get; set; }
    public string ActionTaken { get; set; } = string.Empty;
    public string? MachineConditionAfterRepair { get; set; }
    public string? MechanicRemarks { get; set; }
    public List<PartConsumptionItemDto>? PartsUsed { get; set; }
    public List<FileUploadDto>? RepairAttachments { get; set; }
}

public class ApprovalRequest
{
    public string Stage { get; set; } = "SUPERVISOR"; // SUPERVISOR or INCHARGE
    public string Status { get; set; } = "APPROVED"; // APPROVED or REJECTED
    public string? Remarks { get; set; }
    public string SignatureType { get; set; } = "DRAWN"; // DRAWN or UPLOADED
    public string? SignatureBase64 { get; set; }
    public DateTime? ProductionRestoredAt { get; set; } // If supervisor confirms restored time
}

public class ReopenTicketRequest
{
    public string Reason { get; set; } = string.Empty;
}

public class CancelTicketRequest
{
    public string Reason { get; set; } = string.Empty;
}

public class AddCommentRequest
{
    public string CommentText { get; set; } = string.Empty;
}

public class MaintenanceActionDto
{
    public long ActionId { get; set; }
    public int MechanicId { get; set; }
    public string MechanicName { get; set; } = string.Empty;
    public int ApprovalRound { get; set; }
    public string? InspectionFindings { get; set; }
    public string? ActualRootCause { get; set; }
    public string ActionTaken { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? MachineConditionAfterRepair { get; set; }
    public string? MechanicRemarks { get; set; }
    public List<PartUsedDto> PartsUsed { get; set; } = new();
}

public class PartUsedDto
{
    public long PartsUsedId { get; set; }
    public int PartId { get; set; }
    public string PartCode { get; set; } = string.Empty;
    public string PartName { get; set; } = string.Empty;
    public string? Unit { get; set; }
    public decimal Quantity { get; set; }
    public string? Remarks { get; set; }
}

public class TicketWorkSessionDto
{
    public long SessionId { get; set; }
    public string SessionType { get; set; } = "WORK";
    public DateTime StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public string? HoldReason { get; set; }
    public string? Notes { get; set; }
    public double DurationMinutes { get; set; }
}

public class TicketAttachmentDto
{
    public long AttachmentId { get; set; }
    public string AttachmentType { get; set; } = "BREAKDOWN";
    public string? OriginalFileName { get; set; }
    public string StoredFileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; }
    public string UploaderName { get; set; } = string.Empty;
}

public class TicketApprovalDto
{
    public long ApprovalId { get; set; }
    public int ApprovalRound { get; set; }
    public string ApprovalStage { get; set; } = "SUPERVISOR";
    public string ApprovalStatus { get; set; } = "PENDING";
    public string ApproverName { get; set; } = string.Empty;
    public string? Remarks { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public TicketSignatureDto? Signature { get; set; }
}

public class TicketSignatureDto
{
    public long SignatureId { get; set; }
    public string SignatureType { get; set; } = "DRAWN";
    public string FilePath { get; set; } = string.Empty;
    public string SignerName { get; set; } = string.Empty;
    public DateTime SignedAt { get; set; }
}

public class TicketCommentDto
{
    public long CommentId { get; set; }
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public string CommentText { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class TicketStatusHistoryDto
{
    public long HistoryId { get; set; }
    public string? PreviousStatus { get; set; }
    public string NewStatus { get; set; } = string.Empty;
    public string ChangerName { get; set; } = string.Empty;
    public string? ChangeRemarks { get; set; }
    public DateTime ChangedAt { get; set; }
}

public class MachineDowntimeDto
{
    public long DowntimeId { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? RestoredAt { get; set; }
    public string? RestorationRemarks { get; set; }
    public double DurationMinutes { get; set; }
}

