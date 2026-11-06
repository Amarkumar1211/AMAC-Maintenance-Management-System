using System.Security.Claims;
using MBMS.Application.DTOs;
using MBMS.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MBMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { Message = "Username and password are required." });
        }

        var response = await _authService.LoginAsync(request, ct);
        if (response == null)
        {
            return Unauthorized(new { Message = "Invalid username or password, or account is inactive." });
        }

        return Ok(response);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetCurrentUser(CancellationToken ct)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        var profile = await _authService.GetUserProfileAsync(userId, ct);
        if (profile == null)
        {
            return NotFound(new { Message = "User profile not found." });
        }

        return Ok(profile);
    }
}

