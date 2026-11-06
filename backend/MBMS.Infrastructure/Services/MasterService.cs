using MBMS.Application.DTOs;
using MBMS.Application.Interfaces;
using MBMS.Domain.Entities;
using MBMS.Domain.Enums;
using MBMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MBMS.Infrastructure.Services;

public class MasterService : IMasterService
{
    private readonly MBMSDbContext _db;
    private readonly IQRService _qrService;

    public MasterService(MBMSDbContext db, IQRService qrService)
    {
        _db = db;
        _qrService = qrService;
    }

    public async Task<List<DepartmentDto>> GetDepartmentsAsync(CancellationToken ct = default)
    {
        return await _db.Departments
            .OrderBy(d => d.DepartmentName)
            .Select(d => new DepartmentDto
            {
                DepartmentId = d.DepartmentId,
                DepartmentCode = d.DepartmentCode,
                DepartmentName = d.DepartmentName,
                IsActive = d.IsActive
            })
            .ToListAsync(ct);
    }

    public async Task<List<ProductionSectionDto>> GetSectionsAsync(int? departmentId = null, CancellationToken ct = default)
    {
        var query = _db.ProductionSections.AsQueryable();
        if (departmentId.HasValue)
        {
            query = query.Where(s => s.DepartmentId == departmentId.Value);
        }

        return await query
            .OrderBy(s => s.SectionName)
            .Select(s => new ProductionSectionDto
            {
                SectionId = s.SectionId,
                DepartmentId = s.DepartmentId,
                SectionCode = s.SectionCode,
                SectionName = s.SectionName,
                IsActive = s.IsActive
            })
            .ToListAsync(ct);
    }

    public async Task<List<MachineDto>> GetMachinesAsync(int? departmentId = null, string? criticality = null, bool? activeOnly = null, CancellationToken ct = default)
    {
        var query = _db.Machines
            .Include(m => m.Department)
            .Include(m => m.Section)
            .Include(m => m.Tickets.Where(t => t.CurrentStatus != DomainConstants.StatusClosed && t.CurrentStatus != DomainConstants.StatusCancelled))
            .AsQueryable();

        if (departmentId.HasValue)
            query = query.Where(m => m.DepartmentId == departmentId.Value);

        if (!string.IsNullOrEmpty(criticality))
            query = query.Where(m => m.Criticality == criticality);

        if (activeOnly.HasValue && activeOnly.Value)
            query = query.Where(m => m.IsActive);

        return await query
            .OrderBy(m => m.MachineCode)
            .Select(m => new MachineDto
            {
                MachineId = m.MachineId,
                MachineCode = m.MachineCode,
                MachineName = m.MachineName,
                DepartmentId = m.DepartmentId,
                DepartmentName = m.Department != null ? m.Department.DepartmentName : string.Empty,
                SectionId = m.SectionId,
                SectionName = m.Section != null ? m.Section.SectionName : null,
                MachineCategory = m.MachineCategory,
                Location = m.Location,
                Manufacturer = m.Manufacturer,
                ModelNumber = m.ModelNumber,
                SerialNumber = m.SerialNumber,
                InstallationDate = m.InstallationDate,
                Criticality = m.Criticality,
                QRCode = m.QRCode,
                IsActive = m.IsActive,
                IsUnderBreakdown = m.Tickets.Any(t => t.CurrentStatus != DomainConstants.StatusClosed && t.CurrentStatus != DomainConstants.StatusCancelled),
                ActiveTicketNumber = m.Tickets
                    .Where(t => t.CurrentStatus != DomainConstants.StatusClosed && t.CurrentStatus != DomainConstants.StatusCancelled)
                    .Select(t => t.TicketNumber)
                    .FirstOrDefault()
            })
            .ToListAsync(ct);
    }

    public async Task<MachineDto?> GetMachineByIdAsync(int machineId, CancellationToken ct = default)
    {
        var m = await _db.Machines
            .Include(m => m.Department)
            .Include(m => m.Section)
            .Include(m => m.Tickets.Where(t => t.CurrentStatus != DomainConstants.StatusClosed && t.CurrentStatus != DomainConstants.StatusCancelled))
            .FirstOrDefaultAsync(m => m.MachineId == machineId, ct);

        if (m == null) return null;

        return MapMachine(m);
    }

    public async Task<MachineDto?> GetMachineByCodeAsync(string machineCode, CancellationToken ct = default)
    {
        var m = await _db.Machines
            .Include(m => m.Department)
            .Include(m => m.Section)
            .Include(m => m.Tickets.Where(t => t.CurrentStatus != DomainConstants.StatusClosed && t.CurrentStatus != DomainConstants.StatusCancelled))
            .FirstOrDefaultAsync(m => m.MachineCode.ToLower() == machineCode.ToLower().Trim(), ct);

        if (m == null) return null;

        return MapMachine(m);
    }

    public async Task<List<BreakdownCategoryDto>> GetBreakdownCategoriesAsync(CancellationToken ct = default)
    {
        return await _db.BreakdownCategories
            .Where(c => c.IsActive)
            .OrderBy(c => c.CategoryName)
            .Select(c => new BreakdownCategoryDto
            {
                CategoryId = c.CategoryId,
                CategoryName = c.CategoryName,
                Description = c.Description,
                IsActive = c.IsActive
            })
            .ToListAsync(ct);
    }

