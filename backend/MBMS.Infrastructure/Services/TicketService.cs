using MBMS.Application.DTOs;
using MBMS.Application.Interfaces;
using MBMS.Domain.Entities;
using MBMS.Domain.Enums;
using MBMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MBMS.Infrastructure.Services;

public class TicketService : ITicketService
{
    private readonly MBMSDbContext _db;
    private readonly ITicketNumberGenerator _numberGen;
    private readonly IFileStorageService _fileStorage;
    private readonly INotificationService _notifications;

    public TicketService(
        MBMSDbContext db,
        ITicketNumberGenerator numberGen,
        IFileStorageService fileStorage,
        INotificationService notifications)
    {
        _db = db;
        _numberGen = numberGen;
        _fileStorage = fileStorage;
        _notifications = notifications;
    }

    public async Task<List<TicketListDto>> GetTicketsAsync(
        string? status = null,
        int? machineId = null,
        int? supervisorId = null,
        int? mechanicId = null,
        string? priority = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        CancellationToken ct = default)
    {
        var query = _db.BreakdownTickets
            .Include(t => t.Machine)
                .ThenInclude(m => m!.Department)
            .Include(t => t.Category)
            .Include(t => t.Assignments.Where(a => a.IsCurrent))
                .ThenInclude(a => a.Mechanic)
                    .ThenInclude(m => m!.Employee)
            .Include(t => t.Downtimes)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrEmpty(status))
            query = query.Where(t => t.CurrentStatus == status);

        if (machineId.HasValue)
            query = query.Where(t => t.MachineId == machineId.Value);

        if (supervisorId.HasValue)
            query = query.Where(t => t.SupervisorId == supervisorId.Value);

        if (mechanicId.HasValue)
            query = query.Where(t => t.Assignments.Any(a => a.IsCurrent && a.MechanicId == mechanicId.Value));

        if (!string.IsNullOrEmpty(priority))
            query = query.Where(t => t.Priority == priority);

        if (fromDate.HasValue)
            query = query.Where(t => t.BreakdownOccurredAt >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(t => t.BreakdownOccurredAt <= toDate.Value);

        var now = DateTime.UtcNow;

        var list = await query
            .OrderByDescending(t => t.TicketId)
            .Select(t => new
            {
                t.TicketId,
                t.TicketNumber,
                t.MachineId,
                MachineCode = t.Machine != null ? t.Machine.MachineCode : "",
                MachineName = t.Machine != null ? t.Machine.MachineName : "",
                DepartmentName = t.Machine != null && t.Machine.Department != null ? t.Machine.Department.DepartmentName : "",
                CategoryName = t.Category != null ? t.Category.CategoryName : "",
                t.BreakdownOccurredAt,
                t.ReportedAt,
                t.Priority,
                t.CurrentStatus,
                t.BreakdownReason,
                t.CurrentApprovalRound,
                CurrentAssignment = t.Assignments.FirstOrDefault(a => a.IsCurrent),
                Downtimes = t.Downtimes.Select(d => new { d.StartedAt, d.RestoredAt }).ToList()
            })
            .ToListAsync(ct);

        return list.Select(t =>
        {
            double downtimeMinutes = 0;
            foreach (var d in t.Downtimes)
            {
                var end = d.RestoredAt ?? now;
                downtimeMinutes += Math.Max(0, (end - d.StartedAt).TotalMinutes);
            }

            return new TicketListDto
            {
                TicketId = t.TicketId,
                TicketNumber = t.TicketNumber,
                MachineId = t.MachineId,
                MachineCode = t.MachineCode,
                MachineName = t.MachineName,
                DepartmentName = t.DepartmentName,
                CategoryName = t.CategoryName,
                BreakdownOccurredAt = t.BreakdownOccurredAt,
                ReportedAt = t.ReportedAt,
                Priority = t.Priority,
                CurrentStatus = t.CurrentStatus,
                BreakdownReason = t.BreakdownReason,
                CurrentApprovalRound = t.CurrentApprovalRound,
                AssignedMechanicId = t.CurrentAssignment != null ? (int?)t.CurrentAssignment.MechanicId : null,
                AssignedMechanicName = t.CurrentAssignment?.Mechanic?.Employee?.EmployeeName,
                AssignedMechanicMobile = t.CurrentAssignment?.Mechanic?.Employee?.MobileNumber,
                AssignedMechanicSpecialization = t.CurrentAssignment?.Mechanic?.Specialization,
                AssignedAt = t.CurrentAssignment?.AssignedAt,
                AcceptedAt = t.CurrentAssignment?.AcceptedAt,
                TotalDowntimeMinutes = Math.Round(downtimeMinutes, 1)
            };
        }).ToList();
    }

    public async Task<TicketDetailDto?> GetTicketByIdAsync(long ticketId, CancellationToken ct = default)
    {
        var t = await BuildDetailQuery()
            .FirstOrDefaultAsync(t => t.TicketId == ticketId, ct);

        if (t == null) return null;
        return MapTicketDetail(t);
    }

    public async Task<TicketDetailDto?> GetTicketByNumberAsync(string ticketNumber, CancellationToken ct = default)
    {
        var t = await BuildDetailQuery()
            .FirstOrDefaultAsync(t => t.TicketNumber.ToLower() == ticketNumber.ToLower().Trim(), ct);

        if (t == null) return null;
        return MapTicketDetail(t);
    }

