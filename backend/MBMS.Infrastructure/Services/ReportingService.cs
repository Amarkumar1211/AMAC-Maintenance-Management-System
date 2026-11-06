using System.Text;
using MBMS.Application.DTOs;
using MBMS.Application.Interfaces;
using MBMS.Domain.Entities;
using MBMS.Domain.Enums;
using MBMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MBMS.Infrastructure.Services;

public class ReportingService : IReportingService
{
    private readonly MBMSDbContext _db;

    public ReportingService(MBMSDbContext db)
    {
        _db = db;
    }

    public async Task<ManagementDashboardDto> GetManagementDashboardAsync(DateTime? fromDate = null, DateTime? toDate = null, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var start = fromDate ?? now.AddDays(-30);
        var end = toDate ?? now;

        var ticketsQuery = _db.BreakdownTickets
            .Include(t => t.Category)
            .Include(t => t.Machine)
                .ThenInclude(m => m!.Department)
            .Include(t => t.Downtimes)
            .Include(t => t.WorkSessions)
            .Where(t => t.BreakdownOccurredAt >= start && t.BreakdownOccurredAt <= end);

        var tickets = await ticketsQuery.ToListAsync(ct);

        var total = tickets.Count;
        var open = tickets.Count(t => t.CurrentStatus != DomainConstants.StatusClosed && t.CurrentStatus != DomainConstants.StatusCancelled);
        var inProgress = tickets.Count(t => t.CurrentStatus == DomainConstants.StatusInProgress || t.CurrentStatus == DomainConstants.StatusOnHold);
        var awaitingApproval = tickets.Count(t => t.CurrentStatus == DomainConstants.StatusAwaitingSupervisor || t.CurrentStatus == DomainConstants.StatusAwaitingIncharge);
        var closed = tickets.Count(t => t.CurrentStatus == DomainConstants.StatusClosed);
        var critical = tickets.Count(t => t.Priority == DomainConstants.PriorityCritical);

        // Downtime Hours Calculation
        double totalDowntimeMinutes = 0;
        foreach (var t in tickets)
        {
            foreach (var d in t.Downtimes)
            {
                var dtEnd = d.RestoredAt ?? now;
                totalDowntimeMinutes += Math.Max(0, (dtEnd - d.StartedAt).TotalMinutes);
            }
        }
        var totalDowntimeHours = Math.Round(totalDowntimeMinutes / 60.0, 1);

        // MTTR: Mean Time To Repair (minutes) across completed repairs
        var completedTickets = tickets.Where(t => t.RepairCompletedAt.HasValue).ToList();
        double totalRepairDurationMinutes = 0;
        int repairCount = 0;
        foreach (var ctkt in completedTickets)
        {
            var firstWork = ctkt.WorkSessions
                .Where(w => w.SessionType == "WORK")
                .OrderBy(w => w.StartedAt)
                .Select(w => (DateTime?)w.StartedAt)
                .FirstOrDefault();

            if (firstWork.HasValue && ctkt.RepairCompletedAt.HasValue)
            {
                var dur = (ctkt.RepairCompletedAt.Value - firstWork.Value).TotalMinutes;
                if (dur > 0)
                {
                    totalRepairDurationMinutes += dur;
                    repairCount++;
                }
            }
        }
        var avgMttrMinutes = repairCount > 0 ? Math.Round(totalRepairDurationMinutes / repairCount, 1) : 0;

        // Response Time (minutes)
        double totalResponseMinutes = 0;
        int responseCount = 0;
        foreach (var t in tickets)
        {
            var firstWork = t.WorkSessions
                .Where(w => w.SessionType == "WORK")
                .OrderBy(w => w.StartedAt)
                .Select(w => (DateTime?)w.StartedAt)
                .FirstOrDefault();

            if (firstWork.HasValue)
            {
                var resp = (firstWork.Value - t.BreakdownOccurredAt).TotalMinutes;
                if (resp >= 0)
                {
                    totalResponseMinutes += resp;
                    responseCount++;
                }
            }
        }
        var avgResponseMinutes = responseCount > 0 ? Math.Round(totalResponseMinutes / responseCount, 1) : 0;

        // Overall Availability %
        var totalMachines = await _db.Machines.CountAsync(m => m.IsActive, ct);
        if (totalMachines == 0) totalMachines = 1;
        var periodHours = Math.Max(1, (end - start).TotalHours);
        var totalPlannedHours = totalMachines * periodHours;
        var totalUptimeHours = Math.Max(0, totalPlannedHours - totalDowntimeHours);
        var availability = Math.Max(0, Math.Min(100.0, (totalUptimeHours / totalPlannedHours) * 100.0));
        var avgMttfHours = total > 0 ? Math.Round(totalUptimeHours / total, 1) : Math.Round(totalPlannedHours, 1);
        var avgMtbfHours = total > 0 ? Math.Round((totalUptimeHours + totalDowntimeHours) / total, 1) : Math.Round(totalPlannedHours, 1);

        // Category distribution
        var catDist = tickets
            .GroupBy(t => t.Category?.CategoryName ?? "Other")
            .Select(g => new CategoryCountDto
            {
                CategoryName = g.Key,
                Count = g.Count(),
                DowntimeHours = Math.Round(g.SelectMany(t => t.Downtimes).Sum(d => Math.Max(0, ((d.RestoredAt ?? now) - d.StartedAt).TotalMinutes)) / 60.0, 1)
            })
            .OrderByDescending(c => c.Count)
            .ToList();

        // Daily trend
        var dailyTrend = tickets
            .GroupBy(t => t.BreakdownOccurredAt.ToString("yyyy-MM-dd"))
            .Select(g => new DailyTrendDto
            {
                Date = g.Key,
                BreakdownCount = g.Count(),
                DowntimeHours = Math.Round(g.SelectMany(t => t.Downtimes).Sum(d => Math.Max(0, ((d.RestoredAt ?? now) - d.StartedAt).TotalMinutes)) / 60.0, 1)
            })
            .OrderBy(d => d.Date)
            .ToList();

        // Top Downtime Machines
        var topMachines = await GetMachineReportsAsync(start, end, null, ct);

        // Mechanic Workloads
        var mechanicWorkloads = await GetMechanicReportsAsync(start, end, ct);

        // Pending Approvals Ageing
        var pendingApprovals = tickets
            .Where(t => t.CurrentStatus == DomainConstants.StatusAwaitingSupervisor || t.CurrentStatus == DomainConstants.StatusAwaitingIncharge)
            .Select(t => new ApprovalAgeingDto
            {
                TicketId = t.TicketId,
                TicketNumber = t.TicketNumber,
                MachineCode = t.Machine?.MachineCode ?? "",
                CurrentStatus = t.CurrentStatus,
                PendingStage = t.CurrentStatus == DomainConstants.StatusAwaitingSupervisor ? "Supervisor Verification" : "Incharge Approval",
                RepairCompletedAt = t.RepairCompletedAt ?? t.UpdatedAt,
                WaitingHours = Math.Round(Math.Max(0, (now - (t.RepairCompletedAt ?? t.UpdatedAt)).TotalHours), 1),
                Priority = t.Priority
            })
            .OrderByDescending(p => p.WaitingHours)
            .Take(10)
            .ToList();

        return new ManagementDashboardDto
        {
            TotalTickets = total,
            OpenTickets = open,
            InProgressTickets = inProgress,
            AwaitingApprovalTickets = awaitingApproval,
            ClosedTickets = closed,
            CriticalIncidents = critical,
            TotalDowntimeHours = totalDowntimeHours,
            AverageMTTRMinutes = avgMttrMinutes,
            AverageMTTFHours = avgMttfHours,
            AverageMTBFHours = avgMtbfHours,
            AverageResponseTimeMinutes = avgResponseMinutes,
            OverallAvailabilityPercent = Math.Round(availability, 2),
            CategoriesDistribution = catDist,
            DailyTrend = dailyTrend,
            TopDowntimeMachines = topMachines.Take(5).ToList(),
            MechanicWorkloads = mechanicWorkloads,
            PendingApprovals = pendingApprovals
        };
    }

