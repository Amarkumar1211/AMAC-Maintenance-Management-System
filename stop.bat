@echo off
TITLE Stop MBMS Services
COLOR 0C

echo =======================================================================
echo   STOPPING MBMS APPLICATION SERVICES (Ports 5102 ^& 5103)
echo =======================================================================
echo.

powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 5102, 5103 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"

echo.
echo =======================================================================
echo   All MBMS services have been stopped. Ports 5102 ^& 5103 are free.
echo =======================================================================
echo.
ping -n 3 127.0.0.1 >nul
