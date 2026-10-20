@echo off
setlocal

echo ========================================================
echo   WinMedia Scanner - Windows Native EXE Builder
echo ========================================================
echo.

:: Automatically check common Node.js install directories and append to PATH
if exist "C:\Program Files\nodejs" (
    set "PATH=C:\Program Files\nodejs;%PATH%"
)
if exist "C:\Program Files (x86)\nodejs" (
    set "PATH=C:\Program Files (x86)\nodejs;%PATH%"
)
if exist "%APPDATA%\npm" (
    set "PATH=%APPDATA%\npm;%PATH%"
)
if exist "%LOCALAPPDATA%\Programs\node" (
    set "PATH=%LOCALAPPDATA%\Programs\node;%PATH%"
)

:: Step 1: Check Node.js
echo [1/3] Checking Node.js environment...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Node.js is not found on your computer.
    echo To build this Windows .exe, Node.js LTS is required.
    echo.
    echo Opening https://nodejs.org in your browser...
    start https://nodejs.org
    echo.
    echo Please run the Node.js installer, and once finished, run this script again.
    echo.
    pause
    exit /b 1
)

:: Step 2: Install dependencies
echo.
echo [2/3] Installing dependencies...
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo Retrying with --force...
    call npm install --force
    if %errorlevel% neq 0 (
        echo [ERROR] npm install encountered an issue.
        pause
        exit /b 1
    )
)

:: Step 3: Package with electron-builder
echo.
echo [3/3] Packaging Windows Native Executables with electron-builder...
if not exist "dist\index.html" (
    echo Production bundle not found, compiling with Vite...
    call npm run build
)
call npm run package:exe
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Packaging failed. See error log above.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo   SUCCESS! Windows Native Executables Created!
echo.
echo   Check your dist-electron folder:
echo   - WinMedia Scanner Setup 1.0.2.exe
echo   - WinMedia Scanner 1.0.2.exe (Portable)
echo ========================================================
echo.
if exist "dist-electron" (
    explorer dist-electron
)
pause
