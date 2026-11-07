using MBMS.Application.DTOs;

namespace MBMS.Application.Interfaces;

public interface ITicketService
{
    Task<List<TicketListDto>> GetTicketsAsync(
        string? status = null,
        int? machineId = null,
        int? supervisorId = null,
        int? mechanicId = null,
        string? priority = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        int? departmentId = null,
        int? sectionId = null,
        CancellationToken ct = default);

    Task<TicketDetailDto?> GetTicketByIdAsync(long ticketId, CancellationToken ct = default);
    Task<TicketDetailDto?> GetTicketByNumberAsync(string ticketNumber, CancellationToken ct = default);

    Task<TicketDetailDto> CreateTicketAsync(int supervisorEmployeeId, CreateTicketRequest request, CancellationToken ct = default);
    Task<TicketDetailDto> AssignMechanicAsync(long ticketId, int assignedByEmployeeId, AssignMechanicRequest request, CancellationToken ct = default);
    Task<TicketDetailDto> AcceptTicketAsync(long ticketId, int mechanicId, bool isAdmin = false, CancellationToken ct = default);
    Task<TicketDetailDto> StartWorkAsync(long ticketId, int mechanicId, StartWorkRequest request, bool isAdmin = false, CancellationToken ct = default);
    Task<TicketDetailDto> PauseWorkAsync(long ticketId, int mechanicId, PauseWorkRequest request, bool isAdmin = false, CancellationToken ct = default);
    Task<TicketDetailDto> ResumeWorkAsync(long ticketId, int mechanicId, ResumeWorkRequest request, bool isAdmin = false, CancellationToken ct = default);
    Task<TicketDetailDto> CompleteWorkAsync(long ticketId, int mechanicId, CompleteWorkRequest request, bool isAdmin = false, CancellationToken ct = default);
    Task<TicketDetailDto> ProcessApprovalAsync(long ticketId, int approverEmployeeId, List<string> approverRoles, ApprovalRequest request, CancellationToken ct = default);
    Task<TicketDetailDto> ReopenTicketAsync(long ticketId, int changedByEmployeeId, ReopenTicketRequest request, CancellationToken ct = default);
    Task<TicketDetailDto> CancelTicketAsync(long ticketId, int changedByEmployeeId, CancelTicketRequest request, CancellationToken ct = default);
    Task<TicketCommentDto> AddCommentAsync(long ticketId, int employeeId, AddCommentRequest request, CancellationToken ct = default);
}
