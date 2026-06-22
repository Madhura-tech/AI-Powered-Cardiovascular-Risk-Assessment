// Admin Panel JavaScript
const ADMIN_API = 'http://127.0.0.1:5000';

let adminState = {
    usersPage: 1,
    predictionsPage: 1,
    usersTotal: 0,
    predictionsTotal: 0
};

// ── Tab Navigation ──────────────────────────────────────────────
function adminShowTab(tab) {
    document.querySelectorAll('.admin-tab-content').forEach(el => el.classList.add('d-none'));
    document.querySelectorAll('.admin-tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById('admin-tab-' + tab)?.classList.remove('d-none');
    document.querySelector(`.admin-tab-btn[data-tab="${tab}"]`)?.classList.add('active');

    if (tab === 'dashboard') loadAdminDashboard();
    if (tab === 'users') loadAdminUsers(1);
    if (tab === 'predictions') loadAdminPredictions(1);
    if (tab === 'health') loadSystemHealth();
}

// ── Dashboard ───────────────────────────────────────────────────
async function loadAdminDashboard() {
    const token = localStorage.getItem('authToken');
    try {
        const res = await fetch(`${ADMIN_API}/api/admin/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) return;

        document.getElementById('adminTotalUsers').textContent = data.total_users ?? 0;
        document.getElementById('adminTotalPredictions').textContent = data.total_predictions ?? 0;
        document.getElementById('adminTotalDocuments').textContent = data.total_documents ?? 0;

        const dist = data.risk_distribution || {};
        document.getElementById('adminLowRisk').textContent = dist['Low Risk'] ?? 0;
        document.getElementById('adminModRisk').textContent = dist['Moderate Risk'] ?? 0;
        document.getElementById('adminHighRisk').textContent = dist['High Risk'] ?? 0;

        renderRiskChart(dist);
        renderRecentActivity(data.recent_activity || []);
    } catch (e) { console.error('Admin dashboard error:', e); }
}

function renderRiskChart(dist) {
    const canvas = document.getElementById('adminRiskChart');
    if (!canvas || !window.Chart) return;
    if (canvas._chartInstance) canvas._chartInstance.destroy();
    canvas._chartInstance = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['Low Risk', 'Moderate Risk', 'High Risk'],
            datasets: [{
                data: [dist['Low Risk'] || 0, dist['Moderate Risk'] || 0, dist['High Risk'] || 0],
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom', labels: { color: '#831843', font: { weight: '600' } } } },
            cutout: '65%'
        }
    });
}

function renderRecentActivity(activities) {
    const el = document.getElementById('adminRecentActivity');
    if (!el) return;
    if (!activities.length) { el.innerHTML = '<p style="color:#9d174d; text-align:center;">No recent activity</p>'; return; }
    el.innerHTML = activities.map(a => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:0.75rem 0; border-bottom:1px solid rgba(236,72,153,0.1);">
            <div>
                <span style="font-weight:600; color:#831843;">${a.username}</span>
                <span class="admin-badge ${riskClass(a.risk_category)}" style="margin-left:0.5rem;">${a.risk_category}</span>
            </div>
            <span style="color:#9d174d; font-size:0.8rem;">${new Date(a.created_at).toLocaleDateString()}</span>
        </div>
    `).join('');
}

// ── Users ────────────────────────────────────────────────────────
async function loadAdminUsers(page = 1) {
    adminState.usersPage = page;
    const token = localStorage.getItem('authToken');
    const tbody = document.getElementById('adminUsersBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#9d174d; padding:2rem;">Loading...</td></tr>';

    try {
        const res = await fetch(`${ADMIN_API}/api/admin/users?page=${page}&per_page=10`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) { tbody.innerHTML = `<tr><td colspan="7" style="color:red; padding:1rem;">${data.error}</td></tr>`; return; }

        adminState.usersTotal = data.total;
        tbody.innerHTML = data.users.map(u => `
            <tr>
                <td>${u.id}</td>
                <td><strong>${u.username}</strong></td>
                <td>${u.email}</td>
                <td><span class="admin-badge ${u.role}">${u.role}</span></td>
                <td><span class="admin-badge ${u.is_verified ? 'verified' : 'unverified'}">${u.is_verified ? 'Verified' : 'Unverified'}</span></td>
                <td>${new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="admin-btn edit" onclick="adminEditUser(${u.id}, '${u.role}', ${u.is_verified})">Edit</button>
                    <button class="admin-btn ${u.is_verified ? 'delete' : 'verify'}" onclick="adminToggleVerify(${u.id}, ${u.is_verified})">${u.is_verified ? 'Unverify' : 'Verify'}</button>
                    <button class="admin-btn delete" onclick="adminDeleteUser(${u.id}, '${u.username}')">Delete</button>
                </td>
            </tr>
        `).join('');

        renderPagination('adminUsersPagination', data.pages, page, (p) => loadAdminUsers(p));
    } catch (e) { tbody.innerHTML = '<tr><td colspan="7" style="color:red;">Error loading users.</td></tr>'; }
}

function adminEditUser(id, currentRole, isVerified) {
    const newRole = currentRole === 'admin' ? 'patient' : 'admin';
    if (!confirm(`Change role of user #${id} to "${newRole}"?`)) return;
    adminUpdateUser(id, { role: newRole });
}

function adminToggleVerify(id, isVerified) {
    adminUpdateUser(id, { is_verified: !isVerified });
}

async function adminUpdateUser(id, payload) {
    const token = localStorage.getItem('authToken');
    try {
        const res = await fetch(`${ADMIN_API}/api/admin/users/${id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
            showNotification('User updated successfully', 'success');
            loadAdminUsers(adminState.usersPage);
        } else {
            showNotification(data.error || 'Update failed', 'error');
        }
    } catch (e) { showNotification('Network error', 'error'); }
}

async function adminDeleteUser(id, username) {
    if (!confirm(`Delete user "${username}" (ID: ${id})? This cannot be undone.`)) return;
    const token = localStorage.getItem('authToken');
    try {
        const res = await fetch(`${ADMIN_API}/api/admin/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
            showNotification('User deleted', 'success');
            loadAdminUsers(adminState.usersPage);
            loadAdminDashboard();
        } else {
            showNotification(data.error || 'Delete failed', 'error');
        }
    } catch (e) { showNotification('Network error', 'error'); }
}

// ── Predictions ──────────────────────────────────────────────────
async function loadAdminPredictions(page = 1) {
    adminState.predictionsPage = page;
    const token = localStorage.getItem('authToken');
    const tbody = document.getElementById('adminPredictionsBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#9d174d; padding:2rem;">Loading...</td></tr>';

    try {
        const res = await fetch(`${ADMIN_API}/api/admin/predictions?page=${page}&per_page=10`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) { tbody.innerHTML = `<tr><td colspan="6" style="color:red;">${data.error}</td></tr>`; return; }

        adminState.predictionsTotal = data.total;
        tbody.innerHTML = data.predictions.map(p => `
            <tr>
                <td>${p.id}</td>
                <td><strong>${p.username}</strong></td>
                <td>${p.patient_name || 'N/A'}</td>
                <td><span class="admin-badge ${riskClass(p.risk_category)}">${p.risk_category}</span></td>
                <td>${p.confidence_score ? (p.confidence_score * 100).toFixed(1) + '%' : 'N/A'}</td>
                <td>${new Date(p.created_at).toLocaleDateString()}</td>
            </tr>
        `).join('');

        renderPagination('adminPredictionsPagination', data.pages, page, (p) => loadAdminPredictions(p));
    } catch (e) { tbody.innerHTML = '<tr><td colspan="6" style="color:red;">Error loading predictions.</td></tr>'; }
}

// ── System Health ────────────────────────────────────────────────
async function loadSystemHealth() {
    const token = localStorage.getItem('authToken');
    const el = document.getElementById('adminHealthContent');
    if (!el) return;
    el.innerHTML = '<p style="color:#9d174d;">Checking system health...</p>';

    try {
        const res = await fetch(`${ADMIN_API}/api/admin/system-health`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const dbOk = data.database === 'healthy';

        el.innerHTML = `
            <div class="health-indicator">
                <div class="health-dot ${dbOk ? 'green' : 'red'}"></div>
                <div>
                    <div style="font-weight:600; color:#831843;">Database</div>
                    <div style="font-size:0.85rem; color:#9d174d;">${data.database}</div>
                </div>
            </div>
            <div class="health-indicator">
                <div class="health-dot green"></div>
                <div>
                    <div style="font-weight:600; color:#831843;">API Server</div>
                    <div style="font-size:0.85rem; color:#9d174d;">Online</div>
                </div>
            </div>
            <div class="health-indicator">
                <div class="health-dot green"></div>
                <div>
                    <div style="font-weight:600; color:#831843;">Authentication</div>
                    <div style="font-size:0.85rem; color:#9d174d;">JWT Active</div>
                </div>
            </div>
            <div style="margin-top:1.5rem; padding:1rem; background:rgba(236,72,153,0.05); border-radius:12px; color:#831843; font-size:0.9rem;">
                <div><strong>Last Checked:</strong> ${new Date(data.timestamp).toLocaleString()}</div>
                <div><strong>Total Users:</strong> ${data.total_users}</div>
                <div><strong>Total Predictions:</strong> ${data.total_predictions}</div>
            </div>
        `;
    } catch (e) {
        el.innerHTML = '<p style="color:red;">Failed to fetch system health.</p>';
    }
}

// ── Helpers ──────────────────────────────────────────────────────
function riskClass(cat) {
    if (!cat) return 'low';
    const c = cat.toLowerCase();
    if (c.includes('high')) return 'high';
    if (c.includes('moderate')) return 'moderate';
    return 'low';
}

function renderPagination(containerId, totalPages, currentPage, callback) {
    const el = document.getElementById(containerId);
    if (!el || totalPages <= 1) { if (el) el.innerHTML = ''; return; }

    let html = `<button ${currentPage === 1 ? 'disabled' : ''} onclick="${callback.name ? callback.name + '(' + (currentPage - 1) + ')' : ''}">‹</button>`;
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="${i === currentPage ? 'active' : ''}" onclick="adminGoPage('${containerId}', ${i})">${i}</button>`;
    }
    html += `<button ${currentPage === totalPages ? 'disabled' : ''} onclick="adminGoPage('${containerId}', ${currentPage + 1})">›</button>`;
    el.innerHTML = html;
}

function adminGoPage(containerId, page) {
    if (containerId === 'adminUsersPagination') loadAdminUsers(page);
    if (containerId === 'adminPredictionsPagination') loadAdminPredictions(page);
}

// Expose globals
window.adminShowTab = adminShowTab;
window.loadAdminDashboard = loadAdminDashboard;
window.loadAdminUsers = loadAdminUsers;
window.loadAdminPredictions = loadAdminPredictions;
window.loadSystemHealth = loadSystemHealth;
window.adminDeleteUser = adminDeleteUser;
window.adminEditUser = adminEditUser;
window.adminToggleVerify = adminToggleVerify;
window.adminGoPage = adminGoPage;