    public async Task<List<MachineDowntimeRankingDto>> GetMachineReportsAsync(DateTime? fromDate = null, DateTime? toDate = null, int? departmentId = null, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var start = fromDate ?? now.AddDays(-30);
        var end = toDate ?? now;
        var periodHours = Math.Max(1, (end - start).TotalHours);

        var machinesQuery = _db.Machines
            .Include(m => m.Department)
            .Include(m => m.Tickets.Where(t => t.BreakdownOccurredAt >= start && t.BreakdownOccurredAt <= end))
                .ThenInclude(t => t.Downtimes)
            .Include(m => m.Tickets.Where(t => t.BreakdownOccurredAt >= start && t.BreakdownOccurredAt <= end))
                .ThenInclude(t => t.WorkSessions)
            .Where(m => m.IsActive);

        if (departmentId.HasValue)
            machinesQuery = machinesQuery.Where(m => m.DepartmentId == departmentId.Value);

        var machines = await machinesQuery.ToListAsync(ct);

        return machines.Select(m =>
        {
            var ticketList = m.Tickets.ToList();
            var failCount = ticketList.Count;

            double downtimeMinutes = 0;
            foreach (var t in ticketList)
            {
                foreach (var d in t.Downtimes)
                {
                    var dtEnd = d.RestoredAt ?? now;
                    downtimeMinutes += Math.Max(0, (dtEnd - d.StartedAt).TotalMinutes);
                }
            }
            var downtimeHours = Math.Round(downtimeMinutes / 60.0, 1);

            double totalRepairMinutes = 0;
            int repairCount = 0;
            foreach (var t in ticketList.Where(t => t.RepairCompletedAt.HasValue))
            {
                var firstWork = t.WorkSessions
                    .Where(w => w.SessionType == "WORK")
                    .OrderBy(w => w.StartedAt)
                    .Select(w => (DateTime?)w.StartedAt)
                    .FirstOrDefault();

                if (firstWork.HasValue && t.RepairCompletedAt.HasValue)
                {
                    var dur = (t.RepairCompletedAt.Value - firstWork.Value).TotalMinutes;
                    if (dur > 0)
                    {
                        totalRepairMinutes += dur;
                        repairCount++;
                    }
                }
            }

            var mttrMinutes = repairCount > 0 ? Math.Round(totalRepairMinutes / repairCount, 1) : 0;
            var operatingHours = Math.Max(0, periodHours - downtimeHours);
            var mttfHours = failCount > 0 ? Math.Round(operatingHours / failCount, 1) : Math.Round(periodHours, 1);
            var mtbfHours = failCount > 0 ? Math.Round((operatingHours + (downtimeMinutes / 60.0)) / failCount, 1) : Math.Round(periodHours, 1);
            var availPercent = Math.Max(0, Math.Min(100.0, (operatingHours / periodHours) * 100.0));

            return new MachineDowntimeRankingDto
            {
                MachineId = m.MachineId,
                MachineCode = m.MachineCode,
                MachineName = m.MachineName,
                DepartmentName = m.Department?.DepartmentName ?? "",
                FailureCount = failCount,
                DowntimeHours = downtimeHours,
                MTTRMinutes = mttrMinutes,
                MTTFHours = mttfHours,
                MTBFHours = mtbfHours,
                AvailabilityPercent = Math.Round(availPercent, 2),
                LastBreakdownDate = ticketList.OrderByDescending(t => t.BreakdownOccurredAt).Select(t => (DateTime?)t.BreakdownOccurredAt).FirstOrDefault()
            };
        })
        .OrderByDescending(m => m.DowntimeHours)
        .ThenByDescending(m => m.FailureCount)
        .ToList();
    }

