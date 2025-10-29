@echo off
echo Starting Heart Disease Prediction System...
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && python run.py"

echo Waiting for backend to initialize...
timeout /t 5 /nobreak > nul

echo Starting Frontend Server...
start "Frontend Server" cmd /k "python start_frontend_server.py"

echo.
echo System is starting up...
echo Backend API: http://127.0.0.1:5000
echo Frontend Web App: http://localhost:8080
echo.
echo Both servers are running in separate windows.
echo Close those windows to stop the servers.
pause