@echo off
color 0A
echo ========================================
echo  Heart Disease Prediction System
echo  Tesseract OCR Installation Tool
echo ========================================
echo.

REM Check if Tesseract is already installed
echo [1/4] Checking existing Tesseract installation...
tesseract --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✓ Tesseract OCR is already installed and available in PATH.
    echo.
    echo Current version:
    tesseract --version
    echo.
    echo ✓ OCR extraction should work properly now!
    echo.
    echo Testing OCR service...
    cd backend
    python ocr_diagnostic.py
    pause
    exit /b 0
)

echo ✗ Tesseract not found in PATH
echo.

REM Check if winget is available
echo [2/4] Trying automatic installation with winget...
winget --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✓ Windows Package Manager found
    echo Installing Tesseract OCR...
    winget install --id UB-Mannheim.TesseractOCR --silent
    if %errorlevel% == 0 (
        echo.
        echo ✓ Tesseract OCR installed successfully!
        echo.
        echo [3/4] Testing installation...
        REM Refresh PATH
        call refreshenv >nul 2>&1
        tesseract --version >nul 2>&1
        if %errorlevel% == 0 (
            echo ✓ Installation verified!
            echo.
            echo [4/4] Testing OCR service...
            cd backend
            python ocr_diagnostic.py
        ) else (
            echo ⚠ Installation completed but PATH not updated
            echo Please restart your command prompt and run the backend server again.
        )
        pause
        exit /b 0
    ) else (
        echo ✗ Winget installation failed
    )
) else (
    echo ✗ Windows Package Manager not available
)

echo.
echo [3/4] Trying chocolatey installation...
choco --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✓ Chocolatey found
    echo Installing Tesseract OCR...
    choco install tesseract -y
    if %errorlevel% == 0 (
        echo ✓ Tesseract installed via Chocolatey!
        echo Please restart your command prompt and run the backend server again.
        pause
        exit /b 0
    )
) else (
    echo ✗ Chocolatey not available
)

REM Manual installation instructions
echo.
echo ========================================
echo  MANUAL INSTALLATION REQUIRED
echo ========================================
echo.
echo Automatic installation failed. Please install Tesseract OCR manually:
echo.
echo OPTION 1 - Direct Download (Recommended):
echo 1. Visit: https://github.com/UB-Mannheim/tesseract/wiki
echo 2. Download: tesseract-ocr-w64-setup-v5.3.0.20221214.exe (or latest)
echo 3. Run the installer as Administrator
echo 4. ✓ IMPORTANT: Check "Add to PATH" during installation
echo 5. Restart your command prompt
echo 6. Run: start_complete_system.bat
echo.
echo OPTION 2 - Install Windows Package Manager:
echo 1. Install from Microsoft Store: "App Installer"
echo 2. Restart command prompt
echo 3. Run this script again
echo.
echo OPTION 3 - Install Chocolatey:
echo 1. Visit: https://chocolatey.org/install
echo 2. Follow installation instructions
echo 3. Run this script again
echo.
echo ========================================
echo  CURRENT STATUS
echo ========================================
echo.
echo ⚠ OCR will use fallback extraction mode
echo ✓ System will still work for predictions
echo ✓ Enhanced pattern matching active
echo ⚠ For best accuracy, install Tesseract
echo.
echo Testing current OCR capabilities...
cd backend
python ocr_diagnostic.py
echo.
pause