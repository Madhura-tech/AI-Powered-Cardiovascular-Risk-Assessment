from app import db
from datetime import datetime

class Prediction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    prediction_type = db.Column(db.String(50), nullable=False)
    input_data = db.Column(db.Text, nullable=False)
    result = db.Column(db.Text, nullable=False)
    confidence_score = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        import json
        
        # Parse JSON data
        try:
            input_data = json.loads(self.input_data) if self.input_data else {}
            result_data = json.loads(self.result) if self.result else {}
        except:
            input_data = {}
            result_data = {}
        
        return {
            'id': self.id,
            'user_id': self.user_id,
            'prediction_type': self.prediction_type,
            'input_data': input_data,
            'result': result_data,
            'confidence_score': self.confidence_score,
            'created_at': self.created_at.isoformat(),
            'patient_name': input_data.get('patient_name', 'Unknown Patient'),
            'risk_category': result_data.get('risk_category', 'Unknown'),
            'model_used': result_data.get('model_used', 'Unknown')
        }