# Medical Backend API

## Setup Instructions

1. Create virtual environment:
```bash
python -m venv venv
venv\Scripts\activate  # Windows
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Initialize database:
```bash
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

4. Run the application:
```bash
python run.py
```

## API Endpoints

### Core Endpoints
- `GET /health` - Health check
- `GET /status` - System status
- `GET/POST /api/users` - User management
- `GET/POST /api/documents` - Document management

### Authentication Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/verify-email` - Email verification
- `POST /auth/forgot-password` - Password reset request
- `POST /auth/reset-password` - Password reset
- `GET/PUT /auth/profile` - User profile management

### Role-Based Dashboards
- `GET /dashboard/doctor` - Doctor dashboard (requires doctor role)
- `GET /dashboard/admin` - Admin dashboard (requires admin role)

### Document Management Endpoints (Authentication Required)
- `POST /api/documents/upload` - Upload medical documents
- `GET /api/documents` - List user documents
- `GET /api/documents/<id>` - Get document details with OCR results
- `DELETE /api/documents/<id>` - Delete document
- `GET /api/documents/<id>/download` - Download document file
- `GET /api/documents/<id>/preview` - Document preview

### ML Prediction Endpoints (Authentication Required)
- `POST /predict` - Direct prediction (no history storage)
- `GET/POST /api/predictions` - Prediction with history management
- `GET /api/models` - Available models information

### Sample Prediction Request
```json
{
  "data": {
    "age": 63,
    "sex": 1,
    "cp": 3,
    "trestbps": 145,
    "chol": 233,
    "fbs": 1,
    "restecg": 0,
    "thalach": 150
  },
  "model": "random_forest"
}
```

## Database Schema

- **User**: id, username, email, created_at
- **Prediction**: id, user_id, prediction_type, input_data, result, confidence_score, created_at
- **MedicalDocument**: id, user_id, filename, file_path, document_type, upload_date, processed