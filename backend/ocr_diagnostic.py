#!/usr/bin/env python3
"""
OCR Diagnostic Tool - Improved
Helps identify and fix OCR extraction issues (Tesseract + Python deps + service)
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path
import importlib

# Optional env var to point to tesseract executable
TESSERACT_CMD = os.getenv('TESSERACT_CMD', 'tesseract')

def check_tesseract_installation():
    """Check if Tesseract is properly installed"""
    print("[INFO] Checking Tesseract OCR installation...")

    # 1) try shutil.which first
    exe_path = shutil.which(TESSERACT_CMD)
    if exe_path:
        print(f"[OK] Tesseract executable found: {exe_path}")
        # try get version safely
        try:
            result = subprocess.run([exe_path, '--version'],
                                    capture_output=True, text=True, timeout=10)
            out = result.stdout.strip() or result.stderr.strip()
            # attempt to parse first line, e.g. "tesseract 5.3.0"
            first_line = out.splitlines()[0] if out else ''
            parts = first_line.split()
            version = None
            for token in parts:
                if any(ch.isdigit() for ch in token) and token[0].isdigit():
                    version = token
                    break
            print(f"   Version: {version or 'Unknown'}")
        except Exception as e:
            print(f"   [WARN] Could not read version: {e}")
        return True

    # 2) check common Windows install paths (helpful for Windows users)
    common_paths = [
        r'C:\Program Files\Tesseract-OCR\tesseract.exe',
        r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
        str(Path.home() / r'AppData\Local\Programs\Tesseract-OCR\tesseract.exe'),
    ]
    for p in common_paths:
        if os.path.exists(p):
            print(f"[OK] Tesseract found at: {p}")
            return True

    print("[ERROR] Tesseract OCR not found.")
    print("  - If installed, set environment variable TESSERACT_CMD to the full path,")
    print("    e.g. export TESSERACT_CMD='/usr/bin/tesseract' (Linux/macOS) or set in Windows env vars.")
    return False

def check_python_dependencies():
    """Check if required Python packages are installed"""
    print("\n[INFO] Checking Python dependencies...")

    # map PyPI package -> import name(s)
    packages = {
        'pytesseract': 'pytesseract',
        'Pillow': 'PIL',
        'PyPDF2': 'PyPDF2',
        # add other packages you rely on here
    }

    missing = []
    for pkg, mod in packages.items():
        try:
            importlib.import_module(mod)
            print(f"[OK] {pkg} (imported as '{mod}') is installed")
        except ImportError:
            print(f"[ERROR] {pkg} (module '{mod}') is missing")
            missing.append(pkg)

    if missing:
        print("\nTo install missing packages run:")
        print("  pip install " + " ".join(missing))
    return missing

def test_ocr_service():
    """Test the OCR service functionality (best-effort)"""
    print("\n[INFO] Testing OCR service module (app.ocr_service)...")

    backend_dir = Path(__file__).parent
    # ensure project root is on path so "app" can be imported
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))

    try:
        module = importlib.import_module('app.ocr_service')
    except ImportError as e:
        print(f"[ERROR] Could not import 'app.ocr_service': {e}")
        print("  - Ensure your package structure has an 'app' package with ocr_service.py")
        return False

    # attempt to get ocr_service object/func
    ocr_service = None
    if hasattr(module, 'ocr_service'):
        ocr_service = getattr(module, 'ocr_service')
        print("[OK] Found 'ocr_service' in app.ocr_service")
    else:
        # try common alternatives
        for alt in ('OCRService', 'OcrService', 'service'):
            if hasattr(module, alt):
                ocr_service = getattr(module, alt)
                print(f"[OK] Found '{alt}' in app.ocr_service (using this)")
                break

    if ocr_service is None:
        print("[ERROR] No 'ocr_service' object found in module. Inspect app/ocr_service.py")
        return False

    # best-effort attribute checks
    tconfig = getattr(ocr_service, 'tesseract_configured', None)
    print(f"   Tesseract configured flag: {tconfig if tconfig is not None else '[UNKNOWN]'}")

    # try calling get_installation_status if available
    if hasattr(ocr_service, 'get_installation_status'):
        try:
            status = ocr_service.get_installation_status()
            print("   get_installation_status() -> OK")
            # if it's a dict print some fields safely
            if isinstance(status, dict):
                print(f"   Fallback active: {status.get('fallback_active', 'N/A')}")
                if status.get('recommendations'):
                    print("   Recommendations:")
                    for rec in status.get('recommendations', []):
                        print(f"    - {rec}")
        except Exception as e:
            print(f"   [WARN] get_installation_status() raised: {e}")
    else:
        print("   get_installation_status() not implemented in ocr_service (optional)")

    return True

def test_sample_extraction():
    """Test extraction with a sample medical text (best-effort)"""
    print("\n[INFO] Testing medical data extraction (using ocr_service.parse_medical_data if present)")

    try:
        module = importlib.import_module('app.ocr_service')
    except ImportError:
        print("[ERROR] app.ocr_service not importable; skipping sample extraction")
        return False

    ocr_service = getattr(module, 'ocr_service', None)
    if ocr_service is None:
        print("[ERROR] app.ocr_service does not expose 'ocr_service'; skipping sample extraction")
        return False

    sample_text = """
    COMPREHENSIVE CARDIAC ASSESSMENT REPORT

    PATIENT DEMOGRAPHICS:
    Age: 58 years
    Sex: Female

    VITAL SIGNS AND MEASUREMENTS:
    Resting Blood Pressure: 145 mmHg
    Serum Cholesterol: 310 mg/dL
    Fasting Blood Sugar: 125 mg/dL
    Max Heart Rate Achieved: 120 bpm

    CARDIAC EVALUATION:
    Chest Pain Type: Atypical Angina
    Resting ECG Result: LV Hypertrophy
    Exercise-Induced Angina: Yes
    ST Depression (Exercise ECG): 2.5 mm
    Slope of Peak Exercise ST Segment: Upsloping
    Major Vessels (Fluoroscopy): 2 vessels
    Thalassemia Test: Normal
    """

    # prefer parse_medical_data if present
    if hasattr(ocr_service, 'parse_medical_data'):
        try:
            parsed = ocr_service.parse_medical_data(sample_text)
            if not isinstance(parsed, dict):
                print("   [WARN] parse_medical_data returned non-dict; showing repr")
                print(repr(parsed))
                return False
            extracted_count = sum(1 for v in parsed.values() if v is not None)
            print(f"   Extracted {extracted_count}/{len(parsed)} fields (where len(parsed) keys assumed)")
            # show a few likely keys if present
            for k in ('age', 'sex', 'trestbps', 'chol', 'fbs'):
                if k in parsed:
                    print(f"    - {k}: {parsed[k]}")
            return True
        except Exception as e:
            print(f"   [ERROR] parse_medical_data failed: {e}")
            return False
    else:
        print("   parse_medical_data not implemented in ocr_service; can't run sample extraction")
        return False

def provide_solutions():
    """Provide solutions for common OCR issues"""
    print("\nSOLUTIONS FOR OCR ISSUES:")
    print("=" * 50)

    print("\n1) Install Tesseract OCR (recommended):")
    print("   - Windows: download 'Tesseract-OCR' installer (UB Mannheim builds often recommended).")
    print("   - Linux: sudo apt install tesseract-ocr  (or use distro package manager)")
    print("   - Mac (Homebrew): brew install tesseract")
    print("   - If installed but not found, set TESSERACT_CMD env var to the tesseract executable path.")

    print("\n2) Install Python dependencies:")
    print("   - Run: pip install pytesseract Pillow PyPDF2")

    print("\n3) If app.ocr_service import fails:")
    print("   - Ensure your project has an 'app' package with an __init__.py and ocr_service.py")
    print("   - From project root run this diagnostic script (so imports resolve).")

    print("\n4) Improve OCR accuracy:")
    print("   - Preprocess images (grayscale, denoise, adaptive threshold, deskew).")
    print("   - Ensure ~300 DPI for scanned docs; rescale if images too small.")
    print("   - Try different Tesseract PSM/OEM options or use cloud OCR for handwriting.")
    print("   - Add character whitelists if you know expected charset to reduce errors.")

def main():
    print("Heart Disease Prediction - OCR Diagnostic Tool (improved)")
    print("=" * 60)

    tesseract_ok = check_tesseract_installation()
    missing = check_python_dependencies()
    service_ok = test_ocr_service()
    extraction_ok = test_sample_extraction()

    print("\nDIAGNOSTIC SUMMARY:")
    print("=" * 30)
    print(f"Tesseract OCR: {'[OK]' if tesseract_ok else '[MISSING]'}")
    print(f"Python packages: {'[OK]' if not missing else f'[MISSING]: {missing}'}")
    print(f"OCR service module: {'[OK]' if service_ok else '[FAILED]'}")
    print(f"Data extraction test: {'[OK]' if extraction_ok else '[FAILED]'}")

    if service_ok and extraction_ok:
        overall = '[WORKING]' if tesseract_ok else '[WORKING - Fallback Mode]'
        print(f"\nOVERALL STATUS: {overall}")
        if not tesseract_ok:
            print("   OCR extraction can proceed in fallback mode, but install Tesseract for better accuracy.")
    else:
        print("\n[ERROR] OVERALL STATUS: NEEDS ATTENTION - see messages above for details")

    provide_solutions()
    print(f"\n{'='*60}\nDiagnostic complete.")

if __name__ == '__main__':
    main()
