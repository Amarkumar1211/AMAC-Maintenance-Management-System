using MBMS.Application.DTOs;

namespace MBMS.Application.Interfaces;

public interface IReportingService
{
    Task<ManagementDashboardDto> GetManagementDashboardAsync(DateTime? fromDate = null, DateTime? toDate = null, CancellationToken ct = default);
    Task<List<MachineDowntimeRankingDto>> GetMachineReportsAsync(DateTime? fromDate = null, DateTime? toDate = null, int? departmentId = null, CancellationToken ct = default);
    Task<List<MechanicWorkloadItemDto>> GetMechanicReportsAsync(DateTime? fromDate = null, DateTime? toDate = null, CancellationToken ct = default);
    Task<List<SlaPerformanceDto>> GetSlaReportAsync(DateTime? fromDate = null, DateTime? toDate = null, string? priority = null, CancellationToken ct = default);
    Task<List<RepeatBreakdownReportDto>> GetRepeatBreakdownsAsync(int rollingDays = 30, int minOccurrences = 2, CancellationToken ct = default);
    Task<List<ShiftWiseReportDto>> GetShiftWiseReportsAsync(DateTime? fromDate = null, DateTime? toDate = null, CancellationToken ct = default);
    Task<byte[]> ExportReportCsvAsync(string reportType, DateTime? fromDate = null, DateTime? toDate = null, CancellationToken ct = default);
}

