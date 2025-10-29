// Document Modal Fix - Force Professional Display
console.log('🔧 Document Modal Fix loaded');

// Override any existing showDocumentDetails function
window.showDocumentDetails = function(doc) {
    console.log('🔧 [OVERRIDE] Professional document details for:', doc.original_filename);
    
    // Remove any existing modal
    const existingModalElement = document.getElementById('documentModal');
    if (existingModalElement) {
        existingModalElement.remove();
    }
    
    // Format medical data professionally
    function formatMedicalData(parsedData) {
        if (!parsedData || typeof parsedData !== 'object') {
            return '<p class="text-muted">No medical data extracted</p>';
        }
        
        const medicalLabels = {
            age: 'Age',
            sex: 'Gender', 
            cp: 'Chest Pain Type',
            trestbps: 'Resting Blood Pressure',
            chol: 'Cholesterol Level',
            fbs: 'Fasting Blood Sugar',
            restecg: 'Resting ECG',
            thalach: 'Maximum Heart Rate',
            exang: 'Exercise Induced Angina',
            oldpeak: 'ST Depression',
            slope: 'ST Slope',
            ca: 'Major Vessels',
            thal: 'Thalassemia'
        };
        
        const formatValue = (key, value) => {
            if (value === null || value === undefined) return 'Not specified';
            
            switch(key) {
                case 'sex':
                    return value === 1 || value === '1' ? 'Male' : 'Female';
                case 'cp':
                    const cpTypes = ['Typical Angina', 'Atypical Angina', 'Non-anginal Pain', 'Asymptomatic'];
                    return cpTypes[parseInt(value)] || value;
                case 'fbs':
                    return value === 1 || value === '1' ? 'Yes (>120 mg/dl)' : 'No (≤120 mg/dl)';
                case 'restecg':
                    const ecgTypes = ['Normal', 'ST-T Abnormality', 'LV Hypertrophy'];
                    return ecgTypes[parseInt(value)] || value;
                case 'exang':
                    return value === 1 || value === '1' ? 'Yes' : 'No';
                case 'slope':
                    const slopeTypes = ['Downsloping', 'Flat', 'Upsloping'];
                    return slopeTypes[parseInt(value)] || value;
                case 'thal':
                    const thalTypes = ['', 'Fixed Defect', 'Normal', 'Reversible Defect'];
                    return thalTypes[parseInt(value)] || value;
                case 'trestbps':
                    return `${value} mmHg`;
                case 'chol':
                    return `${value} mg/dl`;
                case 'thalach':
                    return `${value} bpm`;
                case 'age':
                    return `${value} years`;
                case 'ca':
                    return `${value} vessels`;
                default:
                    return value;
            }
        };
        
        let html = '<div class="row">';
        Object.entries(parsedData).forEach(([key, value]) => {
            if (medicalLabels[key]) {
                const label = medicalLabels[key];
                const formattedValue = formatValue(key, value);
                
                html += `
                    <div class="col-md-6 mb-3">
                        <div style="background: rgba(236, 72, 153, 0.05); border: 1px solid rgba(236, 72, 153, 0.2); border-radius: 10px; padding: 1rem;">
                            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                                <i class="fas fa-heartbeat" style="color: #ec4899; font-size: 0.9rem;"></i>
                                <strong style="color: #831843; font-size: 0.9rem;">${label}</strong>
                            </div>
                            <div style="color: #9d174d; font-size: 1rem; font-weight: 600;">${formattedValue}</div>
                        </div>
                    </div>
                `;
            }
        });
        html += '</div>';
        
        return html;
    }
    
    // Create professional modal
    const modalHTML = `
        <div class="modal fade" id="documentModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content" style="background: linear-gradient(135deg, #fdf2f8, #fce7f3); border: none; border-radius: 20px;">
                    <div class="modal-header" style="background: linear-gradient(135deg, #ec4899, #be185d); color: white; border-radius: 20px 20px 0 0; border: none;">
                        <h5 class="modal-title" style="font-weight: 600;">
                            <i class="fas fa-file-medical me-2"></i>
                            ${doc.original_filename}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" style="padding: 2rem; color: #831843;">
                        <!-- Document Information -->
                        <div style="background: rgba(236, 72, 153, 0.1); border: 1px solid rgba(236, 72, 153, 0.3); border-radius: 15px; padding: 1.5rem; margin-bottom: 2rem;">
                            <h6 style="color: #831843; font-weight: 600; margin-bottom: 1rem;">
                                <i class="fas fa-info-circle" style="color: #ec4899;"></i>
                                Document Information
                            </h6>
                            <div class="row">
                                <div class="col-md-6">
                                    <p><strong>Upload Date:</strong> ${new Date(doc.upload_date).toLocaleString()}</p>
                                    <p><strong>File Size:</strong> ${(doc.file_size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <div class="col-md-6">
                                    <p><strong>Type:</strong> ${doc.document_type || 'Medical Report'}</p>
                                    ${doc.confidence_score ? `<p><strong>OCR Confidence:</strong> ${(doc.confidence_score * 100).toFixed(1)}%</p>` : ''}
                                </div>
                            </div>
                        </div>
                        
                        ${doc.parsed_data ? `
                            <!-- Medical Parameters -->
                            <div style="background: rgba(244, 114, 182, 0.1); border: 1px solid rgba(244, 114, 182, 0.3); border-radius: 15px; padding: 1.5rem; margin-bottom: 2rem;">
                                <h6 style="color: #831843; font-weight: 600; margin-bottom: 1.5rem;">
                                    <i class="fas fa-stethoscope" style="color: #ec4899;"></i>
                                    Medical Parameters
                                </h6>
                                ${formatMedicalData(doc.parsed_data)}
                            </div>
                        ` : ''}
                    </div>
                    <div class="modal-footer" style="background: rgba(236, 72, 153, 0.05); border-radius: 0 0 20px 20px; border: none; padding: 1.5rem;">
                        <button type="button" class="btn" data-bs-dismiss="modal" style="background: rgba(236, 72, 153, 0.1); border: 1px solid rgba(236, 72, 153, 0.3); color: #831843; padding: 0.75rem 1.5rem; border-radius: 15px; font-weight: 600;">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('documentModal'));
    modal.show();
    
    // Clean up after modal is hidden
    document.getElementById('documentModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
};

console.log('✅ Document Modal Fix ready - professional display enabled');