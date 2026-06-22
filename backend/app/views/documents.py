import os
import json
from flask import request, send_file, current_app, jsonify, make_response
from flask_restful import Resource
from flask_jwt_extended import jwt_required
from app import db
from app.models import MedicalDocument
from app.auth_utils import get_current_user
from app.file_utils import save_uploaded_file, get_file_info
from app.ocr_service import universal_ocr

class DocumentUpload(Resource):
    @jwt_required()
    def post(self):
        """Upload and process medical document"""
        user = get_current_user()
        
        if 'file' not in request.files:
            return {'error': 'No file provided'}, 400
        
        file = request.files['file']
        document_type = request.form.get('document_type', 'medical_report')
        
        # Save file
        upload_folder = os.path.join(current_app.root_path, '..', 'uploads', 'documents')
        os.makedirs(upload_folder, exist_ok=True)
        
        stored_filename, error = save_uploaded_file(file, upload_folder)
        if error:
            return {'error': error}, 400
        
        file_path = os.path.join(upload_folder, stored_filename)
        file_info = get_file_info(file_path)
        
        # Create document record
        document = MedicalDocument(
            user_id=user.id,
            original_filename=file.filename,
            stored_filename=stored_filename,
            file_path=file_path,
            file_size=file_info['size'],
            mime_type=file_info['mime_type'],
            document_type=document_type,
            processing_status='uploaded'
        )
        
        db.session.add(document)
        db.session.commit()
        
        # Process OCR asynchronously (simplified - in production use Celery)
        self._process_ocr(document)
        
        return {
            'document_id': document.id,
            'message': 'Document uploaded successfully',
            'processing_status': 'processing'
        }, 201
    
    def _process_ocr(self, document):
        """Process OCR for uploaded document"""
        try:
            print(f"\n{'='*60}")
            print(f"PROCESSING DOCUMENT {document.id}")
            print(f"File: {document.stored_filename}")
            print(f"Path: {document.file_path}")
            print(f"{'='*60}")
            
            # Use universal_ocr directly
            ocr_result = universal_ocr.extract(document.file_path)
            text = ocr_result.get('text', '')
            
            print(f"\n[OCR] Extracted {len(text)} characters")
            print(f"[OCR] Full text:\n{text}")
            print(f"\n{'='*60}")
            
            # Parse medical data
            from app.ocr_service import parse_medical_data
            parsed_data = parse_medical_data(text)
            
            print(f"\n{'='*60}")
            print(f"[RESULT] Parsed data: {parsed_data}")
            print(f"[RESULT] Fields found: {sum(1 for v in parsed_data.values() if v is not None)}/14")
            print(f"{'='*60}\n")
            
            # Store in database
            document.ocr_text = text
            document.parsed_data = json.dumps(parsed_data)
            document.confidence_score = 0.85
            document.processed = True
            document.processing_status = 'completed'
            
            db.session.commit()
            
        except Exception as e:
            print(f"\n!!! Document processing error: {str(e)}")
            import traceback
            traceback.print_exc()
            document.processing_status = 'failed'
            document.ocr_text = f"Processing error: {str(e)}"
            db.session.commit()

class DocumentList(Resource):
    @jwt_required()
    def get(self):
        """Get user's documents"""
        user = get_current_user()
        documents = MedicalDocument.query.filter_by(user_id=user.id).order_by(MedicalDocument.upload_date.desc()).all()
        
        return {
            'documents': [doc.to_dict() for doc in documents],
            'total': len(documents)
        }

class DocumentDetail(Resource):
    @jwt_required()
    def get(self, document_id):
        """Get document details including OCR results"""
        user = get_current_user()
        document = MedicalDocument.query.filter_by(id=document_id, user_id=user.id).first()
        
        if not document:
            return {'error': 'Document not found'}, 404
        
        result = document.to_dict()
        
        if document.ocr_text:
            result['ocr_text'] = document.ocr_text
        
        if document.parsed_data:
            try:
                parsed = json.loads(document.parsed_data)
                print(f"[DEBUG] Returning parsed_data for doc {document_id}: {parsed}")
                result['parsed_data'] = parsed
            except:
                result['parsed_data'] = {}
        
        return result
    
    @jwt_required()
    def delete(self, document_id):
        """Delete document"""
        user = get_current_user()
        document = MedicalDocument.query.filter_by(id=document_id, user_id=user.id).first()
        
        if not document:
            return {'error': 'Document not found'}, 404
        
        # Delete file
        try:
            if os.path.exists(document.file_path):
                os.remove(document.file_path)
        except:
            pass
        
        # Delete database record
        db.session.delete(document)
        db.session.commit()
        
        return {'message': 'Document deleted successfully'}

class DocumentDownload(Resource):
    @jwt_required()
    def get(self, document_id):
        """Download document file"""
        user = get_current_user()
        document = MedicalDocument.query.filter_by(id=document_id, user_id=user.id).first()
        
        if not document:
            return {'error': 'Document not found'}, 404
        
        if not os.path.exists(document.file_path):
            return {'error': 'File not found'}, 404
        
        return send_file(
            document.file_path,
            as_attachment=True,
            download_name=document.original_filename
        )