    public async Task<TicketDetailDto> CreateTicketAsync(int supervisorEmployeeId, CreateTicketRequest request, CancellationToken ct = default)
    {
        var machine = await _db.Machines.FindAsync(new object[] { request.MachineId }, ct);
        if (machine == null)
            throw new ArgumentException($"Machine with ID {request.MachineId} not found.");

        var category = await _db.BreakdownCategories.FindAsync(new object[] { request.CategoryId }, ct);
        if (category == null)
            throw new ArgumentException($"Breakdown category with ID {request.CategoryId} not found.");

        if (string.IsNullOrWhiteSpace(request.BreakdownReason))
            throw new InvalidOperationException("Breakdown reason / primary symptom is mandatory.");

        var now = DateTime.UtcNow;
        if (request.BreakdownOccurredAt > now.AddMinutes(5))
            throw new InvalidOperationException("Breakdown occurred timestamp cannot be in the future.");

        var ticketNumber = await _numberGen.GenerateTicketNumberAsync(ct);

        var ticket = new BreakdownTicket
        {
            TicketNumber = ticketNumber,
            MachineId = request.MachineId,
            SupervisorId = supervisorEmployeeId,
            CategoryId = request.CategoryId,
            BreakdownOccurredAt = request.BreakdownOccurredAt,
            ReportedAt = now,
            BreakdownReason = request.BreakdownReason.Trim(),
            BreakdownDescription = request.BreakdownDescription.Trim(),
            MachineCondition = request.MachineCondition ?? "STOPPED",
            ProductionImpact = request.ProductionImpact ?? "MEDIUM",
            Priority = request.Priority ?? "MEDIUM",
            CurrentStatus = DomainConstants.StatusNew,
            CurrentApprovalRound = 1,
            CreatedAt = now,
            UpdatedAt = now
        };

        _db.BreakdownTickets.Add(ticket);
        await _db.SaveChangesAsync(ct);

        // Record initial machine downtime interval
        var downtime = new MachineDowntime
        {
            TicketId = ticket.TicketId,
            MachineId = ticket.MachineId,
            StartedAt = ticket.BreakdownOccurredAt,
            RecordedAt = now
        };
        _db.MachineDowntime.Add(downtime);

        // Record status history
        var history = new TicketStatusHistory
        {
            TicketId = ticket.TicketId,
            PreviousStatus = null,
            NewStatus = DomainConstants.StatusNew,
            ChangedBy = supervisorEmployeeId,
            ChangeRemarks = "Breakdown ticket logged by supervisor.",
            ChangedAt = now
        };
        _db.TicketStatusHistory.Add(history);

        // Process attachments if provided
        if (request.Attachments != null && request.Attachments.Count > 0)
        {
            foreach (var att in request.Attachments)
            {
                if (string.IsNullOrWhiteSpace(att.Base64Data)) continue;
                byte[] bytes = Convert.FromBase64String(att.Base64Data.Contains(',') ? att.Base64Data.Split(',')[1] : att.Base64Data);
                using var ms = new MemoryStream(bytes);
                var saveRes = await _fileStorage.SaveAttachmentAsync(
                    ms,
                    att.FileName,
                    DomainConstants.AttachBreakdown,
                    ticket.TicketNumber,
                    att.ContentType,
                    ct);

                _db.TicketAttachments.Add(new TicketAttachment
                {
                    TicketId = ticket.TicketId,
                    UploadedBy = supervisorEmployeeId,
                    AttachmentType = DomainConstants.AttachBreakdown,
                    OriginalFileName = saveRes.OriginalFileName,
                    StoredFileName = saveRes.StoredFileName,
                    FilePath = saveRes.FullPath,
                    FileSize = saveRes.FileSize,
                    ContentType = saveRes.ContentType,
                    UploadedAt = now
                });
            }
        }

        await _db.SaveChangesAsync(ct);

        await _notifications.NotifyTicketCreatedAsync(ticket.TicketNumber, machine.MachineCode, ticket.Priority);

        return (await GetTicketByIdAsync(ticket.TicketId, ct))!;
    }

    public async Task<TicketDetailDto> AssignMechanicAsync(long ticketId, int assignedByEmployeeId, AssignMechanicRequest request, CancellationToken ct = default)
    {
        var ticket = await _db.BreakdownTickets
            .Include(t => t.Assignments)
            .FirstOrDefaultAsync(t => t.TicketId == ticketId, ct);

        if (ticket == null) throw new KeyNotFoundException($"Ticket {ticketId} not found.");

        if (ticket.CurrentStatus == DomainConstants.StatusClosed || ticket.CurrentStatus == DomainConstants.StatusCancelled)
        {
            throw new InvalidOperationException($"Cannot assign a technician to a {ticket.CurrentStatus} ticket.");
        }

        var mechanic = await _db.Mechanics
            .Include(m => m.Employee)
            .FirstOrDefaultAsync(m => m.MechanicId == request.MechanicId, ct);

        if (mechanic == null) throw new KeyNotFoundException($"Mechanic {request.MechanicId} not found.");

        var now = DateTime.UtcNow;

        // Mark previous assignments as not current and decrement active count if different mechanic
        foreach (var existing in ticket.Assignments.Where(a => a.IsCurrent))
        {
            existing.IsCurrent = false;
            if (existing.MechanicId != request.MechanicId)
            {
                var prevMech = await _db.Mechanics.FindAsync(new object[] { existing.MechanicId }, ct);
                if (prevMech != null)
                {
                    prevMech.ActiveTicketCount = Math.Max(0, prevMech.ActiveTicketCount - 1);
                }
            }
        }

        // Add new assignment
        var assignment = new TicketAssignment
        {
            TicketId = ticketId,
            MechanicId = request.MechanicId,
            AssignedBy = assignedByEmployeeId,
            AssignedAt = now,
            AssignmentRemarks = request.Remarks,
            IsCurrent = true
        };
        _db.TicketAssignments.Add(assignment);

        var oldStatus = ticket.CurrentStatus;
        ticket.CurrentStatus = DomainConstants.StatusAssigned;
        ticket.UpdatedAt = now;

        mechanic.ActiveTicketCount += 1;

        _db.TicketStatusHistory.Add(new TicketStatusHistory
        {
            TicketId = ticketId,
            PreviousStatus = oldStatus,
            NewStatus = DomainConstants.StatusAssigned,
            ChangedBy = assignedByEmployeeId,
            ChangeRemarks = $"Assigned to mechanic {mechanic.Employee?.EmployeeName ?? ""}. {request.Remarks}".Trim(),
            ChangedAt = now
        });

        await _db.SaveChangesAsync(ct);

        await _notifications.NotifyTicketAssignedAsync(ticket.TicketNumber, mechanic.MechanicId, mechanic.Employee?.EmployeeName ?? "");
        await _notifications.NotifyTicketStatusChangedAsync(ticket.TicketNumber, oldStatus, DomainConstants.StatusAssigned);

        return (await GetTicketByIdAsync(ticketId, ct))!;
    }

    public async Task<TicketDetailDto> AcceptTicketAsync(long ticketId, int mechanicId, bool isAdmin = false, CancellationToken ct = default)
    {
        var ticket = await _db.BreakdownTickets
            .Include(t => t.Assignments.Where(a => a.IsCurrent))
                .ThenInclude(a => a.Mechanic)
                    .ThenInclude(m => m!.Employee)
            .FirstOrDefaultAsync(t => t.TicketId == ticketId, ct);

        if (ticket == null) throw new KeyNotFoundException($"Ticket {ticketId} not found.");

        if (ticket.CurrentStatus != DomainConstants.StatusAssigned)
        {
            throw new InvalidOperationException($"Cannot accept ticket when current status is '{ticket.CurrentStatus}'. Ticket must be in ASSIGNED status.");
        }

        var currentAssignment = ticket.Assignments.FirstOrDefault(a => a.IsCurrent);
        if (currentAssignment == null)
        {
            throw new InvalidOperationException("This ticket does not have an active mechanic assignment.");
        }

        if (!isAdmin && currentAssignment.MechanicId != mechanicId)
        {
            throw new InvalidOperationException($"This ticket is assigned to {currentAssignment.Mechanic?.Employee?.EmployeeName ?? "another mechanic"}. Only the assigned technician or Plant Admin can accept it.");
        }

        var now = DateTime.UtcNow;
        currentAssignment.AcceptedAt = now;

        var oldStatus = ticket.CurrentStatus;
        ticket.CurrentStatus = DomainConstants.StatusAccepted;
        ticket.UpdatedAt = now;

        _db.TicketStatusHistory.Add(new TicketStatusHistory
        {
            TicketId = ticketId,
            PreviousStatus = oldStatus,
            NewStatus = DomainConstants.StatusAccepted,
            ChangedBy = currentAssignment.Mechanic?.EmployeeId ?? 1,
            ChangeRemarks = isAdmin ? "Mechanic assignment confirmed by Plant Admin." : "Mechanic accepted breakdown assignment.",
            ChangedAt = now
        });

        await _db.SaveChangesAsync(ct);
        await _notifications.NotifyTicketStatusChangedAsync(ticket.TicketNumber, oldStatus, DomainConstants.StatusAccepted);

        return (await GetTicketByIdAsync(ticketId, ct))!;
    }

