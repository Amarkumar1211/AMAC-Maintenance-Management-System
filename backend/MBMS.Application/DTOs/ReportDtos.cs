namespace MBMS.Application.DTOs;

public class ManagementDashboardDto
{
    public int TotalTickets { get; set; }
    public int OpenTickets { get; set; }
    public int InProgressTickets { get; set; }
    public int AwaitingApprovalTickets { get; set; }
    public int ClosedTickets { get; set; }
    public int CriticalIncidents { get; set; }

    public double TotalDowntimeHours { get; set; }
    public double AverageMTTRMinutes { get; set; }
    public double AverageMTTFHours { get; set; }
    public double AverageMTBFHours { get; set; }
    public double AverageResponseTimeMinutes { get; set; }
    public double OverallAvailabilityPercent { get; set; }

    public List<CategoryCountDto> CategoriesDistribution { get; set; } = new();
    public List<DailyTrendDto> DailyTrend { get; set; } = new();
    public List<MachineDowntimeRankingDto> TopDowntimeMachines { get; set; } = new();
    public List<MechanicWorkloadItemDto> MechanicWorkloads { get; set; } = new();
    public List<ApprovalAgeingDto> PendingApprovals { get; set; } = new();
}

public class CategoryCountDto
{
    public string CategoryName { get; set; } = string.Empty;
    public int Count { get; set; }
    public double DowntimeHours { get; set; }
}

public class DailyTrendDto
{
    public string Date { get; set; } = string.Empty;
    public int BreakdownCount { get; set; }
    public double DowntimeHours { get; set; }
}

public class MachineDowntimeRankingDto
{
    public int MachineId { get; set; }
    public string MachineCode { get; set; } = string.Empty;
    public string MachineName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public int FailureCount { get; set; }
    public double DowntimeHours { get; set; }
    public double MTTRMinutes { get; set; }
    public double MTTFHours { get; set; }
    public double MTBFHours { get; set; }
    public double AvailabilityPercent { get; set; }
    public DateTime? LastBreakdownDate { get; set; }
}

public class MechanicWorkloadItemDto
{
    public int MechanicId { get; set; }
    public string MechanicName { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public string ShiftName { get; set; } = string.Empty;
    public bool IsAvailable { get; set; }
    public int ActiveJobs { get; set; }
    public int CompletedJobs { get; set; }
    public double AvgRepairMinutes { get; set; }
}

public class SlaPerformanceDto
{
    public long TicketId { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public string MachineCode { get; set; } = string.Empty;
    public string Priority { get; set; } = "MEDIUM";
    public DateTime BreakdownOccurredAt { get; set; }
    public DateTime ReportedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? RepairCompletedAt { get; set; }
    public int ResponseTargetMinutes { get; set; }
    public double? ActualResponseMinutes { get; set; }
    public bool IsResponseBreached { get; set; }
    public int ResolutionTargetMinutes { get; set; }
    public double? ActualResolutionMinutes { get; set; }
    public bool IsResolutionBreached { get; set; }
}

public class RepeatBreakdownReportDto
{
    public int MachineId { get; set; }
    public string MachineCode { get; set; } = string.Empty;
    public string MachineName { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public int FailureCountInWindow { get; set; }
    public List<string> TicketNumbers { get; set; } = new();
    public DateTime FirstOccurrence { get; set; }
    public DateTime LatestOccurrence { get; set; }
}

public class ApprovalAgeingDto
{
    public long TicketId { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public string MachineCode { get; set; } = string.Empty;
    public string CurrentStatus { get; set; } = string.Empty;
    public string PendingStage { get; set; } = string.Empty;
    public DateTime RepairCompletedAt { get; set; }
    public double WaitingHours { get; set; }
    public string Priority { get; set; } = "MEDIUM";
}

public class ShiftWiseReportDto
{
    public string ShiftName { get; set; } = string.Empty;
    public int BreakdownCount { get; set; }
    public double TotalDowntimeHours { get; set; }
    public double AvgMTTRMinutes { get; set; }
}

