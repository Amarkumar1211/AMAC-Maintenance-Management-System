using MBMS.Application.Interfaces;
using QRCoder;

namespace MBMS.Infrastructure.Services;

public class QRCodeService : IQRService
{
    public string GenerateMachineQrPayload(int machineId, string machineCode)
    {
        return $"mbms://machine/{machineId}?code={machineCode}";
    }

    public byte[] GenerateQrCodePng(string payload)
    {
        using var qrGenerator = new QRCodeGenerator();
        using var qrCodeData = qrGenerator.CreateQrCode(payload, QRCodeGenerator.ECCLevel.Q);
        using var qrCode = new PngByteQRCode(qrCodeData);
        return qrCode.GetGraphic(20);
    }
}

