using Microsoft.AspNetCore.SignalR;

namespace MBMS.API.Hubs;

public class NotificationHub : Hub
{
    public async Task JoinDepartmentGroup(string departmentId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"dept_{departmentId}");
    }

    public async Task JoinRoleGroup(string role)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"role_{role.ToUpperInvariant()}");
    }

    public async Task JoinMechanicGroup(string mechanicId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"mech_{mechanicId}");
    }
}

