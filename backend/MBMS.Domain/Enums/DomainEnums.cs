namespace MBMS.Domain.Enums;

public static class DomainConstants
{
    public const string RoleAdmin = "ADMIN";
    public const string RoleSupervisor = "SUPERVISOR";
    public const string RoleMaintenanceIncharge = "MAINTENANCE_INCHARGE";
    public const string RoleMechanic = "MECHANIC";

    public const string StatusNew = "NEW";
    public const string StatusAssigned = "ASSIGNED";
    public const string StatusAccepted = "ACCEPTED";
    public const string StatusInProgress = "IN_PROGRESS";
    public const string StatusOnHold = "ON_HOLD";
    public const string StatusAwaitingSupervisor = "AWAITING_SUPERVISOR";
    public const string StatusSupervisorRejected = "SUPERVISOR_REJECTED";
    public const string StatusAwaitingIncharge = "AWAITING_INCHARGE";
    public const string StatusInchargeRejected = "INCHARGE_REJECTED";
    public const string StatusClosed = "CLOSED";
    public const string StatusReopened = "REOPENED";
    public const string StatusCancelled = "CANCELLED";

    public const string StageSupervisor = "SUPERVISOR";
    public const string StageIncharge = "INCHARGE";

    public const string ApprovalStatusPending = "PENDING";
    public const string ApprovalStatusApproved = "APPROVED";
    public const string ApprovalStatusRejected = "REJECTED";

    public const string SigTypeDrawn = "DRAWN";
    public const string SigTypeUploaded = "UPLOADED";

    public const string AttachBreakdown = "BREAKDOWN";
    public const string AttachInspection = "INSPECTION";
    public const string AttachRepair = "REPAIR";
    public const string AttachOther = "OTHER";

    public const string PriorityLow = "LOW";
    public const string PriorityMedium = "MEDIUM";
    public const string PriorityHigh = "HIGH";
    public const string PriorityCritical = "CRITICAL";
}

