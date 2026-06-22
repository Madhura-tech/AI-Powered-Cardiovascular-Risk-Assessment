# force_debug.py
import sys, json, os
from app.ocr_service import universal_ocr, ocr_and_predict, ocr_and_predict_debug, parse_medical_data
import pytesseract

def info():
    print("Python:", sys.version.splitlines()[0])
    try:
        print("pytesseract version:", pytesseract.get_tesseract_version())
    except Exception as e:
        print("pytesseract/tesseract check failed:", e)
    print("cwd:", os.getcwd())
    print("uploads debug dir (exists?):", os.path.exists(os.path.join("uploads","documents","debug")))

def run_basic(path):
    print("\n=== Running universal_ocr.extract ===")
    try:
        res = universal_ocr.extract(path)
        text = res.get("text","") or ""
        print("OCR text length:", len(text))
        print("OCR text (first 800 chars):\n", text[:800].replace("\n","\n"))
        print("\nTokens returned:", len(res.get("tokens", [])))
    except Exception as e:
        print("ERROR in universal_ocr.extract:", repr(e))

def run_parse_and_predict(path):
    print("\n=== Running parse_medical_data + predict_from_parsed ===")
    try:
        res = universal_ocr.extract(path)
        text = res.get("text","") or ""
        parsed = parse_medical_data(text)
        print("Parsed fields:")
        print(json.dumps(parsed, indent=2))
    except Exception as e:
        print("ERROR parse/predict:", repr(e))

def run_wrapper(path):
    print("\n=== Running ocr_and_predict_debug (full wrapper) ===")
    try:
        out = ocr_and_predict_debug(path, save_debug=True)
        print(json.dumps(out, indent=2))
        prefix = out.get("debug_files_prefix") or out.get("debug_prefix") or None
        if prefix:
            debug_dir = os.path.join("uploads","documents","debug")
            print("\nDebug files with prefix (look in uploads/documents/debug):")
            for f in sorted(os.listdir(debug_dir)):
                if f.startswith(prefix):
                    print(" -", f)
    except Exception as e:
        print("ERROR ocr_and_predict_debug:", repr(e))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python force_debug.py path/to/file.pdf")
        sys.exit(1)
    p = sys.argv[1]
    info()
    run_basic(p)
    run_parse_and_predict(p)
    run_wrapper(p)
    print("\nDone. If this says parsed_count < required or shows 'rejected_not_heart', paste the full printed JSON here.")
