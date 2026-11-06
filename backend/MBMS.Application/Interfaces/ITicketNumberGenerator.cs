namespace MBMS.Application.Interfaces;

public interface ITicketNumberGenerator
{
    Task<string> GenerateTicketNumberAsync(CancellationToken ct = default);
}