    public async Task<List<MechanicWorkloadItemDto>> GetMechanicReportsAsync(DateTime? fromDate = null, DateTime? toDate = null, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var start = fromDate ?? now.AddDays(-30);
        var end = toDate ?? now;

        var mechanics = await _db.Mechanics
            .Include(m => m.Employee)
            .Include(m => m.Assignments.Where(a => a.AssignedAt >= start && a.AssignedAt <= end))
                .ThenInclude(a => a.Ticket)
            .Include(m => m.Actions.Where(a => a.StartedAt >= start && a.StartedAt <= end))
            .ToListAsync(ct);

        return mechanics.Select(m =>
        {
            var assignments = m.Assignments.ToList();
            var completedCount = assignments.Count(a => a.Ticket != null && a.Ticket.CurrentStatus == DomainConstants.StatusClosed);
            var activeCount = m.ActiveTicketCount;

            double totalRepairMinutes = 0;
            int repairCount = 0;
            foreach (var act in m.Actions.Where(a => a.CompletedAt.HasValue))
            {
                var dur = (act.CompletedAt!.Value - act.StartedAt).TotalMinutes;
                if (dur > 0)
                {
                    totalRepairMinutes += dur;
                    repairCount++;
                }
            }

            var avgRepairMinutes = repairCount > 0 ? Math.Round(totalRepairMinutes / repairCount, 1) : 0;

            return new MechanicWorkloadItemDto
            {
                MechanicId = m.MechanicId,
                MechanicName = m.Employee?.EmployeeName ?? "",
                Specialization = m.Specialization ?? "General",
                ShiftName = m.ShiftName ?? "General",
                IsAvailable = m.IsAvailable,
                ActiveJobs = activeCount,
                CompletedJobs = completedCount,
                AvgRepairMinutes = avgRepairMinutes
            };
        })
        .OrderByDescending(m => m.ActiveJobs)
        .ToList();
    }

