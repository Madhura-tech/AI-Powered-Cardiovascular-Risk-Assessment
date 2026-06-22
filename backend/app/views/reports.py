from flask import request, send_file, jsonify, make_response, Response
from flask_restful import Resource
from flask_jwt_extended import jwt_required
from app import db
from app.models import User, Prediction
from app.auth_utils import get_current_user
from app.report_service import report_service
import json
from datetime import datetime, timedelta

class PredictionReport(Resource):
    @jwt_required()
    def get(self, prediction_id):
        """Generate PDF report for a specific prediction"""
        user = get_current_user()
        prediction = Prediction.query.filter_by(id=prediction_id, user_id=user.id).first()
        
        if not prediction:
            return {'error': 'Prediction not found'}, 404
        
        try:
            pdf_buffer = report_service.generate_prediction_report(user, prediction)
            
            return send_file(
                pdf_buffer,
                as_attachment=True,
                download_name=f'health_report_{user.username}_{prediction_id}.pdf',
                mimetype='application/pdf'
            )
        except Exception as e:
            return {'error': f'Report generation failed: {str(e)}'}, 500

class PredictionHistory(Resource):
    @jwt_required()
    def get(self):
        """Get prediction history with filtering and pagination"""
        user = get_current_user()
        
        # Query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        risk_filter = request.args.get('risk_level')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        # Build query
        query = Prediction.query.filter_by(user_id=user.id)
        
        # Apply filters
        if date_from:
            try:
                date_from = datetime.strptime(date_from, '%Y-%m-%d')
                query = query.filter(Prediction.created_at >= date_from)
            except ValueError:
                pass
        
        if date_to:
            try:
                date_to = datetime.strptime(date_to, '%Y-%m-%d')
                query = query.filter(Prediction.created_at <= date_to)
            except ValueError:
                pass
        
        # Get paginated results
        predictions = query.order_by(Prediction.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # Filter by risk level if specified
        filtered_predictions = []
        for pred in predictions.items:
            pred_dict = pred.to_dict()
            try:
                result = json.loads(pred.result)
                pred_dict['risk_category'] = result.get('risk_category')
                pred_dict['model_used'] = result.get('model_used')
                
                if not risk_filter or result.get('risk_category', '').lower() == risk_filter.lower():
                    filtered_predictions.append(pred_dict)
            except:
                filtered_predictions.append(pred_dict)
        
        return {
            'predictions': filtered_predictions,
            'pagination': {
                'page': predictions.page,
                'pages': predictions.pages,
                'per_page': predictions.per_page,
                'total': predictions.total,
                'has_next': predictions.has_next,
                'has_prev': predictions.has_prev
            }
        }

class PredictionComparison(Resource):
    @jwt_required()
    def post(self):
        """Compare multiple predictions"""
        user = get_current_user()
        data = request.get_json()
        
        prediction_ids = data.get('prediction_ids', [])
        if len(prediction_ids) < 2:
            return {'error': 'At least 2 predictions required for comparison'}, 400
        
        predictions = Prediction.query.filter(
            Prediction.id.in_(prediction_ids),
            Prediction.user_id == user.id
        ).all()
        
        if len(predictions) != len(prediction_ids):
            return {'error': 'Some predictions not found'}, 404
        
        comparison_data = []
        for pred in predictions:
            try:
                result = json.loads(pred.result)
                input_data = json.loads(pred.input_data)
                
                comparison_data.append({
                    'id': pred.id,
                    'date': pred.created_at.isoformat(),
                    'risk_category': result.get('risk_category'),
                    'confidence_score': result.get('confidence_score'),
                    'model_used': result.get('model_used'),
                    'input_data': input_data
                })
            except:
                comparison_data.append({
                    'id': pred.id,
                    'date': pred.created_at.isoformat(),
                    'error': 'Failed to parse prediction data'
                })
        
        return {
            'comparison': comparison_data,
            'summary': self._generate_comparison_summary(comparison_data)
        }
    
    def _generate_comparison_summary(self, data):
        """Generate summary statistics for comparison"""
        valid_data = [d for d in data if 'error' not in d]
        
        if not valid_data:
            return {'error': 'No valid data for comparison'}
        
        risk_counts = {'Low': 0, 'Medium': 0, 'High': 0}
        confidence_scores = []
        
        for item in valid_data:
            risk = item.get('risk_category')
            if risk in risk_counts:
                risk_counts[risk] += 1
            
            confidence = item.get('confidence_score')
            if confidence:
                confidence_scores.append(confidence)
        
        avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
        
        return {
            'total_predictions': len(valid_data),
            'risk_distribution': risk_counts,
            'average_confidence': round(avg_confidence, 3),
            'date_range': {
                'earliest': min(d['date'] for d in valid_data),
                'latest': max(d['date'] for d in valid_data)
            }
        }

class PredictionExport(Resource):
    @jwt_required()
    def get(self):
        """Export prediction history as CSV"""
        user = get_current_user()
        predictions = Prediction.query.filter_by(user_id=user.id).order_by(Prediction.created_at.desc()).all()
        
        # Generate CSV content
        csv_content = "Date,Risk Level,Confidence,Model,Age,Sex,Chest Pain,Blood Pressure,Cholesterol,Fasting Blood Sugar,ECG,Max Heart Rate\n"
        
        for pred in predictions:
            try:
                result = json.loads(pred.result)
                input_data = json.loads(pred.input_data)
                
                row = [
                    pred.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    result.get('risk_category', ''),
                    str(result.get('confidence_score', '')),
                    result.get('model_used', ''),
                    str(input_data.get('age', '')),
                    str(input_data.get('sex', '')),
                    str(input_data.get('cp', '')),
                    str(input_data.get('trestbps', '')),
                    str(input_data.get('chol', '')),
                    str(input_data.get('fbs', '')),
                    str(input_data.get('restecg', '')),
                    str(input_data.get('thalach', ''))
                ]
                csv_content += ','.join(row) + '\n'
            except:
                continue
        
        # Create response
        return Response(
            csv_content,
            mimetype='text/csv',
            headers={'Content-Disposition': f'attachment; filename=health_predictions_{user.username}.csv'}
        )

class GenerateReport(Resource):
    @jwt_required()
    def post(self):
        """Generate PDF report from prediction data"""
        user = get_current_user()
        data = request.get_json()
        
        if not data:
            return {'error': 'No data provided'}, 400
        
        try:
            # Create a temporary prediction object for report generation
            class TempPrediction:
                def __init__(self, user_id, input_data, result):
                    self.id = 9999  # Temporary ID
                    self.user_id = user_id
                    self.input_data = input_data
                    self.result = result
                    self.created_at = datetime.utcnow()
            
            temp_prediction = TempPrediction(
                user_id=user.id,
                input_data=json.dumps(data.get('input_data', {})),
                result=json.dumps(data.get('prediction_result', {}))
            )
            
            pdf_buffer = report_service.generate_prediction_report(user, temp_prediction)
            
            return send_file(
                pdf_buffer,
                as_attachment=True,
                download_name=f'health_report_{user.username}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf',
                mimetype='application/pdf'
            )
        except Exception as e:
            return {'error': f'Report generation failed: {str(e)}'}, 500

class PredictionShare(Resource):
    @jwt_required()
    def post(self, prediction_id):
        """Generate shareable link for prediction"""
        user = get_current_user()
        prediction = Prediction.query.filter_by(id=prediction_id, user_id=user.id).first()
        
        if not prediction:
            return {'error': 'Prediction not found'}, 404
        
        # Generate share token (simplified - in production use proper token generation)
        import secrets
        share_token = secrets.token_urlsafe(32)
        
        # In a real implementation, you'd store this token in the database
        # For now, we'll return a mock shareable link
        share_link = f"https://medpredict.app/shared/{share_token}"
        
        return {
            'share_link': share_link,
            'expires_at': (datetime.utcnow() + timedelta(days=7)).isoformat(),
            'message': 'Share link generated successfully'
        }

def register_report_routes(api):
    api.add_resource(PredictionReport, '/api/predictions/<int:prediction_id>/report')
    api.add_resource(GenerateReport, '/api/reports/generate')
    api.add_resource(PredictionHistory, '/api/predictions/history')
    api.add_resource(PredictionComparison, '/api/predictions/compare')
    api.add_resource(PredictionExport, '/api/predictions/export')
    api.add_resource(PredictionShare, '/api/predictions/<int:prediction_id>/share')