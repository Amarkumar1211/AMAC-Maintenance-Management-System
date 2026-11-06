using MBMS.Application.Interfaces;
using MBMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MBMS.Infrastructure.Services;

public class TicketNumberGenerator : ITicketNumberGenerator
{
    private readonly MBMSDbContext _db;
    private static readonly SemaphoreSlim Semaphore = new(1, 1);

    public TicketNumberGenerator(MBMSDbContext db)
    {
        _db = db;
    }

    public async Task<string> GenerateTicketNumberAsync(CancellationToken ct = default)
    {
        await Semaphore.WaitAsync(ct);
        try
        {
            var year = DateTime.UtcNow.Year;
            var prefix = $"BD-{year}-";

            var latestTicket = await _db.BreakdownTickets
                .Where(t => t.TicketNumber.StartsWith(prefix))
                .OrderByDescending(t => t.TicketNumber)
                .Select(t => t.TicketNumber)
                .FirstOrDefaultAsync(ct);

            int nextSeq = 1;
            if (!string.IsNullOrEmpty(latestTicket) && latestTicket.Length > prefix.Length)
            {
                var seqPart = latestTicket.Substring(prefix.Length);
                if (int.TryParse(seqPart, out var parsed))
                {
                    nextSeq = parsed + 1;
                }
            }

            return $"{prefix}{nextSeq:D5}";
        }
        finally
        {
            Semaphore.Release();
        }
    }
}

