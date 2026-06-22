# ocr_test.py
import sys, os
from PIL import Image
import pytesseract
import json

def check_tesseract():
    try:
        v = pytesseract.get_tesseract_version()
        print("[OK] Tesseract version:", v)
    except Exception as e:
        print("[ERR] Tesseract not found or pytesseract misconfigured:", e)

def run_ocr(path):
    print("\n--- OCR RUN on:", path)
    try:
        img = Image.open(path)
    except Exception as e:
        print("Cannot open image:", e); return
    conf_cfg = "--oem 3 --psm 3 -c preserve_interword_spaces=1"
    text = pytesseract.image_to_string(img, config=conf_cfg)
    data = pytesseract.image_to_data(img, config=conf_cfg, output_type=pytesseract.Output.DICT)
    print("Extracted text (first 800 chars):\n", text[:800])
    # print token confidences summary
    tokens = []
    for i, t in enumerate(data.get("text", [])):
        if t.strip():
            try:
                conf = float(data.get("conf", [])[i])
            except Exception:
                conf = None
            tokens.append({"text": t, "conf": conf})
    print("\nTokens sample (first 50 non-empty tokens):")
    print(json.dumps(tokens[:50], indent=2))
    print("\nFull text length:", len(text))
    # Save output to debug file
    out = os.path.join("uploads", "documents", "debug_ocr_test.txt")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf8") as f:
        f.write(text)
    print("Saved full OCR text to:", out)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python ocr_test.py path/to/image_or_pdf_page.jpg")
        sys.exit(1)
    check_tesseract()
    run_ocr(sys.argv[1])
