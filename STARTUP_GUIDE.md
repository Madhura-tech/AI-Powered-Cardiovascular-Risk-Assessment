# Quick Startup Guide

## Problem: CORS Error - Document Upload Not Working

The error you're seeing indicates the backend server is not running or not accessible from the frontend.

## Solution: Start Both Servers

### Option 1: Automatic Start (Recommended)
```bash
# Double-click this file or run in command prompt:
start_complete_system.bat
```

### Option 2: Manual Start
```bash
# Terminal 1 - Start Backend
cd backend
python run.py

# Terminal 2 - Start Frontend (in new terminal)
python start_frontend_server.py
```

### Option 3: Test Backend First
```bash
# Test if backend is working
python test_backend.py
```

## Expected Output

When both servers are running, you should see:

**Backend Terminal:**
```
* Running on all addresses (0.0.0.0)
* Running on http://127.0.0.1:5000
* Running on http://[::1]:5000
```

**Frontend Terminal:**
```
Frontend server running at:
http://localhost:8080
```

## Verify System is Working

1. Open browser to: http://localhost:8080
2. Register/Login to create account
3. Navigate to "Documents" section
4. Upload a medical document
5. System should extract data and predict risk

## Troubleshooting

### If Backend Won't Start:
```bash
cd backend
pip install -r requirements.txt
python run.py
```

### If CORS Errors Persist:
- Ensure backend is running on port 5000
- Check that frontend is accessing http://127.0.0.1:5000
- Verify no firewall is blocking the connection

### If Document Upload Fails:
- Check backend logs for errors
- Ensure uploads/documents folder exists
- Verify OCR dependencies are installed

## System URLs

- **Backend API**: http://127.0.0.1:5000
- **Frontend Web App**: http://localhost:8080
- **Health Check**: http://127.0.0.1:5000/health

## Next Steps

Once both servers are running:
1. Register a new account
2. Upload a medical document (PDF/image)
3. System will extract medical parameters
4. Generate heart disease risk prediction
5. View results in dashboard