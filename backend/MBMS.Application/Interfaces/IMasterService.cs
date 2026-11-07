using MBMS.Application.DTOs;

namespace MBMS.Application.Interfaces;

public interface IMasterService
{
    Task<List<DepartmentDto>> GetDepartmentsAsync(CancellationToken ct = default);
    Task<List<ProductionSectionDto>> GetSectionsAsync(int? departmentId = null, CancellationToken ct = default);
    Task<List<MachineDto>> GetMachinesAsync(int? departmentId = null, int? sectionId = null, string? criticality = null, bool? activeOnly = null, CancellationToken ct = default);
    Task<MachineDto?> GetMachineByIdAsync(int machineId, CancellationToken ct = default);
    Task<MachineDto?> GetMachineByCodeAsync(string machineCode, CancellationToken ct = default);
    Task<List<BreakdownCategoryDto>> GetBreakdownCategoriesAsync(CancellationToken ct = default);
    Task<List<MechanicDto>> GetMechanicsAsync(bool? availableOnly = null, CancellationToken ct = default);
    Task<List<SparePartDto>> GetSparePartsAsync(string? search = null, CancellationToken ct = default);
    Task<List<ShiftDto>> GetShiftsAsync(CancellationToken ct = default);
    Task<MachineDto> CreateMachineAsync(MachineDto dto, CancellationToken ct = default);
    Task<MachineDto?> UpdateMachineAsync(int machineId, MachineDto dto, CancellationToken ct = default);
    Task<List<MachineDto>> BulkImportMachinesAsync(List<MachineDto> dtos, CancellationToken ct = default);

    Task<SparePartDto> CreateSparePartAsync(SparePartDto dto, CancellationToken ct = default);
    Task<List<SparePartDto>> BulkImportSparePartsAsync(List<SparePartDto> dtos, CancellationToken ct = default);
    Task<List<SparePartTransactionDto>> GetSparePartTransactionsAsync(string? type = null, int? partId = null, CancellationToken ct = default);
    Task<SparePartTransactionDto> AddSparePartTransactionAsync(CreateSparePartTransactionRequest req, string createdBy, CancellationToken ct = default);

    Task<List<SupervisorDto>> GetSupervisorsAsync(CancellationToken ct = default);
    Task<SupervisorDto> CreateSupervisorAsync(CreateSupervisorRequest req, CancellationToken ct = default);
    Task<List<SupervisorDto>> BulkImportSupervisorsAsync(List<CreateSupervisorRequest> requests, CancellationToken ct = default);

    Task<MechanicDto> CreateMechanicAsync(CreateMechanicRequest req, CancellationToken ct = default);
    Task<List<MechanicDto>> BulkImportMechanicsAsync(List<CreateMechanicRequest> requests, CancellationToken ct = default);
}
