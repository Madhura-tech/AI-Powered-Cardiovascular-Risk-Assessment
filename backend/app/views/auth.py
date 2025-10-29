from flask import request, jsonify
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User
from app.auth_utils import validate_email, validate_password, get_current_user, role_required

from datetime import datetime

class Register(Resource):
    
    def post(self):
        data = request.get_json()
        
        # Validation
        if not data or not data.get('email') or not data.get('password') or not data.get('username'):
            return {'error': 'Missing required fields'}, 400
        
        if not validate_email(data['email']):
            return {'error': 'Invalid email format'}, 400
        
        if not validate_password(data['password']):
            return {'error': 'Password must be at least 8 characters'}, 400
        
        # Check if user exists
        if User.query.filter_by(email=data['email']).first():
            return {'error': 'Email already registered'}, 400
        
        if User.query.filter_by(username=data['username']).first():
            return {'error': 'Username already taken'}, 400
        
        # Create user
        user = User(
            username=data['username'],
            email=data['email'],
            role=data.get('role', 'patient')
        )
        user.set_password(data['password'])
        user.generate_verification_token()
        
        db.session.add(user)
        db.session.commit()
        
        # Email verification disabled for now
        
        return {
            'message': 'User registered successfully. Please check your email for verification.',
            'user_id': user.id
        }, 201

class Login(Resource):
    
    def post(self):
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return {'error': 'Email and password required'}, 400
        
        user = User.query.filter_by(email=data['email']).first()
        
        if not user:
            return {'error': 'Invalid credentials'}, 401
        
        # Check account lock
        if user.is_account_locked():
            return {'error': 'Account temporarily locked due to failed login attempts'}, 423
        
        # Check password
        if not user.check_password(data['password']):
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 5:
                user.lock_account()
            db.session.commit()
            return {'error': 'Invalid credentials'}, 401
        
        # Reset failed attempts on successful login
        user.failed_login_attempts = 0
        user.account_locked_until = None
        db.session.commit()
        
        token = user.get_token()
        
        return {
            'access_token': token,
            'user': user.to_dict()
        }

class VerifyEmail(Resource):
    def post(self):
        data = request.get_json()
        token = data.get('token')
        
        if not token:
            return {'error': 'Verification token required'}, 400
        
        user = User.query.filter_by(verification_token=token).first()
        
        if not user:
            return {'error': 'Invalid verification token'}, 400
        
        user.is_verified = True
        user.verification_token = None
        db.session.commit()
        
        return {'message': 'Email verified successfully'}

class ForgotPassword(Resource):
    
    def post(self):
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return {'error': 'Email required'}, 400
        
        user = User.query.filter_by(email=email).first()
        
        if user:
            user.generate_reset_token()
            db.session.commit()
            # Password reset email disabled for now
        
        # Always return success to prevent email enumeration
        return {'message': 'If email exists, password reset instructions have been sent'}

class ResetPassword(Resource):
    def post(self):
        data = request.get_json()
        token = data.get('token')
        new_password = data.get('password')
        
        if not token or not new_password:
            return {'error': 'Token and new password required'}, 400
        
        if not validate_password(new_password):
            return {'error': 'Password must be at least 8 characters'}, 400
        
        user = User.query.filter_by(reset_token=token).first()
        
        if not user or not user.reset_token_expires or user.reset_token_expires < datetime.utcnow():
            return {'error': 'Invalid or expired reset token'}, 400
        
        user.set_password(new_password)
        user.reset_token = None
        user.reset_token_expires = None
        db.session.commit()
        
        return {'message': 'Password reset successfully'}

class Profile(Resource):
    @jwt_required()
    def get(self):
        user = get_current_user()
        return user.to_dict()
    
    @jwt_required()
    def put(self):
        user = get_current_user()
        data = request.get_json()
        
        if 'username' in data:
            if User.query.filter_by(username=data['username']).filter(User.id != user.id).first():
                return {'error': 'Username already taken'}, 400
            user.username = data['username']
        
        if 'email' in data:
            if not validate_email(data['email']):
                return {'error': 'Invalid email format'}, 400
            if User.query.filter_by(email=data['email']).filter(User.id != user.id).first():
                return {'error': 'Email already registered'}, 400
            user.email = data['email']
            user.is_verified = False
            user.generate_verification_token()
            # Email verification disabled for now
        
        db.session.commit()
        return user.to_dict()

class DoctorDashboard(Resource):
    @role_required('doctor')
    def get(self):
        return {'message': 'Doctor dashboard access granted', 'role': 'doctor'}

class AdminDashboard(Resource):
    @role_required('admin')
    def get(self):
        users = User.query.all()
        return {
            'message': 'Admin dashboard access granted',
            'total_users': len(users),
            'users': [user.to_dict() for user in users]
        }

def register_auth_routes(api):
    api.add_resource(Register, '/auth/register')
    api.add_resource(Login, '/auth/login')
    api.add_resource(VerifyEmail, '/auth/verify-email')
    api.add_resource(ForgotPassword, '/auth/forgot-password')
    api.add_resource(ResetPassword, '/auth/reset-password')
    api.add_resource(Profile, '/auth/profile')
    api.add_resource(DoctorDashboard, '/dashboard/doctor')
    api.add_resource(AdminDashboard, '/dashboard/admin')