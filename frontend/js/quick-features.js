// Export to PDF
function exportToPDF(predictionId) {
    const token = localStorage.getItem('authToken');
    window.open(`http://127.0.0.1:5000/export/pdf/${predictionId}?token=${token}`, '_blank');
}

// Export to CSV
function exportToCSV() {
    const token = localStorage.getItem('authToken');
    fetch('http://127.0.0.1:5000/export/csv', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'predictions.csv';
        a.click();
    });
}

// Send Email Report
function sendEmailReport(predictionId, risk) {
    const token = localStorage.getItem('authToken');
    fetch('http://127.0.0.1:5000/send-report', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prediction_id: predictionId, risk })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.success ? 'Email sent!' : 'Email failed');
    });
}

// Compare with Population
function compareWithPopulation() {
    const token = localStorage.getItem('authToken');
    fetch('http://127.0.0.1:5000/analytics/compare', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
        const html = `
            <div style="background: rgba(244, 114, 182, 0.1); padding: 2rem; border-radius: 15px; margin: 1rem 0;">
                <h4 style="color: #831843;">Population Comparison</h4>
                <p><strong>Your Risk:</strong> ${data.your_risk}%</p>
                <p><strong>Population Average:</strong> ${data.population_avg}%</p>
                <p><strong>Age Group Average:</strong> ${data.age_group_avg}%</p>
                <p><strong>Percentile:</strong> ${data.percentile}th</p>
                <p><strong>Status:</strong> ${data.status === 'below_average' ? '✅ Below Average' : '⚠️ Above Average'}</p>
            </div>
        `;
        document.getElementById('comparison-result').innerHTML = html;
    });
}

window.exportToPDF = exportToPDF;
window.exportToCSV = exportToCSV;
window.sendEmailReport = sendEmailReport;
window.compareWithPopulation = compareWithPopulation;
