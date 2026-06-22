from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_mail import Mail, Message

notify_bp = Blueprint('notify', __name__)
mail = Mail()

@notify_bp.route('/send-report', methods=['POST'])
@jwt_required()
def send_report():
    from app.models import User, Prediction
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    pred_id = request.json.get('prediction_id')
    
    msg = Message(
        'Your Health Report',
        sender='noreply@medpredict.com',
        recipients=[user.email]
    )
    msg.body = f"Your heart disease risk: {request.json.get('risk')}%\n\nView full report at: http://localhost:8080"
    
    try:
        mail.send(msg)
        return jsonify({'success': True})
    except:
        return jsonify({'success': False, 'error': 'Email not configured'}), 500
