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
public class TicketsController : ControllerBase
{
    private readonly ITicketService _ticketService;

    public TicketsController(ITicketService ticketService)
    {
        _ticketService = ticketService;
    }

    [HttpGet]
    public async Task<IActionResult> GetTickets(
        [FromQuery] string? status,
        [FromQuery] int? machineId,
        [FromQuery] int? supervisorId,
        [FromQuery] int? mechanicId,
        [FromQuery] string? priority,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] int? departmentId,
        [FromQuery] int? sectionId,
        CancellationToken ct)
    {
        // Enforce strict section-wise access control:
        // A supervisor can ONLY access tickets belonging to their own assigned section
        if (User.IsInRole(DomainConstants.RoleSupervisor))
        {
            var userSectionId = GetCurrentSectionId();
            if (userSectionId.HasValue && userSectionId.Value > 0)
            {
                sectionId = userSectionId.Value;
            }
        }
        else if (User.IsInRole(DomainConstants.RoleMechanic))
        {
            var userMechId = GetCurrentMechanicId();
            var userSectionId = GetCurrentSectionId();
            if (userMechId.HasValue && userMechId.Value > 0)
            {
                mechanicId = userMechId.Value;
            }
            else if (userSectionId.HasValue && userSectionId.Value > 0)
            {
                sectionId = userSectionId.Value;
            }
        }

        var tickets = await _ticketService.GetTicketsAsync(status, machineId, supervisorId, mechanicId, priority, fromDate, toDate, departmentId, sectionId, ct);
        return Ok(tickets);
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetTicketById(long id, CancellationToken ct)
    {
        var ticket = await _ticketService.GetTicketByIdAsync(id, ct);
        if (ticket == null) return NotFound(new { Message = $"Ticket {id} not found." });
        return Ok(ticket);
    }

    [HttpGet("number/{ticketNumber}")]
    public async Task<IActionResult> GetTicketByNumber(string ticketNumber, CancellationToken ct)
    {
        var ticket = await _ticketService.GetTicketByNumberAsync(ticketNumber, ct);
        if (ticket == null) return NotFound(new { Message = $"Ticket {ticketNumber} not found." });
        return Ok(ticket);
    }

    [HttpPost]
    [Authorize(Roles = $"{DomainConstants.RoleSupervisor},{DomainConstants.RoleAdmin}")]
    public async Task<IActionResult> CreateTicket([FromBody] CreateTicketRequest request, CancellationToken ct)
    {
        var employeeId = GetCurrentEmployeeId();
        var ticket = await _ticketService.CreateTicketAsync(employeeId, request, ct);
        return CreatedAtAction(nameof(GetTicketById), new { id = ticket.TicketId }, ticket);
    }

    [HttpPost("{id:long}/assign")]
    [Authorize(Roles = $"{DomainConstants.RoleMaintenanceIncharge},{DomainConstants.RoleAdmin}")]
    public async Task<IActionResult> AssignMechanic(long id, [FromBody] AssignMechanicRequest request, CancellationToken ct)
    {
        var employeeId = GetCurrentEmployeeId();
        var ticket = await _ticketService.AssignMechanicAsync(id, employeeId, request, ct);
        return Ok(ticket);
    }

    [HttpPost("{id:long}/accept")]
    [Authorize(Roles = $"{DomainConstants.RoleMechanic},{DomainConstants.RoleAdmin}")]
    public async Task<IActionResult> AcceptTicket(long id, CancellationToken ct)
    {
        var mechanicId = GetCurrentMechanicId();
        bool isAdmin = User.IsInRole(DomainConstants.RoleAdmin);
        if (!mechanicId.HasValue && !isAdmin)
        {
            return Forbid();
        }

        var ticket = await _ticketService.AcceptTicketAsync(id, mechanicId ?? 0, isAdmin, ct);
        return Ok(ticket);
    }

    [HttpPost("{id:long}/start-work")]
    [Authorize(Roles = $"{DomainConstants.RoleMechanic},{DomainConstants.RoleAdmin}")]
    public async Task<IActionResult> StartWork(long id, [FromBody] StartWorkRequest request, CancellationToken ct)
    {
        var mechanicId = GetCurrentMechanicId();
        bool isAdmin = User.IsInRole(DomainConstants.RoleAdmin);
        if (!mechanicId.HasValue && !isAdmin)
        {
            return Forbid();
        }

        var ticket = await _ticketService.StartWorkAsync(id, mechanicId ?? 0, request, isAdmin, ct);
        return Ok(ticket);
    }

    [HttpPost("{id:long}/pause-work")]
    [Authorize(Roles = $"{DomainConstants.RoleMechanic},{DomainConstants.RoleAdmin}")]
    public async Task<IActionResult> PauseWork(long id, [FromBody] PauseWorkRequest request, CancellationToken ct)
    {
        var mechanicId = GetCurrentMechanicId();
        bool isAdmin = User.IsInRole(DomainConstants.RoleAdmin);
        if (!mechanicId.HasValue && !isAdmin)
        {
            return Forbid();
        }

        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            return BadRequest(new { Message = "A reason for placing work on hold is required." });
        }

        var ticket = await _ticketService.PauseWorkAsync(id, mechanicId ?? 0, request, isAdmin, ct);
        return Ok(ticket);
    }

    [HttpPost("{id:long}/resume-work")]
    [Authorize(Roles = $"{DomainConstants.RoleMechanic},{DomainConstants.RoleAdmin}")]
    public async Task<IActionResult> ResumeWork(long id, [FromBody] ResumeWorkRequest request, CancellationToken ct)
    {
        var mechanicId = GetCurrentMechanicId();
        bool isAdmin = User.IsInRole(DomainConstants.RoleAdmin);
        if (!mechanicId.HasValue && !isAdmin)
        {
            return Forbid();
        }

        var ticket = await _ticketService.ResumeWorkAsync(id, mechanicId ?? 0, request, isAdmin, ct);
        return Ok(ticket);
    }

    [HttpPost("{id:long}/complete-work")]
    [Authorize(Roles = $"{DomainConstants.RoleMechanic},{DomainConstants.RoleAdmin}")]
    public async Task<IActionResult> CompleteWork(long id, [FromBody] CompleteWorkRequest request, CancellationToken ct)
    {
        var mechanicId = GetCurrentMechanicId();
        bool isAdmin = User.IsInRole(DomainConstants.RoleAdmin);
        if (!mechanicId.HasValue && !isAdmin)
        {
            return Forbid();
        }

        if (string.IsNullOrWhiteSpace(request.ActionTaken))
        {
            return BadRequest(new { Message = "Action taken details are required." });
        }

        var ticket = await _ticketService.CompleteWorkAsync(id, mechanicId ?? 0, request, isAdmin, ct);
        return Ok(ticket);
    }

    [HttpPost("{id:long}/approval")]
    [Authorize(Roles = $"{DomainConstants.RoleSupervisor},{DomainConstants.RoleMaintenanceIncharge},{DomainConstants.RoleAdmin}")]
    public async Task<IActionResult> ProcessApproval(long id, [FromBody] ApprovalRequest request, CancellationToken ct)
    {
        var employeeId = GetCurrentEmployeeId();
        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();

        if (request.Status.Equals("REJECTED", StringComparison.OrdinalIgnoreCase) && string.IsNullOrWhiteSpace(request.Remarks))
        {
            return BadRequest(new { Message = "A reason is mandatory when rejecting a repair." });
        }

        var ticket = await _ticketService.ProcessApprovalAsync(id, employeeId, roles, request, ct);
        return Ok(ticket);
    }

    [HttpPost("{id:long}/reopen")]
    [Authorize(Roles = $"{DomainConstants.RoleSupervisor},{DomainConstants.RoleMaintenanceIncharge},{DomainConstants.RoleAdmin}")]
    public async Task<IActionResult> ReopenTicket(long id, [FromBody] ReopenTicketRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            return BadRequest(new { Message = "A reason is required to reopen a closed ticket." });
        }

        var employeeId = GetCurrentEmployeeId();
        var ticket = await _ticketService.ReopenTicketAsync(id, employeeId, request, ct);
        return Ok(ticket);
    }

    [HttpPost("{id:long}/cancel")]
    [Authorize(Roles = $"{DomainConstants.RoleMaintenanceIncharge},{DomainConstants.RoleAdmin}")]
    public async Task<IActionResult> CancelTicket(long id, [FromBody] CancelTicketRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            return BadRequest(new { Message = "A reason is required to cancel a ticket." });
        }

        var employeeId = GetCurrentEmployeeId();
        var ticket = await _ticketService.CancelTicketAsync(id, employeeId, request, ct);
        return Ok(ticket);
    }

    [HttpPost("{id:long}/comments")]
    public async Task<IActionResult> AddComment(long id, [FromBody] AddCommentRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.CommentText))
        {
            return BadRequest(new { Message = "Comment text cannot be empty." });
        }

        var employeeId = GetCurrentEmployeeId();
        var comment = await _ticketService.AddCommentAsync(id, employeeId, request, ct);
        return Ok(comment);
    }

    private int GetCurrentEmployeeId()
    {
        var val = User.FindFirstValue("EmployeeId");
        return int.Parse(val ?? "1");
    }

    private int? GetCurrentMechanicId()
    {
        var val = User.FindFirstValue("MechanicId");
        if (int.TryParse(val, out var id)) return id;
        return null;
    }

    private int? GetCurrentSectionId()
    {
        var val = User.FindFirstValue("SectionId");
        if (int.TryParse(val, out var id)) return id;
        return null;
    }
}
