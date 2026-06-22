// Analytics Charts with Real Data
let chartInstances = {};

function destroyCharts() {
    Object.values(chartInstances).forEach(chart => chart?.destroy());
    chartInstances = {};
}

function loadAnalyticsCharts() {
    destroyCharts();
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        loadSampleCharts();
        return;
    }

    fetch('http://127.0.0.1:5000/api/analytics/history-charts', {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            loadSampleCharts();
        } else {
            loadRealChartsFromAPI(data);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        loadSampleCharts();
    });
}

function loadRealChartsFromAPI(data) {
    const gaugeCanvas = document.getElementById('riskGaugeChart');
    if (gaugeCanvas) {
        chartInstances.gauge = new Chart(gaugeCanvas, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [data.risk_gauge.value, 100 - data.risk_gauge.value],
                    backgroundColor: ['#ec4899', '#f3f4f6'],
                    borderWidth: 0
                }]
            },
            options: {
                circumference: 180,
                rotation: 270,
                cutout: '75%',
                plugins: { legend: { display: false }, tooltip: { enabled: false } }
            }
        });
    }

    const radarCanvas = document.getElementById('radarChart');
    if (radarCanvas) {
        chartInstances.radar = new Chart(radarCanvas, {
            type: 'radar',
            data: {
                labels: ['Age', 'BP', 'Cholesterol', 'Heart Rate', 'Blood Sugar'],
                datasets: [{
                    label: 'Your Health',
                    data: [data.radar_data.age, data.radar_data.bp, data.radar_data.cholesterol, data.radar_data.heart_rate, data.radar_data.glucose],
                    backgroundColor: 'rgba(236, 72, 153, 0.2)',
                    borderColor: '#ec4899',
                    borderWidth: 2
                }]
            },
            options: { scales: { r: { beginAtZero: true, max: 100 } } }
        });
    }

    const trendCanvas = document.getElementById('trendChart');
    if (trendCanvas) {
        chartInstances.trend = new Chart(trendCanvas, {
            type: 'line',
            data: {
                labels: data.bp_hr_trend.map(d => d.date),
                datasets: [
                    {
                        label: 'Blood Pressure',
                        data: data.bp_hr_trend.map(d => d.bp),
                        borderColor: '#ec4899',
                        backgroundColor: 'rgba(236, 72, 153, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Heart Rate',
                        data: data.bp_hr_trend.map(d => d.hr),
                        borderColor: '#be185d',
                        backgroundColor: 'rgba(190, 24, 93, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'top' } } }
        });
    }

    const barCanvas = document.getElementById('predictionBarChart');
    if (barCanvas) {
        chartInstances.bar = new Chart(barCanvas, {
            type: 'bar',
            data: {
                labels: ['Low Risk', 'Moderate Risk', 'High Risk'],
                datasets: [{
                    label: 'Predictions',
                    data: [data.prediction_distribution.low, data.prediction_distribution.moderate, data.prediction_distribution.high],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
            }
        });
    }
}

function loadSampleCharts() {
    // Sample data for demonstration
    
    // 1. Risk Gauge
    const gaugeCanvas = document.getElementById('riskGaugeChart');
    if (gaugeCanvas) {
        new Chart(gaugeCanvas, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [35, 65],
                    backgroundColor: ['#ec4899', '#f3f4f6'],
                    borderWidth: 0
                }]
            },
            options: {
                circumference: 180,
                rotation: 270,
                cutout: '75%',
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            }
        });
    }

    // 2. Radar Chart
    const radarCanvas = document.getElementById('radarChart');
    if (radarCanvas) {
        new Chart(radarCanvas, {
            type: 'radar',
            data: {
                labels: ['Age', 'BP', 'Cholesterol', 'Heart Rate', 'Blood Sugar'],
                datasets: [{
                    label: 'Sample Health Data',
                    data: [45, 60, 50, 75, 40],
                    backgroundColor: 'rgba(236, 72, 153, 0.2)',
                    borderColor: '#ec4899',
                    borderWidth: 2
                }]
            },
            options: {
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    // 3. BP/HR Trend
    const trendCanvas = document.getElementById('trendChart');
    if (trendCanvas) {
        new Chart(trendCanvas, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
                datasets: [
                    {
                        label: 'Blood Pressure',
                        data: [120, 118, 122, 119, 121],
                        borderColor: '#ec4899',
                        backgroundColor: 'rgba(236, 72, 153, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Heart Rate',
                        data: [72, 75, 70, 73, 71],
                        borderColor: '#be185d',
                        backgroundColor: 'rgba(190, 24, 93, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'top' }
                }
            }
        });
    }

    // 4. Prediction Distribution
    const barCanvas = document.getElementById('predictionBarChart');
    if (barCanvas) {
        new Chart(barCanvas, {
            type: 'bar',
            data: {
                labels: ['Low Risk', 'Moderate Risk', 'High Risk'],
                datasets: [{
                    label: 'Sample Predictions',
                    data: [5, 3, 2],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    }
}

// Auto-load when analytics section is shown
if (typeof window.navigateTo !== 'undefined') {
    const originalNavigateTo = window.navigateTo;
    window.navigateTo = function(sectionId) {
        const result = originalNavigateTo(sectionId);
        if (sectionId === 'analytics') {
            setTimeout(() => {
                loadAnalyticsCharts();
            }, 500);
        }
        return result;
    };
}

// Export for manual loading
window.loadAnalyticsCharts = loadAnalyticsCharts;
