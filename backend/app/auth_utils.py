from functools import wraps
from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.models import User

def role_required(required_role):
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            claims = get_jwt()
            user_role = claims.get('role', 'patient')
            
            if required_role == 'admin' and user_role != 'admin':
                return {'error': 'Admin access required'}, 403
            elif required_role == 'doctor' and user_role not in ['doctor', 'admin']:
                return {'error': 'Doctor access required'}, 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def get_current_user():
    user_id = get_jwt_identity()
    return User.query.get(int(user_id))

def validate_email(email):
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    return len(password) >= 8