@echo off
echo 🚀 Building Kasir POS System with Electron-Builder...
echo.

echo 📝 Step 1: Clean old builds...
if exist dist rmdir /s /q dist
if exist build rmdir /s /q build

echo 📦 Step 2: Building React app...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ React build failed!
    pause
    exit /b 1
)

echo 🔧 Step 3: Building with Electron-Builder (Windows)...
call npx electron-builder --win --dir
if %errorlevel% neq 0 (
    echo ❌ Electron-Builder failed!
    pause
    exit /b 1
)

echo ✅ Build completed successfully!
echo 📍 Executable location: dist\win-unpacked\Kasir POS System.exe
echo.
echo 🎉 You can now run the application without npm start!
echo 💡 To create portable exe: npm run dist-win
echo 💡 To create installer: Change target to "nsis" in package.json
echo 💡 To create dmg (Mac): npm run dist-mac
echo.
echo ⚠️  Note: There might be path-to-regexp warnings but the app builds successfully
pause
