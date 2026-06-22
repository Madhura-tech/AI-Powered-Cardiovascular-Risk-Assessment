#!/usr/bin/env python3
"""
predict_from_file.py - Standalone OCR + Heart Risk Prediction

Usage:
    python predict_from_file.py path/to/file.pdf

Outputs debug files to uploads/documents/debug/ and prints final JSON result.
"""

import os
import sys
import json
import re
from datetime import datetime

# Configure Tesseract path
TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
POPPLER_PATH = None  # Set if needed for PDF conversion

# Import dependencies
try:
    import pytesseract
    from PIL import Image
    import cv2
    import numpy as np
    from pdf2image import convert_from_path
    import PyPDF2
    import joblib
except Exception as e:
    print("Missing dependency:", e)
    print("Install: pip install pytesseract pillow pdf2image opencv-python PyPDF2 joblib numpy")
    sys.exit(1)

if TESSERACT_PATH and os.path.exists(TESSERACT_PATH):
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH

UPLOAD_DIR = os.path.join("uploads", "documents")
DEBUG_DIR = os.path.join(UPLOAD_DIR, "debug")
os.makedirs(DEBUG_DIR, exist_ok=True)

MODEL_PATH = os.path.join("data", "raw", "model_assets", "final_risk_model.joblib")
PIPELINE_PATH = os.path.join("data", "raw", "model_assets", "full_prediction_pipeline.joblib")

# OCR functions
def pdf_to_images(pdf_path, dpi=300):
    pages = convert_from_path(pdf_path, dpi=dpi, poppler_path=POPPLER_PATH) if POPPLER_PATH else convert_from_path(pdf_path, dpi=dpi)
    out = []
    for i, page in enumerate(pages):
        out_path = os.path.join(UPLOAD_DIR, f"__tmp_page_{i}.jpg")
        page.save(out_path, "JPEG")
        out.append(out_path)
    return out

