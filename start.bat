@echo off
echo Starting HireReady...

:: Kill any existing processes on ports 8000 and 5173
echo Checking for existing processes...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000"') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173"') do taskkill /F /PID %%a 2>nul

:: Start Backend
echo Starting Backend on port 8000...
start cmd /k "cd backend && ..\\.venv\\Scripts\\activate && uvicorn main:app --reload --port 8000"

:: Wait for backend to start
timeout /t 3 /nobreak > nul

:: Start Frontend
echo Starting Frontend on port 5173...
start cmd /k "cd frontend && npm run dev"

:: Wait for frontend to start
timeout /t 3 /nobreak > nul

:: Open browser
echo Opening HireReady in browser...
start http://localhost:5173

echo.
echo HireReady is running!
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:8000/docs
echo.
echo Close the terminal windows to stop the services.