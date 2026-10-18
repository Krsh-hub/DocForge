@echo off
echo ========================================================
echo               DocForge Local Launcher
echo ========================================================

REM Step 1: Check Python virtual environment
cd /d "%~dp0\..\backend"
if not exist "venv\Scripts\python.exe" (
    echo [1/3] Setting up Python virtual environment...
    python -m venv venv
    .\venv\Scripts\python.exe -m pip install colorama
    .\venv\Scripts\pip install -r requirements.txt
    .\venv\Scripts\python.exe seed.py
)

REM Step 2: Start Backend Server
echo [2/3] Starting FastAPI Backend on 127.0.0.1:8000...
start "DocForge Backend" .\venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8000

REM Step 3: Start Frontend Server
cd /d "%~dp0\..\frontend"
echo [3/3] Starting Next.js Frontend on http://localhost:3000...
start "DocForge Frontend" npm run dev

echo.
echo ========================================================
echo DocForge is starting up!
echo Web Application: http://localhost:3000
echo API Docs:        http://127.0.0.1:8000/docs
echo ========================================================
pause
