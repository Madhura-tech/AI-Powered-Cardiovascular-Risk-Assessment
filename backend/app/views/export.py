from flask import Blueprint, send_file, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from io import BytesIO
from datetime import datetime

export_bp = Blueprint('export', __name__)

@export_bp.route('/export/pdf/<int:prediction_id>', methods=['GET'])
@jwt_required()
def export_pdf(prediction_id):
    from app.models import Prediction
    pred = Prediction.query.get_or_404(prediction_id)
    
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    
    p.setFont("Helvetica-Bold", 20)
    p.drawString(100, 750, "Heart Disease Prediction Report")
    
    p.setFont("Helvetica", 12)
    p.drawString(100, 700, f"Patient: {pred.patient_name}")
    p.drawString(100, 680, f"Date: {pred.created_at.strftime('%Y-%m-%d')}")
    p.drawString(100, 660, f"Risk Level: {pred.risk_level}")
    p.drawString(100, 640, f"Confidence: {pred.confidence}%")
    
    p.showPage()
    p.save()
    
    buffer.seek(0)
    return send_file(buffer, mimetype='application/pdf', as_attachment=True, download_name=f'report_{prediction_id}.pdf')