class DocumentPreview(Resource):
    @jwt_required()
    def get(self, document_id):
        """Get document preview/thumbnail"""
        user = get_current_user()
        document = MedicalDocument.query.filter_by(id=document_id, user_id=user.id).first()
        
        if not document:
            return {'error': 'Document not found'}, 404
        
        # For images, return the file directly
        if document.mime_type and document.mime_type.startswith('image/'):
            return send_file(document.file_path)
        
        # For PDFs, return first page as image (simplified)
        return {'message': 'Preview not available for this file type'}, 400

class DocumentOCR(Resource):
    @jwt_required()
    def post(self, document_id):
        """Process or re-process OCR for document"""
        user = get_current_user()
        document = MedicalDocument.query.filter_by(id=document_id, user_id=user.id).first()
        
        if not document:
            return {'error': 'Document not found'}, 404
        
        # Process OCR
        self._process_ocr(document)
        
        result = {
            'document_id': document.id,
            'processing_status': document.processing_status,
            'ocr_text': document.ocr_text or '',
            'confidence': document.confidence_score or 0.0
        }
        
        if document.parsed_data:
            try:
                result['parsed_data'] = json.loads(document.parsed_data)
            except:
                result['parsed_data'] = {}
        
        return result
    
    def _process_ocr(self, document):
        """Process OCR for document"""
        try:
            print(f"OCR endpoint processing document: {document.stored_filename}")
            file_ext = document.stored_filename.split('.')[-1].lower()
            print(f"File extension: {file_ext}")
            
            text, error = ocr_service.process_document(document.file_path, file_ext)
            print(f"OCR result - Text length: {len(text) if text else 0}, Error: {error}")
            
            if error:
                document.processing_status = 'failed'
                document.ocr_text = f"Error: {error}"
                print(f"OCR failed: {error}")
            else:
                parsed_data = ocr_service.parse_medical_data(text)
                print(f"Parsed data: {parsed_data}")
                
                ocr_result = ocr_service.create_ocr_result(text, parsed_data)
                
                document.ocr_text = text
                document.parsed_data = json.dumps(parsed_data)
                document.confidence_score = ocr_result['confidence']
                document.processed = True
                document.processing_status = 'completed'
                print(f"OCR endpoint processing completed successfully")
            
            db.session.commit()
        except Exception as e:
            print(f"OCR endpoint processing error: {str(e)}")
            import traceback
            traceback.print_exc()
            document.processing_status = 'failed'
            document.ocr_text = f"Processing error: {str(e)}"
            db.session.commit()

class OCRExtract(Resource):
    def post(self):
        """Extract text from uploaded document using UniversalOCR with heart report detection"""
        if 'file' not in request.files:
            return {"ok": False, "error": "no_file"}, 400

        f = request.files['file']
        from app.ocr_service import ocr_and_predict
        path = universal_ocr.save_file(f)
        result = ocr_and_predict(path)
        
        if not result.get("ok"):
            if result.get("error") == "not_heart_report":
                diagnostic = result.get("diagnostic", {})
                reason = diagnostic.get("reason", "")
                
                if reason == "blacklist_match":
                    matched = diagnostic.get("matched", "unknown")
                    return {
                        "ok": False,
                        "error": "not_heart_report",
                        "message": f"This appears to be a {matched.upper()} or imaging/lab report. We only accept cardiac reports containing BP, cholesterol, ECG or heart rate.",
                        "diagnostic": diagnostic
                    }, 422
                elif reason == "empty_or_too_short":
                    return {
                        "ok": False,
                        "error": "not_heart_report",
                        "message": "Document is too short or empty. Please upload a clearer PDF or image (scanned at ≥300 DPI).",
                        "diagnostic": diagnostic
                    }, 422
                else:
                    return {
                        "ok": False,
                        "error": "not_heart_report",
                        "message": "We couldn't find heart-related parameters (BP/Cholesterol/ECG). Please upload a heart-related medical report.",
                        "diagnostic": diagnostic,
                        "hint": "Upload a cardiac report containing: Blood Pressure, Cholesterol, ECG, Heart Rate, or Stress Test results."
                    }, 422
            return result, 500

        return result, 200

class OCRExtractDebug(Resource):
    def post(self):
        """Debug endpoint with verbose logging and file output"""
        if 'file' not in request.files:
            return {"ok": False, "error": "no_file"}, 400
        
        f = request.files['file']
        from app.ocr_service import ocr_and_predict_debug
        path = universal_ocr.save_file(f)
        result = ocr_and_predict_debug(path)
        
        return result, (200 if result.get("ok") else 422)

def register_document_routes(api):
    api.add_resource(DocumentUpload, '/api/documents/upload')
    api.add_resource(DocumentList, '/api/documents')
    api.add_resource(DocumentDetail, '/api/documents/<int:document_id>')
    api.add_resource(DocumentDownload, '/api/documents/<int:document_id>/download')
    api.add_resource(DocumentPreview, '/api/documents/<int:document_id>/preview')
    api.add_resource(DocumentOCR, '/api/documents/<int:document_id>/ocr')
    api.add_resource(OCRExtract, '/ocr/extract')
    api.add_resource(OCRExtractDebug, '/ocr/extract_debug')