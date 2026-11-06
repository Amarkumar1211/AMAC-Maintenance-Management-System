using MBMS.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace MBMS.Infrastructure.Services;

public class FileStorageService : IFileStorageService
{
    private readonly string _basePath;
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf"
    };

    public FileStorageService(IConfiguration config)
    {
        var configuredPath = config["Storage:BasePath"];
        if (string.IsNullOrWhiteSpace(configuredPath))
        {
            configuredPath = Directory.Exists("D:\\") ? @"D:\MBMSData" : Path.Combine(AppContext.BaseDirectory, "local-storage");
        }
        _basePath = configuredPath;

        try
        {
            Directory.CreateDirectory(_basePath);
            Directory.CreateDirectory(Path.Combine(_basePath, "BreakdownImages"));
            Directory.CreateDirectory(Path.Combine(_basePath, "RepairImages"));
            Directory.CreateDirectory(Path.Combine(_basePath, "Signatures"));
            Directory.CreateDirectory(Path.Combine(_basePath, "Documents"));
            Directory.CreateDirectory(Path.Combine(_basePath, "Backups"));
        }
        catch
        {
            // Fallback to local app directory if D: write permissions restricted
            _basePath = Path.Combine(AppContext.BaseDirectory, "local-storage");
            Directory.CreateDirectory(_basePath);
            Directory.CreateDirectory(Path.Combine(_basePath, "BreakdownImages"));
            Directory.CreateDirectory(Path.Combine(_basePath, "RepairImages"));
            Directory.CreateDirectory(Path.Combine(_basePath, "Signatures"));
            Directory.CreateDirectory(Path.Combine(_basePath, "Documents"));
            Directory.CreateDirectory(Path.Combine(_basePath, "Backups"));
        }
    }

    public async Task<FileSaveResult> SaveAttachmentAsync(
        Stream stream,
        string originalFileName,
        string attachmentType,
        string ticketNumber,
        string contentType,
        CancellationToken ct = default)
    {
        var ext = Path.GetExtension(originalFileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext))
        {
            throw new InvalidOperationException($"File type {ext} is not allowed. Only image and document files are accepted.");
        }

        var now = DateTime.UtcNow;
        var folderCategory = attachmentType.ToUpperInvariant() switch
        {
            "BREAKDOWN" => "BreakdownImages",
            "INSPECTION" or "REPAIR" => "RepairImages",
            _ => "Documents"
        };

        var sanitizedTicket = string.IsNullOrWhiteSpace(ticketNumber) ? "GENERAL" : ticketNumber.Replace('/', '_').Replace('\\', '_');
        var targetDir = Path.Combine(_basePath, folderCategory, now.ToString("yyyy"), now.ToString("MM"), sanitizedTicket);
        Directory.CreateDirectory(targetDir);

        var shortGuid = Guid.NewGuid().ToString("N")[..8];
        var storedFileName = $"{sanitizedTicket}_{attachmentType}_{shortGuid}{ext}";
        var fullPath = Path.Combine(targetDir, storedFileName);

        using (var fileStream = new FileStream(fullPath, FileMode.Create, FileAccess.Write, FileShare.None))
        {
            await stream.CopyToAsync(fileStream, ct);
        }

        var fileInfo = new FileInfo(fullPath);
        var relativePath = Path.GetRelativePath(_basePath, fullPath);

        return new FileSaveResult
        {
            OriginalFileName = originalFileName,
            StoredFileName = storedFileName,
            FullPath = fullPath,
            RelativePath = relativePath,
            FileSize = fileInfo.Length,
            ContentType = string.IsNullOrWhiteSpace(contentType) ? GetMimeType(ext) : contentType
        };
    }

    public async Task<FileSaveResult> SaveSignatureAsync(
        byte[] imageBytes,
        string ticketNumber,
        string stage,
        string signatureType,
        CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var sanitizedTicket = string.IsNullOrWhiteSpace(ticketNumber) ? "GENERAL" : ticketNumber.Replace('/', '_').Replace('\\', '_');
        var targetDir = Path.Combine(_basePath, "Signatures", now.ToString("yyyy"), now.ToString("MM"), sanitizedTicket);
        Directory.CreateDirectory(targetDir);

        var shortGuid = Guid.NewGuid().ToString("N")[..6];
        var ext = ".png";
        var storedFileName = $"{sanitizedTicket}_SIGNATURE_{stage.ToUpperInvariant()}_{shortGuid}{ext}";
        var fullPath = Path.Combine(targetDir, storedFileName);

        await File.WriteAllBytesAsync(fullPath, imageBytes, ct);
        var fileInfo = new FileInfo(fullPath);
        var relativePath = Path.GetRelativePath(_basePath, fullPath);

        return new FileSaveResult
        {
            OriginalFileName = $"{stage}_Signature.png",
            StoredFileName = storedFileName,
            FullPath = fullPath,
            RelativePath = relativePath,
            FileSize = fileInfo.Length,
            ContentType = "image/png"
        };
    }

    public (Stream Stream, string ContentType, string FileName)? GetFileStream(string storedPath)
    {
        string fullPath = Path.IsPathRooted(storedPath) ? storedPath : Path.Combine(_basePath, storedPath);
        if (!File.Exists(fullPath))
        {
            return null;
        }

        var ext = Path.GetExtension(fullPath).ToLowerInvariant();
        var mime = GetMimeType(ext);
        var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return (stream, mime, Path.GetFileName(fullPath));
    }

    private static string GetMimeType(string ext) => ext switch
    {
        ".jpg" or ".jpeg" => "image/jpeg",
        ".png" => "image/png",
        ".gif" => "image/gif",
        ".webp" => "image/webp",
        ".pdf" => "application/pdf",
        _ => "application/octet-stream"
    };
}

