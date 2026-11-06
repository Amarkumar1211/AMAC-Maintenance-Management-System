using MBMS.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MBMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FilesController : ControllerBase
{
    private readonly IFileStorageService _fileStorage;

    public FilesController(IFileStorageService fileStorage)
    {
        _fileStorage = fileStorage;
    }

    [HttpGet("view")]
    [AllowAnonymous] // Allows rendering inline images via token query param or public ticket viewing on LAN
    public IActionResult ViewFile([FromQuery] string path)
    {
        if (string.IsNullOrWhiteSpace(path))
        {
            return BadRequest(new { Message = "File path is required." });
        }

        var result = _fileStorage.GetFileStream(path);
        if (result == null)
        {
            return NotFound(new { Message = "Requested file not found on local storage." });
        }

        return File(result.Value.Stream, result.Value.ContentType);
    }
}

