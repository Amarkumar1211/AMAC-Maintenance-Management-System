using MBMS.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MBMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportingService _reportingService;

    public ReportsController(IReportingService reportingService)
    {
        _reportingService = reportingService;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        CancellationToken ct)
    {
        return Ok(await _reportingService.GetManagementDashboardAsync(fromDate, toDate, ct));
    }

    [HttpGet("machines")]
    public async Task<IActionResult> GetMachineReports(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] int? departmentId,
        CancellationToken ct)
    {
        return Ok(await _reportingService.GetMachineReportsAsync(fromDate, toDate, departmentId, ct));
    }

    [HttpGet("mechanics")]
    public async Task<IActionResult> GetMechanicReports(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        CancellationToken ct)
    {
        return Ok(await _reportingService.GetMechanicReportsAsync(fromDate, toDate, ct));
    }

    [HttpGet("sla")]
    public async Task<IActionResult> GetSlaReport(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] string? priority,
        CancellationToken ct)
    {
        return Ok(await _reportingService.GetSlaReportAsync(fromDate, toDate, priority, ct));
    }

    [HttpGet("repeat-breakdowns")]
    public async Task<IActionResult> GetRepeatBreakdowns(
        [FromQuery] int rollingDays = 30,
        [FromQuery] int minOccurrences = 2,
        CancellationToken ct = default)
    {
        return Ok(await _reportingService.GetRepeatBreakdownsAsync(rollingDays, minOccurrences, ct));
    }

    [HttpGet("shifts")]
    public async Task<IActionResult> GetShiftReports(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        CancellationToken ct)
    {
        return Ok(await _reportingService.GetShiftWiseReportsAsync(fromDate, toDate, ct));
    }

    [HttpGet("export-csv")]
    public async Task<IActionResult> ExportCsv(
        [FromQuery] string reportType,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        CancellationToken ct)
    {
        var bytes = await _reportingService.ExportReportCsvAsync(reportType, fromDate, toDate, ct);
        var filename = $"{reportType}_report_{DateTime.UtcNow:yyyyMMdd_HHmm}.csv";
        return File(bytes, "text/csv", filename);
    }
}

