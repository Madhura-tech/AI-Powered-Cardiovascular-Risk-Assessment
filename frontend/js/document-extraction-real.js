// Real OCR Extraction - No Demo Data
let extractedMedicalData = null;
const OCR_ENDPOINT = "/ocr/extract_debug";

async function uploadFiles() {
    if (!authToken) {
        showNotification('Please login first to upload documents', 'error');
        navigateTo('login');
        return;
    }
    
    const fileInput = document.getElementById('fileInput');
    if (!fileInput.files[0]) {
        showNotification('Please select a file', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    
    try {
        showUploadProgress(25, 'Uploading document...');
        
        const response = await fetch(`${API_BASE_URL}${OCR_ENDPOINT}`, {
            method: 'POST',
            body: formData
        });
        
        showUploadProgress(75, 'Extracting medical data...');
        const result = await response.json();
        console.log('OCR API response:', result);
        
        if (result.ok && result.parsed) {
            extractedMedicalData = result.parsed;
            displayExtractedData(result);
            showUploadProgress(100, 'Complete!');
            setTimeout(hideUploadProgress, 1000);
        } else {
            hideUploadProgress();
            const msg = result.message || result.error || 'Extraction failed';
            showNotification(msg, 'error');
        }
    } catch (error) {
        console.error('Upload error:', error);
        hideUploadProgress();
        showNotification('Network error. Please ensure backend is running.', 'error');
    }
}

function displayExtractedData(apiData) {
    const previewDiv = document.getElementById('extractedDataPreview');
    const contentDiv = document.getElementById('extractedDataContent');
    
    if (!previewDiv || !contentDiv) return;
    
    const parsed = apiData.parsed || {};
    const prediction = apiData.prediction || {};
    const parsedCount = Object.values(parsed).filter(v => v !== null && v !== undefined).length;
    
    const dataHTML = `
        <div class="alert ${parsedCount >= 10 ? 'alert-success' : parsedCount >= 6 ? 'alert-warning' : 'alert-info'} mb-3">
            <h6 class="mb-2"><i class="fas fa-file-medical"></i> OCR Extraction Result</h6>
            <p class="mb-0">Extracted ${parsedCount} out of 13 parameters from document</p>
        </div>
        <div class="row">
            <div class="col-md-8">
                <h6>Extracted Parameters:</h6>
                <div class="row">
                    <div class="col-md-6">
                        <ul class="list-unstyled">
                            <li><strong>Age:</strong> <span id="age-value">${parsed.age || '—'}</span></li>
                            <li><strong>Sex:</strong> <span id="sex-value">${parsed.sex === 1 ? 'Male' : parsed.sex === 0 ? 'Female' : '—'}</span></li>
                            <li><strong>Blood Pressure:</strong> <span id="bp-value">${parsed.trestbps || '—'} ${parsed.trestbps ? 'mmHg' : ''}</span></li>
                            <li><strong>Cholesterol:</strong> <span id="chol-value">${parsed.chol || '—'} ${parsed.chol ? 'mg/dl' : ''}</span></li>
                            <li><strong>Fasting Blood Sugar:</strong> <span id="fbs-value">${parsed.fbs === 1 ? '>120 mg/dl' : parsed.fbs === 0 ? '≤120 mg/dl' : '—'}</span></li>
                            <li><strong>Max Heart Rate:</strong> <span id="hr-value">${parsed.thalach || '—'} ${parsed.thalach ? 'bpm' : ''}</span></li>
                        </ul>
                    </div>
                    <div class="col-md-6">
                        <ul class="list-unstyled">
                            <li><strong>Resting ECG:</strong> <span id="ecg-value">${parsed.restecg !== null ? ['Normal', 'ST-T abnormality', 'LV hypertrophy'][parsed.restecg] : '—'}</span></li>
                            <li><strong>Exercise Angina:</strong> <span id="exang-value">${parsed.exang === 1 ? 'Yes' : parsed.exang === 0 ? 'No' : '—'}</span></li>
                            <li><strong>ST Depression:</strong> <span id="oldpeak-value">${parsed.oldpeak !== null ? parsed.oldpeak : '—'}</span></li>
                            <li><strong>ST Slope:</strong> <span id="slope-value">${parsed.slope !== null ? ['Downsloping', 'Flat', 'Upsloping'][parsed.slope] : '—'}</span></li>
                            <li><strong>Major Vessels:</strong> <span id="ca-value">${parsed.ca !== null ? parsed.ca : '—'}</span></li>
                            <li><strong>Thalassemia:</strong> <span id="thal-value">${parsed.thal !== null ? ['', 'Fixed Defect', 'Normal', 'Reversible Defect'][parsed.thal] : '—'}</span></li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card border-${parsedCount >= 10 ? 'success' : 'warning'}">
                    <div class="card-body text-center">
                        <h4 class="text-${parsedCount >= 10 ? 'success' : 'warning'}">${parsedCount}/13</h4>
                        <p class="mb-2">Parameters Extracted</p>
                        <div class="progress mb-2">
                            <div class="progress-bar bg-${parsedCount >= 10 ? 'success' : 'warning'}" style="width: ${(parsedCount/13)*100}%"></div>
                        </div>
                        <small>${parsedCount >= 10 ? 'Excellent extraction!' : parsedCount >= 6 ? 'Good extraction' : 'Partial extraction'}</small>
                    </div>
                </div>
                ${prediction.risk ? `
                <div class="mt-3">
                    <div class="alert alert-${prediction.risk === 'HIGH' ? 'danger' : prediction.risk === 'MODERATE' ? 'warning' : 'success'}">
                        <strong>Risk:</strong> ${prediction.risk}<br>
                        <strong>Confidence:</strong> ${Math.round((prediction.confidence || 0) * 100)}%
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    contentDiv.innerHTML = dataHTML;
    previewDiv.classList.remove('d-none');
    previewDiv.style.display = 'block';
    
    window.currentExtractedData = parsed;
    setTimeout(() => previewDiv.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
}

function useExtractedData() {
    if (!extractedMedicalData) {
        showNotification('No extracted data available. Please upload a document first.', 'error');
        return;
    }
    navigateTo('predict');
    setTimeout(() => {
        fillPredictionForm(extractedMedicalData);
        showNotification('Form filled with extracted data!', 'success');
    }, 500);
}

function fillPredictionForm(data) {
    const fields = {
        age: 'age', sex: 'sex', cp: 'cp', trestbps: 'trestbps', chol: 'chol',
        fbs: 'fbs', restecg: 'restecg', thalach: 'thalach', exang: 'exang',
        oldpeak: 'oldpeak', slope: 'slope', ca: 'ca', thal: 'thal'
    };
    
    Object.entries(fields).forEach(([key, id]) => {
        const field = document.getElementById(id);
        if (field && data[key] !== null && data[key] !== undefined) {
            field.value = data[key];
        }
    });
}

function closeExtractedData() {
    const previewDiv = document.getElementById('extractedDataPreview');
    if (previewDiv) {
        previewDiv.classList.add('d-none');
        previewDiv.style.display = 'none';
    }
}

function showUploadProgress(percent, message) {
    const progressDiv = document.getElementById('uploadProgress');
    const progressBar = progressDiv?.querySelector('.progress-bar');
    const progressText = document.getElementById('progressText');
    
    if (progressDiv) progressDiv.classList.remove('d-none');
    if (progressBar) progressBar.style.width = `${percent}%`;
    if (progressText) progressText.textContent = message;
}

function hideUploadProgress() {
    const progressDiv = document.getElementById('uploadProgress');
    if (progressDiv) progressDiv.classList.add('d-none');
}

// File handlers
let fileHandlersInitialized = false;

function initializeFileHandlers() {
    if (fileHandlersInitialized) return;
    
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const uploadBtn = document.getElementById('uploadBtn');
    
    if (!fileInput || !browseBtn || !uploadBtn) return;
    
    browseBtn.onclick = (e) => {
        e.stopPropagation();
        fileInput.click();
    };
    
    fileInput.onchange = function() {
        if (this.files && this.files[0]) {
            showFilePreview(this.files[0]);
            uploadBtn.disabled = false;
        }
    };
    
    fileHandlersInitialized = true;
}

function showFilePreview(file) {
    const previewDiv = document.getElementById('filePreview');
    const previewList = document.getElementById('previewList');
    
    if (previewList) {
        previewList.innerHTML = `
            <div class="alert alert-info d-flex justify-content-between align-items-center">
                <div>
                    <i class="fas fa-file me-2"></i>
                    <strong>${file.name}</strong> (${(file.size / 1024 / 1024).toFixed(2)} MB)
                </div>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="cancelFileSelection()">
                    <i class="fas fa-times me-1"></i>Cancel
                </button>
            </div>
        `;
    }
    
    if (previewDiv) previewDiv.classList.remove('d-none');
}

function cancelFileSelection() {
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const previewDiv = document.getElementById('filePreview');
    
    if (fileInput) fileInput.value = '';
    if (uploadBtn) uploadBtn.disabled = true;
    if (previewDiv) previewDiv.classList.add('d-none');
    
    showNotification('File selection cancelled', 'info');
}

document.addEventListener('DOMContentLoaded', initializeFileHandlers);
