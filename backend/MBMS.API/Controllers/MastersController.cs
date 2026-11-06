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
        [FromQuery] string? criticality,
        [FromQuery] bool? activeOnly,
        CancellationToken ct)
    {
        return Ok(await _masterService.GetMachinesAsync(departmentId, criticality, activeOnly, ct));
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
}

