// Charts Fix - Destroy and Recreate
let chartInstances = {};

function destroyAllCharts() {
    Object.values(chartInstances).forEach(chart => {
        if (chart) chart.destroy();
    });
    chartInstances = {};
}

function loadAnalyticsCharts() {
    destroyAllCharts();
    
    const token = localStorage.getItem('authToken');
    if (!token) {
        loadDemoCharts();
        return;
    }
    
    fetch('http://127.0.0.1:5000/api/predictions', {
        headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(r => r.json())
    .then(data => {
        const predictions = data.predictions || [];
        if (predictions.length > 0) {
            loadRealCharts(predictions);
        } else {
            loadDemoCharts();
        }
    })
    .catch(() => loadDemoCharts());
}

function loadRealCharts(predictions) {
    const latest = predictions[predictions.length - 1];
    const risk = (latest.confidence_score || 0.5) * 100;
    const inp = latest.input_data || {};
    
    chartInstances.gauge = new Chart(document.getElementById('riskGaugeChart'), {
        type: 'doughnut',
        data: { datasets: [{ data: [risk, 100-risk], backgroundColor: ['#ec4899', '#f3f4f6'] }] },
        options: { circumference: 180, rotation: 270, cutout: '75%', plugins: { legend: { display: false } } }
    });
    
    chartInstances.radar = new Chart(document.getElementById('radarChart'), {
        type: 'radar',
        data: { labels: ['Age', 'BP', 'Chol', 'HR', 'BS'], datasets: [{ data: [inp.age||50, (inp.trestbps||120)/2, (inp.chol||200)/4, (inp.thalach||150)/2, (inp.fbs||0)*100], backgroundColor: 'rgba(236,72,153,0.2)', borderColor: '#ec4899' }] },
        options: { scales: { r: { beginAtZero: true, max: 100 } } }
    });
    
    const last5 = predictions.slice(-5);
    chartInstances.trend = new Chart(document.getElementById('trendChart'), {
        type: 'line',
        data: { labels: last5.map((_, i) => 'Test ' + (i+1)), datasets: [{ label: 'BP', data: last5.map(p => (p.input_data||{}).trestbps||120), borderColor: '#ec4899', tension: 0.4 }, { label: 'HR', data: last5.map(p => (p.input_data||{}).thalach||150), borderColor: '#be185d', tension: 0.4 }] }
    });
    
    const counts = { low: 0, moderate: 0, high: 0 };
    predictions.forEach(p => {
        const cat = ((p.result||{}).risk_category||'low').toLowerCase();
        if (cat.includes('high')) counts.high++;
        else if (cat.includes('moderate')||cat.includes('medium')) counts.moderate++;
        else counts.low++;
    });
    chartInstances.bar = new Chart(document.getElementById('predictionBarChart'), {
        type: 'bar',
        data: { labels: ['Low', 'Moderate', 'High'], datasets: [{ data: [counts.low, counts.moderate, counts.high], backgroundColor: ['#10b981', '#f59e0b', '#ef4444'] }] },
        options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
}

function loadDemoCharts() {
    chartInstances.gauge = new Chart(document.getElementById('riskGaugeChart'), {
        type: 'doughnut',
        data: { datasets: [{ data: [35, 65], backgroundColor: ['#ec4899', '#f3f4f6'] }] },
        options: { circumference: 180, rotation: 270, cutout: '75%', plugins: { legend: { display: false } } }
    });
    
    chartInstances.radar = new Chart(document.getElementById('radarChart'), {
        type: 'radar',
        data: { labels: ['Age', 'BP', 'Chol', 'HR', 'BS'], datasets: [{ data: [45, 60, 50, 75, 40], backgroundColor: 'rgba(236,72,153,0.2)', borderColor: '#ec4899' }] },
        options: { scales: { r: { beginAtZero: true, max: 100 } } }
    });
    
    chartInstances.trend = new Chart(document.getElementById('trendChart'), {
        type: 'line',
        data: { labels: ['W1','W2','W3','W4','W5'], datasets: [{ label: 'BP', data: [120,118,122,119,121], borderColor: '#ec4899', tension: 0.4 }, { label: 'HR', data: [72,75,70,73,71], borderColor: '#be185d', tension: 0.4 }] }
    });
    
    chartInstances.bar = new Chart(document.getElementById('predictionBarChart'), {
        type: 'bar',
        data: { labels: ['Low', 'Moderate', 'High'], datasets: [{ data: [5, 3, 2], backgroundColor: ['#10b981', '#f59e0b', '#ef4444'] }] },
        options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
}

// Hook into navigation
setTimeout(function() {
    const orig = window.navigateTo;
    if (orig) {
        window.navigateTo = function(id) {
            const res = orig(id);
            if (id === 'analytics') {
                setTimeout(loadAnalyticsCharts, 300);
            }
            return res;
        };
    }
}, 500);
