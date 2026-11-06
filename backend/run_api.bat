@echo off
TITLE MBMS Backend Web API (Port 5102)
COLOR 0A
cd /d "%~dp0publish"
echo =======================================================================
echo   MBMS BACKEND REST API - PORT 5102
echo =======================================================================
echo.
echo Starting ASP.NET Core API on http://0.0.0.0:5102 ...
dotnet MBMS.API.dll --urls "http://0.0.0.0:5102"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [FALLBACK] Trying source compilation via dotnet run...
    cd /d "%~dp0MBMS.API"
    dotnet run --urls "http://0.0.0.0:5102"
)
pause

