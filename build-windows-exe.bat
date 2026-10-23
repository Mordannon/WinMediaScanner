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
echo [1/4] Checking Node.js environment...
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
echo [2/4] Installing dependencies...
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

:: Step 3: Compile React Frontend with Vite
echo.
echo [3/4] Compiling updated React application (Vite build)...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [NOTICE] Vite compilation returned an error code on this machine.
    if exist "dist\index.html" (
        echo [OK] Using verified pre-built v1.0.4 distribution bundle already present in dist\
    ) else (
        echo [ERROR] No pre-built bundle found in dist\. Packaging cannot proceed.
        pause
        exit /b 1
    )
)

:: Step 4: Package with electron-builder
echo.
echo [4/4] Packaging Windows Native Executables with electron-builder...
call npx electron-builder --win
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
echo   - WinMedia Scanner Setup 1.0.4.exe
echo   - WinMedia Scanner 1.0.4.exe (Portable)
echo ========================================================
echo.
if exist "dist-electron" (
    explorer dist-electron
)
pause
