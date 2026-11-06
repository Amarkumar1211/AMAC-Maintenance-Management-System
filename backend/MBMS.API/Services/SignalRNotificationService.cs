using MBMS.API.Hubs;
using MBMS.Application.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace MBMS.API.Services;

public class SignalRNotificationService : INotificationService
{
    private readonly IHubContext<NotificationHub> _hub;

    public SignalRNotificationService(IHubContext<NotificationHub> hub)
    {
        _hub = hub;
    }

    public async Task NotifyTicketCreatedAsync(string ticketNumber, string machineCode, string priority)
    {
        await _hub.Clients.All.SendAsync("TicketCreated", new
        {
            TicketNumber = ticketNumber,
            MachineCode = machineCode,
            Priority = priority,
            Timestamp = DateTime.UtcNow
        });
    }

    public async Task NotifyTicketAssignedAsync(string ticketNumber, int mechanicId, string mechanicName)
    {
        await _hub.Clients.All.SendAsync("TicketAssigned", new
        {
            TicketNumber = ticketNumber,
            MechanicId = mechanicId,
            MechanicName = mechanicName,
            Timestamp = DateTime.UtcNow
        });
    }

    public async Task NotifyTicketStatusChangedAsync(string ticketNumber, string oldStatus, string newStatus)
    {
        await _hub.Clients.All.SendAsync("TicketStatusChanged", new
        {
            TicketNumber = ticketNumber,
            OldStatus = oldStatus,
            NewStatus = newStatus,
            Timestamp = DateTime.UtcNow
        });
    }

    public async Task NotifyApprovalPendingAsync(string ticketNumber, string stage)
    {
        await _hub.Clients.All.SendAsync("ApprovalPending", new
        {
            TicketNumber = ticketNumber,
            Stage = stage,
            Timestamp = DateTime.UtcNow
        });
    }

    public async Task NotifyTicketClosedAsync(string ticketNumber)
    {
        await _hub.Clients.All.SendAsync("TicketClosed", new
        {
            TicketNumber = ticketNumber,
            Timestamp = DateTime.UtcNow
        });
    }
}