    public async Task<List<SlaPerformanceDto>> GetSlaReportAsync(DateTime? fromDate = null, DateTime? toDate = null, string? priority = null, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var start = fromDate ?? now.AddDays(-30);
        var end = toDate ?? now;

        var slas = await _db.SLAConfigurations.ToDictionaryAsync(s => s.Priority, ct);

        var query = _db.BreakdownTickets
            .Include(t => t.Machine)
            .Include(t => t.WorkSessions)
            .Where(t => t.BreakdownOccurredAt >= start && t.BreakdownOccurredAt <= end);

        if (!string.IsNullOrEmpty(priority))
            query = query.Where(t => t.Priority == priority);

        var tickets = await query.ToListAsync(ct);

        return tickets.Select(t =>
        {
            var sla = slas.GetValueOrDefault(t.Priority) ?? new SLAConfiguration
            {
                ResponseTargetMinutes = 30,
                ResolutionTargetMinutes = 480
            };

            var firstWork = t.WorkSessions
                .Where(w => w.SessionType == "WORK")
                .OrderBy(w => w.StartedAt)
                .Select(w => (DateTime?)w.StartedAt)
                .FirstOrDefault();

            double? respActual = firstWork.HasValue ? Math.Max(0, (firstWork.Value - t.BreakdownOccurredAt).TotalMinutes) : null;
            double? resActual = t.RepairCompletedAt.HasValue ? Math.Max(0, (t.RepairCompletedAt.Value - t.BreakdownOccurredAt).TotalMinutes) : null;

            bool respBreached = respActual.HasValue && respActual.Value > sla.ResponseTargetMinutes;
            bool resBreached = resActual.HasValue && resActual.Value > sla.ResolutionTargetMinutes;

            return new SlaPerformanceDto
            {
                TicketId = t.TicketId,
                TicketNumber = t.TicketNumber,
                MachineCode = t.Machine?.MachineCode ?? "",
                Priority = t.Priority,
                BreakdownOccurredAt = t.BreakdownOccurredAt,
                ReportedAt = t.ReportedAt,
                StartedAt = firstWork,
                RepairCompletedAt = t.RepairCompletedAt,
                ResponseTargetMinutes = sla.ResponseTargetMinutes,
                ActualResponseMinutes = respActual.HasValue ? Math.Round(respActual.Value, 1) : null,
                IsResponseBreached = respBreached,
                ResolutionTargetMinutes = sla.ResolutionTargetMinutes,
                ActualResolutionMinutes = resActual.HasValue ? Math.Round(resActual.Value, 1) : null,
                IsResolutionBreached = resBreached
            };
        }).ToList();
    }