    public async Task<List<MechanicDto>> GetMechanicsAsync(bool? availableOnly = null, CancellationToken ct = default)
    {
        var query = _db.Mechanics
            .Include(m => m.Employee)
            .AsQueryable();

        if (availableOnly.HasValue && availableOnly.Value)
            query = query.Where(m => m.IsAvailable);

        return await query
            .OrderBy(m => m.Employee!.EmployeeName)
            .Select(m => new MechanicDto
            {
                MechanicId = m.MechanicId,
                EmployeeId = m.EmployeeId,
                EmployeeCode = m.Employee!.EmployeeCode,
                EmployeeName = m.Employee.EmployeeName,
                MobileNumber = m.Employee.MobileNumber,
                Specialization = m.Specialization,
                ShiftName = m.ShiftName,
                IsAvailable = m.IsAvailable,
                ActiveTicketCount = m.ActiveTicketCount
            })
            .ToListAsync(ct);
    }

    public async Task<List<SparePartDto>> GetSparePartsAsync(string? search = null, CancellationToken ct = default)
    {
        var query = _db.SpareParts.Where(p => p.IsActive);
        if (!string.IsNullOrEmpty(search))
        {
            var s = search.ToLower().Trim();
            query = query.Where(p => p.PartCode.ToLower().Contains(s) || p.PartName.ToLower().Contains(s));
        }

        return await query
            .OrderBy(p => p.PartName)
            .Select(p => new SparePartDto
            {
                PartId = p.PartId,
                PartCode = p.PartCode,
                PartName = p.PartName,
                Unit = p.Unit,
                Description = p.Description,
                UnitPrice = p.UnitPrice,
                StockQuantity = p.StockQuantity,
                IsActive = p.IsActive
            })
            .ToListAsync(ct);
    }

    public async Task<List<ShiftDto>> GetShiftsAsync(CancellationToken ct = default)
    {
        return await _db.Shifts
            .Where(s => s.IsActive)
            .OrderBy(s => s.StartTime)
            .Select(s => new ShiftDto
            {
                ShiftId = s.ShiftId,
                ShiftName = s.ShiftName,
                StartTime = s.StartTime,
                EndTime = s.EndTime
            })
            .ToListAsync(ct);
    }

    public async Task<MachineDto> CreateMachineAsync(MachineDto dto, CancellationToken ct = default)
    {
        var machine = new Machine
        {
            MachineCode = dto.MachineCode.Trim().ToUpper(),
            MachineName = dto.MachineName.Trim(),
            DepartmentId = dto.DepartmentId,
            SectionId = dto.SectionId,
            MachineCategory = dto.MachineCategory,
            Location = dto.Location,
            Manufacturer = dto.Manufacturer,
            ModelNumber = dto.ModelNumber,
            SerialNumber = dto.SerialNumber,
            InstallationDate = dto.InstallationDate,
            Criticality = dto.Criticality,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.Machines.Add(machine);
        await _db.SaveChangesAsync(ct);

        machine.QRCode = _qrService.GenerateMachineQrPayload(machine.MachineId, machine.MachineCode);
        await _db.SaveChangesAsync(ct);

        return await GetMachineByIdAsync(machine.MachineId, ct) ?? dto;
    }

    public async Task<MachineDto?> UpdateMachineAsync(int machineId, MachineDto dto, CancellationToken ct = default)
    {
        var machine = await _db.Machines.FindAsync(new object[] { machineId }, ct);
        if (machine == null) return null;

        machine.MachineName = dto.MachineName.Trim();
        machine.DepartmentId = dto.DepartmentId;
        machine.SectionId = dto.SectionId;
        machine.MachineCategory = dto.MachineCategory;
        machine.Location = dto.Location;
        machine.Manufacturer = dto.Manufacturer;
        machine.ModelNumber = dto.ModelNumber;
        machine.SerialNumber = dto.SerialNumber;
        machine.InstallationDate = dto.InstallationDate;
        machine.Criticality = dto.Criticality;
        machine.IsActive = dto.IsActive;

        await _db.SaveChangesAsync(ct);
        return await GetMachineByIdAsync(machineId, ct);
    }

    private static MachineDto MapMachine(Machine m) => new()
    {
        MachineId = m.MachineId,
        MachineCode = m.MachineCode,
        MachineName = m.MachineName,
        DepartmentId = m.DepartmentId,
        DepartmentName = m.Department != null ? m.Department.DepartmentName : string.Empty,
        SectionId = m.SectionId,
        SectionName = m.Section != null ? m.Section.SectionName : null,
        MachineCategory = m.MachineCategory,
        Location = m.Location,
        Manufacturer = m.Manufacturer,
        ModelNumber = m.ModelNumber,
        SerialNumber = m.SerialNumber,
        InstallationDate = m.InstallationDate,
        Criticality = m.Criticality,
        QRCode = m.QRCode,
        IsActive = m.IsActive,
        IsUnderBreakdown = m.Tickets.Any(t => t.CurrentStatus != DomainConstants.StatusClosed && t.CurrentStatus != DomainConstants.StatusCancelled),
        ActiveTicketNumber = m.Tickets
            .Where(t => t.CurrentStatus != DomainConstants.StatusClosed && t.CurrentStatus != DomainConstants.StatusCancelled)
            .Select(t => t.TicketNumber)
            .FirstOrDefault()
    };
}

