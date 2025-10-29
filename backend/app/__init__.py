from flask import Flask, send_from_directory, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_restful import Api
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt

from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
bcrypt = Bcrypt()


def create_app():
    app = Flask(__name__)
    
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///medical_app.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False
    

    
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)
    
    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return {'error': 'Token has expired'}, 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return {'error': 'Invalid token'}, 422
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return {'error': 'Authorization token required'}, 401

    
    # Enable CORS for frontend integration
    CORS(app, 
         origins=['http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:3000'],
         supports_credentials=True,
         allow_headers=['Content-Type', 'Authorization', 'Accept'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
    
    api = Api(app)
    
    # Register API routes
    from app.views.api import register_routes
    from app.views.auth import register_auth_routes
    from app.views.documents import register_document_routes
    from app.views.reports import register_report_routes
    register_routes(api)
    register_auth_routes(api)
    register_document_routes(api)
    register_report_routes(api)
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        return {'status': 'healthy', 'message': 'Medical Health Prediction System is running'}
    
    return app