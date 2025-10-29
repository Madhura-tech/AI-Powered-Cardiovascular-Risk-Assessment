# Heart Disease Prediction System

A complete AI-powered medical prediction system with web interface.

## Quick Start

### Option 1: Automatic Start
```bash
start_complete_system.bat
```

### Option 2: Manual Start
```bash
# Terminal 1 - Backend
cd backend
python run.py

# Terminal 2 - Frontend  
python start_frontend_server.py
```

## Access URLs

- **Backend API**: http://127.0.0.1:5000
- **Frontend Web App**: http://localhost:8080

## Features

- ✅ Heart disease risk prediction
- ✅ User authentication & profiles
- ✅ **Enhanced OCR processing** - Works with any medical image
- ✅ PDF report generation
- ✅ Analytics dashboard
- ✅ Multi-step prediction form
- ✅ **Smart parameter extraction** from medical documents
- ✅ **Fallback extraction** when OCR is unavailable

## System Requirements

- Python 3.8+
- Required packages: `pip install -r backend/requirements.txt`
- **Optional**: Tesseract OCR for enhanced document extraction
  - Run `install_tesseract.bat` for automatic installation
  - Or install manually from: https://github.com/UB-Mannheim/tesseract/wiki

## Project Structure

```
├── backend/          # Flask API server
├── frontend/         # Web interface
├── data/            # ML models & datasets
└── docs/            # Documentation
```

## Usage

1. Start both servers using the batch file
2. Open http://localhost:8080 in your browser
3. Register/login to access all features
4. Make predictions using the health check form
5. Upload medical documents for OCR processing
6. View analytics and download reports

System is ready for production use!