def deskew_image(img):
    try:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        coords = np.column_stack(np.where(gray < 255))
        if len(coords) < 10:
            return img
        angle = cv2.minAreaRect(coords)[-1]
        angle = -(90 + angle) if angle < -45 else -angle
        (h, w) = img.shape[:2]
        M = cv2.getRotationMatrix2D((w//2, h//2), angle, 1.0)
        return cv2.warpAffine(img, M, (w, h))
    except:
        return img

def preprocess_for_ocr(path):
    img = cv2.imread(path)
    if img is None:
        raise RuntimeError("Could not read image: " + path)
    img = deskew_image(img)
    h, w = img.shape[:2]
    if max(h, w) < 1600:
        img = cv2.resize(img, None, fx=1.6, fy=1.6, interpolation=cv2.INTER_CUBIC)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.bilateralFilter(gray, 9, 75, 75)
    kernel = np.array([[0,-1,0],[-1,5,-1],[0,-1,0]])
    gray = cv2.filter2D(gray, -1, kernel)
    try:
        th = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 9)
    except:
        _, th = cv2.threshold(gray, 128, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
    return th

def tesseract_extract(np_image):
    pil = Image.fromarray(np_image)
    config = "--oem 3 --psm 3 -c preserve_interword_spaces=1"
    text = pytesseract.image_to_string(pil, config=config)
    data = pytesseract.image_to_data(pil, config=config, output_type=pytesseract.Output.DICT)
    tokens = []
    for i, t in enumerate(data.get("text", [])):
        if t and t.strip():
            try:
                conf = float(data.get("conf", [None])[i])
            except:
                conf = None
            tokens.append({"text": t.strip(), "conf": conf})
    return text, tokens

def universal_extract(file_path):
    ext = file_path.lower().split(".")[-1]
    if ext == "pdf":
        try:
            with open(file_path, "rb") as f:
                pdf = PyPDF2.PdfReader(f)
                extracted = ""
                for p in pdf.pages:
                    extracted += (p.extract_text() or "") + "\n"
            if extracted.strip():
                return {"text": extracted, "tokens": []}
        except:
            pass
        pages = pdf_to_images(file_path)
        all_text, all_tokens = "", []
        for p in pages:
            im = preprocess_for_ocr(p)
            text, tokens = tesseract_extract(im)
            all_text += text + "\n"
            all_tokens.extend(tokens)
        return {"text": all_text, "tokens": all_tokens}
    else:
        im = preprocess_for_ocr(file_path)
        text, tokens = tesseract_extract(im)
        return {"text": text, "tokens": tokens}

# Detection
NON_HEART_KEYWORDS = ["semen", "urine", "cbc", "thyroid", "x-ray", "xray", "radiology", "ct scan", "mri", "sputum", "smear", "histopath", "biopsy", "microbiology"]
HEART_KEYWORDS = {"blood pressure": 3, "bp": 2, "cholesterol": 3, "ecg": 3, "heart rate": 3, "bpm": 2, "angina":3, "chest pain":3, "st depression":3, "thalach":3, "age":1, "sex":1, "gender":1, "fbs":2, "fasting blood sugar":2, "oldpeak":2}

def is_heart_report(text, min_score=4):
    if not text or len(text.strip()) < 20:
        return False, {"score":0,"reason":"empty"}
    t = text.lower()
    for bad in NON_HEART_KEYWORDS:
        if re.search(r"\b" + re.escape(bad) + r"\b", t):
            return False, {"score":0,"reason":"blacklist", "matched": bad}
    score = 0
    hits = []
    for k,w in HEART_KEYWORDS.items():
        if re.search(r"\b"+re.escape(k)+r"\b", t):
            score += w
            hits.append(k)
    if re.search(r"\b\d{2,3}\s*(bpm|beats per minute)\b", t):
        score += 2
    return (score >= min_score, {"score":score,"hits":hits})

# Parser
def parse_medical_data(text):
    parsed = {'name':None, 'age':None, 'sex':None, 'trestbps':None, 'chol':None, 'fbs':None, 'restecg':None, 'thalach':None, 'exang':None, 'oldpeak':None, 'slope':None, 'ca':None, 'thal':None}
    if not text:
        return parsed
    t, tl = text, text.lower()
    
    # AGE/SEX combined
    m = re.search(r'age/sex[:\s]*([0-9]{1,3})\s*(?:yrs|years)?\s*[/\-\\]\s*(male|female|m|f)', tl)
    if m:
        parsed['age'] = int(m.group(1))
        parsed['sex'] = 1 if m.group(2).startswith('m') else 0
    
    if parsed['age'] is None:
        m = re.search(r'\bage[:\s]*([0-9]{1,3})\b', tl)
        if m:
            parsed['age'] = int(m.group(1))
    
    if parsed['sex'] is None:
        m = re.search(r'\b(sex|gender)[:\s]*(male|female|m|f)\b', tl)
        if m:
            parsed['sex'] = 1 if m.group(2).startswith('m') else 0
    
    # Name
    m = re.search(r'name\s*[:\-]\s*(.+?)(?:\n|$)', t, re.I)
    if m:
        val = re.split(r'\b(ref by|date|age/sex|age|mrn)\b', m.group(1).strip(), flags=re.I)[0].strip()
        if val:
            parsed['name'] = val
    
    # BP
    m = re.search(r'\b(?:blood pressure|bp)[:\s]*([0-9]{2,3})', tl)
    if m:
        parsed['trestbps'] = int(m.group(1))
    
    # Cholesterol
    m = re.search(r'\b(?:cholesterol|chol)[:\s]*([0-9]{2,3})\b', tl)
    if m:
        parsed['chol'] = int(m.group(1))
    
    # FBS
    m = re.search(r'(?:fasting .* sugar|fbs)[:\s]*([0-9]{2,3})', tl)
    if m:
        parsed['fbs'] = 1 if int(m.group(1)) > 120 else 0
    
    # Heart rate
    m = re.search(r'(?:max heart rate|maxhr|thalach|heart rate|hr)[:\s]*([0-9]{2,3})', tl)
    if m:
        parsed['thalach'] = int(m.group(1))
    
    # ECG
    m = re.search(r'\b(ecg|resting ecg)[:\s]*(normal|abnormal|lvh)', tl)
    if m:
        parsed['restecg'] = 0 if 'normal' in m.group(2) else 1
    
    # Exercise angina
    m = re.search(r'(exercise.*angina|exang)[:\s]*(yes|no)', tl)
    if m:
        parsed['exang'] = 1 if m.group(2).startswith('y') else 0
    
    # ST depression
    m = re.search(r'\b(?:st[-\s]*depress|oldpeak)[:\s]*([0-9.]+)', tl)
    if m:
        try:
            parsed['oldpeak'] = float(m.group(1))
        except:
            pass
    
    return parsed

# Prediction
_loaded_model = None
try:
    if os.path.exists(MODEL_PATH):
        _loaded_model = joblib.load(MODEL_PATH)
except:
    pass

def heuristic_risk(parsed):
    score = 0.0
    age = parsed.get('age') or 0
    if age >= 65: score += 2
    elif age >= 50: score += 1
    bp = parsed.get('trestbps') or 0
    if bp >= 160: score += 2
    elif bp >= 140: score += 1
    chol = parsed.get('chol') or 0
    if chol >= 280: score += 2
    elif chol >= 240: score += 1
    if parsed.get('fbs') == 1: score += 1
    th = parsed.get('thalach') or 0
    if th < 50 or th > 180: score += 1
    oldp = parsed.get('oldpeak')
    if oldp:
        if oldp >= 2: score += 2
        elif oldp >= 1: score += 1
    if parsed.get('exang') == 1: score += 2
    ca = parsed.get('ca')
    if ca:
        if ca >= 2: score += 2
        elif ca == 1: score += 1
    
    if score >= 6:
        return {"risk": "HIGH", "confidence": round(min(0.9, 0.5 + score*0.05), 3)}
    if score >= 3:
        return {"risk": "MODERATE", "confidence": round(min(0.85, 0.35 + score*0.08), 3)}
    return {"risk": "LOW", "confidence": round(min(0.8, 0.55 + score*0.05), 3)}

def predict_from_parsed(parsed):
    try:
        if _loaded_model:
            import pandas as pd
            df = pd.DataFrame([parsed])
            if hasattr(_loaded_model, "predict_proba"):
                probs = _loaded_model.predict_proba(df)
                p = float(probs[0][1])
                label = "HIGH" if p > 0.66 else ("MODERATE" if p > 0.35 else "LOW")
                return {"risk": label, "confidence": round(p, 3), "source":"model"}
    except:
        pass
    return heuristic_risk(parsed)

# Main
def main(filepath):
    if not os.path.exists(filepath):
        print("File not found:", filepath)
        return
    ts = datetime.utcnow().strftime("%Y%m%dT%H%M%S")
    base = os.path.basename(filepath)
    debug_prefix = f"{ts}__{base}"
    
    try:
        ocr_res = universal_extract(filepath)
    except Exception as e:
        print("OCR extraction failed:", e)
        return
    
    text = ocr_res.get("text","") or ""
    tokens = ocr_res.get("tokens", [])
    
    # Save OCR debug
    try:
        open(os.path.join(DEBUG_DIR, debug_prefix + ".ocr.txt"), "w", encoding="utf8").write(text)
        open(os.path.join(DEBUG_DIR, debug_prefix + ".tokens.json"), "w", encoding="utf8").write(json.dumps(tokens, indent=2))
    except:
        pass
    
    is_heart, diag = is_heart_report(text, min_score=4)
    if not is_heart:
        out = {"ok": False, "error":"not_heart_report", "diagnostic": diag, "text_preview": text[:800]}
        print(json.dumps(out, indent=2))
        return
    
    parsed = parse_medical_data(text)
    try:
        open(os.path.join(DEBUG_DIR, debug_prefix + ".parsed.json"), "w", encoding="utf8").write(json.dumps(parsed, indent=2))
    except:
        pass
    
    required = sum(1 for v in parsed.values() if v is not None)
    if required < 3:
        out = {"ok": False, "error":"insufficient_fields", "parsed": parsed, "text_preview": text[:500]}
        print(json.dumps(out, indent=2))
        return
    
    prediction = predict_from_parsed(parsed)
    out = {"ok": True, "file": filepath, "parsed": parsed, "prediction": prediction, "diagnostic": diag, "text_preview": text[:1000], "debug_files_prefix": debug_prefix}
    print(json.dumps(out, indent=2))
    
    try:
        open(os.path.join(DEBUG_DIR, debug_prefix + ".result.json"), "w", encoding="utf8").write(json.dumps(out, indent=2))
    except:
        pass

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python predict_from_file.py path/to/file.jpg")
        sys.exit(1)
    main(sys.argv[1])
