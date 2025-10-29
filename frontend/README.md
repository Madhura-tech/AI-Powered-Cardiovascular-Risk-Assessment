# Medical Health Predictor - Frontend

## Overview
Responsive web interface for the Medical Health Predictor application with user authentication, health prediction forms, and document management.

## Features

### 🎨 Responsive Design
- Bootstrap 5 framework
- Mobile-first responsive design
- Consistent medical theme
- Accessible UI components

### 🔐 User Authentication
- Login/Registration forms
- JWT token management
- Role-based UI (Patient/Doctor)
- Profile management
- Form validation

### 📋 Health Prediction Forms
- Multi-step form with progress indicator
- Client-side validation
- Input helpers and tooltips
- Real-time form validation
- Prediction result visualization

### 📄 Document Management
- File upload with drag-and-drop
- Document listing and management
- File type validation
- Processing status tracking

## File Structure
```
frontend/
├── index.html          # Main HTML file
├── css/
│   └── style.css      # Custom styles
├── js/
│   └── app.js         # Main JavaScript application
└── images/            # Static images
```

## Setup Instructions

1. **Start Backend Server**
   ```bash
   cd backend
   python run.py
   ```

2. **Open Frontend**
   - Open `index.html` in a web browser
   - Or serve with a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   ```

3. **Access Application**
   - Frontend: http://localhost:8000
   - Backend API: http://localhost:5000

## Usage

### Authentication
1. **Register**: Create new account with username, email, password
2. **Login**: Access with email and password
3. **Profile**: Update user information

### Health Prediction
1. Navigate to "Health Check" section
2. Complete 3-step form:
   - Step 1: Basic information (age, sex)
   - Step 2: Symptoms and vitals
   - Step 3: Additional tests
3. Select prediction model
4. View results with risk categorization

### Document Management
1. Upload medical documents (PDF, JPG, PNG)
2. View document list with processing status
3. Delete documents as needed

## API Integration

The frontend integrates with the backend API:

- **Authentication**: `/auth/login`, `/auth/register`
- **Predictions**: `/api/predictions`
- **Documents**: `/api/documents/upload`, `/api/documents`
- **Profile**: `/auth/profile`

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Mobile Responsiveness

- Responsive navigation with collapsible menu
- Touch-friendly form controls
- Optimized layouts for mobile screens
- Accessible on tablets and smartphones

## Security Features

- JWT token storage and management
- Form validation and sanitization
- File type and size validation
- CSRF protection through API design