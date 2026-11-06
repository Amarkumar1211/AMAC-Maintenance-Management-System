@echo off
TITLE MBMS Frontend UI (Port 5103)
COLOR 0B
cd /d "%~dp0"
echo =======================================================================
echo   MBMS FRONTEND WEB UI - PORT 5103
echo =======================================================================
echo.
echo Starting React Vite dev server on http://0.0.0.0:5103 ...
npm run dev -- --host 0.0.0.0 --port 5103
pause

