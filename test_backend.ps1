# Test backend OCR endpoint
Write-Host "Testing backend OCR endpoint..." -ForegroundColor Cyan

$imagePath = "C:\Users\gmadh\3rd sem project\R.jpeg"

if (-not (Test-Path $imagePath)) {
    Write-Host "ERROR: Image not found at $imagePath" -ForegroundColor Red
    exit 1
}

Write-Host "Uploading image to backend..." -ForegroundColor Yellow
curl.exe -X POST -F "file=@$imagePath" http://127.0.0.1:5000/ocr/extract_debug -o debug_response.json

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nBackend response saved to debug_response.json" -ForegroundColor Green
    Write-Host "`nResponse content:" -ForegroundColor Cyan
    Get-Content debug_response.json -Raw | ConvertFrom-Json | ConvertTo-Json -Depth 10
} else {
    Write-Host "ERROR: Failed to connect to backend" -ForegroundColor Red
    Write-Host "Make sure backend is running: cd backend && python run.py" -ForegroundColor Yellow
}
