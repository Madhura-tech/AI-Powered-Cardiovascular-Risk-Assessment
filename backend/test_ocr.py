import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.ocr_service import ocr_and_predict_debug
import json

if len(sys.argv) < 2:
    print("Usage: python test_ocr.py <image_path>")
    sys.exit(1)

image_path = sys.argv[1]
if not os.path.exists(image_path):
    print(f"Error: File not found: {image_path}")
    sys.exit(1)

print(f"Processing: {image_path}")
print("-" * 60)

result = ocr_and_predict_debug(image_path, save_debug=True)

print("\n=== RESULT ===")
print(json.dumps(result, indent=2, ensure_ascii=False))

if result.get("ok"):
    print("\n✅ SUCCESS")
    print(f"Fields found: {result.get('parsed_count', 0)}")
    print(f"Debug files: uploads/documents/debug/{result.get('debug_files_prefix')}.*")
else:
    print(f"\n❌ FAILED at stage: {result.get('stage')}")
    print(f"Error: {result.get('error')}")
    if 'text_preview' in result:
        print(f"\nOCR Preview:\n{result['text_preview'][:500]}")
