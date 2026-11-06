using System.Security.Cryptography;
using MBMS.Application.Interfaces;

namespace MBMS.Infrastructure.Security;

public class PasswordHasher : IPasswordHasher
{
    private const int SaltSize = 16; // 128-bit
    private const int KeySize = 32;  // 256-bit
    private const int Iterations = 100000;
    private static readonly HashAlgorithmName Algorithm = HashAlgorithmName.SHA256;

    private const char SegmentDelimiter = ':';

    public string HashPassword(string password)
    {
        byte[] salt = RandomNumberGenerator.GetBytes(SaltSize);
        byte[] hash = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt,
            Iterations,
            Algorithm,
            KeySize);

        return string.Join(
            SegmentDelimiter,
            Convert.ToBase64String(hash),
            Convert.ToBase64String(salt),
            Iterations,
            Algorithm);
    }

    public bool VerifyPassword(string password, string passwordHash)
    {
        string[] segments = passwordHash.Split(SegmentDelimiter);
        if (segments.Length != 4)
        {
            return false;
        }

        byte[] hash = Convert.FromBase64String(segments[0]);
        byte[] salt = Convert.FromBase64String(segments[1]);
        int iterations = int.Parse(segments[2]);
        var algorithm = new HashAlgorithmName(segments[3]);

        byte[] inputHash = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt,
            iterations,
            algorithm,
            hash.Length);

        return CryptographicOperations.FixedTimeEquals(inputHash, hash);
    }
}

