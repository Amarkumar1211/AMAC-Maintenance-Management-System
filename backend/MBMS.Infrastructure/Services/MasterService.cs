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
    private readonly IPasswordHasher _hasher;

    public MasterService(MBMSDbContext db, IQRService qrService, IPasswordHasher hasher)
    {
        _db = db;
        _qrService = qrService;
        _hasher = hasher;
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

    public async Task<List<MachineDto>> GetMachinesAsync(int? departmentId = null, int? sectionId = null, string? criticality = null, bool? activeOnly = null, CancellationToken ct = default)
    {
        var query = _db.Machines
            .Include(m => m.Department)
            .Include(m => m.Section)
            .Include(m => m.Tickets.Where(t => t.CurrentStatus != DomainConstants.StatusClosed && t.CurrentStatus != DomainConstants.StatusCancelled))
            .AsQueryable();

        if (departmentId.HasValue)
            query = query.Where(m => m.DepartmentId == departmentId.Value);

        if (sectionId.HasValue)
            query = query.Where(m => m.SectionId == sectionId.Value);

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
                .ThenInclude(e => e!.Department)
            .Include(m => m.Employee)
                .ThenInclude(e => e!.Section)
            .Include(m => m.Section)
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
                DepartmentId = m.Employee.DepartmentId,
                DepartmentName = m.Employee.Department != null ? m.Employee.Department.DepartmentName : null,
                SectionId = m.SectionId ?? m.Employee.SectionId,
                SectionCode = m.Section != null ? m.Section.SectionCode : (m.Employee.Section != null ? m.Employee.Section.SectionCode : null),
                SectionName = m.Section != null ? m.Section.SectionName : (m.Employee.Section != null ? m.Employee.Section.SectionName : null),
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

    public async Task<List<MachineDto>> BulkImportMachinesAsync(List<MachineDto> dtos, CancellationToken ct = default)
    {
        var result = new List<MachineDto>();
        foreach (var dto in dtos)
        {
            if (string.IsNullOrWhiteSpace(dto.MachineCode) || string.IsNullOrWhiteSpace(dto.MachineName))
                continue;

            var existing = await _db.Machines.FirstOrDefaultAsync(m => m.MachineCode.ToUpper() == dto.MachineCode.Trim().ToUpper(), ct);
            if (existing != null)
            {
                existing.MachineName = dto.MachineName.Trim();
                if (dto.DepartmentId > 0) existing.DepartmentId = dto.DepartmentId;
                if (dto.SectionId.HasValue && dto.SectionId.Value > 0) existing.SectionId = dto.SectionId;
                if (!string.IsNullOrWhiteSpace(dto.MachineCategory)) existing.MachineCategory = dto.MachineCategory;
                if (!string.IsNullOrWhiteSpace(dto.Criticality)) existing.Criticality = dto.Criticality;
                if (!string.IsNullOrWhiteSpace(dto.Location)) existing.Location = dto.Location;
                if (!string.IsNullOrWhiteSpace(dto.Manufacturer)) existing.Manufacturer = dto.Manufacturer;
                if (!string.IsNullOrWhiteSpace(dto.ModelNumber)) existing.ModelNumber = dto.ModelNumber;
                if (!string.IsNullOrWhiteSpace(dto.SerialNumber)) existing.SerialNumber = dto.SerialNumber;
                await _db.SaveChangesAsync(ct);
                var mapped = await GetMachineByIdAsync(existing.MachineId, ct);
                if (mapped != null) result.Add(mapped);
            }
            else
            {
                var created = await CreateMachineAsync(dto, ct);
                result.Add(created);
            }
        }
        return result;
    }

    public async Task<SparePartDto> CreateSparePartAsync(SparePartDto dto, CancellationToken ct = default)
    {
        var code = dto.PartCode.Trim().ToUpper();
        var part = new SparePart
        {
            PartCode = code,
            PartName = dto.PartName.Trim(),
            Unit = !string.IsNullOrWhiteSpace(dto.Unit) ? dto.Unit.Trim().ToUpper() : "NOS",
            Description = dto.Description,
            UnitPrice = dto.UnitPrice,
            StockQuantity = dto.StockQuantity,
            IsActive = true
        };

        _db.SpareParts.Add(part);
        await _db.SaveChangesAsync(ct);

        if (dto.StockQuantity > 0)
        {
            _db.SparePartTransactions.Add(new SparePartTransaction
            {
                PartId = part.PartId,
                TransactionType = "INWARD",
                Quantity = dto.StockQuantity,
                UnitPrice = dto.UnitPrice,
                ReferenceNo = "INIT-STOCK",
                SupplierOrSource = "Initial Catalog Registration",
                Remarks = "Opening stock recorded on spare creation",
                TransactionDate = DateTime.UtcNow,
                CreatedBy = "Store Admin"
            });
            await _db.SaveChangesAsync(ct);
        }

        return new SparePartDto
        {
            PartId = part.PartId,
            PartCode = part.PartCode,
            PartName = part.PartName,
            Unit = part.Unit,
            Description = part.Description,
            UnitPrice = part.UnitPrice,
            StockQuantity = part.StockQuantity,
            IsActive = part.IsActive
        };
    }

    public async Task<List<SparePartDto>> BulkImportSparePartsAsync(List<SparePartDto> dtos, CancellationToken ct = default)
    {
        var result = new List<SparePartDto>();
        foreach (var dto in dtos)
        {
            if (string.IsNullOrWhiteSpace(dto.PartCode) || string.IsNullOrWhiteSpace(dto.PartName))
                continue;

            var existing = await _db.SpareParts.FirstOrDefaultAsync(p => p.PartCode.ToUpper() == dto.PartCode.Trim().ToUpper(), ct);
            if (existing != null)
            {
                existing.PartName = dto.PartName.Trim();
                if (!string.IsNullOrWhiteSpace(dto.Unit)) existing.Unit = dto.Unit.Trim().ToUpper();
                if (!string.IsNullOrWhiteSpace(dto.Description)) existing.Description = dto.Description;
                if (dto.UnitPrice > 0) existing.UnitPrice = dto.UnitPrice;
                if (dto.StockQuantity > 0)
                {
                    var diff = dto.StockQuantity - existing.StockQuantity;
                    existing.StockQuantity = dto.StockQuantity;
                    if (diff != 0)
                    {
                        _db.SparePartTransactions.Add(new SparePartTransaction
                        {
                            PartId = existing.PartId,
                            TransactionType = diff > 0 ? "INWARD" : "OUTWARD",
                            Quantity = Math.Abs(diff),
                            UnitPrice = existing.UnitPrice,
                            ReferenceNo = "BULK-IMPORT-ADJ",
                            SupplierOrSource = "Bulk Inventory Import",
                            Remarks = "Stock quantity adjusted via bulk sheet import",
                            TransactionDate = DateTime.UtcNow,
                            CreatedBy = "Store Admin"
                        });
                    }
                }
                await _db.SaveChangesAsync(ct);
                result.Add(new SparePartDto
                {
                    PartId = existing.PartId,
                    PartCode = existing.PartCode,
                    PartName = existing.PartName,
                    Unit = existing.Unit,
                    Description = existing.Description,
                    UnitPrice = existing.UnitPrice,
                    StockQuantity = existing.StockQuantity,
                    IsActive = existing.IsActive
                });
            }
            else
            {
                var created = await CreateSparePartAsync(dto, ct);
                result.Add(created);
            }
        }
        return result;
    }

    public async Task<List<SparePartTransactionDto>> GetSparePartTransactionsAsync(string? type = null, int? partId = null, CancellationToken ct = default)
    {
        var query = _db.SparePartTransactions
            .Include(t => t.Part)
            .Include(t => t.Machine)
            .Include(t => t.Mechanic)
                .ThenInclude(m => m!.Employee)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(type))
        {
            var tNorm = type.Trim().ToUpper();
            query = query.Where(t => t.TransactionType.ToUpper() == tNorm);
        }

        if (partId.HasValue && partId.Value > 0)
        {
            query = query.Where(t => t.PartId == partId.Value);
        }

        return await query
            .OrderByDescending(t => t.TransactionDate)
            .Select(t => new SparePartTransactionDto
            {
                TransactionId = t.TransactionId,
                PartId = t.PartId,
                PartCode = t.Part != null ? t.Part.PartCode : string.Empty,
                PartName = t.Part != null ? t.Part.PartName : string.Empty,
                Unit = t.Part != null ? t.Part.Unit : "NOS",
                TransactionType = t.TransactionType,
                Quantity = t.Quantity,
                UnitPrice = t.UnitPrice,
                TotalAmount = t.Quantity * t.UnitPrice,
                ReferenceNo = t.ReferenceNo,
                SupplierOrSource = t.SupplierOrSource,
                Remarks = t.Remarks,
                MachineId = t.MachineId,
                MachineCode = t.Machine != null ? t.Machine.MachineCode : null,
                MachineName = t.Machine != null ? t.Machine.MachineName : null,
                MechanicId = t.MechanicId,
                MechanicName = t.Mechanic != null && t.Mechanic.Employee != null ? t.Mechanic.Employee.EmployeeName : null,
                TransactionDate = t.TransactionDate,
                CreatedBy = t.CreatedBy
            })
            .ToListAsync(ct);
    }

    public async Task<SparePartTransactionDto> AddSparePartTransactionAsync(CreateSparePartTransactionRequest req, string createdBy, CancellationToken ct = default)
    {
        var part = await _db.SpareParts.FindAsync(new object[] { req.PartId }, ct);
        if (part == null)
            throw new InvalidOperationException($"Spare part with ID {req.PartId} not found.");

        var type = req.TransactionType.Trim().ToUpper() == "OUTWARD" ? "OUTWARD" : "INWARD";
        if (type == "INWARD")
        {
            part.StockQuantity += req.Quantity;
            if (req.UnitPrice > 0)
                part.UnitPrice = req.UnitPrice;
        }
        else
        {
            if (part.StockQuantity < req.Quantity)
            {
                throw new InvalidOperationException($"Insufficient stock for {part.PartCode}. Current stock: {part.StockQuantity}, Requested: {req.Quantity}");
            }
            part.StockQuantity -= req.Quantity;
        }

        var tx = new SparePartTransaction
        {
            PartId = part.PartId,
            TransactionType = type,
            Quantity = req.Quantity,
            UnitPrice = req.UnitPrice > 0 ? req.UnitPrice : part.UnitPrice,
            ReferenceNo = req.ReferenceNo,
            SupplierOrSource = req.SupplierOrSource,
            Remarks = req.Remarks,
            MachineId = req.MachineId,
            MechanicId = req.MechanicId,
            TransactionDate = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        _db.SparePartTransactions.Add(tx);
        await _db.SaveChangesAsync(ct);

        return new SparePartTransactionDto
        {
            TransactionId = tx.TransactionId,
            PartId = part.PartId,
            PartCode = part.PartCode,
            PartName = part.PartName,
            Unit = part.Unit,
            TransactionType = tx.TransactionType,
            Quantity = tx.Quantity,
            UnitPrice = tx.UnitPrice,
            TotalAmount = tx.Quantity * tx.UnitPrice,
            ReferenceNo = tx.ReferenceNo,
            SupplierOrSource = tx.SupplierOrSource,
            Remarks = tx.Remarks,
            MachineId = tx.MachineId,
            MechanicId = tx.MechanicId,
            TransactionDate = tx.TransactionDate,
            CreatedBy = tx.CreatedBy
        };
    }

    public async Task<List<SupervisorDto>> GetSupervisorsAsync(CancellationToken ct = default)
    {
        var supervisors = await _db.Employees
            .Include(e => e.Department)
            .Include(e => e.Section)
            .Include(e => e.User)
                .ThenInclude(u => u!.UserRoles)
                    .ThenInclude(ur => ur.Role)
            .Where(e => (e.User != null && e.User.UserRoles.Any(ur => ur.Role != null && ur.Role.RoleName == DomainConstants.RoleSupervisor))
                     || (e.Designation != null && e.Designation.Contains("Supervisor")))
            .OrderBy(e => e.EmployeeName)
            .Select(e => new SupervisorDto
            {
                EmployeeId = e.EmployeeId,
                EmployeeCode = e.EmployeeCode,
                EmployeeName = e.EmployeeName,
                DepartmentId = e.DepartmentId,
                DepartmentName = e.Department != null ? e.Department.DepartmentName : null,
                SectionId = e.SectionId,
                SectionCode = e.Section != null ? e.Section.SectionCode : null,
                SectionName = e.Section != null ? e.Section.SectionName : null,
                Designation = e.Designation,
                MobileNumber = e.MobileNumber,
                Email = e.Email,
                Username = e.User != null ? e.User.Username : null,
                ShiftName = "General Shift",
                IsActive = e.User == null || e.User.IsActive
            })
            .ToListAsync(ct);

        return supervisors;
    }

    public async Task<SupervisorDto> CreateSupervisorAsync(CreateSupervisorRequest req, CancellationToken ct = default)
    {
        var empCode = req.EmployeeCode.Trim().ToUpper();
        var existingEmp = await _db.Employees.FirstOrDefaultAsync(e => e.EmployeeCode.ToUpper() == empCode, ct);
        Employee emp;

        if (existingEmp != null)
        {
            emp = existingEmp;
            emp.EmployeeName = req.EmployeeName.Trim();
            if (req.DepartmentId.HasValue) emp.DepartmentId = req.DepartmentId.Value;
            if (req.SectionId.HasValue) emp.SectionId = req.SectionId.Value;
            if (!string.IsNullOrWhiteSpace(req.Designation)) emp.Designation = req.Designation.Trim();
            if (!string.IsNullOrWhiteSpace(req.MobileNumber)) emp.MobileNumber = req.MobileNumber.Trim();
            if (!string.IsNullOrWhiteSpace(req.Email)) emp.Email = req.Email.Trim();
        }
        else
        {
            emp = new Employee
            {
                EmployeeCode = empCode,
                EmployeeName = req.EmployeeName.Trim(),
                DepartmentId = req.DepartmentId ?? 1,
                SectionId = req.SectionId,
                Designation = !string.IsNullOrWhiteSpace(req.Designation) ? req.Designation.Trim() : "Shift Production Supervisor",
                MobileNumber = req.MobileNumber,
                Email = req.Email
            };
            _db.Employees.Add(emp);
        }
        await _db.SaveChangesAsync(ct);

        var supervisorRole = await _db.Roles.FirstOrDefaultAsync(r => r.RoleName == DomainConstants.RoleSupervisor, ct);
        if (supervisorRole != null)
        {
            var username = !string.IsNullOrWhiteSpace(req.Username) ? req.Username.Trim().ToLower() : empCode.ToLower();
            var existingUser = await _db.Users.FirstOrDefaultAsync(u => u.EmployeeId == emp.EmployeeId || u.Username.ToLower() == username, ct);
            if (existingUser == null)
            {
                var pwd = !string.IsNullOrWhiteSpace(req.Password) ? req.Password : "Supervisor@123";
                var newUser = new User
                {
                    EmployeeId = emp.EmployeeId,
                    Username = username,
                    PasswordHash = _hasher.HashPassword(pwd),
                    IsActive = true
                };
                _db.Users.Add(newUser);
                await _db.SaveChangesAsync(ct);

                _db.UserRoles.Add(new UserRole { UserId = newUser.UserId, RoleId = supervisorRole.RoleId });
                await _db.SaveChangesAsync(ct);
            }
        }

        var list = await GetSupervisorsAsync(ct);
        return list.FirstOrDefault(s => s.EmployeeCode.ToUpper() == empCode) ?? new SupervisorDto
        {
            EmployeeId = emp.EmployeeId,
            EmployeeCode = emp.EmployeeCode,
            EmployeeName = emp.EmployeeName,
            Designation = emp.Designation
        };
    }

    public async Task<List<SupervisorDto>> BulkImportSupervisorsAsync(List<CreateSupervisorRequest> requests, CancellationToken ct = default)
    {
        var result = new List<SupervisorDto>();
        foreach (var req in requests)
        {
            if (string.IsNullOrWhiteSpace(req.EmployeeCode) || string.IsNullOrWhiteSpace(req.EmployeeName))
                continue;
            var created = await CreateSupervisorAsync(req, ct);
            result.Add(created);
        }
        return result;
    }

    public async Task<MechanicDto> CreateMechanicAsync(CreateMechanicRequest req, CancellationToken ct = default)
    {
        var empCode = req.EmployeeCode.Trim().ToUpper();
        var existingEmp = await _db.Employees.FirstOrDefaultAsync(e => e.EmployeeCode.ToUpper() == empCode, ct);
        Employee emp;

        var maintDept = await _db.Departments.FirstOrDefaultAsync(d => d.DepartmentCode == "DEPT-MAINT", ct);
        var deptId = maintDept?.DepartmentId ?? 2;

        if (existingEmp != null)
        {
            emp = existingEmp;
            emp.EmployeeName = req.EmployeeName.Trim();
            if (req.SectionId.HasValue) emp.SectionId = req.SectionId.Value;
            if (!string.IsNullOrWhiteSpace(req.MobileNumber)) emp.MobileNumber = req.MobileNumber.Trim();
        }
        else
        {
            emp = new Employee
            {
                EmployeeCode = empCode,
                EmployeeName = req.EmployeeName.Trim(),
                DepartmentId = deptId,
                SectionId = req.SectionId,
                Designation = req.Specialization ?? "Maintenance Fitter",
                MobileNumber = req.MobileNumber
            };
            _db.Employees.Add(emp);
        }
        await _db.SaveChangesAsync(ct);

        var existingMech = await _db.Mechanics.FirstOrDefaultAsync(m => m.EmployeeId == emp.EmployeeId, ct);
        if (existingMech == null)
        {
            var mech = new Mechanic
            {
                EmployeeId = emp.EmployeeId,
                SectionId = req.SectionId,
                Specialization = req.Specialization ?? "General Maintenance",
                IsAvailable = true,
                ActiveTicketCount = 0
            };
            _db.Mechanics.Add(mech);
            await _db.SaveChangesAsync(ct);
        }
        else
        {
            if (req.SectionId.HasValue) existingMech.SectionId = req.SectionId.Value;
            if (!string.IsNullOrWhiteSpace(req.Specialization)) existingMech.Specialization = req.Specialization;
            await _db.SaveChangesAsync(ct);
        }

        var mechRole = await _db.Roles.FirstOrDefaultAsync(r => r.RoleName == DomainConstants.RoleMechanic, ct);
        if (mechRole != null)
        {
            var username = empCode.ToLower();
            var existingUser = await _db.Users.FirstOrDefaultAsync(u => u.EmployeeId == emp.EmployeeId || u.Username.ToLower() == username, ct);
            if (existingUser == null)
            {
                var newUser = new User
                {
                    EmployeeId = emp.EmployeeId,
                    Username = username,
                    PasswordHash = _hasher.HashPassword("Mechanic@123"),
                    IsActive = true
                };
                _db.Users.Add(newUser);
                await _db.SaveChangesAsync(ct);

                _db.UserRoles.Add(new UserRole { UserId = newUser.UserId, RoleId = mechRole.RoleId });
                await _db.SaveChangesAsync(ct);
            }
        }

        var list = await GetMechanicsAsync(null, ct);
        return list.FirstOrDefault(m => m.EmployeeCode.ToUpper() == empCode) ?? new MechanicDto
        {
            EmployeeId = emp.EmployeeId,
            EmployeeCode = emp.EmployeeCode,
            EmployeeName = emp.EmployeeName,
            Specialization = req.Specialization
        };
    }

    public async Task<List<MechanicDto>> BulkImportMechanicsAsync(List<CreateMechanicRequest> requests, CancellationToken ct = default)
    {
        var result = new List<MechanicDto>();
        foreach (var req in requests)
        {
            if (string.IsNullOrWhiteSpace(req.EmployeeCode) || string.IsNullOrWhiteSpace(req.EmployeeName))
                continue;
            var created = await CreateMechanicAsync(req, ct);
            result.Add(created);
        }
        return result;
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
