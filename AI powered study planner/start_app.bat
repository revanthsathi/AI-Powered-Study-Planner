@echo off
title AI Study Planner Launcher
echo ===================================================
echo             AI STUDY PLATFORM LAUNCHER             
echo ===================================================
echo.
echo [1/3] Checking backend virtual environment...

cd %~dp0backend
if not exist .venv (
    echo [!] Python virtual environment not found. Creating it...
    python -m venv .venv
    call .venv\Scripts\activate
    echo [!] Installing python packages...
    pip install -r requirements.txt
) else (
    call .venv\Scripts\activate
)

echo.
echo [2/3] Launching FastAPI backend server on port 8000...
start "AI Planner Backend" cmd /k "cd %~dp0backend && .venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

echo.
echo [3/3] Launching Vite React frontend on port 3000...
start "AI Planner Frontend" cmd /k "cd %~dp0frontend && powershell -ExecutionPolicy Bypass -File ../run_node.ps1 npm run dev"

echo.
echo ===================================================
echo  Starting complete. Launching browser in 5 seconds...
echo ===================================================
timeout /t 5 /nobreak >nul
start http://localhost:3000
exit
