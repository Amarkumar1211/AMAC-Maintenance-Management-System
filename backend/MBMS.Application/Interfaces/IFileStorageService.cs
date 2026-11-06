namespace MBMS.Application.Interfaces;

public class FileSaveResult
{
    public string OriginalFileName { get; set; } = string.Empty;
    public string StoredFileName { get; set; } = string.Empty;
    public string RelativePath { get; set; } = string.Empty;
    public string FullPath { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string ContentType { get; set; } = string.Empty;
}

public interface IFileStorageService
{
    Task<FileSaveResult> SaveAttachmentAsync(Stream stream, string originalFileName, string attachmentType, string ticketNumber, string contentType, CancellationToken ct = default);
    Task<FileSaveResult> SaveSignatureAsync(byte[] imageBytes, string ticketNumber, string stage, string signatureType, CancellationToken ct = default);
    (Stream Stream, string ContentType, string FileName)? GetFileStream(string storedPath);
}