    public async Task<List<RepeatBreakdownReportDto>> GetRepeatBreakdownsAsync(int rollingDays = 30, int minOccurrences = 2, CancellationToken ct = default)
    {
        var cutoff = DateTime.UtcNow.AddDays(-rollingDays);

        var tickets = await _db.BreakdownTickets
            .Include(t => t.Machine)
            .Include(t => t.Category)
            .Where(t => t.BreakdownOccurredAt >= cutoff && t.CurrentStatus != DomainConstants.StatusCancelled)
            .OrderBy(t => t.BreakdownOccurredAt)
            .ToListAsync(ct);

        var grouped = tickets
            .GroupBy(t => new { t.MachineId, t.CategoryId })
            .Where(g => g.Count() >= minOccurrences)
            .Select(g =>
            {
                var first = g.First();
                return new RepeatBreakdownReportDto
                {
                    MachineId = first.MachineId,
                    MachineCode = first.Machine?.MachineCode ?? "",
                    MachineName = first.Machine?.MachineName ?? "",
                    CategoryName = first.Category?.CategoryName ?? "",
                    FailureCountInWindow = g.Count(),
                    TicketNumbers = g.Select(t => t.TicketNumber).ToList(),
                    FirstOccurrence = g.Min(t => t.BreakdownOccurredAt),
                    LatestOccurrence = g.Max(t => t.BreakdownOccurredAt)
                };
            })
            .OrderByDescending(r => r.FailureCountInWindow)
            .ToList();

        return grouped;
    }

    public async Task<List<ShiftWiseReportDto>> GetShiftWiseReportsAsync(DateTime? fromDate = null, DateTime? toDate = null, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var start = fromDate ?? now.AddDays(-30);
        var end = toDate ?? now;

        var shifts = await _db.Shifts.Where(s => s.IsActive).ToListAsync(ct);
        var tickets = await _db.BreakdownTickets
            .Include(t => t.Downtimes)
            .Include(t => t.WorkSessions)
            .Where(t => t.BreakdownOccurredAt >= start && t.BreakdownOccurredAt <= end)
            .ToListAsync(ct);

        var result = new List<ShiftWiseReportDto>();

        foreach (var shift in shifts)
        {
            var shiftTickets = tickets.Where(t =>
            {
                var time = t.BreakdownOccurredAt.TimeOfDay;
                if (shift.StartTime <= shift.EndTime)
                {
                    return time >= shift.StartTime && time < shift.EndTime;
                }
                else
                {
                    // Overnight shift
                    return time >= shift.StartTime || time < shift.EndTime;
                }
            }).ToList();

            double downtimeMins = 0;
            foreach (var t in shiftTickets)
            {
                foreach (var d in t.Downtimes)
                {
                    var dtEnd = d.RestoredAt ?? now;
                    downtimeMins += Math.Max(0, (dtEnd - d.StartedAt).TotalMinutes);
                }
            }

            double totalMttrMins = 0;
            int mttrCount = 0;
            foreach (var t in shiftTickets.Where(t => t.RepairCompletedAt.HasValue))
            {
                var firstWork = t.WorkSessions
                    .Where(w => w.SessionType == "WORK")
                    .OrderBy(w => w.StartedAt)
                    .Select(w => (DateTime?)w.StartedAt)
                    .FirstOrDefault();

                if (firstWork.HasValue && t.RepairCompletedAt.HasValue)
                {
                    var dur = (t.RepairCompletedAt.Value - firstWork.Value).TotalMinutes;
                    if (dur > 0)
                    {
                        totalMttrMins += dur;
                        mttrCount++;
                    }
                }
            }

            result.Add(new ShiftWiseReportDto
            {
                ShiftName = shift.ShiftName,
                BreakdownCount = shiftTickets.Count,
                TotalDowntimeHours = Math.Round(downtimeMins / 60.0, 1),
                AvgMTTRMinutes = mttrCount > 0 ? Math.Round(totalMttrMins / mttrCount, 1) : 0
            });
        }

        return result;
    }

