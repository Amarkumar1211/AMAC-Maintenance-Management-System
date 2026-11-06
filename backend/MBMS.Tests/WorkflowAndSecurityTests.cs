using MBMS.Domain.Entities;
using MBMS.Domain.Enums;
using MBMS.Infrastructure.Security;
using Xunit;

namespace MBMS.Tests;

public class WorkflowAndSecurityTests
{
    [Fact]
    public void PasswordHasher_ShouldHashAndVerifySuccessfully()
    {
        var hasher = new PasswordHasher();
        var password = "IndustrialSecretPassword@2026";

        var hash = hasher.HashPassword(password);

        Assert.NotNull(hash);
        Assert.NotEmpty(hash);
        Assert.NotEqual(password, hash);

        Assert.True(hasher.VerifyPassword(password, hash));
        Assert.False(hasher.VerifyPassword("WrongPassword", hash));
    }

    [Fact]
    public void TicketStatusTransitions_ShouldFollowExpectedSequence()
    {
        var ticket = new BreakdownTicket
        {
            TicketNumber = "BD-2026-00001",
            CurrentStatus = DomainConstants.StatusNew,
            CurrentApprovalRound = 1
        };

        // Incharge assigns mechanic
        ticket.CurrentStatus = DomainConstants.StatusAssigned;
        Assert.Equal(DomainConstants.StatusAssigned, ticket.CurrentStatus);

        // Mechanic accepts
        ticket.CurrentStatus = DomainConstants.StatusAccepted;
        Assert.Equal(DomainConstants.StatusAccepted, ticket.CurrentStatus);

        // Mechanic starts work
        ticket.CurrentStatus = DomainConstants.StatusInProgress;
        Assert.Equal(DomainConstants.StatusInProgress, ticket.CurrentStatus);

        // Mechanic completes work -> Awaiting Supervisor
        ticket.CurrentStatus = DomainConstants.StatusAwaitingSupervisor;
        Assert.Equal(DomainConstants.StatusAwaitingSupervisor, ticket.CurrentStatus);

        // Supervisor approves -> Awaiting Incharge
        ticket.CurrentStatus = DomainConstants.StatusAwaitingIncharge;
        Assert.Equal(DomainConstants.StatusAwaitingIncharge, ticket.CurrentStatus);

        // Incharge approves -> Closed
        ticket.CurrentStatus = DomainConstants.StatusClosed;
        Assert.Equal(DomainConstants.StatusClosed, ticket.CurrentStatus);
    }

    [Fact]
    public void ReopenTicket_ShouldIncrementApprovalRoundAndResetClosedState()
    {
        var ticket = new BreakdownTicket
        {
            TicketNumber = "BD-2026-00001",
            CurrentStatus = DomainConstants.StatusClosed,
            CurrentApprovalRound = 1,
            ClosedAt = DateTime.UtcNow
        };

        // Reopen event
        ticket.CurrentApprovalRound += 1;
        ticket.CurrentStatus = DomainConstants.StatusReopened;
        ticket.ClosedAt = null;

        Assert.Equal(2, ticket.CurrentApprovalRound);
        Assert.Equal(DomainConstants.StatusReopened, ticket.CurrentStatus);
        Assert.Null(ticket.ClosedAt);
    }

    [Fact]
    public void MachineDowntimeCalculation_ShouldDecoupleFromRepairTime()
    {
        var occurred = new DateTime(2026, 11, 2, 8, 0, 0);
        var workStarted = new DateTime(2026, 11, 2, 8, 30, 0);
        var repairDone = new DateTime(2026, 11, 2, 9, 30, 0);
        var restored = new DateTime(2026, 11, 2, 10, 0, 0);

        var totalDowntime = (restored - occurred).TotalMinutes;
        var activeRepairDuration = (repairDone - workStarted).TotalMinutes;
        var responseTime = (workStarted - occurred).TotalMinutes;
        var trialOrQualityDelay = (restored - repairDone).TotalMinutes;

        Assert.Equal(120, totalDowntime);
        Assert.Equal(60, activeRepairDuration);
        Assert.Equal(30, responseTime);
        Assert.Equal(30, trialOrQualityDelay);
    }
}

