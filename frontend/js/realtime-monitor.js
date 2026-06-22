// Real-time Health Monitoring with Socket.IO
let socket = null;
let vitalsChart = null;
let heartRateData = [];
let timestamps = [];

function initRealtimeMonitoring() {
    // Connect to WebSocket
    socket = io('http://127.0.0.1:5000', {
        transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
        console.log('✅ Connected to real-time monitoring');
        const userId = localStorage.getItem('userId');
        if (userId) {
            socket.emit('join_monitoring', { user_id: userId });
        }
    });

    socket.on('joined_room', (data) => {
        console.log('Joined monitoring room:', data.room);
        showNotification('Real-time monitoring active', 'success');
    });

    socket.on('vitals_update', (data) => {
        updateVitalsDisplay(data);
        updateVitalsChart(data);
    });

    socket.on('health_alert', (data) => {
        showHealthAlert(data.alerts);
    });

    socket.on('disconnect', () => {
        console.log('❌ Disconnected from monitoring');
        showNotification('Monitoring disconnected', 'warning');
    });

    initVitalsChart();
}

function updateVitalsDisplay(vitals) {
    document.getElementById('rt-heart-rate').textContent = vitals.heart_rate || '--';
    document.getElementById('rt-bp-systolic').textContent = vitals.blood_pressure_systolic || '--';
    document.getElementById('rt-bp-diastolic').textContent = vitals.blood_pressure_diastolic || '--';
    document.getElementById('rt-oxygen').textContent = vitals.oxygen_level || '--';
    document.getElementById('rt-temperature').textContent = vitals.temperature || '--';
    document.getElementById('rt-respiratory').textContent = vitals.respiratory_rate || '--';

    // Update status indicator
    const statusEl = document.getElementById('rt-status');
    statusEl.className = `status-badge status-${vitals.status}`;
    statusEl.textContent = vitals.status.toUpperCase();

    // Update timestamp
    document.getElementById('rt-timestamp').textContent = new Date().toLocaleTimeString();
}

function initVitalsChart() {
    const ctx = document.getElementById('vitalsChart');
    if (!ctx) return;

    vitalsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timestamps,
            datasets: [{
                label: 'Heart Rate (BPM)',
                data: heartRateData,
                borderColor: '#ec4899',
                backgroundColor: 'rgba(236, 72, 153, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: false, min: 50, max: 120 },
                x: { display: true }
            },
            plugins: {
                legend: { display: true, position: 'top' }
            }
        }
    });
}

function updateVitalsChart(vitals) {
    if (!vitalsChart) return;

    const now = new Date().toLocaleTimeString();
    timestamps.push(now);
    heartRateData.push(vitals.heart_rate);

    // Keep only last 20 data points
    if (timestamps.length > 20) {
        timestamps.shift();
        heartRateData.shift();
    }

    vitalsChart.update();
}

function startSimulation() {
    const userId = localStorage.getItem('userId');
    if (!socket || !userId) return;

    // Simulate vitals every 2 seconds
    setInterval(() => {
        socket.emit('simulate_vitals', { user_id: userId });
    }, 2000);

    showNotification('Simulation started', 'info');
}

function showHealthAlert(alerts) {
    alerts.forEach(alert => {
        const alertHtml = `
            <div class="alert alert-${alert.type === 'critical' ? 'danger' : 'warning'} alert-dismissible fade show">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>${alert.type.toUpperCase()}:</strong> ${alert.message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        document.getElementById('alerts-container').insertAdjacentHTML('beforeend', alertHtml);
    });
}

function showNotification(message, type) {
    const toast = `
        <div class="toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'info'} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    const container = document.getElementById('toast-container') || createToastContainer();
    container.insertAdjacentHTML('beforeend', toast);
    const toastEl = container.lastElementChild;
    new bootstrap.Toast(toastEl).show();
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
}

// Auto-initialize when dashboard loads
document.addEventListener('DOMContentLoaded', () => {
    const dashboardSection = document.getElementById('realtime-monitor');
    if (dashboardSection && !dashboardSection.classList.contains('d-none')) {
        initRealtimeMonitoring();
    }
});

window.initRealtimeMonitoring = initRealtimeMonitoring;
window.startSimulation = startSimulation;
