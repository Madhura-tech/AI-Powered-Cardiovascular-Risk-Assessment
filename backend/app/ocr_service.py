import os
import re
import cv2
import numpy as np
import pytesseract          # import first
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

from PIL import Image
from pdf2image import convert_from_path
import PyPDF2
import joblib
from datetime import datetime


UPLOAD_DIR = os.path.join("uploads", "documents")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ----------------------- Universal OCR -----------------------
class UniversalOCR:
    def __init__(self, poppler_path=None):
        self.poppler_path = poppler_path
    def save_file(self, file_storage):
        filename = file_storage.filename.replace(" ", "_")
        path = os.path.join(UPLOAD_DIR, filename)
        file_storage.save(path)
        return path

    def _pdf_to_images(self, pdf_path, dpi=300):
        if self.poppler_path:
            pages = convert_from_path(pdf_path, dpi=dpi, poppler_path=self.poppler_path)
        else:
            pages = convert_from_path(pdf_path, dpi=dpi)
        out_paths = []
        for i, page in enumerate(pages):
            temp = os.path.join(UPLOAD_DIR, f"page_{i}.jpg")
            page.save(temp, "JPEG")
            out_paths.append(temp)
        return out_paths

    def deskew(self, image):
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            coords = np.column_stack(np.where(gray < 255))
            if len(coords) < 10:
                return image
            angle = cv2.minAreaRect(coords)[-1]
            if angle < -45:
                angle = -(90 + angle)
            else:
                angle = -angle
            (h, w) = image.shape[:2]
            M = cv2.getRotationMatrix2D((w // 2, h // 2), angle, 1)
            return cv2.warpAffine(image, M, (w, h))
        except Exception:
            return image

    def preprocess_image(self, path):
        img = cv2.imread(path)
        if img is None:
            raise RuntimeError("Could not read image for preprocessing")
        img = self.deskew(img)
        h, w = img.shape[:2]
        if max(h, w) < 1600:
            img = cv2.resize(img, None, fx=1.6, fy=1.6, interpolation=cv2.INTER_CUBIC)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        gray = cv2.bilateralFilter(gray, 9, 75, 75)
        kernel = np.array([[0,-1,0],[-1,5,-1],[0,-1,0]])
        gray = cv2.filter2D(gray, -1, kernel)
        try:
            th = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                       cv2.THRESH_BINARY, 31, 9)
        except Exception:
            _, th = cv2.threshold(gray, 128, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
        return th

    def run_tesseract(self, image_array):
        best_text = ""
        best_tokens = []
        
        for psm in [3, 6]:
            config = f"--oem 3 --psm {psm} -c preserve_interword_spaces=1"
            pil = Image.fromarray(image_array)
            text = pytesseract.image_to_string(pil, config=config)
            data = pytesseract.image_to_data(pil, config=config, output_type=pytesseract.Output.DICT)
            tokens = []
            for i in range(len(data["text"])):
                if data["text"][i].strip():
                    try:
                        conf = float(data["conf"][i])
                    except:
                        conf = None
                    tokens.append({
                        "text": data["text"][i],
                        "conf": conf,
                        "bbox": [int(data['left'][i]), int(data['top'][i]), int(data['width'][i]), int(data['height'][i])]
                    })
            if len(text) > len(best_text):
                best_text = text
                best_tokens = tokens
        
        return best_text, best_tokens

    def extract_from_image(self, path):
        processed = self.preprocess_image(path)
        text, tokens = self.run_tesseract(processed)
        return {"text": text, "tokens": tokens}

    def extract(self, file_path):
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
            except Exception:
                pass
            pages = self._pdf_to_images(file_path)
            full_text = ""
            full_tokens = []
            for p in pages:
                res = self.extract_from_image(p)
                full_text += res["text"] + "\n"
                full_tokens += res["tokens"]
            return {"text": full_text, "tokens": full_tokens}
        else:
            return self.extract_from_image(file_path)

universal_ocr = UniversalOCR()


# ----------------------- Heart report detector -----------------------
NON_HEART_KEYWORDS = [
    "echo", "echocardi", "2d echo", "2-d echo", "doppler", "ultrasound",
    "echocardiogram", "semen", "semen analysis", "urine", "cbc", "complete blood count",
    "thyroid", "x-ray", "xray", "radiology", "ct scan", "mri", "sputum", "smear",
    "histopath", "pathology", "biopsy", "microbiology"
]

HEART_KEYWORDS = {
    "blood pressure": 3, "bp": 2, "cholesterol": 3, "hdl":2, "ldl":2, "triglyceride":2,
    "ecg": 3, "electrocardiogram": 3, "heart rate": 3, "bpm": 2, "angina":3,
    "chest pain":3, "st depression":3, "st-segment":3, "thalach":3, "max heart rate":3,
    "systolic":2, "diastolic":2, "ischemia":2, "stress test":2,
    "age":1, "sex":1, "gender":1, "fbs":2, "fasting blood sugar":2,
    "oldpeak":2, "slope":2, "ca":2, "thal":2
}

FIELD_PATTERNS = [
    r"\bage[:\s]*\d{1,3}\b",
    r"\b(age|years|yrs)\b",
    r"\b(sex|gender)[:\s]*(male|female|m|f)\b",
    r"\b(blood pressure|bp)[:\s]*\d{2,3}\b",
    r"\b(cholesterol|chol)[:\s]*\d{2,3}\b",
    r"\b(fasting .* sugar|fbs)[:\s]*\d{2,3}\b",
    r"\b(resting ecg|ecg|electrocardiogram)\b",
    r"\b(max heart rate|maxhr|thalach)[:\s]*\d{2,3}\b",
    r"\b(st[-\s]*depress|oldpeak)[:\s]*[0-9.]+\b",
]

def is_heart_report(text: str, min_score: int = 1):
    """Detect if document is a medical report. Very permissive to allow most medical documents."""
    if not text or len(text.strip()) < 20:
        return False, {"score": 0, "reason": "empty_or_too_short"}

    t = text.lower()
    
    # Skip blacklist check for now - too restrictive
    # Allow any document with basic medical indicators
    
    score = 0
    hits = {"keywords": [], "patterns": []}

    # Basic medical document indicators
    medical_indicators = [
        r"\b(patient|name|age|sex|male|female)\b",
        r"\b(report|test|result|finding|impression)\b", 
        r"\b(normal|abnormal|mg/dl|mmhg|bpm)\b",
        r"\b\d{1,3}\s*(yrs|years|y)\b",
        r"\b\d{2,3}\s*mg/dl\b",
        r"\b\d{2,3}/\d{2,3}\s*mmhg\b"
    ]
    
    for pattern in medical_indicators:
        if re.search(pattern, t):
            score += 1
            hits["patterns"].append(pattern)

    for kw, wt in HEART_KEYWORDS.items():
        if re.search(r"\b" + re.escape(kw).replace(r"\ ", r"[\s\-]") + r"\b", t):
            score += wt
            hits["keywords"].append((kw, wt))

    return (score >= min_score, {"score": score, "hits": hits, "min_score": min_score})


# ----------------------- Medical parser for heart fields -----------------------
def parse_medical_data(text: str):
    """Enhanced parser for any medical document with flexible pattern matching."""
    print(f"\n[PARSE] Starting parse_medical_data")
    print(f"[PARSE] Text length: {len(text)}")
    print(f"[PARSE] Text preview: {text[:300]}...")
    
    parsed = {
        'name': None, 'age': None, 'sex': None, 'cp': None,
        'trestbps': None, 'chol': None, 'fbs': None,
        'restecg': None, 'thalach': None, 'exang': None,
        'oldpeak': None, 'slope': None, 'ca': None, 'thal': None
    }

    if not text or len(text.strip()) < 20:
        print("[PARSE] Text too short")
        return parsed

    t = text
    tl = text.lower()
    
    # Extract any numeric values for fallback
    all_numbers = re.findall(r'\b\d{1,3}\b', text)
    print(f"[PARSE] Found numbers: {all_numbers[:10]}...")  # Show first 10

    # AGE - flexible patterns
    patterns = [
        r'age[:\s]*([0-9]{1,3})',
        r'([0-9]{1,3})\s*(?:yrs|years|year)',
        r'age[/\s-]*([0-9]{1,3})',
    ]
    for pat in patterns:
        m = re.search(pat, tl)
        if m:
            val = int(m.group(1))
            if 18 <= val <= 100:
                parsed['age'] = val
                print(f"[PARSE] ✓ age -> {val}")
                break

    # SEX
    if re.search(r'\bmale\b', tl) and not re.search(r'\bfemale\b', tl):
        parsed['sex'] = 1
        print(f"[PARSE] ✓ sex -> 1 (male)")
    elif re.search(r'\bfemale\b', tl):
        parsed['sex'] = 0
        print(f"[PARSE] ✓ sex -> 0 (female)")

    # CHEST PAIN TYPE
    if re.search(r'typical\s*angina', tl):
        parsed['cp'] = 0
        print(f"[PARSE] ✓ cp -> 0 (typical angina)")
    elif re.search(r'atypical\s*angina', tl):
        parsed['cp'] = 1
        print(f"[PARSE] ✓ cp -> 1 (atypical angina)")
    elif re.search(r'non[\s-]*anginal', tl):
        parsed['cp'] = 2
        print(f"[PARSE] ✓ cp -> 2 (non-anginal)")
    elif re.search(r'asymptomatic', tl):
        parsed['cp'] = 3
        print(f"[PARSE] ✓ cp -> 3 (asymptomatic)")

    # BLOOD PRESSURE
    m = re.search(r'(?:blood\s*pressure|bp)[:\s]*([0-9]{2,3})', tl)
    if m:
        parsed['trestbps'] = int(m.group(1))
        print(f"[PARSE] ✓ trestbps -> {parsed['trestbps']}")

    # CHOLESTEROL
    m = re.search(r'cholesterol[:\s]*([0-9]{2,3})', tl)
    if m:
        parsed['chol'] = int(m.group(1))
        print(f"[PARSE] ✓ chol -> {parsed['chol']}")

    # FASTING BLOOD SUGAR
    m = re.search(r'(?:fasting\s*blood\s*sugar|fbs)[:\s]*[>]?\s*([0-9]{2,3})', tl)
    if m:
        val = int(m.group(1))
        parsed['fbs'] = 1 if val > 120 else 0
        print(f"[PARSE] ✓ fbs -> {parsed['fbs']} (value: {val})")

    # RESTING ECG
    if re.search(r'resting\s*ecg[:\s]*normal', tl):
        parsed['restecg'] = 0
        print(f"[PARSE] ✓ restecg -> 0 (normal)")
    elif re.search(r'(?:st[\s-]*t\s*abnormal|abnormal)', tl):
        parsed['restecg'] = 1
        print(f"[PARSE] ✓ restecg -> 1 (abnormal)")
    elif re.search(r'hypertrophy', tl):
        parsed['restecg'] = 2
        print(f"[PARSE] ✓ restecg -> 2 (hypertrophy)")

    # MAX HEART RATE
    m = re.search(r'(?:max\s*heart\s*rate|heart\s*rate)[:\s]*([0-9]{2,3})', tl)
    if m:
        parsed['thalach'] = int(m.group(1))
        print(f"[PARSE] ✓ thalach -> {parsed['thalach']}")

    # EXERCISE ANGINA
    if re.search(r'exercise\s*angina[:\s]*yes', tl):
        parsed['exang'] = 1
        print(f"[PARSE] ✓ exang -> 1 (yes)")
    elif re.search(r'exercise\s*angina[:\s]*no', tl):
        parsed['exang'] = 0
        print(f"[PARSE] ✓ exang -> 0 (no)")

    # ST DEPRESSION
    m = re.search(r'(?:st\s*depression|oldpeak)[:\s]*([0-9]+\.?[0-9]*)', tl)
    if m:
        parsed['oldpeak'] = float(m.group(1))
        print(f"[PARSE] ✓ oldpeak -> {parsed['oldpeak']}")

    # ST SLOPE
    if re.search(r'slope[:\s]*upsloping', tl):
        parsed['slope'] = 2
        print(f"[PARSE] ✓ slope -> 2 (upsloping)")
    elif re.search(r'slope[:\s]*flat', tl):
        parsed['slope'] = 1
        print(f"[PARSE] ✓ slope -> 1 (flat)")
    elif re.search(r'slope[:\s]*downsloping', tl):
        parsed['slope'] = 0
        print(f"[PARSE] ✓ slope -> 0 (downsloping)")

    # MAJOR VESSELS
    m = re.search(r'(?:major\s*vessels|vessels)[:\s]*([0-4])', tl)
    if m:
        parsed['ca'] = int(m.group(1))
        print(f"[PARSE] ✓ ca -> {parsed['ca']}")

    # THALASSEMIA
    if re.search(r'thal(?:assemia)?[:\s]*normal', tl):
        parsed['thal'] = 2
        print(f"[PARSE] ✓ thal -> 2 (normal)")
    elif re.search(r'thal(?:assemia)?[:\s]*fixed', tl):
        parsed['thal'] = 1
        print(f"[PARSE] ✓ thal -> 1 (fixed defect)")
    elif re.search(r'thal(?:assemia)?[:\s]*reversible', tl):
        parsed['thal'] = 3
        print(f"[PARSE] ✓ thal -> 3 (reversible defect)")

    found = sum(1 for v in parsed.values() if v is not None)
    print(f"\n[PARSE] === FINAL RESULT: {found}/14 fields found ===")
    print(f"[PARSE] Parsed data: {parsed}\n")
    return parsed


# LEGACY FALLBACK (kept for compatibility)
def parse_medical_data_legacy(text: str):
    parsed = {
        'name': None, 'age': None, 'sex': None,
        'trestbps': None, 'chol': None, 'fbs': None,
        'restecg': None, 'thalach': None, 'exang': None,
        'oldpeak': None, 'slope': None, 'ca': None, 'thal': None
    }

    if not text or len(text.strip()) < 20:
        print("[PARSE] No text to parse")
        return parsed

    # --- Improved Name detection ---
    name_patterns = [
        r'(?:name of patient|patient name|patient[:\s\-]+)([A-Z][A-Za-z ,.\'\-]{2,80})',
        r'\bname[:\s\-]+([A-Z][A-Za-z ,.\'\-]{2,80})',
        r'(^[A-Z]{2,}[A-Z0-9 ,.\'\-]{2,100}$)'
    ]
    for pat in name_patterns:
        m = re.search(pat, text, re.M)
        if m:
            candidate = m.group(1).strip()
            candidate = re.split(r'\b(REF BY|REFBY|DATE|DOB|AGE)\b', candidate, flags=re.I)[0].strip()
            if candidate and len(candidate) >= 2:
                parsed['name'] = candidate
                print(f"[PARSE] name -> {parsed['name']}")
                break

    if parsed['name'] is None:
        m = re.search(r'NAME\s*[:\-]\s*([A-Z][A-Za-z0-9 .,\-]{2,80})', text, re.I)
        if m:
            candidate = m.group(1).strip()
            candidate = re.split(r'\b(REF BY|AGE|DOB)\b', candidate, flags=re.I)[0].strip()
            parsed['name'] = candidate
            print(f"[PARSE] name -> {parsed['name']}")

    # --- Improved Age & Sex detection ---
    m = re.search(r'age\s*[/\-\\]\s*sex[:\s]*([0-9]{1,3})\s*(?:yrs|years)?\s*[\/\|,\-]\s*(male|female|m|f)', text, re.I)
    if m:
        parsed['age'] = int(m.group(1))
        parsed['sex'] = 1 if m.group(2).lower().startswith('m') else 0
        print(f"[PARSE] age -> {parsed['age']}")
        print(f"[PARSE] sex -> {parsed['sex']}")
    else:
        m = re.search(r'\b([0-9]{1,3})\s*(?:yrs|years|y)\b', text, re.I)
        if m and not parsed['age']:
            age_val = int(m.group(1))
            if 0 < age_val < 120:
                parsed['age'] = age_val
                print(f"[PARSE] age -> {age_val}")

        if parsed['age'] is None:
            m = re.search(r'\bage[:\s\-]*([0-9]{1,3})\b', text, re.I)
            if m:
                age_val = int(m.group(1))
                if 0 < age_val < 120:
                    parsed['age'] = age_val
                    print(f"[PARSE] age -> {age_val}")

        m = re.search(r'\b(?:sex|gender)[:\s\-]*\b(male|female|m|f)\b', text, re.I)
        if m:
            parsed['sex'] = 1 if m.group(1).lower().startswith('m') else 0
            print(f"[PARSE] sex -> {parsed['sex']}")
        else:
            m = re.search(r'\b[0-9]{1,3}\s*(?:yrs|years)?\s*[\/\|\,]\s*(male|female|m|f)\b', text, re.I)
            if m:
                parsed['sex'] = 1 if m.group(1).lower().startswith('m') else 0
                print(f"[PARSE] sex -> {parsed['sex']}")

    # Blood pressure - allow systolic/diastolic "150/90 mmHg" or labeled "BP: 150"
    m = re.search(r'\b(?:blood pressure|bp|resting blood pressure)[:\s\-]*([0-9]{2,3}(?:\s*/\s*[0-9]{2,3})?)\s*(?:mmhg)?\b', text, re.I)
    if m:
        bp_raw = m.group(1)
        if "/" in bp_raw:
            parsed['trestbps'] = int(bp_raw.split("/")[0])
        else:
            parsed['trestbps'] = int(re.sub(r'\D', '', bp_raw))
        print(f"[PARSE] trestbps -> {parsed['trestbps']}")

    # Cholesterol - support value with mg/dl units
    m = re.search(r'\b(?:serum\s+)?(?:cholesterol|chol)[:\s\-]*([0-9]{2,4})\s*(?:mg\/dl|mgdl)?\b', text, re.I)
    if m:
        parsed['chol'] = int(m.group(1))
        print(f"[PARSE] chol -> {parsed['chol']}")

    # FBS - allow >120 or 125 mg/dl
    m = re.search(r'(?:fasting\b.*?sugar|fbs)[:\s\-]*([<>]?\s*[0-9]{2,4})\s*(?:mg\/dl|mgdl)?', text, re.I)
    if m:
        val = re.sub(r'[^\d]', '', m.group(1))
        if val:
            parsed['fbs'] = 1 if int(val) > 120 else 0
            print(f"[PARSE] fbs -> {parsed['fbs']}")

    # Heart rate
    m = re.search(r'(?:max heart rate|maxhr|thalach|heart rate|hr)[:\s]*([0-9]{2,3})', text, re.I)
    if m:
        parsed['thalach'] = int(m.group(1))
        print(f"[PARSE] thalach -> {parsed['thalach']}")

    # ECG
    m = re.search(r'\b(ecg|resting ecg|restecg)[:\s]*(normal|abnormal|lv hypertrophy|lvh|st changes)\b', text, re.I)
    if m:
        val = m.group(2).lower()
        parsed['restecg'] = 0 if 'normal' in val else 1
        print(f"[PARSE] restecg -> {parsed['restecg']}")

    # Exercise angina
    m = re.search(r'(exercise induced angina|exercise.*angina|exang)[:\s]*(yes|no)', text, re.I)
    if m:
        parsed['exang'] = 1 if m.group(2).lower().startswith('y') else 0
        print(f"[PARSE] exang -> {parsed['exang']}")

    # ST depression
    m = re.search(r'\b(?:st[-\s]*depress(?:ion)?|oldpeak)[:\s]*([0-9]+(?:\.[0-9]+)?)', text, re.I)
    if m:
        try:
            parsed['oldpeak'] = float(m.group(1))
            print(f"[PARSE] oldpeak -> {parsed['oldpeak']}")
        except:
            pass

    # slope
    m = re.search(r'\bslope[:\s]*(upsloping|flat|downsloping|up|flat|down)\b', text, re.I)
    if m:
        sval = m.group(1).lower()
        mapping = {'upsloping':2,'up':2,'flat':1,'downsloping':0,'down':0}
        parsed['slope'] = mapping.get(sval, None)
        if parsed['slope'] is not None:
            print(f"[PARSE] slope -> {parsed['slope']}")

    # ca
    m = re.search(r'\b(?:major vessels|vessels|ca)[:\s]*([0-4])\b', text, re.I)
    if m:
        parsed['ca'] = int(m.group(1))
        print(f"[PARSE] ca -> {parsed['ca']}")

    # thalassemia
    m = re.search(r'\b(thalassemia|thal)[:\s]*(normal|fixed|reversible|[0-9])\b', text, re.I)
    if m:
        val = m.group(2).lower()
        thmap = {'normal':2,'fixed':1,'reversible':3}
        parsed['thal'] = thmap.get(val, int(val) if val.isdigit() else None)
        if parsed['thal'] is not None:
            print(f"[PARSE] thal -> {parsed['thal']}")

    # --- FALLBACK PATTERNS ---
    if parsed['trestbps'] is None:
        m = re.search(r'\b(bp|blood pressure)[:\s\-]*([0-9]{2,3})(?:/([0-9]{2,3}))?\s*(?:mmhg)?\b', text, re.I)
        if m:
            parsed['trestbps'] = int(m.group(2))
            print(f"[PARSE] trestbps fallback -> {parsed['trestbps']}")

    if parsed['chol'] is None:
        m = re.search(r'\b(cholesterol|chol)[:\s\-]*([0-9]{2,3})\s*(?:mg/dl)?\b', text, re.I)
        if m:
            parsed['chol'] = int(m.group(2))
            print(f"[PARSE] chol fallback -> {parsed['chol']}")

    if parsed['fbs'] is None:
        m = re.search(r'\b(?:fasting blood sugar|fasting .* sugar|fbs)[:\s\-]*([<>]?\s*[0-9]{2,3})', text, re.I)
        if m:
            token = m.group(1).replace(' ', '')
            num = int(re.sub(r'[^0-9]', '', token))
            parsed['fbs'] = 1 if num > 120 else 0
            print(f"[PARSE] fbs fallback -> {parsed['fbs']} (raw:{token})")

    found = sum(1 for v in parsed.values() if v is not None)
    print(f"[PARSE] fields found: {found}/{len(parsed)}")
    return parsed


# ----------------------- Prediction helper -----------------------
MODEL_PATH = os.path.join("data", "raw", "model_assets", "final_risk_model.joblib")
PIPELINE_PATH = os.path.join("data", "raw", "model_assets", "full_prediction_pipeline.joblib")
_loaded_model = None
_loaded_pipeline = None
try:
    if os.path.exists(MODEL_PATH):
        _loaded_model = joblib.load(MODEL_PATH)
    if os.path.exists(PIPELINE_PATH):
        _loaded_pipeline = joblib.load(PIPELINE_PATH)
except Exception:
    _loaded_model = None
    _loaded_pipeline = None

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
    fbs = parsed.get('fbs')
    if fbs == 1: score += 1
    th = parsed.get('thalach') or 0
    if th < 50 or th > 180: score += 1
    oldp = parsed.get('oldpeak')
    if oldp is not None:
        if oldp >= 2: score += 2
        elif oldp >= 1: score += 1
    if parsed.get('exang') == 1: score += 2
    ca = parsed.get('ca')
    if ca is not None:
        if ca >= 2: score += 2
        elif ca == 1: score += 1
    thal = parsed.get('thal')
    if thal in (1,3): score += 1

    if score >= 6:
        return {"risk": "HIGH", "confidence": min(0.9, 0.5 + score*0.05)}
    if score >= 3:
        return {"risk": "MODERATE", "confidence": min(0.85, 0.35 + score*0.08)}
    return {"risk": "LOW", "confidence": min(0.8, 0.55 + score*0.05)}

def predict_from_parsed(parsed):
    try:
        if _loaded_pipeline is not None:
            import pandas as pd
            df = pd.DataFrame([parsed])
            preds = _loaded_pipeline.predict_proba(df) if hasattr(_loaded_pipeline, "predict_proba") else None
            if preds is not None:
                p = float(preds[0][1])
                label = "HIGH" if p > 0.66 else ("MODERATE" if p > 0.35 else "LOW")
                return {"risk": label, "confidence": p}
            pred = _loaded_pipeline.predict(df)
            label = pred[0] if isinstance(pred, (list, np.ndarray)) else pred
            return {"risk": str(label).upper(), "confidence": 0.75}
        if _loaded_model is not None:
            import pandas as pd
            df = pd.DataFrame([parsed])
            prob = _loaded_model.predict_proba(df) if hasattr(_loaded_model, "predict_proba") else None
            if prob is not None:
                p = float(prob[0][1])
                label = "HIGH" if p > 0.66 else ("MODERATE" if p > 0.35 else "LOW")
                return {"risk": label, "confidence": p}
            pred = _loaded_model.predict(df)
            label = pred[0] if isinstance(pred, (list, np.ndarray)) else pred
            return {"risk": str(label).upper(), "confidence": 0.7}
    except Exception:
        pass
    return heuristic_risk(parsed)


# ----------------------- Convenience wrapper used by views -----------------------
DEBUG_DIR = os.path.join(UPLOAD_DIR, "debug")
os.makedirs(DEBUG_DIR, exist_ok=True)

def ocr_and_predict(file_path):
    ocr_result = universal_ocr.extract(file_path)
    text = ocr_result.get("text", "") or ""
    tokens = ocr_result.get("tokens", [])

    is_heart, diag = is_heart_report(text, min_score=4)
    if not is_heart:
        return {
            "ok": False,
            "error": "not_heart_report",
            "diagnostic": diag,
            "text": text,
            "tokens": tokens
        }

    parsed = parse_medical_data(text)
    prediction = predict_from_parsed(parsed)
    return {
        "ok": True,
        "text": text,
        "tokens": tokens,
        "parsed": parsed,
        "prediction": prediction,
        "processed_at": datetime.utcnow().isoformat()
    }

def ocr_and_predict_debug(file_path, save_debug=True):
    import json
    try:
        ocr_result = universal_ocr.extract(file_path)
    except Exception as e:
        return {"ok": False, "stage": "ocr", "error": f"ocr_exception: {repr(e)}"}

    text = ocr_result.get("text", "") or ""
    tokens = ocr_result.get("tokens", [])

    timestamp = datetime.utcnow().strftime("%Y%m%dT%H%M%S")
    base = os.path.basename(file_path)
    debug_prefix = f"{timestamp}__{base}"
    if save_debug:
        try:
            open(os.path.join(DEBUG_DIR, debug_prefix + ".ocr.txt"), "w", encoding="utf8").write(text)
            open(os.path.join(DEBUG_DIR, debug_prefix + ".tokens.json"), "w", encoding="utf8").write(json.dumps(tokens, ensure_ascii=False, indent=2))
        except Exception:
            pass

    try:
        is_heart, diag = is_heart_report(text, min_score=1)
    except Exception as e:
        return {"ok": False, "stage": "detector", "error": f"detector_exception: {repr(e)}", "text_preview": text[:400]}

    if not is_heart:
        if save_debug:
            open(os.path.join(DEBUG_DIR, debug_prefix + ".diag.json"), "w", encoding="utf8").write(json.dumps(diag, ensure_ascii=False, indent=2))
        return {
            "ok": False,
            "stage": "rejected_not_heart",
            "error": "not_heart_report",
            "diagnostic": diag,
            "text_preview": text[:1000]
        }

    try:
        parsed = parse_medical_data(text)
    except Exception as e:
        return {"ok": False, "stage": "parse", "error": f"parse_exception: {repr(e)}", "text_preview": text[:1000]}

    # Always proceed with prediction even if few fields extracted
    non_null = sum(1 for v in parsed.values() if v is not None)
    print(f"[DEBUG] Extracted {non_null} fields from document")

    if save_debug:
        open(os.path.join(DEBUG_DIR, debug_prefix + ".parsed.json"), "w", encoding="utf8").write(json.dumps(parsed, ensure_ascii=False, indent=2))

    try:
        prediction = predict_from_parsed(parsed)
    except Exception as e:
        prediction = {"error": f"prediction_exception: {repr(e)}"}

    if save_debug:
        open(os.path.join(DEBUG_DIR, debug_prefix + ".prediction.json"), "w", encoding="utf8").write(json.dumps(prediction, ensure_ascii=False, indent=2))

    return {
        "ok": True,
        "stage": "success",
        "source": "live",
        "text_preview": text[:2000],
        "ocr_len": len(text),
        "diagnostic": diag,
        "parsed": parsed,
        "parsed_count": non_null,
        "prediction": prediction,
        "debug_files_prefix": debug_prefix
    }
