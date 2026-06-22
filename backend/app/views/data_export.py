from flask import Blueprint, Response, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import csv
from io import StringIO

data_export_bp = Blueprint('data_export', __name__)

@data_export_bp.route('/export/csv', methods=['GET'])
@jwt_required()
def export_csv():
    from app.models import Prediction
    user_id = get_jwt_identity()
    predictions = Prediction.query.filter_by(user_id=user_id).all()
    
    si = StringIO()
    writer = csv.writer(si)
    writer.writerow(['Date', 'Patient', 'Age', 'Risk Level', 'Confidence', 'Heart Rate', 'BP'])
    
    for p in predictions:
        writer.writerow([
            p.created_at.strftime('%Y-%m-%d'),
            p.patient_name,
            p.age,
            p.risk_level,
            p.confidence,
            p.thalach,
            p.trestbps
        ])
    
    output = si.getvalue()
    return Response(output, mimetype='text/csv', headers={'Content-Disposition': 'attachment;filename=predictions.csv'})

@data_export_bp.route('/export/json', methods=['GET'])
@jwt_required()
def export_json():
    from app.models import Prediction
    user_id = get_jwt_identity()
    predictions = Prediction.query.filter_by(user_id=user_id).all()
    
    data = [{
        'date': p.created_at.isoformat(),
        'patient': p.patient_name,
        'risk': p.risk_level,
        'confidence': p.confidence
    } for p in predictions]
    
    return jsonify(data)
