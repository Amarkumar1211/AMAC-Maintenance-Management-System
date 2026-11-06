namespace MBMS.Application.Interfaces;

public interface IQRService
{
    string GenerateMachineQrPayload(int machineId, string machineCode);
    byte[] GenerateQrCodePng(string payload);
}

