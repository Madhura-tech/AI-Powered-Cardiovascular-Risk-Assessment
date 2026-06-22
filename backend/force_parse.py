# force_parse.py
import sys, json
from app.ocr_service import universal_ocr, parse_medical_data, predict_from_parsed

def run(path):
    print("Extracting OCR (using project's universal_ocr)...")
    res = universal_ocr.extract(path)
    text = res.get("text","") or ""
    print("OCR text length:", len(text))
    print("Text (first 600 chars):\n", text[:600])

    parsed = parse_medical_data(text)
    print("\nParsed fields:")
    print(json.dumps(parsed, indent=2))

    pred = predict_from_parsed(parsed)
    print("\nPrediction / heuristic output:")
    print(json.dumps(pred, indent=2))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python force_parse.py path/to/file.jpg")
    else:
        run(sys.argv[1])
