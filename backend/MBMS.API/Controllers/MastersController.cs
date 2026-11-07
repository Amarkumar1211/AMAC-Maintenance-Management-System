using System.Security.Claims;
using MBMS.Application.DTOs;
using MBMS.Application.Interfaces;
using MBMS.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MBMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MastersController : ControllerBase
{
    private readonly IMasterService _masterService;
    private readonly IQRService _qrService;

    public MastersController(IMasterService masterService, IQRService qrService)
    {
        _masterService = masterService;
        _qrService = qrService;
    }

    [HttpGet("departments")]
    public async Task<IActionResult> GetDepartments(CancellationToken ct)
    {
        return Ok(await _masterService.GetDepartmentsAsync(ct));
    }

    [HttpGet("sections")]
    public async Task<IActionResult> GetSections([FromQuery] int? departmentId, CancellationToken ct)
    {
        return Ok(await _masterService.GetSectionsAsync(departmentId, ct));
    }

    [HttpGet("machines")]
    public async Task<IActionResult> GetMachines(
        [FromQuery] int? departmentId,
        [FromQuery] int? sectionId,
        [FromQuery] string? criticality,
        [FromQuery] bool? activeOnly,
        CancellationToken ct)
    {
        // Enforce section-wise role isolation:
        // A supervisor can ONLY see machines belonging to their own assigned section
        if (User.IsInRole(DomainConstants.RoleSupervisor))
        {
            var userSecClaim = User.FindFirstValue("SectionId");
            if (int.TryParse(userSecClaim, out var sId) && sId > 0)
            {
                sectionId = sId;
            }
        }

        return Ok(await _masterService.GetMachinesAsync(departmentId, sectionId, criticality, activeOnly, ct));
    }

    [HttpGet("machines/{id:int}")]
    public async Task<IActionResult> GetMachineById(int id, CancellationToken ct)
    {
        var machine = await _masterService.GetMachineByIdAsync(id, ct);
        if (machine == null) return NotFound(new { Message = $"Machine {id} not found." });
        return Ok(machine);
    }

    [HttpGet("machines/code/{code}")]
    public async Task<IActionResult> GetMachineByCode(string code, CancellationToken ct)
    {
        var machine = await _masterService.GetMachineByCodeAsync(code, ct);
        if (machine == null) return NotFound(new { Message = $"Machine {code} not found." });
        return Ok(machine);
    }

    [HttpGet("machines/{id:int}/qr")]
    public async Task<IActionResult> GetMachineQrCode(int id, CancellationToken ct)
    {
        var machine = await _masterService.GetMachineByIdAsync(id, ct);
        if (machine == null) return NotFound(new { Message = $"Machine {id} not found." });

        var payload = _qrService.GenerateMachineQrPayload(machine.MachineId, machine.MachineCode);
        var pngBytes = _qrService.GenerateQrCodePng(payload);

        return File(pngBytes, "image/png", $"{machine.MachineCode}_QR.png");
    }

    [HttpPost("machines")]
    [Authorize(Roles = DomainConstants.RoleAdmin)]
    public async Task<IActionResult> CreateMachine([FromBody] MachineDto dto, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(dto.MachineCode) || string.IsNullOrWhiteSpace(dto.MachineName))
        {
            return BadRequest(new { Message = "Machine Code and Machine Name are required." });
        }

        var created = await _masterService.CreateMachineAsync(dto, ct);
        return CreatedAtAction(nameof(GetMachineById), new { id = created.MachineId }, created);
    }

    [HttpPut("machines/{id:int}")]
    [Authorize(Roles = DomainConstants.RoleAdmin)]
    public async Task<IActionResult> UpdateMachine(int id, [FromBody] MachineDto dto, CancellationToken ct)
    {
        var updated = await _masterService.UpdateMachineAsync(id, dto, ct);
        if (updated == null) return NotFound(new { Message = $"Machine {id} not found." });
        return Ok(updated);
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories(CancellationToken ct)
    {
        return Ok(await _masterService.GetBreakdownCategoriesAsync(ct));
    }

    [HttpGet("mechanics")]
    public async Task<IActionResult> GetMechanics([FromQuery] bool? availableOnly, CancellationToken ct)
    {
        return Ok(await _masterService.GetMechanicsAsync(availableOnly, ct));
    }

    [HttpGet("spare-parts")]
    public async Task<IActionResult> GetSpareParts([FromQuery] string? search, CancellationToken ct)
    {
        return Ok(await _masterService.GetSparePartsAsync(search, ct));
    }

    [HttpGet("shifts")]
    public async Task<IActionResult> GetShifts(CancellationToken ct)
    {
        return Ok(await _masterService.GetShiftsAsync(ct));
    }

    [HttpPost("machines/bulk")]
    [Authorize(Roles = DomainConstants.RoleAdmin)]
    public async Task<IActionResult> BulkImportMachines([FromBody] List<MachineDto> machines, CancellationToken ct)
    {
        if (machines == null || machines.Count == 0)
            return BadRequest(new { Message = "No machine data provided for import." });
        var created = await _masterService.BulkImportMachinesAsync(machines, ct);
        return Ok(created);
    }

    [HttpPost("spare-parts")]
    [Authorize(Roles = $"{DomainConstants.RoleAdmin},{DomainConstants.RoleMaintenanceIncharge}")]
    public async Task<IActionResult> CreateSparePart([FromBody] SparePartDto dto, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(dto.PartCode) || string.IsNullOrWhiteSpace(dto.PartName))
            return BadRequest(new { Message = "Part Code and Part Name are required." });
        var created = await _masterService.CreateSparePartAsync(dto, ct);
        return Ok(created);
    }

    [HttpPost("spare-parts/bulk")]
    [Authorize(Roles = $"{DomainConstants.RoleAdmin},{DomainConstants.RoleMaintenanceIncharge}")]
    public async Task<IActionResult> BulkImportSpareParts([FromBody] List<SparePartDto> parts, CancellationToken ct)
    {
        if (parts == null || parts.Count == 0)
            return BadRequest(new { Message = "No spare parts provided for import." });
        var created = await _masterService.BulkImportSparePartsAsync(parts, ct);
        return Ok(created);
    }

    [HttpGet("spare-parts/transactions")]
    public async Task<IActionResult> GetSparePartTransactions([FromQuery] string? type, [FromQuery] int? partId, CancellationToken ct)
    {
        return Ok(await _masterService.GetSparePartTransactionsAsync(type, partId, ct));
    }

    [HttpPost("spare-parts/transactions")]
    [Authorize(Roles = $"{DomainConstants.RoleAdmin},{DomainConstants.RoleMaintenanceIncharge},{DomainConstants.RoleSupervisor}")]
    public async Task<IActionResult> AddSparePartTransaction([FromBody] CreateSparePartTransactionRequest req, CancellationToken ct)
    {
        if (req.PartId <= 0 || req.Quantity <= 0)
            return BadRequest(new { Message = "Part ID and valid quantity greater than 0 are required." });
        var user = User.Identity?.Name ?? "Store Incharge";
        var created = await _masterService.AddSparePartTransactionAsync(req, user, ct);
        return Ok(created);
    }

    [HttpGet("supervisors")]
    public async Task<IActionResult> GetSupervisors(CancellationToken ct)
    {
        return Ok(await _masterService.GetSupervisorsAsync(ct));
    }

    [HttpPost("supervisors")]
    [Authorize(Roles = DomainConstants.RoleAdmin)]
    public async Task<IActionResult> CreateSupervisor([FromBody] CreateSupervisorRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.EmployeeCode) || string.IsNullOrWhiteSpace(req.EmployeeName))
            return BadRequest(new { Message = "Employee Code and Name are required." });
        var created = await _masterService.CreateSupervisorAsync(req, ct);
        return Ok(created);
    }

    [HttpPost("supervisors/bulk")]
    [Authorize(Roles = DomainConstants.RoleAdmin)]
    public async Task<IActionResult> BulkImportSupervisors([FromBody] List<CreateSupervisorRequest> requests, CancellationToken ct)
    {
        if (requests == null || requests.Count == 0)
            return BadRequest(new { Message = "No supervisor data provided for import." });
        var created = await _masterService.BulkImportSupervisorsAsync(requests, ct);
        return Ok(created);
    }

    [HttpPost("mechanics")]
    [Authorize(Roles = DomainConstants.RoleAdmin)]
    public async Task<IActionResult> CreateMechanic([FromBody] CreateMechanicRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.EmployeeCode) || string.IsNullOrWhiteSpace(req.EmployeeName))
            return BadRequest(new { Message = "Employee Code and Name are required." });
        var created = await _masterService.CreateMechanicAsync(req, ct);
        return Ok(created);
    }

    [HttpPost("mechanics/bulk")]
    [Authorize(Roles = DomainConstants.RoleAdmin)]
    public async Task<IActionResult> BulkImportMechanics([FromBody] List<CreateMechanicRequest> requests, CancellationToken ct)
    {
        if (requests == null || requests.Count == 0)
            return BadRequest(new { Message = "No mechanic data provided for import." });
        var created = await _masterService.BulkImportMechanicsAsync(requests, ct);
        return Ok(created);
    }
}
