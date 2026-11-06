using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MBMS.Application.DTOs;
using MBMS.Application.Interfaces;
using MBMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace MBMS.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly MBMSDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly IConfiguration _config;

    public AuthService(MBMSDbContext db, IPasswordHasher hasher, IConfiguration config)
    {
        _db = db;
        _hasher = hasher;
        _config = config;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var user = await _db.Users
            .Include(u => u.Employee)
                .ThenInclude(e => e!.Department)
            .Include(u => u.Employee)
                .ThenInclude(e => e!.Mechanic)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Username.ToLower() == request.Username.ToLower().Trim() && u.IsActive, ct);

        if (user == null || user.Employee == null)
        {
            return null;
        }

        if (!_hasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            return null;
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        var roles = user.UserRoles
            .Where(ur => ur.Role != null)
            .Select(ur => ur.Role!.RoleName)
            .ToList();

        var token = GenerateJwtToken(user, roles);

        return new LoginResponse
        {
            Token = token,
            UserId = user.UserId,
            EmployeeId = user.EmployeeId,
            EmployeeCode = user.Employee.EmployeeCode,
            EmployeeName = user.Employee.EmployeeName,
            Designation = user.Employee.Designation,
            DepartmentId = user.Employee.DepartmentId,
            DepartmentName = user.Employee.Department?.DepartmentName ?? string.Empty,
            Roles = roles,
            MechanicId = user.Employee.Mechanic?.MechanicId
        };
    }

    public async Task<UserProfileDto?> GetUserProfileAsync(int userId, CancellationToken ct = default)
    {
        var user = await _db.Users
            .Include(u => u.Employee)
                .ThenInclude(e => e!.Department)
            .Include(u => u.Employee)
                .ThenInclude(e => e!.Mechanic)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.UserId == userId && u.IsActive, ct);

        if (user == null || user.Employee == null)
        {
            return null;
        }

        return new UserProfileDto
        {
            UserId = user.UserId,
            EmployeeId = user.EmployeeId,
            Username = user.Username,
            EmployeeCode = user.Employee.EmployeeCode,
            EmployeeName = user.Employee.EmployeeName,
            MobileNumber = user.Employee.MobileNumber,
            Email = user.Employee.Email,
            Designation = user.Employee.Designation,
            DepartmentId = user.Employee.DepartmentId,
            DepartmentName = user.Employee.Department?.DepartmentName ?? string.Empty,
            Roles = user.UserRoles.Where(ur => ur.Role != null).Select(ur => ur.Role!.RoleName).ToList(),
            MechanicId = user.Employee.Mechanic?.MechanicId
        };
    }

    private string GenerateJwtToken(Domain.Entities.User user, List<string> roles)
    {
        var jwtKey = _config["Jwt:Key"] ?? "MBMS_SuperSecret_Factory_LAN_Key_2026_Industrial_Security!";
        var issuer = _config["Jwt:Issuer"] ?? "MBMS.API";
        var audience = _config["Jwt:Audience"] ?? "MBMS.Client";

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new(ClaimTypes.Name, user.Username),
            new("EmployeeId", user.EmployeeId.ToString()),
            new("EmployeeCode", user.Employee!.EmployeeCode),
            new("EmployeeName", user.Employee.EmployeeName),
            new("DepartmentId", user.Employee.DepartmentId.ToString())
        };

        if (user.Employee.Mechanic != null)
        {
            claims.Add(new("MechanicId", user.Employee.Mechanic.MechanicId.ToString()));
        }

        foreach (var role in roles)
        {
            claims.Add(new(ClaimTypes.Role, role));
        }

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

