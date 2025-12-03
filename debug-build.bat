@echo off
echo ========================================
echo    DEBUG BUILD - KASIR POS SYSTEM
echo ========================================
echo.

echo [1/6] Killing existing processes...
taskkill /F /IM "Kasir*" >nul 2>&1

echo [2/6] Cleaning dist folder...
if exist dist rmdir /s /q dist

echo [3/6] Building React app...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: React build failed!
    pause
    exit /b 1
)

echo [4/6] Copying electron files...
copy "public\electron.js" "build\electron.js" /Y >nul
copy "public\preload.js" "build\preload.js" /Y >nul

echo [5/6] Building Electron app...
call npx electron-builder --win --dir
if %errorlevel% neq 0 (
    echo ERROR: Electron build failed!
    pause
    exit /b 1
)

echo [6/6] Checking files...
echo Checking if PrinterSettings exists in build...
if exist "build\static\js\main.*.js" (
    findstr /C:"PrinterSettings" "build\static\js\main.*.js" >nul
    if %errorlevel% equ 0 (
        echo ✅ PrinterSettings found in build
    ) else (
        echo ❌ PrinterSettings NOT found in build
    )
) else (
    echo ❌ Main JS file not found
)

echo.
echo ========================================
echo    BUILD COMPLETED!
echo ========================================
echo.
echo Executable: dist\win-unpacked\Kasir POS System.exe
echo.
echo Instructions:
echo 1. Run the application
echo 2. Go to Settings (gear icon in sidebar)
echo 3. Click "Printer" tab (first tab)
echo 4. Look for "Koneksi Printer" section
echo.
echo Press any key to run the application...
pause >nul

echo Starting Kasir POS System...
start "" "dist\win-unpacked\Kasir POS System.exe"