    public async Task<TicketDetailDto> StartWorkAsync(long ticketId, int mechanicId, StartWorkRequest request, bool isAdmin = false, CancellationToken ct = default)
    {
        var ticket = await _db.BreakdownTickets
            .Include(t => t.Assignments.Where(a => a.IsCurrent))
            .FirstOrDefaultAsync(t => t.TicketId == ticketId, ct);

        if (ticket == null) throw new KeyNotFoundException($"Ticket {ticketId} not found.");

        if (ticket.CurrentStatus != DomainConstants.StatusAccepted 
            && ticket.CurrentStatus != DomainConstants.StatusAssigned
            && ticket.CurrentStatus != DomainConstants.StatusSupervisorRejected 
            && ticket.CurrentStatus != DomainConstants.StatusInchargeRejected
            && ticket.CurrentStatus != DomainConstants.StatusReopened)
        {
            throw new InvalidOperationException($"Cannot start work when ticket status is '{ticket.CurrentStatus}'. Ticket must be in ACCEPTED, ASSIGNED, REOPENED, or REJECTED status.");
        }

        var currentAssignment = ticket.Assignments.FirstOrDefault(a => a.IsCurrent);
        if (currentAssignment == null)
        {
            throw new InvalidOperationException("This ticket does not have an active mechanic assignment.");
        }

        var effectiveMechanicId = (isAdmin && mechanicId <= 0) ? currentAssignment.MechanicId : mechanicId;
        if (!isAdmin && currentAssignment.MechanicId != effectiveMechanicId)
        {
            throw new InvalidOperationException("You are not the currently assigned mechanic for this ticket.");
        }

        var mechanic = await _db.Mechanics.FindAsync(new object[] { effectiveMechanicId }, ct);
        var now = DateTime.UtcNow;

        if (currentAssignment.AcceptedAt == null)
        {
            currentAssignment.AcceptedAt = now;
        }

        var oldStatus = ticket.CurrentStatus;
        ticket.CurrentStatus = DomainConstants.StatusInProgress;
        ticket.UpdatedAt = now;

        // Start a work session
        _db.TicketWorkSessions.Add(new TicketWorkSession
        {
            TicketId = ticketId,
            MechanicId = effectiveMechanicId,
            SessionType = "WORK",
            StartedAt = now,
            Notes = request.Remarks ?? "Work started"
        });

        _db.TicketStatusHistory.Add(new TicketStatusHistory
        {
            TicketId = ticketId,
            PreviousStatus = oldStatus,
            NewStatus = DomainConstants.StatusInProgress,
            ChangedBy = mechanic?.EmployeeId ?? 1,
            ChangeRemarks = isAdmin ? "Repair commenced by Plant Admin." : "Mechanic commenced repair work.",
            ChangedAt = now
        });

        await _db.SaveChangesAsync(ct);
        await _notifications.NotifyTicketStatusChangedAsync(ticket.TicketNumber, oldStatus, DomainConstants.StatusInProgress);

        return (await GetTicketByIdAsync(ticketId, ct))!;
    }

    public async Task<TicketDetailDto> PauseWorkAsync(long ticketId, int mechanicId, PauseWorkRequest request, bool isAdmin = false, CancellationToken ct = default)
    {
        var ticket = await _db.BreakdownTickets
            .Include(t => t.Assignments.Where(a => a.IsCurrent))
            .FirstOrDefaultAsync(t => t.TicketId == ticketId, ct);
        if (ticket == null) throw new KeyNotFoundException($"Ticket {ticketId} not found.");

        if (ticket.CurrentStatus != DomainConstants.StatusInProgress)
        {
            throw new InvalidOperationException($"Cannot place repair on hold when ticket status is '{ticket.CurrentStatus}'. Work must be actively IN_PROGRESS.");
        }

        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            throw new ArgumentException("A reason for placing work on hold is required (e.g. Awaiting Spare Parts, Specialist Vendor).");
        }

        var currentAssignment = ticket.Assignments.FirstOrDefault(a => a.IsCurrent);
        var effectiveMechanicId = (isAdmin && mechanicId <= 0) ? (currentAssignment?.MechanicId ?? 1) : mechanicId;

        var mechanic = await _db.Mechanics.FindAsync(new object[] { effectiveMechanicId }, ct);
        var now = DateTime.UtcNow;

        // End active work session
        var activeSession = await _db.TicketWorkSessions
            .Where(s => s.TicketId == ticketId && s.EndedAt == null)
            .OrderByDescending(s => s.StartedAt)
            .FirstOrDefaultAsync(ct);

        if (activeSession != null)
        {
            activeSession.EndedAt = now;
        }

        // Start ON_HOLD session
        _db.TicketWorkSessions.Add(new TicketWorkSession
        {
            TicketId = ticketId,
            MechanicId = effectiveMechanicId,
            SessionType = "ON_HOLD",
            StartedAt = now,
            HoldReason = request.Reason.Trim(),
            Notes = request.Notes?.Trim()
        });

        var oldStatus = ticket.CurrentStatus;
        ticket.CurrentStatus = DomainConstants.StatusOnHold;
        ticket.UpdatedAt = now;

        _db.TicketStatusHistory.Add(new TicketStatusHistory
        {
            TicketId = ticketId,
            PreviousStatus = oldStatus,
            NewStatus = DomainConstants.StatusOnHold,
            ChangedBy = mechanic?.EmployeeId ?? 1,
            ChangeRemarks = $"Work paused. Reason: {request.Reason}".Trim(),
            ChangedAt = now
        });

        await _db.SaveChangesAsync(ct);
        await _notifications.NotifyTicketStatusChangedAsync(ticket.TicketNumber, oldStatus, DomainConstants.StatusOnHold);

