@echo off
echo Starting Umbuzo Frontend with NPX...
cd /d %~dp0

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed. Please install Node.js to use npx.
    echo Falling back to Python server...
    python -m http.server 8080
    pause
    exit /b
)

:: Start http-server via npx
echo Launching http-server on port 8080...
call npx http-server -p 8080 -c-1 --cors

pause
