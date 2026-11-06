using MBMS.Application.DTOs;

namespace MBMS.Application.Interfaces;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest request, CancellationToken ct = default);
    Task<UserProfileDto?> GetUserProfileAsync(int userId, CancellationToken ct = default);
}