        return (await GetTicketByIdAsync(ticketId, ct))!;
    }

    public async Task<TicketDetailDto> ResumeWorkAsync(long ticketId, int mechanicId, ResumeWorkRequest request, bool isAdmin = false, CancellationToken ct = default)
    {
        var ticket = await _db.BreakdownTickets
            .Include(t => t.Assignments.Where(a => a.IsCurrent))
            .FirstOrDefaultAsync(t => t.TicketId == ticketId, ct);
        if (ticket == null) throw new KeyNotFoundException($"Ticket {ticketId} not found.");

        if (ticket.CurrentStatus != DomainConstants.StatusOnHold)
        {
            throw new InvalidOperationException($"Cannot resume work when ticket status is '{ticket.CurrentStatus}'. Ticket must be ON_HOLD.");
        }

        var currentAssignment = ticket.Assignments.FirstOrDefault(a => a.IsCurrent);
        var effectiveMechanicId = (isAdmin && mechanicId <= 0) ? (currentAssignment?.MechanicId ?? 1) : mechanicId;

        var mechanic = await _db.Mechanics.FindAsync(new object[] { effectiveMechanicId }, ct);
        var now = DateTime.UtcNow;

        // End on_hold session
        var activeSession = await _db.TicketWorkSessions
            .Where(s => s.TicketId == ticketId && s.EndedAt == null)
            .OrderByDescending(s => s.StartedAt)
            .FirstOrDefaultAsync(ct);

        if (activeSession != null)
        {
            activeSession.EndedAt = now;
        }

        // Start new work session
        _db.TicketWorkSessions.Add(new TicketWorkSession
        {
            TicketId = ticketId,
            MechanicId = effectiveMechanicId,
            SessionType = "WORK",
            StartedAt = now,
            Notes = request.Notes?.Trim() ?? "Work resumed"
        });

        var oldStatus = ticket.CurrentStatus;
        ticket.CurrentStatus = DomainConstants.StatusInProgress;
        ticket.UpdatedAt = now;

        _db.TicketStatusHistory.Add(new TicketStatusHistory
        {
            TicketId = ticketId,
            PreviousStatus = oldStatus,
            NewStatus = DomainConstants.StatusInProgress,
            ChangedBy = mechanic?.EmployeeId ?? 1,
            ChangeRemarks = "Work resumed by mechanic.",
            ChangedAt = now
        });

        await _db.SaveChangesAsync(ct);
        await _notifications.NotifyTicketStatusChangedAsync(ticket.TicketNumber, oldStatus, DomainConstants.StatusInProgress);

        return (await GetTicketByIdAsync(ticketId, ct))!;
    }

    public async Task<TicketDetailDto> CompleteWorkAsync(long ticketId, int mechanicId, CompleteWorkRequest request, bool isAdmin = false, CancellationToken ct = default)
    {
        var ticket = await _db.BreakdownTickets
            .Include(t => t.Assignments.Where(a => a.IsCurrent))
            .FirstOrDefaultAsync(t => t.TicketId == ticketId, ct);

        if (ticket == null) throw new KeyNotFoundException($"Ticket {ticketId} not found.");

        if (ticket.CurrentStatus != DomainConstants.StatusInProgress)
        {
            throw new InvalidOperationException($"Cannot complete work when ticket status is '{ticket.CurrentStatus}'. Work must be actively IN_PROGRESS.");
        }

        if (string.IsNullOrWhiteSpace(request.ActionTaken))
        {
            throw new ArgumentException("Action taken / repair details are mandatory.");
        }

        if (string.IsNullOrWhiteSpace(request.ActualRootCause))
        {
            throw new ArgumentException("Actual root cause is mandatory upon repair completion.");
        }

        var currentAssignment = ticket.Assignments.FirstOrDefault(a => a.IsCurrent);
        if (currentAssignment == null)
        {
            throw new InvalidOperationException("This ticket does not have an active mechanic assignment.");
        }

        var effectiveMechanicId = (isAdmin && mechanicId <= 0) ? currentAssignment.MechanicId : mechanicId;
        if (!isAdmin && currentAssignment.MechanicId != effectiveMechanicId)
        {
            throw new InvalidOperationException("You are not the currently assigned mechanic for this ticket.");
        }

        var mechanic = await _db.Mechanics.FindAsync(new object[] { effectiveMechanicId }, ct);
        var now = DateTime.UtcNow;

        // End active work session
        var activeSession = await _db.TicketWorkSessions
            .Where(s => s.TicketId == ticketId && s.EndedAt == null)
            .OrderByDescending(s => s.StartedAt)
            .FirstOrDefaultAsync(ct);

        if (activeSession != null)
        {
            activeSession.EndedAt = now;
        }

        // Create MaintenanceAction
        var action = new MaintenanceAction
        {
            TicketId = ticketId,
            MechanicId = effectiveMechanicId,
            ApprovalRound = ticket.CurrentApprovalRound,
            InspectionFindings = request.InspectionFindings,
            ActualRootCause = request.ActualRootCause,
            ActionTaken = request.ActionTaken,
            StartedAt = activeSession?.StartedAt ?? now,
            CompletedAt = now,
            MachineConditionAfterRepair = request.MachineConditionAfterRepair ?? "RUNNING_NORMAL",
            MechanicRemarks = request.MechanicRemarks,
            CreatedAt = now
        };
        _db.MaintenanceActions.Add(action);
        await _db.SaveChangesAsync(ct);

        // Deduct spare parts & record PartsUsed
        if (request.PartsUsed != null && request.PartsUsed.Count > 0)
        {
            foreach (var partItem in request.PartsUsed)
            {
                var sparePart = await _db.SpareParts.FindAsync(new object[] { partItem.PartId }, ct);
                if (sparePart != null)
                {
                    sparePart.StockQuantity = Math.Max(0, sparePart.StockQuantity - partItem.Quantity);
                    _db.PartsUsed.Add(new PartUsed
                    {
                        ActionId = action.ActionId,
                        PartId = partItem.PartId,
                        Quantity = partItem.Quantity,
                        Remarks = partItem.Remarks
                    });
                }
            }
        }

        // Save repair photos
        if (request.RepairAttachments != null && request.RepairAttachments.Count > 0)
        {
            foreach (var att in request.RepairAttachments)
            {
                if (string.IsNullOrWhiteSpace(att.Base64Data)) continue;
                byte[] bytes = Convert.FromBase64String(att.Base64Data.Contains(',') ? att.Base64Data.Split(',')[1] : att.Base64Data);
                using var ms = new MemoryStream(bytes);
                var saveRes = await _fileStorage.SaveAttachmentAsync(
                    ms,
                    att.FileName,
                    DomainConstants.AttachRepair,
                    ticket.TicketNumber,
                    att.ContentType,
                    ct);

                _db.TicketAttachments.Add(new TicketAttachment
                {
                    TicketId = ticket.TicketId,
                    ActionId = action.ActionId,
                    UploadedBy = mechanic!.EmployeeId,
                    AttachmentType = DomainConstants.AttachRepair,
                    OriginalFileName = saveRes.OriginalFileName,
                    StoredFileName = saveRes.StoredFileName,
                    FilePath = saveRes.FullPath,
                    FileSize = saveRes.FileSize,
                    ContentType = saveRes.ContentType,
                    UploadedAt = now
                });
            }
        }

        var oldStatus = ticket.CurrentStatus;
        ticket.CurrentStatus = DomainConstants.StatusAwaitingSupervisor;
        ticket.RepairCompletedAt = now;
        ticket.UpdatedAt = now;

        _db.TicketStatusHistory.Add(new TicketStatusHistory
        {
            TicketId = ticketId,
            PreviousStatus = oldStatus,
            NewStatus = DomainConstants.StatusAwaitingSupervisor,
            ChangedBy = mechanic!.EmployeeId,
            ChangeRemarks = "Mechanic submitted repair completion. Awaiting supervisor verification.",
            ChangedAt = now
        });

        await _db.SaveChangesAsync(ct);

        await _notifications.NotifyApprovalPendingAsync(ticket.TicketNumber, DomainConstants.StageSupervisor);
        await _notifications.NotifyTicketStatusChangedAsync(ticket.TicketNumber, oldStatus, DomainConstants.StatusAwaitingSupervisor);

        return (await GetTicketByIdAsync(ticketId, ct))!;
    }

    public async Task<TicketDetailDto> ProcessApprovalAsync(
        long ticketId,
        int approverEmployeeId,
        List<string> approverRoles,
        ApprovalRequest request,
        CancellationToken ct = default)
    {
        var ticket = await _db.BreakdownTickets
            .Include(t => t.Assignments.Where(a => a.IsCurrent))
                .ThenInclude(a => a.Mechanic)
            .Include(t => t.Approvals)
            .Include(t => t.Downtimes)
            .FirstOrDefaultAsync(t => t.TicketId == ticketId, ct);

        if (ticket == null) throw new KeyNotFoundException($"Ticket {ticketId} not found.");

        var now = DateTime.UtcNow;
        var round = ticket.CurrentApprovalRound;
        var stage = request.Stage.ToUpperInvariant();
        var isApproved = request.Status.Equals(DomainConstants.ApprovalStatusApproved, StringComparison.OrdinalIgnoreCase);

        // Security / Segregation of Duties Check
        var currentAssignment = ticket.Assignments.FirstOrDefault(a => a.IsCurrent);
        if (currentAssignment != null && currentAssignment.Mechanic != null && currentAssignment.Mechanic.EmployeeId == approverEmployeeId)
        {
            throw new InvalidOperationException("Mechanic who performed the repair cannot approve their own work.");
        }

        // STAGE 1: SUPERVISOR VERIFICATION
        if (stage == DomainConstants.StageSupervisor)
        {
            if (ticket.CurrentStatus != DomainConstants.StatusAwaitingSupervisor)
            {
                throw new InvalidOperationException($"Ticket is not awaiting supervisor verification (current status: {ticket.CurrentStatus}).");
            }

            var isSupervisorOrAdmin = approverRoles.Contains(DomainConstants.RoleSupervisor) || approverRoles.Contains(DomainConstants.RoleAdmin);
            if (!isSupervisorOrAdmin)
            {
                throw new UnauthorizedAccessException("User does not have Supervisor or Plant Admin permissions to verify breakdown repairs.");
            }

            if (isApproved && string.IsNullOrWhiteSpace(request.SignatureBase64))
            {
                throw new InvalidOperationException("Digital signature is required before submitting supervisor approval.");
            }

            if (!isApproved && string.IsNullOrWhiteSpace(request.Remarks))
            {
                throw new InvalidOperationException("A reason is mandatory when rejecting a repair.");
            }

            var approval = new TicketApproval
            {
                TicketId = ticketId,
                ApprovalRound = round,
                ApprovalStage = DomainConstants.StageSupervisor,
                ApproverId = approverEmployeeId,
                ApprovalStatus = isApproved ? DomainConstants.ApprovalStatusApproved : DomainConstants.ApprovalStatusRejected,
                Remarks = request.Remarks,
                ApprovedAt = now,
                CreatedAt = now
            };
            _db.TicketApprovals.Add(approval);
            await _db.SaveChangesAsync(ct);

            // Handle Signature
            if (!string.IsNullOrWhiteSpace(request.SignatureBase64))
            {
                byte[] sigBytes = Convert.FromBase64String(request.SignatureBase64.Contains(',') ? request.SignatureBase64.Split(',')[1] : request.SignatureBase64);
                var sigSave = await _fileStorage.SaveSignatureAsync(sigBytes, ticket.TicketNumber, DomainConstants.StageSupervisor, request.SignatureType, ct);

                _db.TicketSignatures.Add(new TicketSignature
                {
                    ApprovalId = approval.ApprovalId,
                    SignatureType = request.SignatureType.ToUpperInvariant(),
                    FilePath = sigSave.FullPath,
                    OriginalFileName = sigSave.OriginalFileName,
                    SignedBy = approverEmployeeId,
                    SignedAt = now
                });
            }

            var oldStatus = ticket.CurrentStatus;

            if (isApproved)
            {
                ticket.CurrentStatus = DomainConstants.StatusAwaitingIncharge;
                ticket.ProductionRestoredAt = request.ProductionRestoredAt ?? now;
                ticket.UpdatedAt = now;

                _db.TicketStatusHistory.Add(new TicketStatusHistory
                {
                    TicketId = ticketId,
                    PreviousStatus = oldStatus,
                    NewStatus = DomainConstants.StatusAwaitingIncharge,
                    ChangedBy = approverEmployeeId,
                    ChangeRemarks = $"Supervisor verified repair. Remarks: {request.Remarks}".Trim(),
                    ChangedAt = now
                });

                await _db.SaveChangesAsync(ct);
                await _notifications.NotifyApprovalPendingAsync(ticket.TicketNumber, DomainConstants.StageIncharge);
                await _notifications.NotifyTicketStatusChangedAsync(ticket.TicketNumber, oldStatus, DomainConstants.StatusAwaitingIncharge);
            }
            else
            {
                ticket.CurrentStatus = DomainConstants.StatusSupervisorRejected;
                ticket.UpdatedAt = now;

                _db.TicketStatusHistory.Add(new TicketStatusHistory
                {
                    TicketId = ticketId,
                    PreviousStatus = oldStatus,
                    NewStatus = DomainConstants.StatusSupervisorRejected,
                    ChangedBy = approverEmployeeId,
                    ChangeRemarks = $"Supervisor REJECTED repair: {request.Remarks}",
                    ChangedAt = now
                });

                await _db.SaveChangesAsync(ct);
                await _notifications.NotifyTicketStatusChangedAsync(ticket.TicketNumber, oldStatus, DomainConstants.StatusSupervisorRejected);
            }
        }
        // STAGE 2: MAINTENANCE INCHARGE FINAL APPROVAL
        else if (stage == DomainConstants.StageIncharge)
        {
            if (ticket.CurrentStatus != DomainConstants.StatusAwaitingIncharge)
            {
                throw new InvalidOperationException($"Ticket is not awaiting Maintenance Incharge approval (current status: {ticket.CurrentStatus}).");
            }

            var hasSupervisorApproved = await _db.TicketApprovals
                .AnyAsync(a => a.TicketId == ticketId && a.ApprovalRound == round && a.ApprovalStage == DomainConstants.StageSupervisor && a.ApprovalStatus == DomainConstants.ApprovalStatusApproved, ct);

            if (!hasSupervisorApproved)
            {
                throw new InvalidOperationException("Cannot perform Incharge approval without prior Supervisor approval in the current round.");
            }

            var isAuthorizedIncharge = approverRoles.Contains(DomainConstants.RoleMaintenanceIncharge) || approverRoles.Contains(DomainConstants.RoleAdmin);
            if (!isAuthorizedIncharge)
            {
                throw new UnauthorizedAccessException("User does not have Maintenance Incharge or Plant Admin permissions.");
            }

            if (isApproved && string.IsNullOrWhiteSpace(request.SignatureBase64))
            {
                throw new InvalidOperationException("Digital signature is required before submitting final Maintenance Incharge approval.");
            }

            if (!isApproved && string.IsNullOrWhiteSpace(request.Remarks))
            {
                throw new InvalidOperationException("A reason is mandatory when rejecting a repair.");
            }

            var approval = new TicketApproval
            {
                TicketId = ticketId,
                ApprovalRound = round,
                ApprovalStage = DomainConstants.StageIncharge,
                ApproverId = approverEmployeeId,
                ApprovalStatus = isApproved ? DomainConstants.ApprovalStatusApproved : DomainConstants.ApprovalStatusRejected,
                Remarks = request.Remarks,
                ApprovedAt = now,
                CreatedAt = now
            };
            _db.TicketApprovals.Add(approval);
            await _db.SaveChangesAsync(ct);

            // Handle Signature
            if (!string.IsNullOrWhiteSpace(request.SignatureBase64))
            {
                byte[] sigBytes = Convert.FromBase64String(request.SignatureBase64.Contains(',') ? request.SignatureBase64.Split(',')[1] : request.SignatureBase64);
                var sigSave = await _fileStorage.SaveSignatureAsync(sigBytes, ticket.TicketNumber, DomainConstants.StageIncharge, request.SignatureType, ct);

                _db.TicketSignatures.Add(new TicketSignature
                {
                    ApprovalId = approval.ApprovalId,
                    SignatureType = request.SignatureType.ToUpperInvariant(),
                    FilePath = sigSave.FullPath,
                    OriginalFileName = sigSave.OriginalFileName,
                    SignedBy = approverEmployeeId,
                    SignedAt = now
                });
            }

            var oldStatus = ticket.CurrentStatus;

            if (isApproved)
            {
                ticket.CurrentStatus = DomainConstants.StatusClosed;
                ticket.ClosedAt = now;
                ticket.ProductionRestoredAt ??= now;
                ticket.UpdatedAt = now;

                // Close open downtime interval
                var openDowntime = ticket.Downtimes.FirstOrDefault(d => d.RestoredAt == null);
                if (openDowntime != null)
                {
                    openDowntime.RestoredAt = ticket.ProductionRestoredAt;
                    openDowntime.RestorationRemarks = "Repair approved and closed by Maintenance Incharge.";
                }

                // Decrement mechanic active tickets
                if (currentAssignment != null && currentAssignment.Mechanic != null)
                {
                    currentAssignment.Mechanic.ActiveTicketCount = Math.Max(0, currentAssignment.Mechanic.ActiveTicketCount - 1);
                }

                _db.TicketStatusHistory.Add(new TicketStatusHistory
                {
                    TicketId = ticketId,
                    PreviousStatus = oldStatus,
                    NewStatus = DomainConstants.StatusClosed,
                    ChangedBy = approverEmployeeId,
                    ChangeRemarks = $"Maintenance Incharge approved. Ticket closed successfully. Remarks: {request.Remarks}".Trim(),
                    ChangedAt = now
                });

                await _db.SaveChangesAsync(ct);
                await _notifications.NotifyTicketClosedAsync(ticket.TicketNumber);
                await _notifications.NotifyTicketStatusChangedAsync(ticket.TicketNumber, oldStatus, DomainConstants.StatusClosed);
            }
            else
            {
                ticket.CurrentStatus = DomainConstants.StatusInchargeRejected;
                ticket.UpdatedAt = now;

                _db.TicketStatusHistory.Add(new TicketStatusHistory
                {
                    TicketId = ticketId,
                    PreviousStatus = oldStatus,
                    NewStatus = DomainConstants.StatusInchargeRejected,
                    ChangedBy = approverEmployeeId,
                    ChangeRemarks = $"Maintenance Incharge REJECTED repair: {request.Remarks}",
                    ChangedAt = now
                });

                await _db.SaveChangesAsync(ct);
                await _notifications.NotifyTicketStatusChangedAsync(ticket.TicketNumber, oldStatus, DomainConstants.StatusInchargeRejected);
            }
        }

        return (await GetTicketByIdAsync(ticketId, ct))!;
    }

    public async Task<TicketDetailDto> ReopenTicketAsync(long ticketId, int changedByEmployeeId, ReopenTicketRequest request, CancellationToken ct = default)
    {
        var ticket = await _db.BreakdownTickets
            .Include(t => t.Assignments.Where(a => a.IsCurrent))
                .ThenInclude(a => a.Mechanic)
            .FirstOrDefaultAsync(t => t.TicketId == ticketId, ct);

        if (ticket == null) throw new KeyNotFoundException($"Ticket {ticketId} not found.");

        if (ticket.CurrentStatus != DomainConstants.StatusClosed)
        {
            throw new InvalidOperationException("Only closed tickets can be reopened.");
        }

        var now = DateTime.UtcNow;
        var oldStatus = ticket.CurrentStatus;

        ticket.CurrentApprovalRound += 1;
        ticket.CurrentStatus = DomainConstants.StatusReopened;
        ticket.ClosedAt = null;
        ticket.UpdatedAt = now;

        // Record a new downtime interval since the machine is reopened for breakdown
        _db.MachineDowntime.Add(new MachineDowntime
        {
            TicketId = ticketId,
            MachineId = ticket.MachineId,
            StartedAt = now,
            RestorationRemarks = $"Ticket reopened (Round {ticket.CurrentApprovalRound}): {request.Reason}",
            RecordedAt = now
        });

        // Re-increment active count on current mechanic if assigned
        var currentAssignment = ticket.Assignments.FirstOrDefault(a => a.IsCurrent);
        if (currentAssignment != null && currentAssignment.Mechanic != null)
        {
            currentAssignment.Mechanic.ActiveTicketCount += 1;
        }

        _db.TicketStatusHistory.Add(new TicketStatusHistory
        {
            TicketId = ticketId,
            PreviousStatus = oldStatus,
            NewStatus = DomainConstants.StatusReopened,
            ChangedBy = changedByEmployeeId,
            ChangeRemarks = $"Ticket reopened (Round {ticket.CurrentApprovalRound}). Reason: {request.Reason}",
            ChangedAt = now
        });

        await _db.SaveChangesAsync(ct);
        await _notifications.NotifyTicketStatusChangedAsync(ticket.TicketNumber, oldStatus, DomainConstants.StatusReopened);

        return (await GetTicketByIdAsync(ticketId, ct))!;
    }

    public async Task<TicketDetailDto> CancelTicketAsync(long ticketId, int changedByEmployeeId, CancelTicketRequest request, CancellationToken ct = default)
    {
        var ticket = await _db.BreakdownTickets
            .Include(t => t.Assignments.Where(a => a.IsCurrent))
                .ThenInclude(a => a.Mechanic)
            .Include(t => t.Downtimes)
            .FirstOrDefaultAsync(t => t.TicketId == ticketId, ct);

        if (ticket == null) throw new KeyNotFoundException($"Ticket {ticketId} not found.");

        if (ticket.CurrentStatus == DomainConstants.StatusClosed)
        {
            throw new InvalidOperationException("Cannot cancel an already closed ticket.");
        }

        var now = DateTime.UtcNow;
        var oldStatus = ticket.CurrentStatus;
        ticket.CurrentStatus = DomainConstants.StatusCancelled;
        ticket.UpdatedAt = now;

        // Close open downtime interval
        var openDowntime = ticket.Downtimes.FirstOrDefault(d => d.RestoredAt == null);
        if (openDowntime != null)
        {
            openDowntime.RestoredAt = now;
            openDowntime.RestorationRemarks = $"Ticket cancelled: {request.Reason}";
        }

        var currentAssignment = ticket.Assignments.FirstOrDefault(a => a.IsCurrent);
        if (currentAssignment != null && currentAssignment.Mechanic != null)
        {
            currentAssignment.Mechanic.ActiveTicketCount = Math.Max(0, currentAssignment.Mechanic.ActiveTicketCount - 1);
        }

        _db.TicketStatusHistory.Add(new TicketStatusHistory
        {
            TicketId = ticketId,
            PreviousStatus = oldStatus,
            NewStatus = DomainConstants.StatusCancelled,
            ChangedBy = changedByEmployeeId,
            ChangeRemarks = $"Ticket cancelled. Reason: {request.Reason}",
            ChangedAt = now
        });

        await _db.SaveChangesAsync(ct);
        await _notifications.NotifyTicketStatusChangedAsync(ticket.TicketNumber, oldStatus, DomainConstants.StatusCancelled);

        return (await GetTicketByIdAsync(ticketId, ct))!;
    }

    public async Task<TicketCommentDto> AddCommentAsync(long ticketId, int employeeId, AddCommentRequest request, CancellationToken ct = default)
    {
        var ticket = await _db.BreakdownTickets.FindAsync(new object[] { ticketId }, ct);
        if (ticket == null) throw new KeyNotFoundException($"Ticket {ticketId} not found.");

        var employee = await _db.Employees.FindAsync(new object[] { employeeId }, ct);
        if (employee == null) throw new KeyNotFoundException($"Employee {employeeId} not found.");

        var now = DateTime.UtcNow;
        var comment = new TicketComment
        {
            TicketId = ticketId,
            EmployeeId = employeeId,
            CommentText = request.CommentText.Trim(),
            CreatedAt = now
        };

        _db.TicketComments.Add(comment);
        await _db.SaveChangesAsync(ct);

        return new TicketCommentDto
        {
            CommentId = comment.CommentId,
            EmployeeId = comment.EmployeeId,
            EmployeeName = employee.EmployeeName,
            CommentText = comment.CommentText,
            CreatedAt = comment.CreatedAt
        };
    }

    private IQueryable<BreakdownTicket> BuildDetailQuery()
    {
        return _db.BreakdownTickets
            .Include(t => t.Machine)
                .ThenInclude(m => m!.Department)
            .Include(t => t.Supervisor)
            .Include(t => t.Category)
            .Include(t => t.Assignments)
                .ThenInclude(a => a.Mechanic)
                    .ThenInclude(m => m!.Employee)
            .Include(t => t.Actions)
                .ThenInclude(a => a.Mechanic)
                    .ThenInclude(m => m!.Employee)
            .Include(t => t.Actions)
                .ThenInclude(a => a.PartsUsed)
                    .ThenInclude(p => p.Part)
            .Include(t => t.WorkSessions)
            .Include(t => t.Attachments)
                .ThenInclude(att => att.Uploader)
            .Include(t => t.Approvals)
                .ThenInclude(ap => ap.Approver)
            .Include(t => t.Approvals)
                .ThenInclude(ap => ap.Signature)
                    .ThenInclude(s => s!.Signer)
            .Include(t => t.Comments)
                .ThenInclude(c => c.Employee)
            .Include(t => t.StatusHistory)
                .ThenInclude(sh => sh.Changer)
            .Include(t => t.Downtimes)
            .AsNoTracking();
    }

    private static TicketDetailDto MapTicketDetail(BreakdownTicket t)
    {
        var now = DateTime.UtcNow;

        double totalDowntimeMinutes = 0;
        foreach (var d in t.Downtimes)
        {
            var end = d.RestoredAt ?? now;
            totalDowntimeMinutes += Math.Max(0, (end - d.StartedAt).TotalMinutes);
        }

        var firstWorkStart = t.WorkSessions
            .Where(w => w.SessionType == "WORK")
            .OrderBy(w => w.StartedAt)
            .Select(w => (DateTime?)w.StartedAt)
            .FirstOrDefault();

        double? responseTimeMinutes = firstWorkStart.HasValue
            ? Math.Max(0, (firstWorkStart.Value - t.BreakdownOccurredAt).TotalMinutes)
            : null;

        double activeLaborMinutes = 0;
        foreach (var w in t.WorkSessions.Where(ws => ws.SessionType == "WORK"))
        {
            var end = w.EndedAt ?? now;
            activeLaborMinutes += Math.Max(0, (end - w.StartedAt).TotalMinutes);
        }

        double? approvalDelayMinutes = t.ClosedAt.HasValue && t.RepairCompletedAt.HasValue
            ? Math.Max(0, (t.ClosedAt.Value - t.RepairCompletedAt.Value).TotalMinutes)
            : null;

        double? mttrMinutes = t.RepairCompletedAt.HasValue && firstWorkStart.HasValue
            ? Math.Max(0, (t.RepairCompletedAt.Value - firstWorkStart.Value).TotalMinutes)
            : (activeLaborMinutes > 0 ? activeLaborMinutes : null);

        double? mttfHours = totalDowntimeMinutes > 0
            ? Math.Round(Math.Max(1.0, 720.0 - (totalDowntimeMinutes / 60.0)), 1)
            : 720.0;

        double? mtbfHours = mttfHours.HasValue && mttrMinutes.HasValue
            ? Math.Round(mttfHours.Value + (mttrMinutes.Value / 60.0), 1)
            : mttfHours;

        var currentAssignment = t.Assignments.FirstOrDefault(a => a.IsCurrent);

        return new TicketDetailDto
        {
            TicketId = t.TicketId,
            TicketNumber = t.TicketNumber,
            MachineId = t.MachineId,
            MachineCode = t.Machine?.MachineCode ?? "",
            MachineName = t.Machine?.MachineName ?? "",
            MachineLocation = t.Machine?.Location,
            MachineCategory = t.Machine?.MachineCategory,
            MachineCriticality = t.Machine?.Criticality ?? "MEDIUM",
            DepartmentId = t.Machine?.DepartmentId ?? 0,
            DepartmentName = t.Machine?.Department?.DepartmentName ?? "",
            SupervisorId = t.SupervisorId,
            SupervisorName = t.Supervisor?.EmployeeName ?? "",
            SupervisorMobile = t.Supervisor?.MobileNumber,
            CategoryId = t.CategoryId,
            CategoryName = t.Category?.CategoryName ?? "",
            BreakdownOccurredAt = t.BreakdownOccurredAt,
            ReportedAt = t.ReportedAt,
            BreakdownReason = t.BreakdownReason,
            BreakdownDescription = t.BreakdownDescription,
            MachineCondition = t.MachineCondition,
            ProductionImpact = t.ProductionImpact,
            Priority = t.Priority,
            CurrentStatus = t.CurrentStatus,
            CurrentApprovalRound = t.CurrentApprovalRound,
            RepairCompletedAt = t.RepairCompletedAt,
            ProductionRestoredAt = t.ProductionRestoredAt,
            ClosedAt = t.ClosedAt,
            RowVersion = t.RowVersion,

            TotalDowntimeMinutes = Math.Round(totalDowntimeMinutes, 1),
            ResponseTimeMinutes = responseTimeMinutes.HasValue ? Math.Round(responseTimeMinutes.Value, 1) : null,
            ActiveLaborMinutes = Math.Round(activeLaborMinutes, 1),
            ApprovalDelayMinutes = approvalDelayMinutes.HasValue ? Math.Round(approvalDelayMinutes.Value, 1) : null,
            MTTRMinutes = mttrMinutes.HasValue ? Math.Round(mttrMinutes.Value, 1) : null,
            MTTFHours = mttfHours,
            MTBFHours = mtbfHours,

            CurrentAssignment = currentAssignment == null ? null : new AssignedMechanicInfoDto
            {
                AssignmentId = currentAssignment.AssignmentId,
                MechanicId = currentAssignment.MechanicId,
                EmployeeName = currentAssignment.Mechanic?.Employee?.EmployeeName ?? "",
                EmployeeCode = currentAssignment.Mechanic?.Employee?.EmployeeCode ?? "",
                MobileNumber = currentAssignment.Mechanic?.Employee?.MobileNumber,
                Specialization = currentAssignment.Mechanic?.Specialization,
                ShiftName = currentAssignment.Mechanic?.ShiftName,
                AssignedAt = currentAssignment.AssignedAt,
                AcceptedAt = currentAssignment.AcceptedAt,
                Remarks = currentAssignment.AssignmentRemarks
            },

            Actions = t.Actions.OrderByDescending(a => a.ActionId).Select(a => new MaintenanceActionDto
            {
                ActionId = a.ActionId,
                MechanicId = a.MechanicId,
                MechanicName = a.Mechanic?.Employee?.EmployeeName ?? "",
                ApprovalRound = a.ApprovalRound,
                InspectionFindings = a.InspectionFindings,
                ActualRootCause = a.ActualRootCause,
                ActionTaken = a.ActionTaken,
                StartedAt = a.StartedAt,
                CompletedAt = a.CompletedAt,
                MachineConditionAfterRepair = a.MachineConditionAfterRepair,
                MechanicRemarks = a.MechanicRemarks,
                PartsUsed = a.PartsUsed.Select(pu => new PartUsedDto
                {
                    PartsUsedId = pu.PartsUsedId,
                    PartId = pu.PartId,
                    PartCode = pu.Part?.PartCode ?? "",
                    PartName = pu.Part?.PartName ?? "",
                    Unit = pu.Part?.Unit,
                    Quantity = pu.Quantity,
                    Remarks = pu.Remarks
                }).ToList()
            }).ToList(),

            WorkSessions = t.WorkSessions.OrderBy(w => w.StartedAt).Select(w => new TicketWorkSessionDto
            {
                SessionId = w.SessionId,
                SessionType = w.SessionType,
                StartedAt = w.StartedAt,
                EndedAt = w.EndedAt,
                HoldReason = w.HoldReason,
                Notes = w.Notes,
                DurationMinutes = Math.Round(Math.Max(0, ((w.EndedAt ?? now) - w.StartedAt).TotalMinutes), 1)
            }).ToList(),

            Attachments = t.Attachments.OrderByDescending(att => att.UploadedAt).Select(att => new TicketAttachmentDto
            {
                AttachmentId = att.AttachmentId,
                AttachmentType = att.AttachmentType,
                OriginalFileName = att.OriginalFileName,
                StoredFileName = att.StoredFileName,
                FilePath = att.FilePath,
                UploadedAt = att.UploadedAt,
                UploaderName = att.Uploader?.EmployeeName ?? ""
            }).ToList(),

            Approvals = t.Approvals.OrderBy(ap => ap.ApprovalRound).ThenBy(ap => ap.ApprovalStage).Select(ap => new TicketApprovalDto
            {
                ApprovalId = ap.ApprovalId,
                ApprovalRound = ap.ApprovalRound,
                ApprovalStage = ap.ApprovalStage,
                ApprovalStatus = ap.ApprovalStatus,
                ApproverName = ap.Approver?.EmployeeName ?? "",
                Remarks = ap.Remarks,
                ApprovedAt = ap.ApprovedAt,
                Signature = ap.Signature == null ? null : new TicketSignatureDto
                {
                    SignatureId = ap.Signature.SignatureId,
                    SignatureType = ap.Signature.SignatureType,
                    FilePath = ap.Signature.FilePath,
                    SignerName = ap.Signature.Signer?.EmployeeName ?? "",
                    SignedAt = ap.Signature.SignedAt
                }
            }).ToList(),

            Comments = t.Comments.OrderBy(c => c.CreatedAt).Select(c => new TicketCommentDto
            {
                CommentId = c.CommentId,
                EmployeeId = c.EmployeeId,
                EmployeeName = c.Employee?.EmployeeName ?? "",
                CommentText = c.CommentText,
                CreatedAt = c.CreatedAt
            }).ToList(),

            StatusHistory = t.StatusHistory.OrderBy(sh => sh.ChangedAt).Select(sh => new TicketStatusHistoryDto
            {
                HistoryId = sh.HistoryId,
                PreviousStatus = sh.PreviousStatus,
                NewStatus = sh.NewStatus,
                ChangerName = sh.Changer?.EmployeeName ?? "",
                ChangeRemarks = sh.ChangeRemarks,
                ChangedAt = sh.ChangedAt
            }).ToList(),

            Downtimes = t.Downtimes.OrderBy(d => d.StartedAt).Select(d => new MachineDowntimeDto
            {
                DowntimeId = d.DowntimeId,
                StartedAt = d.StartedAt,
                RestoredAt = d.RestoredAt,
                RestorationRemarks = d.RestorationRemarks,
                DurationMinutes = Math.Round(Math.Max(0, ((d.RestoredAt ?? now) - d.StartedAt).TotalMinutes), 1)
            }).ToList()
        };
    }
}

