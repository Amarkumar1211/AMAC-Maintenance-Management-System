namespace MBMS.Application.Interfaces;

public interface INotificationService
{
    Task NotifyTicketCreatedAsync(string ticketNumber, string machineCode, string priority);
    Task NotifyTicketAssignedAsync(string ticketNumber, int mechanicId, string mechanicName);
    Task NotifyTicketStatusChangedAsync(string ticketNumber, string oldStatus, string newStatus);
    Task NotifyApprovalPendingAsync(string ticketNumber, string stage);
    Task NotifyTicketClosedAsync(string ticketNumber);
}

