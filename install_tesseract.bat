@echo off
echo Installing Tesseract OCR for better document extraction...
echo.

REM Check if Tesseract is already installed
tesseract --version >nul 2>&1
if %errorlevel% == 0 (
    echo Tesseract OCR is already installed and available in PATH.
    echo.
    tesseract --version
    pause
    exit /b 0
)

REM Check if winget is available
winget --version >nul 2>&1
if %errorlevel% == 0 (
    echo Installing Tesseract OCR using winget...
    winget install --id UB-Mannheim.TesseractOCR
    if %errorlevel% == 0 (
        echo.
        echo Tesseract OCR installed successfully!
        echo Please restart your command prompt and run the backend server again.
        pause
        exit /b 0
    )
)

REM Fallback: Manual installation instructions
echo.
echo Automatic installation failed. Please install Tesseract OCR manually:
echo.
echo 1. Download Tesseract OCR from: https://github.com/UB-Mannheim/tesseract/wiki
echo 2. Run the installer (tesseract-ocr-w64-setup-v5.3.0.20221214.exe or similar)
echo 3. During installation, make sure to check "Add to PATH"
echo 4. Restart your command prompt
echo 5. Run the backend server again
echo.
echo Alternative: Install using chocolatey:
echo   choco install tesseract
echo.
pause