import sys
sys.path.insert(0, 'c:\\Users\\gmadh\\3rd sem project\\Madhura_project\\backend')

from app.ocr_service import universal_ocr, parse_medical_data

# Test with your uploaded file (most recent)
file_path = r"c:\Users\gmadh\3rd sem project\Madhura_project\backend\uploads\documents\5d3143a2-59b2-4345-b989-04b88a37ffb2.png"

print("="*60)
print("TESTING OCR EXTRACTION")
print("="*60)

# Extract text
result = universal_ocr.extract(file_path)
text = result.get('text', '')

print(f"\n[OCR] Extracted {len(text)} characters")
print(f"\n[OCR] Full extracted text:")
print("-"*60)
print(text)
print("-"*60)

# Parse the text
print("\n" + "="*60)
print("TESTING PARSER")
print("="*60)

parsed = parse_medical_data(text)

print("\n" + "="*60)
print("FINAL RESULT")
print("="*60)
print(f"Parsed data: {parsed}")
print(f"Fields found: {sum(1 for v in parsed.values() if v is not None)}/14")