    public async Task<byte[]> ExportReportCsvAsync(string reportType, DateTime? fromDate = null, DateTime? toDate = null, CancellationToken ct = default)
    {
        var sb = new StringBuilder();

        switch (reportType.ToLowerInvariant())
        {
            case "machines":
                var machines = await GetMachineReportsAsync(fromDate, toDate, null, ct);
                sb.AppendLine("MachineCode,MachineName,Department,FailureCount,DowntimeHours,MTTRMinutes,MTTFHours,MTBFHours,AvailabilityPercent,LastBreakdown");
                foreach (var m in machines)
                {
                    sb.AppendLine($"\"{m.MachineCode}\",\"{m.MachineName}\",\"{m.DepartmentName}\",{m.FailureCount},{m.DowntimeHours},{m.MTTRMinutes},{m.MTTFHours},{m.MTBFHours},{m.AvailabilityPercent},\"{m.LastBreakdownDate:yyyy-MM-dd HH:mm}\"");
                }
                break;

            case "sla":
                var sla = await GetSlaReportAsync(fromDate, toDate, null, ct);
                sb.AppendLine("TicketNumber,MachineCode,Priority,BreakdownTime,StartedTime,RepairCompletedTime,ResponseTargetMins,ResponseActualMins,ResponseBreached,ResolutionTargetMins,ResolutionActualMins,ResolutionBreached");
                foreach (var s in sla)
                {
                    sb.AppendLine($"\"{s.TicketNumber}\",\"{s.MachineCode}\",\"{s.Priority}\",\"{s.BreakdownOccurredAt:yyyy-MM-dd HH:mm}\",\"{s.StartedAt:yyyy-MM-dd HH:mm}\",\"{s.RepairCompletedAt:yyyy-MM-dd HH:mm}\",{s.ResponseTargetMinutes},{s.ActualResponseMinutes},{s.IsResponseBreached},{s.ResolutionTargetMinutes},{s.ActualResolutionMinutes},{s.IsResolutionBreached}");
                }
                break;

            case "mechanics":
                var mechanics = await GetMechanicReportsAsync(fromDate, toDate, ct);
                sb.AppendLine("MechanicName,Specialization,Shift,ActiveJobs,CompletedJobs,AvgRepairMinutes");
                foreach (var mech in mechanics)
                {
                    sb.AppendLine($"\"{mech.MechanicName}\",\"{mech.Specialization}\",\"{mech.ShiftName}\",{mech.ActiveJobs},{mech.CompletedJobs},{mech.AvgRepairMinutes}");
                }
                break;

            default:
                var tickets = await _db.BreakdownTickets
                    .Include(t => t.Machine)
                    .Include(t => t.Category)
                    .Include(t => t.Supervisor)
                    .Include(t => t.Assignments.Where(a => a.IsCurrent)).ThenInclude(a => a.Mechanic).ThenInclude(m => m!.Employee)
                    .ToListAsync(ct);
                sb.AppendLine("TicketNumber,MachineCode,Category,Priority,Status,BreakdownTime,ReportedTime,Supervisor,Mechanic,Reason");
                foreach (var t in tickets)
                {
                    var mechName = t.Assignments.FirstOrDefault()?.Mechanic?.Employee?.EmployeeName ?? "Unassigned";
                    sb.AppendLine($"\"{t.TicketNumber}\",\"{t.Machine?.MachineCode}\",\"{t.Category?.CategoryName}\",\"{t.Priority}\",\"{t.CurrentStatus}\",\"{t.BreakdownOccurredAt:yyyy-MM-dd HH:mm}\",\"{t.ReportedAt:yyyy-MM-dd HH:mm}\",\"{t.Supervisor?.EmployeeName}\",\"{mechName}\",\"{t.BreakdownReason.Replace("\"", "\"\"")}\"");
                }
                break;
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }
}
