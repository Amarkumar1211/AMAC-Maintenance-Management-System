# =======================================================================
# MBMS Industrial Maintenance System - Automated Backup Script
# Backs up SQL Server database MBMS_Production and local attachment directories
# =======================================================================

param(
    [string]$SqlServer = "localhost",
    [string]$Database = "MBMS_Production",
    [string]$StoragePath = "D:\MBMSData",
    [string]$BackupDestination = "D:\MBMSData\Backups"
)

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$DbBackupFile = "$BackupDestination\Database\MBMS_DB_$Timestamp.bak"
$FileBackupZip = "$BackupDestination\Files\MBMS_Files_$Timestamp.zip"

Write-Host "Starting MBMS Backup Routine: $Timestamp" -ForegroundColor Cyan

# 1. Ensure target directories exist
New-Item -ItemType Directory -Force -Path "$BackupDestination\Database" | Out-Null
New-Item -ItemType Directory -Force -Path "$BackupDestination\Files" | Out-Null

# 2. SQL Server Database Full Backup
Write-Host "Backing up SQL Server database [$Database]..." -ForegroundColor Yellow
$BackupSql = "BACKUP DATABASE [$Database] TO DISK = N'$DbBackupFile' WITH NOFORMAT, NOINIT, NAME = N'$Database-Full', SKIP, NOREWIND, NOUNLOAD, STATS = 10"
sqlcmd -S $SqlServer -E -I -Q $BackupSql

if (Test-Path $DbBackupFile) {
    $dbSize = (Get-Item $DbBackupFile).Length / 1MB
    Write-Host "Database backup successful: $DbBackupFile ($([math]::Round($dbSize, 2)) MB)" -ForegroundColor Green
} else {
    Write-Error "Database backup failed!"
    exit 1
}

# 3. File Storage Backup (Breakdown images, repair photos, signatures)
if (Test-Path $StoragePath) {
    Write-Host "Archiving local storage directories from $StoragePath..." -ForegroundColor Yellow
    $FoldersToZip = @(
        "$StoragePath\BreakdownImages",
        "$StoragePath\RepairImages",
        "$StoragePath\Signatures",
        "$StoragePath\Documents"
    ) | Where-Object { Test-Path $_ }

    if ($FoldersToZip.Count -gt 0) {
        Compress-Archive -Path $FoldersToZip -DestinationPath $FileBackupZip -Force
        $zipSize = (Get-Item $FileBackupZip).Length / 1MB
        Write-Host "File backup successful: $FileBackupZip ($([math]::Round($zipSize, 2)) MB)" -ForegroundColor Green
    }
}

Write-Host "MBMS Backup Routine Completed Successfully." -ForegroundColor Cyan

