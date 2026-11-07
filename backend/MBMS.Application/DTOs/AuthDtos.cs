namespace MBMS.Application.DTOs;

public class LoginRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public int UserId { get; set; }
    public int EmployeeId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string? Designation { get; set; }
    public int DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public int? SectionId { get; set; }
    public string? SectionCode { get; set; }
    public string? SectionName { get; set; }
    public List<string> Roles { get; set; } = new();
    public int? MechanicId { get; set; }
}

public class UserProfileDto
{
    public int UserId { get; set; }
    public int EmployeeId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string EmployeeCode { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string? MobileNumber { get; set; }
    public string? Email { get; set; }
    public string? Designation { get; set; }
    public int DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public int? SectionId { get; set; }
    public string? SectionCode { get; set; }
    public string? SectionName { get; set; }
    public List<string> Roles { get; set; } = new();
    public int? MechanicId { get; set; }
}
