from flask import jsonify, request
from flask_restful import Resource, Api
from flask_jwt_extended import jwt_required
from app import db
from app.models import User, Prediction
from app.ml_service import ml_service
from app.auth_utils import get_current_user, role_required
from datetime import datetime
import json

class HealthCheck(Resource):
    def get(self):
        return {
            'status': 'healthy',
            'message': 'Medical API is running',
            'version': '1.0.0'
        }

class Status(Resource):
    def get(self):
        try:
            db.session.execute('SELECT 1')
            db_status = 'connected'
        except:
            db_status = 'disconnected'
        
        return {
            'api_status': 'active',
            'database_status': db_status,
            'endpoints': [
                '/health',
                '/status',
                '/api/users',
                '/api/predictions',
                '/api/documents'
            ]
        }

class Users(Resource):
    def get(self):
        return {'message': 'Users endpoint - GET method'}
    
    def post(self):
        return {'message': 'Users endpoint - POST method'}

class Predictions(Resource):
    @jwt_required()
    def get(self):
        """Get prediction history for authenticated user"""
        user = get_current_user()
        predictions = Prediction.query.filter_by(user_id=user.id).order_by(Prediction.created_at.desc()).limit(10).all()
        total_count = Prediction.query.filter_by(user_id=user.id).count()
        return {
            'predictions': [p.to_dict() for p in predictions],
            'total': total_count
        }
    
    @jwt_required()
    def post(self):
        """Create new prediction for authenticated user"""
        try:
            user = get_current_user()
            data = request.get_json()
            if not data:
                return {'error': 'No data provided'}, 400
            
            # Extract prediction data and model selection
            model_name = data.get('model', 'random_forest')
            input_data = data.get('data', {})
            patient_name = data.get('patient_name', '')
            
            # Validate input data - all 13 features required
            required_fields = ['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal']
            for field in required_fields:
                if field not in input_data:
                    return {'error': f'Missing required field: {field}'}, 400
            
            # Add patient name to input data for storage
            input_data_with_name = {**input_data, 'patient_name': patient_name}
            
            # Make prediction (only with medical data)
            result = ml_service.predict(input_data, model_name)
            
            # Save prediction to database
            prediction = Prediction(
                user_id=user.id,
                prediction_type='heart_disease',
                input_data=json.dumps(input_data_with_name),
                result=json.dumps(result),
                confidence_score=result['confidence_score']
            )
            db.session.add(prediction)
            db.session.commit()
            
            return {
                'prediction_id': prediction.id,
                'result': result,
                'input_data': input_data
            }
            
        except ValueError as e:
            return {'error': str(e)}, 400
        except Exception as e:
            return {'error': 'Internal server error'}, 500

class PredictEndpoint(Resource):
    def post(self):
        """Direct prediction endpoint"""
        try:
            data = request.get_json()
            if not data:
                return {'error': 'No data provided'}, 400
            
            model_name = data.get('model', 'main_pipeline')
            input_data = data.get('data', {})
            
            # Validate all 13 features
            required_fields = ['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal']
            for field in required_fields:
                if field not in input_data:
                    return {'error': f'Missing required field: {field}'}, 400
            
            # Make prediction without saving to database
            result = ml_service.predict(input_data, model_name)
            
            return {
                'success': True,
                'result': result,
                'available_models': ml_service.get_available_models()
            }
            
        except ValueError as e:
            return {'error': str(e)}, 400
        except Exception as e:
            return {'error': f'Internal server error: {str(e)}'}, 500

class PredictionDetail(Resource):
    @jwt_required()
    def get(self, prediction_id):
        """Get specific prediction details"""
        user = get_current_user()
        prediction = Prediction.query.filter_by(id=prediction_id, user_id=user.id).first()
        
        if not prediction:
            return {'error': 'Prediction not found'}, 404
        
        return prediction.to_dict()
    
    @jwt_required()
    def delete(self, prediction_id):
        """Delete specific prediction"""
        user = get_current_user()
        prediction = Prediction.query.filter_by(id=prediction_id, user_id=user.id).first()
        
        if not prediction:
            return {'error': 'Prediction not found'}, 404
        
        db.session.delete(prediction)
        db.session.commit()
        
        return {'message': 'Prediction deleted successfully'}

class ModelInfo(Resource):
    def get(self):
        """Get available models information"""
        return {
            'available_models': ml_service.get_available_models(),
            'default_model': 'random_forest',
            'input_features': ['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal'],
            'risk_categories': ['Low', 'Medium', 'High']
        }



def register_routes(api):
    api.add_resource(HealthCheck, '/health')
    api.add_resource(Status, '/status')
    api.add_resource(Users, '/api/users')
    api.add_resource(Predictions, '/api/predictions')
    api.add_resource(PredictionDetail, '/api/predictions/<int:prediction_id>')
    api.add_resource(PredictEndpoint, '/predict')
    api.add_resource(ModelInfo, '/api/models')
