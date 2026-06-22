from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
import json

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/analytics/history-charts', methods=['GET'])
@jwt_required()
def get_history_charts():
    from app.models import Prediction
    user_id = get_jwt_identity()
    predictions = Prediction.query.filter_by(user_id=user_id).order_by(Prediction.created_at).all()
    
    if not predictions:
        return jsonify({'error': 'No prediction history'}), 404
    
    try:
        latest = predictions[-1]
        inp = json.loads(latest.input_data) if isinstance(latest.input_data, str) else latest.input_data
        res = json.loads(latest.result) if isinstance(latest.result, str) else latest.result
        
        return jsonify({
            'risk_gauge': {'value': (latest.confidence_score or 0.5) * 100, 'category': res.get('risk_category', 'Unknown')},
            'radar_data': {'age': inp.get('age', 50), 'bp': inp.get('trestbps', 120) / 2, 'cholesterol': inp.get('chol', 200) / 4, 'heart_rate': inp.get('thalach', 150) / 2, 'glucose': inp.get('fbs', 0) * 100},
            'bp_hr_trend': [{'date': p.created_at.strftime('%Y-%m-%d'), 'bp': json.loads(p.input_data).get('trestbps', 120), 'hr': json.loads(p.input_data).get('thalach', 150)} for p in predictions],
            'prediction_distribution': {'low': sum(1 for p in predictions if 'low' in (json.loads(p.result).get('risk_category', 'low') or 'low').lower()), 'moderate': sum(1 for p in predictions if 'moderate' in (json.loads(p.result).get('risk_category', '') or '').lower() or 'medium' in (json.loads(p.result).get('risk_category', '') or '').lower()), 'high': sum(1 for p in predictions if 'high' in (json.loads(p.result).get('risk_category', '') or '').lower())}
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/analytics/compare', methods=['GET'])
@jwt_required()
def compare_population():
    from app.models import Prediction, User
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    user_pred = Prediction.query.filter_by(user_id=user_id).order_by(Prediction.created_at.desc()).first()
    
    if not user_pred:
        return jsonify({'error': 'No predictions found'}), 404
    
    avg_risk = Prediction.query.with_entities(func.avg(Prediction.confidence_score)).scalar() or 0
    
    lower_count = Prediction.query.filter(Prediction.confidence_score < user_pred.confidence_score).count()
    total_count = Prediction.query.count()
    percentile = (lower_count / total_count * 100) if total_count > 0 else 0
    
    return jsonify({
        'your_risk': user_pred.confidence_score,
        'population_avg': round(avg_risk, 2),
        'percentile': round(percentile, 1),
        'status': 'below_average' if user_pred.confidence_score < avg_risk else 'above_average'
    })
