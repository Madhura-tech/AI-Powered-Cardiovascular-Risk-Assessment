import os
import uuid
from werkzeug.utils import secure_filename
from PIL import Image
import mimetypes

ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_file_size(file):
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    return size <= MAX_FILE_SIZE

def generate_unique_filename(filename):
    ext = filename.rsplit('.', 1)[1].lower()
    unique_id = str(uuid.uuid4())
    return f"{unique_id}.{ext}"

def save_uploaded_file(file, upload_folder):
    if not file or file.filename == '':
        return None, "No file selected"
    
    if not allowed_file(file.filename):
        return None, "File type not allowed"
    
    if not validate_file_size(file):
        return None, "File size too large"
    
    filename = generate_unique_filename(file.filename)
    filepath = os.path.join(upload_folder, filename)
    
    try:
        file.save(filepath)
        return filename, None
    except Exception as e:
        return None, f"Error saving file: {str(e)}"

def get_file_info(filepath):
    if not os.path.exists(filepath):
        return None
    
    stat = os.stat(filepath)
    mime_type, _ = mimetypes.guess_type(filepath)
    
    return {
        'size': stat.st_size,
        'mime_type': mime_type,
        'created': stat.st_ctime
    }