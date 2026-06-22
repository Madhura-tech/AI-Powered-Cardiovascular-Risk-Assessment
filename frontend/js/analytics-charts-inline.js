// Inline Analytics Charts - Direct Load
(function() {
    const originalNavigateTo = window.navigateTo;
    if (originalNavigateTo) {
        window.navigateTo = function(sectionId) {
            const result = originalNavigateTo(sectionId);
            if (sectionId === 'analytics') {
                setTimeout(() => {
                    console.log('Loading analytics charts...');
                    loadChartsNow();
                }, 100);
            }
            return result;
        };
    }

    function loadChartsNow() {
        // Destroy existing charts
        Chart.helpers.each(Chart.instances, function(instance) {
            instance.destroy();
        });

        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            loadSampleCharts();
            return;
        }

        fetch('http://127.0.0.1:5000/api/predictions', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        })
        .then(r => r.json())
        .then(data => {
            const predictions = data.predictions || [];
            if (predictions.length === 0) {
                loadSampleCharts();
            } else {
                loadRealCharts(predictions);
            }
        })
        .catch(err => {
            console.error('Error:', err);
            loadSampleCharts();
        });
    }

    function loadRealCharts(predictions) {
        const latest = predictions[predictions.length - 1];
        const riskValue = (latest.confidence_score || 0.5) * 100;
        const inp = latest.input_data || {};
        
        new Chart(document.getElementById('riskGaugeChart'), {
            type: 'doughnut',
            data: { datasets: [{ data: [riskValue, 100 - riskValue], backgroundColor: ['#ec4899', '#f3f4f6'] }] },
            options: { circumference: 180, rotation: 270, cutout: '75%', plugins: { legend: { display: false } } }
        });

        new Chart(document.getElementById('radarChart'), {
            type: 'radar',
            data: {
                labels: ['Age', 'BP', 'Cholesterol', 'Heart Rate', 'Blood Sugar'],
                datasets: [{ data: [(inp.age||50), (inp.trestbps||120)/2, (inp.chol||200)/4, (inp.thalach||150)/2, (inp.fbs||0)*100], backgroundColor: 'rgba(236, 72, 153, 0.2)', borderColor: '#ec4899' }]
            },
            options: { scales: { r: { beginAtZero: true, max: 100 } } }
        });

        const last5 = predictions.slice(-5);
        new Chart(document.getElementById('trendChart'), {
            type: 'line',
            data: {
                labels: last5.map((_, i) => `Test ${i + 1}`),
                datasets: [
                    { label: 'BP', data: last5.map(p => (p.input_data||{}).trestbps||120), borderColor: '#ec4899', tension: 0.4 },
                    { label: 'HR', data: last5.map(p => (p.input_data||{}).thalach||150), borderColor: '#be185d', tension: 0.4 }
                ]
            }
        });

        const counts = { low: 0, moderate: 0, high: 0 };
        predictions.forEach(p => {
            const cat = ((p.result||{}).risk_category||'low').toLowerCase();
            if (cat.includes('high')) counts.high++;
            else if (cat.includes('moderate')||cat.includes('medium')) counts.moderate++;
            else counts.low++;
        });
        new Chart(document.getElementById('predictionBarChart'), {
            type: 'bar',
            data: { labels: ['Low Risk', 'Moderate Risk', 'High Risk'], datasets: [{ data: [counts.low, counts.moderate, counts.high], backgroundColor: ['#10b981', '#f59e0b', '#ef4444'] }] },
            options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
        });
    }

    function loadSampleCharts() {
        new Chart(document.getElementById('riskGaugeChart'), {
            type: 'doughnut',
            data: { datasets: [{ data: [35, 65], backgroundColor: ['#ec4899', '#f3f4f6'] }] },
            options: { circumference: 180, rotation: 270, cutout: '75%', plugins: { legend: { display: false } } }
        });
        new Chart(document.getElementById('radarChart'), {
            type: 'radar',
            data: { labels: ['Age', 'BP', 'Cholesterol', 'Heart Rate', 'Blood Sugar'], datasets: [{ data: [45, 60, 50, 75, 40], backgroundColor: 'rgba(236, 72, 153, 0.2)', borderColor: '#ec4899' }] },
            options: { scales: { r: { beginAtZero: true, max: 100 } } }
        });
        new Chart(document.getElementById('trendChart'), {
            type: 'line',
            data: { labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'], datasets: [{ label: 'BP', data: [120, 118, 122, 119, 121], borderColor: '#ec4899', tension: 0.4 }, { label: 'HR', data: [72, 75, 70, 73, 71], borderColor: '#be185d', tension: 0.4 }] }
        });
        new Chart(document.getElementById('predictionBarChart'), {
            type: 'bar',
            data: { labels: ['Low Risk', 'Moderate Risk', 'High Risk'], datasets: [{ data: [5, 3, 2], backgroundColor: ['#10b981', '#f59e0b', '#ef4444'] }] },
            options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
        });
    }

    window.loadChartsNow = loadChartsNow;
})();
