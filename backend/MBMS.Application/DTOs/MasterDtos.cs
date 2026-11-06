namespace MBMS.Application.DTOs;

public class DepartmentDto
{
    public int DepartmentId { get; set; }
    public string DepartmentCode { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class ProductionSectionDto
{
    public int SectionId { get; set; }
    public int DepartmentId { get; set; }
    public string SectionCode { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class MachineDto
{
    public int MachineId { get; set; }
    public string MachineCode { get; set; } = string.Empty;
    public string MachineName { get; set; } = string.Empty;
    public int DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public int? SectionId { get; set; }
    public string? SectionName { get; set; }
    public string? MachineCategory { get; set; }
    public string? Location { get; set; }
    public string? Manufacturer { get; set; }
    public string? ModelNumber { get; set; }
    public string? SerialNumber { get; set; }
    public DateTime? InstallationDate { get; set; }
    public string Criticality { get; set; } = "MEDIUM";
    public string? QRCode { get; set; }
    public bool IsActive { get; set; }
    public bool IsUnderBreakdown { get; set; }
    public string? ActiveTicketNumber { get; set; }
}

public class MechanicDto
{
    public int MechanicId { get; set; }
    public int EmployeeId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string? MobileNumber { get; set; }
    public string? Specialization { get; set; }
    public string? ShiftName { get; set; }
    public bool IsAvailable { get; set; }
    public int ActiveTicketCount { get; set; }
}

public class BreakdownCategoryDto
{
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
}

public class SparePartDto
{
    public int PartId { get; set; }
    public string PartCode { get; set; } = string.Empty;
    public string PartName { get; set; } = string.Empty;
    public string? Unit { get; set; }
    public string? Description { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal StockQuantity { get; set; }
    public bool IsActive { get; set; }
}

public class ShiftDto
{
    public int ShiftId { get; set; }
    public string ShiftName { get; set; } = string.Empty;
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
}

