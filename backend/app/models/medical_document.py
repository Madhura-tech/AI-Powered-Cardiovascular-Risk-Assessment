from app import db
from datetime import datetime

class MedicalDocument(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    stored_filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer)
    mime_type = db.Column(db.String(100))
    document_type = db.Column(db.String(50), nullable=False)
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)
    processed = db.Column(db.Boolean, default=False)
    ocr_text = db.Column(db.Text)
    parsed_data = db.Column(db.Text)  # JSON string
    processing_status = db.Column(db.String(50), default='pending')
    confidence_score = db.Column(db.Float)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'original_filename': self.original_filename,
            'stored_filename': self.stored_filename,
            'file_size': self.file_size,
            'mime_type': self.mime_type,
            'document_type': self.document_type,
            'upload_date': self.upload_date.isoformat(),
            'processed': self.processed,
            'processing_status': self.processing_status,
            'confidence_score': self.confidence_score,
            'has_ocr_text': bool(self.ocr_text)
        }