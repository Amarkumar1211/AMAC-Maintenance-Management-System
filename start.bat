@echo off
TITLE AMAC MBMS - Machine Breakdown and Maintenance Management System
COLOR 0A

echo =======================================================================
echo   AMAC - MACHINE BREAKDOWN ^& MAINTENANCE MANAGEMENT SYSTEM
echo   Asiaan Metals ^& Aluminium Casting Pvt Ltd - Unit 5 (U5)
echo =======================================================================
echo.

cd /d "%~dp0"

echo [1/3] Starting Backend Web API on port 5102...
start "AMAC MBMS Backend API (Port 5102)" cmd /k "cd /d ""%~dp0backend\publish"" && dotnet MBMS.API.dll --urls http://0.0.0.0:5102"

echo [2/3] Starting Frontend Web UI on port 5103...
start "AMAC MBMS Frontend UI (Port 5103)" cmd /k "cd /d ""%~dp0frontend"" && npm run dev -- --host 0.0.0.0 --port 5103"

echo [3/3] Initializing services and launching web browser...
ping -n 4 127.0.0.1 >nul

start http://localhost:5103

echo.
echo =======================================================================
echo   AMAC MBMS APPLICATION IS RUNNING!
echo   -------------------------------------------------------------------
echo   * Web Portal (Frontend):  http://localhost:5103
echo   * Backend REST API:       http://localhost:5102
echo   * Factory LAN Access:     http://0.0.0.0:5103
echo.
echo   ROLE-BASED FACTORY DEMO ACCOUNTS:
echo   - Production Supervisor:  supervisor   / Supervisor@123
echo   - Maintenance Mechanic:   mechanic     / Mechanic@123
echo   - Maintenance Incharge:   incharge     / Incharge@123
echo   - Plant Administrator:    admin        / Admin@123
echo =======================================================================
echo.
echo Press any key to exit this launcher window. Services will remain running.
pause >nul
