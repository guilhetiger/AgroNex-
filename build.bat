@echo off
cls
echo ========================================
echo   AgroNex - Build Script
echo ========================================
echo.

:: Check if EAS is installed
eas --version >nul 2>&1
if errorlevel 1 (
  echo Installing EAS CLI...
  npm install -g eas-cli
)

:: Check login status
echo Checking login status...
eas whoami >nul 2>&1
if errorlevel 1 (
  echo.
  echo Not logged in. Opening login...
  eas login
) else (
  echo Already logged in.
)

echo.
echo Select what to build:
echo.
echo 1. Android APK (QR code to download)
echo 2. iOS TestFlight (macOS only)
echo 3. Both
echo.

set /p selection=Choose option (1-3):

if "%selection%"=="1" (
  echo.
  echo Building Android APK...
  eas build --platform android --profile preview
) else if "%selection%"=="2" (
  echo.
  echo Building iOS TestFlight...
  eas build --platform ios --profile preview
) else if "%selection%"=="3" (
  echo.
  echo Building both...
  eas build --platform android --profile preview
  eas build --platform ios --profile preview
) else (
  echo Invalid option
)

echo.
echo Build completed. Check QR codes at https://expo.dev/builds
pause
