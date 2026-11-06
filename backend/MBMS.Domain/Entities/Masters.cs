namespace MBMS.Domain.Entities;

public class Department
{
    public int DepartmentId { get; set; }
    public string DepartmentCode { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<ProductionSection> Sections { get; set; } = new List<ProductionSection>();
    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
    public ICollection<Machine> Machines { get; set; } = new List<Machine>();
}

public class ProductionSection
{
    public int SectionId { get; set; }
    public int DepartmentId { get; set; }
    public string SectionCode { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Department? Department { get; set; }
    public ICollection<Machine> Machines { get; set; } = new List<Machine>();
}

public class Shift
{
    public int ShiftId { get; set; }
    public string ShiftName { get; set; } = string.Empty;
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public bool IsActive { get; set; } = true;
}

public class Employee
{
    public int EmployeeId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string? MobileNumber { get; set; }
    public string? Email { get; set; }
    public int DepartmentId { get; set; }
    public string? Designation { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Department? Department { get; set; }
    public User? User { get; set; }
    public Mechanic? Mechanic { get; set; }
}

public class Role
{
    public int RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public string? Description { get; set; }

    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}

public class User
{
    public int UserId { get; set; }
    public int EmployeeId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime? LastLoginAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Employee? Employee { get; set; }
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}

public class UserRole
{
    public int UserId { get; set; }
    public int RoleId { get; set; }

    public User? User { get; set; }
    public Role? Role { get; set; }
}

public class MechanicSpecialization
{
    public int SpecializationId { get; set; }
    public string SpecializationName { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class Mechanic
{
    public int MechanicId { get; set; }
    public int EmployeeId { get; set; }
    public string? Specialization { get; set; }
    public string? ShiftName { get; set; }
    public bool IsAvailable { get; set; } = true;
    public int ActiveTicketCount { get; set; } = 0;

    public Employee? Employee { get; set; }
    public ICollection<TicketAssignment> Assignments { get; set; } = new List<TicketAssignment>();
    public ICollection<MaintenanceAction> Actions { get; set; } = new List<MaintenanceAction>();
    public ICollection<TicketWorkSession> WorkSessions { get; set; } = new List<TicketWorkSession>();
}

public class MachineCategory
{
    public int MachineCategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<Machine> Machines { get; set; } = new List<Machine>();
}

public class Machine
{
    public int MachineId { get; set; }
    public string MachineCode { get; set; } = string.Empty;
    public string MachineName { get; set; } = string.Empty;
    public int DepartmentId { get; set; }
    public int? SectionId { get; set; }
    public int? MachineCategoryId { get; set; }
    public string? MachineCategory { get; set; }
    public string? Location { get; set; }
    public string? Manufacturer { get; set; }
    public string? ModelNumber { get; set; }
    public string? SerialNumber { get; set; }
    public DateTime? InstallationDate { get; set; }
    public string Criticality { get; set; } = "MEDIUM";
    public string? QRCode { get; set; }
    public string? MachineImagePath { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Department? Department { get; set; }
    public ProductionSection? Section { get; set; }
    public MachineCategory? Category { get; set; }
    public ICollection<BreakdownTicket> Tickets { get; set; } = new List<BreakdownTicket>();
    public ICollection<MachineDowntime> Downtimes { get; set; } = new List<MachineDowntime>();
}

public class BreakdownCategory
{
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<BreakdownTicket> Tickets { get; set; } = new List<BreakdownTicket>();
}

