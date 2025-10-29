// Medical App JavaScript - Clean Version
const API_BASE_URL = 'http://127.0.0.1:5000';
let currentUser = null;
let authToken = null;

// Notification system
function showNotification(message, type = 'info') {
    console.log(`📢 Notification: [${type.toUpperCase()}] ${message}`);
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} alert-dismissible fade show`;
    notification.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Check backend connectivity
async function checkBackendStatus() {
    try {
        console.log('🌐 Checking backend connectivity...');
        const response = await fetch(`${API_BASE_URL}/health`, { 
            method: 'GET',
            timeout: 5000 
        });
        
        if (response.ok) {
            console.log('✅ Backend is online and responding');
            return true;
        } else {
            console.log('⚠️ Backend responded with status:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ Backend connectivity check failed:', error);
        showNotification('Unable to connect to server. Please check if the backend is running.', 'error');
        return false;
    }
}

// Global error handler
window.addEventListener('error', function(e) {
    console.error('🚨 JavaScript Error:', e.error);
    console.error('Error details:', { message: e.message, filename: e.filename, lineno: e.lineno, colno: e.colno });
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('🚨 Unhandled Promise Rejection:', e.reason);
});





// Debug: Log that functions are available
console.log('✅ Functions available:', {
    navigateTo: typeof window.navigateTo,
    handleLogin: typeof window.handleLogin,
    handleRegister: typeof window.handleRegister
});

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('🚀 App initializing...');
        
        // Ensure functions are still available
        window.navigateTo = navigateTo;
        window.handleLogin = handleLogin;
        window.handleRegister = handleRegister;
        window.showNotification = showNotification;
        
        // Check backend connectivity first
        checkBackendStatus();
        
        // Check for stored auth token FIRST
        authToken = localStorage.getItem('authToken');
        console.log('🔍 Initial auth check:', { authToken: !!authToken, tokenValue: authToken?.substring(0, 20) + '...' });
        
        if (authToken) {
            console.log('🔑 Found stored auth token, validating...');
            validateToken();
        } else {
            console.log('🏠 No auth token found, showing welcome page');
            updateUIForLoggedOutUser();
            // Check URL parameters for login redirect
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('email') && urlParams.has('password')) {
                console.log('🔄 URL contains login params, showing login page');
                navigateTo('login');
            } else {
                navigateTo('welcome');
            }
        }
        
        setupEventListeners();
        
        // Debug: Check what sections exist
        setTimeout(() => {
            const sections = document.querySelectorAll('.content-section');
            console.log('📋 Available sections after DOM load:', Array.from(sections).map(s => ({ id: s.id, display: s.style.display, hidden: s.classList.contains('d-none') })));
        }, 200);
        
        console.log('✅ App initialization completed successfully');
        

    } catch (error) {
        console.error('🚨 App initialization failed:', error);
        showNotification('Application failed to initialize. Please refresh the page.', 'error');
    }
});

// Enhanced navigateTo function
function navigateTo(sectionId) {
    console.log('🔄 Navigation requested to:', sectionId);
    console.log('🔑 Current auth state:', { authToken: !!authToken, currentUser: !!currentUser });
    
    // Block protected routes if not authenticated
    const protectedRoutes = ['dashboard', 'predict', 'documents', 'history', 'profile', 'medical-report'];
    const publicRoutes = ['welcome', 'login', 'register'];
    
    if (protectedRoutes.includes(sectionId) && !authToken) {
        console.log('🚫 Protected route requires authentication, redirecting to login');
        window.navigateTo('login');
        return false;
    }
    
    // Hide all sections
    const allSections = document.querySelectorAll('.content-section');
    allSections.forEach(section => {
        section.style.display = 'none';
        section.classList.add('d-none');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (!targetSection) {
        console.error('❌ Section not found:', sectionId);
        return false;
    }
    
    console.log('🎯 Showing section:', sectionId);
    targetSection.style.display = 'block';
    targetSection.classList.remove('d-none');
    targetSection.style.visibility = 'visible';
    targetSection.style.opacity = '1';
    
    // Layout management
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    if (publicRoutes.includes(sectionId)) {
        if (sidebar) sidebar.style.display = 'none';
        if (mainContent) {
            mainContent.style.marginLeft = '0';
            mainContent.style.width = '100vw';
            mainContent.classList.add('no-sidebar');
        }
    } else {
        if (sidebar) sidebar.style.display = 'flex';
        if (mainContent) {
            mainContent.style.marginLeft = '280px';
            mainContent.style.width = 'calc(100vw - 280px)';
            mainContent.classList.remove('no-sidebar');
        }
    }
    
    // Load section-specific data
    if (sectionId === 'dashboard' && currentUser) {
        setTimeout(() => {
            loadDashboardData();
            console.log('✅ Dashboard loaded and displayed');
        }, 100);
    }
    
    if (sectionId === 'history' && currentUser) {
        setTimeout(() => {
            loadPredictionHistory();
        }, 100);
    }
    
    if (sectionId === 'documents') {
        setTimeout(() => {
            loadUserDocuments();
        }, 100);
    }
    
    return true;
}

// Make functions globally available immediately
window.navigateTo = navigateTo;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;

function setupEventListeners() {
    console.log('🔍 Setting up event listeners...');
    
    // Setup login form with multiple attempts
    function setupLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            // Remove existing listeners to prevent duplicates
            loginForm.removeEventListener('submit', handleLogin);
            loginForm.addEventListener('submit', function(e) {
                console.log('🔑 Login form submitted');
                e.preventDefault();
                e.stopPropagation();
                handleLogin(e);
            });
            console.log('✅ Login form listener added');
            return true;
        }
        return false;
    }
    
    if (!setupLoginForm()) {
        // Try again after DOM is fully loaded
        setTimeout(setupLoginForm, 500);
        setTimeout(setupLoginForm, 1000);
    }
    
    // Setup register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        // Remove existing listeners to prevent duplicates
        registerForm.removeEventListener('submit', handleRegister);
        registerForm.addEventListener('submit', function(e) {
            console.log('🔐 Register form submitted');
            e.preventDefault();
            e.stopPropagation();
            handleRegister(e);
        });
        console.log('✅ Register form listener added');
    } else {
        console.log('⚠️ Register form not found during setup');
    }
    
    // Setup prediction form
    const predictionForm = document.getElementById('predictionForm');
    if (predictionForm) {
        predictionForm.addEventListener('submit', function(e) {
            console.log('🔮 Prediction form submitted');
            e.preventDefault();
            e.stopPropagation();
            handlePrediction(e);
        });
        console.log('✅ Prediction form listener added');
    }
}

async function handleLogin(e) {
    console.log('🔑 handleLogin called');
    if (e) e.preventDefault();
    
    const emailField = document.getElementById('loginEmail');
    const passwordField = document.getElementById('loginPassword');
    
    if (!emailField || !passwordField) {
        console.error('❌ Login form fields not found');
        showNotification('Login form not found. Please refresh the page.', 'error');
        return;
    }
    
    const email = emailField.value.trim();
    const password = passwordField.value.trim();
    
    console.log('📧 Email:', email);
    console.log('🔒 Password length:', password.length);
    
    if (!email || !password) {
        showNotification('Please enter both email and password', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = document.querySelector('#loginForm button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
        submitBtn.disabled = true;
    }
    
    try {
        console.log('🌐 Making login request...');
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        console.log('📡 Response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('📊 Response data:', data);
            
            authToken = data.access_token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            
            console.log('✅ Login successful for:', currentUser.username);
            
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-check"></i> Success!';
            }
            
            showNotification('Login successful! Welcome back.', 'success');
            
            // Immediate UI update and navigation
            updateUIForLoggedInUser();
            
            // Navigate to dashboard immediately after successful login
            console.log('🔄 Navigating to dashboard after login');
            navigateTo('dashboard');
        } else {
            const data = await response.json();
            console.error('❌ Login failed:', data);
            showNotification(data.error || data.message || 'Invalid credentials. Please check your email and password.', 'error');
            
            // Reset button - stay on login page
            if (submitBtn) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }
    } catch (error) {
        console.error('🚨 Network error:', error);
        showNotification('Network error. Please check your connection and try again.', 'error');
        
        // Reset button - stay on login page
        if (submitBtn) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
}

async function handleRegister(e) {
    console.log('🔐 handleRegister called');
    if (e) e.preventDefault();
    
    const username = document.getElementById('registerUsername')?.value?.trim();
    const email = document.getElementById('registerEmail')?.value?.trim();
    const password = document.getElementById('registerPassword')?.value;
    const confirmPassword = document.getElementById('registerConfirmPassword')?.value;
    
    console.log('📝 Registration data:', { username, email, passwordLength: password?.length });
    
    if (!username || !email || !password || !confirmPassword) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters long', 'error');
        return;
    }
    
    const submitBtn = document.querySelector('#registerForm button[type="submit"]');
    const originalText = submitBtn?.innerHTML || '';
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
        submitBtn.disabled = true;
    }
    
    try {
        console.log('🌐 Making registration request...');
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ username, email, password, role: 'patient' })
        });
        
        console.log('📡 Registration response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Registration successful:', data);
            
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-check"></i> Account Created!';
            }
            
            showNotification('Registration successful! Please sign in with your new account.', 'success');
            
            // Clear form fields
            document.getElementById('registerUsername').value = '';
            document.getElementById('registerEmail').value = '';
            document.getElementById('registerPassword').value = '';
            document.getElementById('registerConfirmPassword').value = '';
            
            setTimeout(() => {
                if (submitBtn) {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
                navigateTo('login');
            }, 1500);
        } else {
            const data = await response.json();
            console.error('❌ Registration failed:', data);
            
            // Show specific error messages without redirecting
            if (data.error && data.error.toLowerCase().includes('email')) {
                showNotification('This email is already registered. Please use a different email or sign in.', 'error');
            } else if (data.error && data.error.toLowerCase().includes('username')) {
                showNotification('This username is already taken. Please choose a different username.', 'error');
            } else {
                showNotification(data.error || data.message || 'Registration failed. Please try again.', 'error');
            }
            
            // Reset button - stay on register page
            if (submitBtn) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }
    } catch (error) {
        console.error('🚨 Registration network error:', error);
        showNotification('Network error. Please check your connection and try again.', 'error');
        
        // Reset button
        if (submitBtn) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
}

async function validateToken() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            currentUser = await response.json();
            console.log('✅ User validated:', currentUser.username);
            
            // Immediate UI update
            updateUIForLoggedInUser();
            
            // Navigate to dashboard
            setTimeout(() => {
                console.log('🔄 Navigating to dashboard after token validation');
                navigateTo('dashboard');
            }, 200);
        } else {
            console.log('⚠️ Token validation failed');
            localStorage.removeItem('authToken');
            authToken = null;
            currentUser = null;
            updateUIForLoggedOutUser();
            navigateTo('welcome');
        }
    } catch (error) {
        console.log('⚠️ Token validation error:', error);
        localStorage.removeItem('authToken');
        authToken = null;
        currentUser = null;
        updateUIForLoggedOutUser();
        navigateTo('welcome');
    }
}

function updateUIForLoggedInUser() {
    // Show sidebar and update navigation
    const sidebar = document.getElementById('sidebar');
    const authSidebar = document.getElementById('authSidebar');
    const mainSidebar = document.getElementById('mainSidebar');
    const userInfo = document.getElementById('userInfo');
    const mainContent = document.getElementById('mainContent');
    
    if (sidebar) sidebar.style.display = 'flex';
    if (authSidebar) authSidebar.classList.add('d-none');
    if (mainSidebar) mainSidebar.classList.remove('d-none');
    if (userInfo) userInfo.classList.remove('d-none');
    
    // Update sidebar username
    const sidebarUserName = document.getElementById('sidebarUserName');
    if (sidebarUserName) {
        sidebarUserName.textContent = currentUser.username;
    }
    
    // Update dashboard username
    const dashboardUserName = document.getElementById('dashboardUserName');
    if (dashboardUserName) {
        dashboardUserName.textContent = currentUser.username;
    }
    
    // Adjust main content for sidebar
    if (mainContent) {
        mainContent.style.marginLeft = '280px';
        mainContent.classList.remove('no-sidebar');
        mainContent.style.width = 'calc(100vw - 280px)';
    }
    
    // Remove auth body classes
    document.body.classList.remove('login-active', 'register-active');
    
    // Show quick access buttons for testing
    const quickAccess = document.getElementById('quickAccess');
    if (quickAccess) {
        quickAccess.style.display = 'block';
    }
    
    // Load dashboard data immediately after login
    setTimeout(() => {
        loadDashboardData();
    }, 200);
}

function loadProfileData() {
    console.log('loadProfileData called with currentUser:', currentUser);
    if (currentUser) {
        const usernameField = document.getElementById('profileUsername');
        const emailField = document.getElementById('profileEmail');
        console.log('Username field:', usernameField, 'Email field:', emailField);
        if (usernameField) usernameField.value = currentUser.username || '';
        if (emailField) emailField.value = currentUser.email || '';
        console.log('Profile data loaded');
    }
}

function updateUIForLoggedOutUser() {
    const sidebar = document.getElementById('sidebar');
    const authSidebar = document.getElementById('authSidebar');
    const mainSidebar = document.getElementById('mainSidebar');
    const userInfo = document.getElementById('userInfo');
    const quickAccess = document.getElementById('quickAccess');
    
    if (sidebar) sidebar.style.display = 'none';
    if (authSidebar) authSidebar.classList.remove('d-none');
    if (mainSidebar) mainSidebar.classList.add('d-none');
    if (userInfo) userInfo.classList.add('d-none');
    if (quickAccess) quickAccess.style.display = 'none';
}

function logout() {
    console.log('🚪 Logging out user...');
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.clear();
    
    // Force UI reset
    updateUIForLoggedOutUser();
    
    // Clear any cached state
    const medicalReportLink = document.getElementById('medicalReportLink');
    if (medicalReportLink) {
        medicalReportLink.classList.add('d-none');
    }
    
    // Reattach event listeners after logout
    setTimeout(() => {
        setupEventListeners();
        navigateTo('welcome');
    }, 100);
}

// Step navigation functions
function nextStep(step) {
    // Hide current step
    document.querySelectorAll('.form-step').forEach(s => s.classList.add('d-none'));
    
    // Show next step
    document.getElementById('step' + step).classList.remove('d-none');
    
    // Update progress bar
    const progress = (step / 4) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
    document.getElementById('progressBar').textContent = `Step ${step} of 4`;
}

function prevStep(step) {
    // Hide current step
    document.querySelectorAll('.form-step').forEach(s => s.classList.add('d-none'));
    
    // Show previous step
    document.getElementById('step' + step).classList.remove('d-none');
    
    // Update progress bar
    const progress = (step / 4) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
    document.getElementById('progressBar').textContent = `Step ${step} of 4`;
}

// Make functions globally available
window.nextStep = nextStep;
window.prevStep = prevStep;
window.logout = logout;

async function loadDashboardData() {
    try {
        console.log('Loading dashboard data...');
        
        // Load predictions count
        const response = await fetch(`${API_BASE_URL}/api/predictions`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Dashboard predictions loaded:', data);
            const predCountEl = document.getElementById('predictionCount');
            if (predCountEl) {
                predCountEl.textContent = data.predictions ? data.predictions.length : 0;
            }
        }
        
        // Load documents count
        const docResponse = await fetch(`${API_BASE_URL}/api/documents`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (docResponse.ok) {
            const docData = await docResponse.json();
            console.log('Dashboard documents loaded:', docData);
            const docCountElement = document.getElementById('documentCount');
            if (docCountElement) {
                const count = (docData && docData.documents && Array.isArray(docData.documents)) ? docData.documents.length : 0;
                docCountElement.textContent = count;
            }
        } else {
            console.error('Failed to load documents:', docResponse.status);
            const docCountEl = document.getElementById('documentCount');
            if (docCountEl) docCountEl.textContent = '0';
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        const predCountEl = document.getElementById('predictionCount');
        const docCountEl = document.getElementById('documentCount');
        if (predCountEl) predCountEl.textContent = '0';
        if (docCountEl) docCountEl.textContent = '0';
    }
}

function setupPredictionForm() {
    const predictionForm = document.getElementById('predictionForm');
    if (predictionForm && !predictionForm.hasAttribute('data-listener-added')) {
        predictionForm.addEventListener('submit', handlePrediction);
        predictionForm.setAttribute('data-listener-added', 'true');
    }
}

// Handle prediction form submission
async function handlePrediction(e) {
    e.preventDefault();
    
    // Prevent double submission
    if (window.predictionInProgress) {
        console.log('Prediction already in progress, ignoring duplicate submission');
        return;
    }
    window.predictionInProgress = true;
    
    // Collect form data
    const formData = {
        age: parseInt(document.getElementById('age').value),
        sex: parseInt(document.getElementById('sex').value),
        cp: parseInt(document.getElementById('cp').value),
        trestbps: parseInt(document.getElementById('trestbps').value),
        chol: parseInt(document.getElementById('chol').value),
        fbs: parseInt(document.getElementById('fbs').value),
        restecg: parseInt(document.getElementById('restecg').value),
        thalach: parseInt(document.getElementById('thalach').value),
        exang: parseInt(document.getElementById('exang').value),
        oldpeak: parseFloat(document.getElementById('oldpeak').value),
        slope: parseInt(document.getElementById('slope').value),
        ca: parseInt(document.getElementById('ca').value),
        thal: parseInt(document.getElementById('thal').value)
    };
    
    // Validate all fields are present and not NaN
    const missingFields = [];
    for (const [key, value] of Object.entries(formData)) {
        if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
            missingFields.push(key);
        }
    }
    
    if (missingFields.length > 0) {
        console.error('Missing or invalid fields:', missingFields);
        showNotification(`Missing data for: ${missingFields.join(', ')}. Please fill in all required fields.`, 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/predictions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                data: formData,
                model: 'main_pipeline',
                patient_name: document.getElementById('patientName').value
            })
        });
        
        const result = await response.json();
        console.log('Backend response:', JSON.stringify(result, null, 2));
        console.log('Prediction value:', result.result?.prediction || result.prediction);
        console.log('Confidence value:', result.result?.confidence_score || result.confidence_score);
        console.log('Risk category:', result.result?.risk_category || result.risk_category);
        
        if (response.ok) {
            showNotification('Prediction completed successfully!', 'success');
            showMedicalReportTab();
            generateMedicalReport(result.result || result, formData);
            loadDashboardData(); // Update dashboard count
        } else {
            showNotification(result.error || 'Prediction failed', 'error');
            console.error('Prediction error:', result);
        }
    } catch (error) {
        showNotification('Network error. Please try again.', 'error');
        console.error('Prediction error:', error);
    } finally {
        // Reset the flag to allow future submissions
        window.predictionInProgress = false;
    }
}

// Load user documents function
async function loadUserDocuments() {
    console.log('Loading user documents...');
    console.log('Current user:', currentUser);
    console.log('Auth token exists:', !!authToken);
    
    if (!authToken) {
        console.log('No auth token, cannot load documents');
        return;
    }
    
    if (currentUser) {
        console.log('Current user ID:', currentUser.id);
        console.log('Current username:', currentUser.username);
        console.log('Current email:', currentUser.email);
    }
    
    try {
        console.log('Making request to:', `${API_BASE_URL}/api/documents`);
        const response = await fetch(`${API_BASE_URL}/api/documents`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Accept': 'application/json'
            }
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Documents API response:', data);
            console.log('Documents array:', data.documents);
            console.log('Documents count:', data.documents ? data.documents.length : 0);
            displayUserDocuments(data.documents || []);
        } else {
            const errorText = await response.text();
            console.error('Failed to load documents:', response.status, errorText);
            displayUserDocuments([]);
        }
    } catch (error) {
        console.error('Error loading documents:', error);
        displayUserDocuments([]);
    }
}

function displayUserDocuments(documents) {
    const documentsContainer = document.getElementById('documentList');
    
    if (!documentsContainer) {
        console.error('Documents container not found');
        return;
    }
    
    if (documents.length === 0) {
        documentsContainer.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-file-medical" style="font-size: 3rem; color: #ec4899; margin-bottom: 1rem;"></i>
                <p style="color: #831843;">No documents uploaded yet</p>
            </div>
        `;
        return;
    }
    
    const documentsHTML = `
        <div class="row">
            ${documents.map(doc => {
                const uploadDate = new Date(doc.upload_date).toLocaleDateString();
                const fileSize = (doc.file_size / 1024 / 1024).toFixed(2);
                const statusBadge = getStatusBadge(doc.processing_status);
                
                return `
                    <div class="col-md-6 col-lg-4 mb-3">
                        <div style="background: rgba(244, 114, 182, 0.1); border: 1px solid rgba(244, 114, 182, 0.3); border-radius: 20px; padding: 1.5rem; transition: all 0.3s ease; height: 100%;" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 15px 35px rgba(236, 72, 153, 0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                            <div style="display: flex; justify-content: between; align-items: start; margin-bottom: 1rem;">
                                <div style="flex: 1;">
                                    <h6 style="color: #831843; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.9rem;" title="${doc.original_filename}">
                                        <i class="fas fa-file-medical" style="color: #ec4899; margin-right: 0.5rem;"></i>
                                        ${doc.original_filename.length > 25 ? doc.original_filename.substring(0, 25) + '...' : doc.original_filename}
                                    </h6>
                                </div>
                                <div style="margin-left: 0.5rem;">
                                    ${statusBadge}
                                </div>
                            </div>
                            <div style="margin-bottom: 1rem;">
                                <p style="color: #9d174d; margin: 0; font-size: 0.8rem; line-height: 1.4;">
                                    <i class="fas fa-calendar" style="color: #ec4899; margin-right: 0.3rem;"></i> ${uploadDate}<br>
                                    <i class="fas fa-weight" style="color: #ec4899; margin-right: 0.3rem;"></i> ${fileSize} MB<br>
                                    <i class="fas fa-tag" style="color: #ec4899; margin-right: 0.3rem;"></i> ${doc.document_type || 'Medical Report'}
                                </p>
                                ${doc.confidence_score ? `<p style="color: #9d174d; margin: 0.5rem 0 0 0; font-size: 0.8rem;"><i class="fas fa-chart-line" style="color: #ec4899; margin-right: 0.3rem;"></i> Confidence: ${(doc.confidence_score * 100).toFixed(1)}%</p>` : ''}
                            </div>
                            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                <button style="background: linear-gradient(135deg, #f8bbd9, #f472b6); border: none; color: white; padding: 0.4rem 0.8rem; border-radius: 15px; font-weight: 600; font-size: 0.75rem; cursor: pointer; flex: 1; min-width: 70px;" onclick="viewDocument(${doc.id})">
                                    <i class="fas fa-eye"></i> View
                                </button>
                                <button style="background: linear-gradient(135deg, #ec4899, #be185d); border: none; color: white; padding: 0.4rem 0.8rem; border-radius: 15px; font-weight: 600; font-size: 0.75rem; cursor: pointer; flex: 1; min-width: 70px;" onclick="deleteDocument(${doc.id})">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    documentsContainer.innerHTML = documentsHTML;
}

function getStatusBadge(status) {
    const badges = {
        'uploaded': '<span class="badge bg-info">Uploaded</span>',
        'processing': '<span class="badge bg-warning">Processing</span>',
        'completed': '<span class="badge bg-success">Processed</span>',
        'failed': '<span class="badge bg-danger">Failed</span>'
    };
    return badges[status] || '<span class="badge bg-secondary">Unknown</span>';
}

async function viewDocument(documentId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const doc = await response.json();
            showDocumentDetails(doc);
        } else {
            showNotification('Failed to load document details', 'error');
        }
    } catch (error) {
        console.error('Error viewing document:', error);
        showNotification('Error loading document', 'error');
    }
}

async function downloadDocument(documentId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}/download`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `document_${documentId}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showNotification('Document downloaded successfully', 'success');
        } else {
            showNotification('Failed to download document', 'error');
        }
    } catch (error) {
        console.error('Error downloading document:', error);
        showNotification('Error downloading document', 'error');
    }
}

async function deleteDocument(documentId) {
    if (!confirm('Are you sure you want to delete this document?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            showNotification('Document deleted successfully', 'success');
            loadUserDocuments(); // Reload the documents list
            loadDashboardData(); // Update dashboard count
        } else {
            showNotification('Failed to delete document', 'error');
        }
    } catch (error) {
        console.error('Error deleting document:', error);
        showNotification('Error deleting document', 'error');
    }
}

function showDocumentDetails(doc) {
    console.log('🔍 [v2.0] Showing document details for:', doc.original_filename);
    console.log('📊 Document data:', doc);
    
    // Force clear any existing modal
    let modalElement = document.getElementById('documentModal');
    if (modalElement) {
        modalElement.remove();
    }
    
    // Function to format parsed medical data professionally
    function formatMedicalData(parsedData) {
        console.log('🏥 Formatting medical data:', parsedData);
        
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
                    return value === 1 || value === '1' ? 'Male' : value === 0 || value === '0' ? 'Female' : value;
                case 'cp':
                    const cpTypes = ['Typical Angina', 'Atypical Angina', 'Non-anginal Pain', 'Asymptomatic'];
                    return cpTypes[parseInt(value)] || value;
                case 'fbs':
                    return value === 1 || value === '1' ? 'Yes (>120 mg/dl)' : value === 0 || value === '0' ? 'No (≤120 mg/dl)' : value;
                case 'restecg':
                    const ecgTypes = ['Normal', 'ST-T Abnormality', 'LV Hypertrophy'];
                    return ecgTypes[parseInt(value)] || value;
                case 'exang':
                    return value === 1 || value === '1' ? 'Yes' : value === 0 || value === '0' ? 'No' : value;
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
        let count = 0;
        
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
                count++;
            }
        });
        
        html += '</div>';
        
        if (count === 0) {
            return '<p class="text-muted">No recognized medical parameters found</p>';
        }
        
        return html;
    }
    
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
                            <h6 style="color: #831843; font-weight: 600; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-info-circle" style="color: #ec4899;"></i>
                                Document Information
                            </h6>
                            <div class="row">
                                <div class="col-md-6">
                                    <p style="margin-bottom: 0.5rem;"><strong>Upload Date:</strong> ${new Date(doc.upload_date).toLocaleString()}</p>
                                    <p style="margin-bottom: 0.5rem;"><strong>File Size:</strong> ${(doc.file_size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <div class="col-md-6">
                                    <p style="margin-bottom: 0.5rem;"><strong>Status:</strong> ${getStatusBadge(doc.processing_status)}</p>
                                    <p style="margin-bottom: 0.5rem;"><strong>Type:</strong> ${doc.document_type || 'Medical Report'}</p>
                                    ${doc.confidence_score ? `<p style="margin-bottom: 0.5rem;"><strong>OCR Confidence:</strong> ${(doc.confidence_score * 100).toFixed(1)}%</p>` : ''}
                                </div>
                            </div>
                        </div>
                        
                        ${doc.parsed_data ? `
                            <!-- Medical Parameters -->
                            <div style="background: rgba(244, 114, 182, 0.1); border: 1px solid rgba(244, 114, 182, 0.3); border-radius: 15px; padding: 1.5rem; margin-bottom: 2rem;">
                                <h6 style="color: #831843; font-weight: 600; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                                    <i class="fas fa-stethoscope" style="color: #ec4899;"></i>
                                    Medical Parameters
                                </h6>
                                ${formatMedicalData(doc.parsed_data)}
                            </div>
                        ` : ''}
                    </div>
                    <div class="modal-footer" style="background: rgba(236, 72, 153, 0.05); border-radius: 0 0 20px 20px; border: none; padding: 1.5rem;">
                        <button type="button" class="btn" data-bs-dismiss="modal" style="background: rgba(236, 72, 153, 0.1); border: 1px solid rgba(236, 72, 153, 0.3); color: #831843; padding: 0.75rem 1.5rem; border-radius: 15px; font-weight: 600;">
                            <i class="fas fa-times me-1"></i>Close
                        </button>
                        <button type="button" class="btn" onclick="downloadDocument(${doc.id})" style="background: linear-gradient(135deg, #ec4899, #be185d); border: none; color: white; padding: 0.75rem 1.5rem; border-radius: 15px; font-weight: 600; margin-left: 0.5rem;">
                            <i class="fas fa-download me-1"></i>Download
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    let existingModalCheck = document.getElementById('documentModal');
    if (existingModalCheck) {
        existingModalCheck.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('documentModal'));
    modal.show();
    
    // Clean up modal after it's hidden
    document.getElementById('documentModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

function showMedicalReportTab() {
    const medicalReportLink = document.getElementById('medicalReportLink');
    if (medicalReportLink) {
        medicalReportLink.classList.remove('d-none');
    }
}

function generateMedicalReport(predictionData, inputData) {
    // Store data globally for PDF generation
    window.currentPredictionInput = inputData;
    window.currentPredictionResult = predictionData;
    const reportContent = document.getElementById('reportContent');
    if (!reportContent) return;
    
    // Extract risk level from backend response - use backend's risk_category directly
    let riskLevel = 'Low Risk';
    if (predictionData.risk_category) {
        riskLevel = predictionData.risk_category;
        console.log('Using backend risk_category:', riskLevel);
    } else {
        // Fallback: determine from prediction and confidence
        const prediction = predictionData.prediction;
        const confidence = predictionData.confidence_score || 0.5;
        console.log('Fallback logic - prediction:', prediction, 'confidence:', confidence);
        
        if (prediction === 0) {
            riskLevel = 'Low Risk';
        } else if (prediction === 1) {
            if (confidence >= 0.75) {
                riskLevel = 'High Risk';
            } else if (confidence >= 0.50) {
                riskLevel = 'Moderate Risk';
            } else {
                riskLevel = 'Low Risk';
            }
        }
        console.log('Calculated risk level:', riskLevel);
    }
    
    // Extract confidence from backend response
    let confidence = '95.0';
    if (predictionData.confidence_score) {
        confidence = (predictionData.confidence_score * 100).toFixed(1);
    } else if (predictionData.confidence) {
        confidence = (predictionData.confidence * 100).toFixed(1);
    }
    const patientName = inputData.patientName || document.getElementById('patientName')?.value || 'sangeetha';
    const reportDate = new Date().toLocaleDateString() + ', ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) + ' PM';
    const patientId = 'Y2IW8U7YR';
    
    reportContent.innerHTML = `
        <!-- Floating Elements -->
        <div class="floating-elements">
            <div class="floating-circle"></div>
            <div class="floating-circle"></div>
            <div class="floating-circle"></div>
        </div>
        
        <!-- Header Section -->
        <div class="professional-card" style="background: linear-gradient(135deg, rgba(244, 114, 182, 0.15), rgba(236, 72, 153, 0.1)); border: 2px solid rgba(244, 114, 182, 0.3); border-radius: 20px; padding: 2rem; margin-bottom: 2rem; text-align: center; animation: slideInUp 0.8s ease-out;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; margin-bottom: 1.5rem;">
                <div class="pulse-heart" style="width: 60px; height: 60px; background: linear-gradient(135deg, #f8bbd9, #ec4899); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-heartbeat" style="color: white; font-size: 1.5rem;"></i>
                </div>
                <div>
                    <h2 style="color: #831843; font-weight: 700; margin: 0; font-size: 1.8rem;">ADVANCED CARDIOVASCULAR</h2>
                    <h2 style="color: #831843; font-weight: 700; margin: 0; font-size: 1.8rem;">RISK ASSESSMENT</h2>
                </div>
            </div>
            <div style="height: 3px; background: linear-gradient(90deg, #f8bbd9, #ec4899, #be185d); border-radius: 2px; margin: 1rem auto; width: 60%;"></div>
            <div style="display: flex; justify-content: space-around; margin-top: 2rem;">
                <div style="background: rgba(244, 114, 182, 0.1); padding: 1rem 1.5rem; border-radius: 15px; border: 1px solid rgba(244, 114, 182, 0.3); animation: slideInUp 0.8s ease-out 0.2s both;">
                    <i class="fas fa-brain" style="color: #ec4899; font-size: 1.5rem; margin-bottom: 0.5rem;"></i>
                    <div style="color: #831843; font-weight: 600; font-size: 0.9rem;">AI-Powered Analysis</div>
                </div>
                <div style="background: rgba(244, 114, 182, 0.1); padding: 1rem 1.5rem; border-radius: 15px; border: 1px solid rgba(244, 114, 182, 0.3); animation: slideInUp 0.8s ease-out 0.4s both;">
                    <i class="fas fa-shield-alt" style="color: #ec4899; font-size: 1.5rem; margin-bottom: 0.5rem;"></i>
                    <div style="color: #831843; font-weight: 600; font-size: 0.9rem;">Medical Grade Security</div>
                </div>
                <div style="background: rgba(244, 114, 182, 0.1); padding: 1rem 1.5rem; border-radius: 15px; border: 1px solid rgba(244, 114, 182, 0.3); animation: slideInUp 0.8s ease-out 0.6s both;">
                    <i class="fas fa-microscope" style="color: #ec4899; font-size: 1.5rem; margin-bottom: 0.5rem;"></i>
                    <div style="color: #831843; font-weight: 600; font-size: 0.9rem;">Research Backed</div>
                </div>
            </div>
        </div>
        
        <!-- Patient Info & Report Details -->
        <div class="professional-card" style="background: linear-gradient(135deg, rgba(244, 114, 182, 0.1), rgba(236, 72, 153, 0.05)); border: 2px solid rgba(244, 114, 182, 0.3); border-radius: 20px; padding: 2rem; margin-bottom: 2rem; animation: slideInUp 0.8s ease-out 0.3s both;">
            <div class="row">
                <div class="col-md-6">
                    <h4 style="color: #831843; font-weight: 700; margin-bottom: 1.5rem; text-transform: uppercase; letter-spacing: 1px;">PATIENT INFORMATION</h4>
                    <div style="color: #831843; line-height: 2;">
                        <div><strong>Name:</strong> ${patientName}</div>
                        <div><strong>Age:</strong> ${inputData.age} years</div>
                        <div><strong>Gender:</strong> ${inputData.sex === 1 ? 'Male' : 'Female'}</div>
                        <div><strong>Patient ID:</strong> ${patientId}</div>
                    </div>
                </div>
                <div class="col-md-6">
                    <h4 style="color: #831843; font-weight: 700; margin-bottom: 1.5rem; text-transform: uppercase; letter-spacing: 1px;">REPORT DETAILS</h4>
                    <div style="color: #831843; line-height: 2;">
                        <div><strong>Report Date:</strong> ${reportDate}</div>
                        <div><strong>Analysis Model:</strong> Heart Disease Prediction Model</div>
                        <div><strong>Report Type:</strong> Cardiovascular Risk Assessment</div>
                        <div><strong>Status:</strong> <span style="color: #10b981; font-weight: 600;">Complete</span></div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Risk Assessment Banner -->
        <div class="professional-card" style="background: linear-gradient(135deg, ${getRiskGradient(riskLevel)}); border: 2px solid ${getRiskBorderColor(riskLevel)}; border-radius: 20px; padding: 2.5rem; margin-bottom: 2rem; text-align: center; color: white; animation: slideInUp 0.8s ease-out 0.5s both;">
            <h1 class="pulse-heart" style="font-size: 2.5rem; font-weight: 800; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 2px;">${riskLevel}</h1>
            <h3 style="font-size: 1.3rem; margin-bottom: 1.5rem; opacity: 0.9;">Confidence Level: ${confidence}%</h3>
            <div style="background: rgba(255, 255, 255, 0.1); padding: 1.5rem; border-radius: 15px; margin-top: 1.5rem;">
                <p style="margin: 0; font-size: 1rem; line-height: 1.6;"><strong>Assessment Summary:</strong> ${generateAssessmentSummary(riskLevel, inputData)}</p>
            </div>
        </div>
        
        <!-- Precautionary Measures -->
        <div class="professional-card" style="margin-bottom: 2rem; animation: slideInUp 0.8s ease-out 0.7s both;">
            <h3 style="color: #831843; font-weight: 700; margin-bottom: 2rem; text-transform: uppercase; letter-spacing: 1px; text-align: center;">PRECAUTIONARY MEASURES</h3>
            <div class="row">
                <div class="col-md-4 mb-3">
                    <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05)); border: 2px solid rgba(16, 185, 129, 0.3); border-radius: 15px; padding: 1.5rem; height: 100%; animation: slideInUp 0.8s ease-out 0.9s both; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 15px 35px rgba(16, 185, 129, 0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                            <i class="fas fa-heart-pulse" style="color: #10b981; font-size: 1.2rem;"></i>
                            <h5 style="color: #831843; font-weight: 600; margin: 0;">Preventive Care</h5>
                        </div>
                        <ul style="color: #831843; font-size: 0.9rem; line-height: 1.8; padding-left: 1rem;">
                            <li>Regular health check-ups every 6 months</li>
                            <li>Blood pressure monitoring at home</li>
                            <li>Annual comprehensive metabolic panel</li>
                            <li>Maintain vaccination schedule</li>
                            <li>Dental health maintenance</li>
                        </ul>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div style="background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(8, 145, 178, 0.05)); border: 2px solid rgba(6, 182, 212, 0.3); border-radius: 15px; padding: 1.5rem; height: 100%; animation: slideInUp 0.8s ease-out 1.1s both; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 15px 35px rgba(6, 182, 212, 0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                            <i class="fas fa-apple-alt" style="color: #06b6d4; font-size: 1.2rem;"></i>
                            <h5 style="color: #831843; font-weight: 600; margin: 0;">Nutritional Guidelines</h5>
                        </div>
                        <ul style="color: #831843; font-size: 0.9rem; line-height: 1.8; padding-left: 1rem;">
                            <li>Limit sodium intake to 2300mg daily</li>
                            <li>Increase omega-3 fatty acids</li>
                            <li>Choose whole grains over refined</li>
                            <li>Limit saturated and trans fats</li>
                            <li>Portion control and mindful eating</li>
                        </ul>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.05)); border: 2px solid rgba(245, 158, 11, 0.3); border-radius: 15px; padding: 1.5rem; height: 100%; animation: slideInUp 0.8s ease-out 1.3s both; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 15px 35px rgba(245, 158, 11, 0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                            <i class="fas fa-running" style="color: #f59e0b; font-size: 1.2rem;"></i>
                            <h5 style="color: #831843; font-weight: 600; margin: 0;">Physical Activity</h5>
                        </div>
                        <ul style="color: #831843; font-size: 0.9rem; line-height: 1.8; padding-left: 1rem;">
                            <li>Gradual increase in exercise intensity</li>
                            <li>Mix of cardio and strength training</li>
                            <li>Warm-up and cool-down routines</li>
                            <li>Listen to your body's signals</li>
                            <li>Stay hydrated during activities</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Methodology & Limitations -->
        <div class="professional-card" style="background: linear-gradient(135deg, rgba(244, 114, 182, 0.1), rgba(236, 72, 153, 0.05)); border: 2px solid rgba(244, 114, 182, 0.3); border-radius: 20px; padding: 2rem; margin-bottom: 2rem; animation: slideInUp 0.8s ease-out 1.5s both;">
            <h3 style="color: #831843; font-weight: 700; margin-bottom: 1.5rem; text-transform: uppercase; letter-spacing: 1px;">METHODOLOGY & LIMITATIONS</h3>
            <div style="color: #831843; line-height: 1.8;">
                <p><strong>Analysis Method:</strong> This assessment was performed using a validated machine learning model trained on clinical cardiovascular data. The model analyzes multiple risk factors to provide a comprehensive risk stratification.</p>
                <p><strong>Limitations:</strong> This analysis is based on the provided clinical parameters and should be interpreted in conjunction with complete clinical evaluation. It does not replace professional medical judgment and should not be used as the sole basis for clinical decision-making.</p>
                <p><strong>Confidence Level:</strong> The reported confidence level of ${confidence}% indicates the model's certainty in the risk assessment based on the input parameters.</p>
            </div>
        </div>
        
        <!-- Action Buttons -->
        <div style="text-align: center; margin: 3rem 0; animation: slideInUp 0.8s ease-out 1.7s both;">
            <button onclick="generatePDFReport()" style="background: linear-gradient(135deg, #f8bbd9, #ec4899); border: none; color: white; padding: 1rem 2rem; border-radius: 25px; font-weight: 600; margin-right: 1rem; cursor: pointer; font-size: 1rem; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 10px 25px rgba(236, 72, 153, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                <i class="fas fa-file-pdf"></i> Generate PDF Report
            </button>
            <button onclick="closeReport()" style="background: linear-gradient(135deg, #ec4899, #be185d); border: none; color: white; padding: 1rem 2rem; border-radius: 25px; font-weight: 600; cursor: pointer; font-size: 1rem; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 10px 25px rgba(236, 72, 153, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                Close Report
            </button>
        </div>
        
        <!-- Footer -->
        <div class="professional-card" style="display: flex; justify-content: space-between; align-items: center; padding: 2rem; background: rgba(244, 114, 182, 0.05); border-radius: 15px; margin-top: 2rem; animation: slideInUp 0.8s ease-out 1.9s both;">
            <div style="color: #831843;">
                <div style="font-weight: 600;">AI Analysis System</div>
                <div style="font-size: 0.9rem;">Automated Report Generation</div>
            </div>
            <div style="color: #831843; text-align: right;">
                <div style="font-weight: 600;">Date of Report</div>
                <div style="font-size: 0.9rem;">${new Date().toLocaleDateString()}</div>
            </div>
        </div>
    `;
    
    // Navigate to medical report
    setTimeout(() => navigateTo('medical-report'), 500);
}

function generateAssessmentSummary(riskLevel, inputData) {
    const age = inputData.age;
    const bp = inputData.trestbps;
    const chol = inputData.chol;
    
    if (riskLevel === 'High Risk') {
        return `Based on the clinical parameters analyzed, this patient presents with elevated cardiovascular risk factors. Key concerns include blood pressure readings of ${bp} mmHg and cholesterol levels of ${chol} mg/dl. At age ${age}, immediate medical attention and lifestyle modifications are recommended to mitigate potential cardiac events.`;
    } else if (riskLevel === 'Moderate Risk') {
        return `The assessment indicates moderate cardiovascular risk with some parameters requiring attention. Blood pressure (${bp} mmHg) and cholesterol (${chol} mg/dl) levels suggest the need for preventive measures and regular monitoring. Age-appropriate interventions are recommended.`;
    } else {
        return `Current cardiovascular risk assessment shows favorable results with most parameters within acceptable ranges. Blood pressure (${bp} mmHg) and cholesterol (${chol} mg/dl) levels are manageable. Continue current lifestyle practices with routine monitoring.`;
    }
}

function generatePrecautionaryMeasures(riskLevel) {
    const measures = {
        'High Risk': [
            'Monitor blood pressure daily and maintain log',
            'Increase omega-3 fatty acids (fish, walnuts, flaxseed)',
            'Engage in supervised cardio and strength training',
            'Schedule quarterly cholesterol checks',
            'Adopt Mediterranean diet with whole grains',
            'Implement proper warm-up and cool-down routines',
            'Maintain current vaccination schedule',
            'Eliminate trans fats and limit saturated fats',
            'Schedule dental checkups every 6 months',
            'Practice strict portion control and adequate hydration'
        ],
        'Moderate Risk': [
            'Monitor blood pressure weekly',
            'Include omega-3 rich foods 3x per week',
            'Mix moderate cardio with strength training',
            'Annual comprehensive cholesterol panel',
            'Choose whole grains over refined carbohydrates',
            'Always warm-up before exercise',
            'Stay up-to-date with vaccinations',
            'Limit saturated fats to <7% of daily calories',
            'Maintain good dental hygiene',
            'Practice mindful eating and stay hydrated'
        ],
        'Low Risk': [
            'Monitor blood pressure monthly',
            'Include fish in diet twice weekly',
            'Regular cardio and strength training routine',
            'Annual cholesterol screening',
            'Maintain balanced diet with whole grains',
            'Continue current exercise routine with proper form',
            'Keep vaccinations current',
            'Maintain healthy fat intake',
            'Regular dental care',
            'Continue healthy portion sizes and hydration'
        ]
    };
    
    const riskMeasures = measures[riskLevel] || measures['Low Risk'];
    
    return `
        <div class="row">
            ${riskMeasures.map((measure, index) => `
                <div class="col-md-6 mb-3">
                    <div style="display: flex; align-items: start; gap: 0.5rem; padding: 1rem; background: rgba(236, 72, 153, 0.05); border-radius: 10px;">
                        <i class="fas fa-check-circle" style="color: #10b981; margin-top: 0.2rem;"></i>
                        <span style="color: #831843; font-size: 0.9rem;">${measure}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function generateHeartTemplates() {
    const templates = [
        {
            condition: 'Hypertension',
            icon: 'fa-tachometer-alt',
            summary: 'High blood pressure requiring monitoring and management',
            tests: ['24-hour BP monitoring', 'Echocardiogram', 'Kidney function tests'],
            treatments: ['ACE inhibitors', 'Lifestyle modifications', 'Sodium restriction'],
            followUp: 'Every 3-6 months'
        },
        {
            condition: 'Arrhythmia',
            icon: 'fa-heartbeat',
            summary: 'Irregular heart rhythm patterns requiring evaluation',
            tests: ['ECG', 'Holter monitor', 'Electrophysiology study'],
            treatments: ['Antiarrhythmic drugs', 'Cardioversion', 'Pacemaker if needed'],
            followUp: 'Every 6 months'
        },
        {
            condition: 'Coronary Artery Disease',
            icon: 'fa-heart',
            summary: 'Narrowed coronary arteries affecting blood flow',
            tests: ['Stress test', 'Cardiac catheterization', 'CT angiography'],
            treatments: ['Statins', 'Antiplatelet therapy', 'Revascularization'],
            followUp: 'Every 3-4 months'
        }
    ];
    
    return `
        <div class="row">
            ${templates.map(template => `
                <div class="col-md-4 mb-3">
                    <div style="background: rgba(236, 72, 153, 0.05); border: 1px solid rgba(236, 72, 153, 0.2); border-radius: 15px; padding: 1.5rem; height: 100%;">
                        <div style="text-align: center; margin-bottom: 1rem;">
                            <i class="fas ${template.icon}" style="font-size: 2rem; color: #ec4899; margin-bottom: 0.5rem;"></i>
                            <h5 style="color: #831843; font-weight: 600;">${template.condition}</h5>
                        </div>
                        <p style="color: #9d174d; font-size: 0.9rem; margin-bottom: 1rem;">${template.summary}</p>
                        <div style="margin-bottom: 1rem;">
                            <h6 style="color: #831843; font-size: 0.8rem; margin-bottom: 0.5rem;">Recommended Tests:</h6>
                            <ul style="color: #9d174d; font-size: 0.8rem; margin: 0; padding-left: 1rem;">
                                ${template.tests.map(test => `<li>${test}</li>`).join('')}
                            </ul>
                        </div>
                        <div style="margin-bottom: 1rem;">
                            <h6 style="color: #831843; font-size: 0.8rem; margin-bottom: 0.5rem;">Treatment Options:</h6>
                            <ul style="color: #9d174d; font-size: 0.8rem; margin: 0; padding-left: 1rem;">
                                ${template.treatments.map(treatment => `<li>${treatment}</li>`).join('')}
                            </ul>
                        </div>
                        <p style="color: #831843; font-size: 0.8rem; margin: 0;"><strong>Follow-up:</strong> ${template.followUp}</p>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function getRiskGradient(riskLevel) {
    if (riskLevel === 'High Risk' || riskLevel === 'High') return '#ef4444, #dc2626';
    if (riskLevel === 'Moderate Risk' || riskLevel === 'Moderate') return '#f59e0b, #d97706';
    return '#10b981, #059669';
}

function getRiskBorderColor(riskLevel) {
    if (riskLevel === 'High Risk' || riskLevel === 'High') return '#ef4444';
    if (riskLevel === 'Moderate Risk' || riskLevel === 'Moderate') return '#f59e0b';
    return '#10b981';
}

async function generatePDFReport() {
    try {
        // Get the current prediction data from the medical report
        const reportContent = document.getElementById('reportContent');
        if (!reportContent) {
            showNotification('No report data available for PDF generation', 'error');
            return;
        }
        
        // Get current patient name from the medical report display or form
        const patientNameFromReport = reportContent.textContent.match(/Name:\s*([^\n]+)/)?.[1]?.trim();
        const patientNameFromForm = document.getElementById('patientName')?.value;
        const currentPatientName = patientNameFromForm || patientNameFromReport || 'Unknown Patient';
        
        console.log('Patient name from form:', patientNameFromForm);
        console.log('Patient name from report:', patientNameFromReport);
        console.log('Using patient name:', currentPatientName);
        
        // Update the stored input data with current patient name
        if (window.currentPredictionInput) {
            window.currentPredictionInput.patient_name = currentPatientName;
            window.currentPredictionInput.patientName = currentPatientName;
        }
        
        // Show loading state
        const button = event?.target || document.querySelector('button[onclick*="generatePDFReport"]');
        const originalText = button?.innerHTML || 'Generate PDF Report';
        if (button) {
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';
            button.disabled = true;
        }
        
        // Make request to generate PDF
        console.log('PDF Generation - Input data:', window.currentPredictionInput);
        console.log('PDF Generation - Patient name in input:', window.currentPredictionInput?.patient_name);
        console.log('PDF Generation - PatientName in input:', window.currentPredictionInput?.patientName);
        console.log('PDF Generation - Result data:', window.currentPredictionResult);
        
        const response = await fetch(`${API_BASE_URL}/api/reports/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                input_data: window.currentPredictionInput || {},
                prediction_result: window.currentPredictionResult || {}
            })
        });
        
        if (response.ok) {
            // Handle PDF download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `medical_report_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showNotification('PDF report generated successfully!', 'success');
        } else {
            const errorData = await response.json();
            showNotification(errorData.error || 'Failed to generate PDF report', 'error');
        }
    } catch (error) {
        console.error('PDF generation error:', error);
        showNotification('Error generating PDF report. Please try again.', 'error');
    } finally {
        // Reset button state
        if (button) {
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }
}

function displayPredictionResult(data) {
    // Keep existing simple result display for backward compatibility
    const resultContainer = document.getElementById('predictionResult');
    const resultContent = document.getElementById('resultContent');
    
    if (!resultContainer || !resultContent) {
        console.error('Result containers not found');
        return;
    }
    
    // Extract risk level from backend response - use backend's risk_category directly
    const resultData = data.result || data;
    let riskLevel = 'Low Risk';
    if (resultData.risk_category) {
        riskLevel = resultData.risk_category;
        console.log('Display: Using backend risk_category:', riskLevel);
    } else {
        // Fallback: determine from prediction and confidence
        const prediction = resultData.prediction;
        const confidence = resultData.confidence_score || 0.5;
        console.log('Display fallback - prediction:', prediction, 'confidence:', confidence);
        
        if (prediction === 0) {
            riskLevel = 'Low Risk';
        } else if (prediction === 1) {
            if (confidence >= 0.75) {
                riskLevel = 'High Risk';
            } else if (confidence >= 0.50) {
                riskLevel = 'Moderate Risk';
            } else {
                riskLevel = 'Low Risk';
            }
        }
        console.log('Display calculated risk level:', riskLevel);
    }
    
    // Extract confidence from backend response
    let confidence = '95.0';
    if (resultData.confidence_score) {
        confidence = (resultData.confidence_score * 100).toFixed(1);
    } else if (resultData.confidence) {
        confidence = (resultData.confidence * 100).toFixed(1);
    }
    
    resultContent.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <h3 style="color: #831843; margin-bottom: 1rem;">Prediction Result</h3>
            <div style="background: rgba(236, 72, 153, 0.1); border: 1px solid rgba(236, 72, 153, 0.3); border-radius: 15px; padding: 2rem; margin-bottom: 1rem;">
                <h4 style="color: #ec4899; margin-bottom: 0.5rem;">${riskLevel}</h4>
                <p style="color: #831843;">Confidence: ${confidence}%</p>
            </div>
            <button class="btn" onclick="navigateTo('medical-report')" style="background: linear-gradient(135deg, #ec4899, #be185d); border: none; color: white; padding: 0.75rem 2rem; border-radius: 25px; font-weight: 600; margin-right: 1rem;">
                View Medical Report
            </button>
            <button class="btn" onclick="navigateTo('history')" style="background: linear-gradient(135deg, #10b981, #059669); border: none; color: white; padding: 0.75rem 2rem; border-radius: 25px; font-weight: 600;">
                View History
            </button>
        </div>
    `;
    
    resultContainer.classList.remove('d-none');
    resultContainer.scrollIntoView({ behavior: 'smooth' });
}

// Load prediction history function
function loadPredictionHistory() {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        const emptyState = document.getElementById('emptyHistoryState');
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    console.log('Loading prediction history...');
    
    fetch('http://127.0.0.1:5000/api/predictions', {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
    .then(response => {
        console.log('History response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('History API response:', data);
        
        const historyList = document.getElementById('historyList');
        const emptyState = document.getElementById('emptyHistoryState');
        
        if (!historyList) {
            console.error('History list container not found');
            return;
        }
        
        // Get predictions array from response
        let predictions = [];
        if (data.predictions && Array.isArray(data.predictions)) {
            predictions = data.predictions.filter(item => {
                // Include items that have either result data or prediction data
                return (item.result || item.prediction !== undefined) && 
                       item.input_data && 
                       !item.document_type;
            });
        }
        
        console.log('Filtered predictions for history:', predictions.length);
        
        if (predictions.length > 0) {
            // Create simple history cards
            const historyHTML = predictions.map(prediction => {
                const inputData = prediction.input_data || {};
                const resultData = prediction.result || {};
                
                // Parse result if it's a string
                let parsedResult = resultData;
                if (typeof resultData === 'string') {
                    try {
                        parsedResult = JSON.parse(resultData);
                    } catch (e) {
                        parsedResult = resultData;
                    }
                }
                
                // Determine risk level - use backend's risk_category directly
                let riskText = 'Low Risk';
                let riskColor = '#10b981';
                
                if (parsedResult.risk_category) {
                    riskText = parsedResult.risk_category;
                } else if (prediction.risk_category) {
                    riskText = prediction.risk_category;
                } else {
                    // Fallback: determine from prediction and confidence
                    const pred = parsedResult.prediction || prediction.prediction;
                    const conf = parsedResult.confidence_score || prediction.confidence_score || 0.5;
                    
                    if (pred === 0) {
                        riskText = 'High Risk';
                    } else if (pred === 0.5) {
                        riskText = 'Moderate Risk';
                    } else if (pred === 1) {
                        riskText = 'Low Risk';
                    } else {
                        riskText = 'Low Risk';
                    }
                }
                
                // Set color based on risk text
                if (riskText === 'High Risk' || riskText === 'High') {
                    riskColor = '#ef4444';
                } else if (riskText === 'Moderate Risk' || riskText === 'Moderate') {
                    riskColor = '#f59e0b';
                } else {
                    riskColor = '#10b981';
                }
                
                const date = new Date(prediction.created_at).toLocaleDateString();
                const time = new Date(prediction.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                
                return `
                    <div class="col-md-6 mb-4">
                        <div style="background: rgba(244, 114, 182, 0.1); border: 1px solid rgba(244, 114, 182, 0.3); border-radius: 20px; padding: 1.5rem; transition: all 0.3s ease; cursor: pointer;" onclick="showPatientDetails(${prediction.id})" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 15px 35px rgba(236, 72, 153, 0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                            
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                                <div style="padding: 0.3rem 0.8rem; border-radius: 15px; font-size: 0.75rem; font-weight: 600; display: flex; align-items: center; gap: 0.3rem; background: rgba(${riskColor === '#ef4444' ? '239, 68, 68' : '34, 197, 94'}, 0.1); color: ${riskColor};">
                                    <i class="fas ${riskColor === '#ef4444' ? 'fa-exclamation-triangle' : 'fa-heart'}"></i>
                                    ${riskText}
                                </div>
                                <div style="font-size: 0.75rem; color: #9d174d; text-align: right;">
                                    ${date}<br>
                                    ${time}
                                </div>
                            </div>
                            
                            <div style="display: flex; align-items: center; gap: 0.8rem; margin-bottom: 1rem;">
                                <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #ec4899, #be185d); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 1.1rem;">
                                    ${(inputData.patientName || inputData.patient_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase()}
                                </div>
                                <div>
                                    <h6 style="margin: 0; color: #831843; font-weight: 600; font-size: 1rem;">${inputData.patientName || inputData.patient_name || 'Unknown Patient'}</h6>
                                    <div style="display: flex; gap: 1rem; margin: 0; font-size: 0.8rem; color: #9d174d;">
                                        <span><i class="fas fa-birthday-cake"></i> Age: ${inputData.age || 'N/A'}</span>
                                        <span><i class="fas ${inputData.sex === '1' || inputData.sex === 1 ? 'fa-mars' : inputData.sex === '0' || inputData.sex === 0 ? 'fa-venus' : 'fa-question'}"></i> ${inputData.sex === '1' || inputData.sex === 1 ? 'Male' : inputData.sex === '0' || inputData.sex === 0 ? 'Female' : 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                                <div style="text-align: center; padding: 0.8rem; background: rgba(236, 72, 153, 0.05); border-radius: 12px;">
                                    <div style="font-size: 0.7rem; color: #9d174d; margin-bottom: 0.2rem; text-transform: uppercase; font-weight: 500;">Blood Pressure</div>
                                    <div style="font-size: 1.1rem; font-weight: 700; color: #831843;">${inputData.trestbps || 'N/A'}</div>
                                </div>
                                <div style="text-align: center; padding: 0.8rem; background: rgba(236, 72, 153, 0.05); border-radius: 12px;">
                                    <div style="font-size: 0.7rem; color: #9d174d; margin-bottom: 0.2rem; text-transform: uppercase; font-weight: 500;">Cholesterol</div>
                                    <div style="font-size: 1.1rem; font-weight: 700; color: #831843;">${inputData.chol || 'N/A'}</div>
                                </div>
                            </div>
                            
                            <div style="padding-top: 1rem; border-top: 1px solid rgba(236, 72, 153, 0.1);">
                                <button style="background: linear-gradient(135deg, #ec4899, #be185d); border: none; color: white; padding: 0.6rem 1.5rem; border-radius: 20px; font-weight: 600; font-size: 0.8rem; cursor: pointer; transition: all 0.3s ease; width: 100%;" onclick="event.stopPropagation(); showPatientDetails(${prediction.id})" onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 15px rgba(236, 72, 153, 0.3)';" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';">
                                    <i class="fas fa-eye"></i> View Details
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            historyList.innerHTML = historyHTML;
            if (emptyState) emptyState.style.display = 'none';
            
            // Store predictions globally for showPatientDetails function
            window.globalPredictions = predictions;
        } else {
            historyList.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
        }
    })
    .catch(error => {
        console.error('Error loading history:', error);
        const historyList = document.getElementById('historyList');
        if (historyList) {
            historyList.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger" role="alert">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Failed to load prediction history. Please try again.
                    </div>
                </div>
            `;
        }
    });
}

// Show patient details function
function showPatientDetails(predictionId) {
    const predictions = window.globalPredictions || [];
    const prediction = predictions.find(p => p.id === predictionId);
    if (!prediction) {
        alert('Prediction details not found');
        return;
    }
    
    const inputData = prediction.input_data || {};
    const resultData = prediction.result || {};
    
    // Parse result if it's a string
    let parsedResult = resultData;
    if (typeof resultData === 'string') {
        try {
            parsedResult = JSON.parse(resultData);
        } catch (e) {
            parsedResult = resultData;
        }
    }
    
    const detailsHtml = `
        <div class="row">
            <div class="col-md-6">
                <h6 style="color: #06b6d4; margin-bottom: 1rem;">Patient Information</h6>
                <p><strong>Name:</strong> ${inputData.patientName || inputData.patient_name || 'N/A'}</p>
                <p><strong>Age:</strong> ${inputData.age || 'N/A'}</p>
                <p><strong>Sex:</strong> ${inputData.sex === '1' || inputData.sex === 1 ? 'Male' : inputData.sex === '0' || inputData.sex === 0 ? 'Female' : 'N/A'}</p>
                <p><strong>Chest Pain Type:</strong> ${getChestPainTypeText(inputData.cp)}</p>
            </div>
            <div class="col-md-6">
                <h6 style="color: #10b981; margin-bottom: 1rem;">Health Metrics</h6>
                <p><strong>Blood Pressure:</strong> ${inputData.trestbps || 'N/A'}</p>
                <p><strong>Cholesterol:</strong> ${inputData.chol || 'N/A'}</p>
                <p><strong>Max Heart Rate:</strong> ${inputData.thalach || 'N/A'}</p>
                <p><strong>Fasting Blood Sugar:</strong> ${inputData.fbs === '1' || inputData.fbs === 1 ? 'Yes (>120 mg/dl)' : inputData.fbs === '0' || inputData.fbs === 0 ? 'No (≤120 mg/dl)' : 'N/A'}</p>
            </div>
        </div>
        <hr style="border-color: rgba(255,255,255,0.2);">
        <div class="row">
            <div class="col-12">
                <h6 style="color: #f59e0b; margin-bottom: 1rem;">Prediction Result</h6>
                <p><strong>Risk Level:</strong> ${parsedResult.risk_category || parsedResult.risk_level || parsedResult.category || parsedResult.result || (parsedResult.prediction === 1 || parsedResult.prediction === '1' ? 'High Risk' : 'Low Risk')}</p>
                <p><strong>Confidence:</strong> ${prediction.confidence_score ? (prediction.confidence_score * 100).toFixed(1) + '%' : 'N/A'}</p>
                <p><strong>Date:</strong> ${new Date(prediction.created_at).toLocaleString()}</p>
            </div>
        </div>
    `;
    
    const patientDetailsEl = document.getElementById('patientDetails');
    if (patientDetailsEl) {
        patientDetailsEl.innerHTML = detailsHtml;
    }
    
    const deleteBtn = document.getElementById('deleteBtn');
    if (deleteBtn) {
        deleteBtn.setAttribute('data-prediction-id', predictionId);
    }
    
    const modal = new bootstrap.Modal(document.getElementById('patientModal'));
    modal.show();
}

// Helper function to convert chest pain type numeric value to text
function getChestPainTypeText(cpValue) {
    const cpMap = {
        '0': 'Typical Angina',
        '1': 'Atypical Angina', 
        '2': 'Non-anginal Pain',
        '3': 'Asymptomatic',
        0: 'Typical Angina',
        1: 'Atypical Angina',
        2: 'Non-anginal Pain', 
        3: 'Asymptomatic'
    };
    return cpMap[cpValue] || 'N/A';
}

// Delete prediction function
function deletePrediction() {
    const predictionId = document.getElementById('deleteBtn')?.getAttribute('data-prediction-id');
    if (!predictionId) {
        alert('No prediction selected for deletion');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this prediction? This action cannot be undone.')) {
        return;
    }
    
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        alert('Please login to delete predictions');
        return;
    }
    
    fetch(`http://127.0.0.1:5000/api/predictions/${predictionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
    .then(response => {
        if (response.ok) {
            alert('Prediction deleted successfully');
            const modal = bootstrap.Modal.getInstance(document.getElementById('patientModal'));
            if (modal) modal.hide();
            loadPredictionHistory(); // Reload the history
        } else {
            alert('Failed to delete prediction');
        }
    })
    .catch(error => {
        console.error('Error deleting prediction:', error);
        alert('Error deleting prediction. Please try again.');
    });
}

function closeReport() {
    // Clear the report content
    const reportContent = document.getElementById('reportContent');
    if (reportContent) {
        reportContent.innerHTML = '';
    }
    
    // Hide the medical report tab
    const medicalReportLink = document.getElementById('medicalReportLink');
    if (medicalReportLink) {
        medicalReportLink.classList.add('d-none');
    }
    
    // Clear the health check form
    const predictionForm = document.getElementById('predictionForm');
    if (predictionForm) {
        predictionForm.reset();
    }
    
    // Navigate to dashboard
    navigateTo('dashboard');
}

// History filtering functionality
function filterHistory() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const riskFilter = document.getElementById('riskFilter')?.value || '';
    const cards = document.querySelectorAll('#historyList .col-md-6');
    
    console.log('Filtering with:', { searchTerm, riskFilter, cardsFound: cards.length });
    
    cards.forEach(cardContainer => {
        // Get patient name from the card
        const patientNameElement = cardContainer.querySelector('h6');
        const patientName = patientNameElement ? patientNameElement.textContent.toLowerCase() : '';
        
        // Get all text content and search for risk patterns
        const allText = cardContainer.textContent.toLowerCase();
        let riskText = '';
        
        if (allText.includes('high risk')) {
            riskText = 'high';
        } else if (allText.includes('moderate risk')) {
            riskText = 'moderate';
        } else if (allText.includes('low risk')) {
            riskText = 'low';
        }
        
        console.log('Card data:', { patientName, riskText, riskFilter });
        
        // Check search match
        const matchesSearch = searchTerm.length === 0 || patientName.includes(searchTerm);
        
        // Check risk filter match
        let matchesRisk = true;
        if (riskFilter && riskFilter !== '') {
            matchesRisk = riskText === riskFilter;
        }
        
        console.log('Matches:', { matchesSearch, matchesRisk });
        
        // Show/hide card based on filters
        cardContainer.style.display = (matchesSearch && matchesRisk) ? 'block' : 'none';
    });
}

// Clear search function
function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
        filterHistory();
    }
}

// Initialize history filters when history section is loaded
function initHistoryFilters() {
    const searchInput = document.getElementById('searchInput');
    const riskFilter = document.getElementById('riskFilter');
    
    if (searchInput) {
        // Remove existing listeners to prevent duplicates
        searchInput.removeEventListener('input', filterHistory);
        searchInput.removeEventListener('keyup', filterHistory);
        
        // Add new listeners
        searchInput.addEventListener('input', filterHistory);
        searchInput.addEventListener('keyup', filterHistory);
        console.log('✅ Search input listener added');
    }
    
    if (riskFilter) {
        // Remove existing listeners to prevent duplicates
        riskFilter.removeEventListener('change', filterHistory);
        
        // Add new listener
        riskFilter.addEventListener('change', filterHistory);
        console.log('✅ Risk filter listener added');
    }
    
    // Initialize filters immediately after setup
    setTimeout(() => {
        filterHistory();
    }, 100);
    
    // Also add a manual trigger for testing
    console.log('History filters initialized. Available functions:', {
        filterHistory: typeof filterHistory,
        clearSearch: typeof clearSearch
    });
}

// Enhanced loadPredictionHistory function with filtering support
function loadPredictionHistoryWithFilters() {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        const emptyState = document.getElementById('emptyHistoryState');
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    console.log('Loading prediction history with filters...');
    
    fetch('http://127.0.0.1:5000/api/predictions', {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
    .then(response => {
        console.log('History response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('History API response:', data);
        
        const historyList = document.getElementById('historyList');
        const emptyState = document.getElementById('emptyHistoryState');
        
        if (!historyList) {
            console.error('History list container not found');
            return;
        }
        
        // Get predictions array from response
        let predictions = [];
        if (data.predictions && Array.isArray(data.predictions)) {
            predictions = data.predictions.filter(item => {
                // Include items that have either result data or prediction data
                return (item.result || item.prediction !== undefined) && 
                       item.input_data && 
                       !item.document_type;
            });
        }
        
        console.log('Filtered predictions for history:', predictions.length);
        
        if (predictions.length > 0) {
            // Create history cards with proper risk level detection
            const historyHTML = predictions.map(prediction => {
                const inputData = prediction.input_data || {};
                const resultData = prediction.result || {};
                
                // Parse result if it's a string
                let parsedResult = resultData;
                if (typeof resultData === 'string') {
                    try {
                        parsedResult = JSON.parse(resultData);
                    } catch (e) {
                        parsedResult = resultData;
                    }
                }
                
                // Determine risk level - use backend's risk_category directly
                let riskText = 'Low Risk';
                let riskColor = '#10b981';
                let riskIcon = 'fa-heart';
                
                if (parsedResult.risk_category) {
                    riskText = parsedResult.risk_category;
                } else if (prediction.risk_category) {
                    riskText = prediction.risk_category;
                } else {
                    // Fallback: determine from prediction and confidence
                    const pred = parsedResult.prediction || prediction.prediction;
                    const conf = parsedResult.confidence_score || prediction.confidence_score || 0.5;
                    
                    if (pred === 1 || pred === '1') {
                        if (conf >= 0.75) {
                            riskText = 'High Risk';
                        } else if (conf >= 0.50) {
                            riskText = 'Moderate Risk';
                        } else {
                            riskText = 'Low Risk';
                        }
                    } else {
                        riskText = 'Low Risk';
                    }
                }
                
                // Set color and icon based on risk text
                if (riskText.toLowerCase().includes('high')) {
                    riskColor = '#ef4444';
                    riskIcon = 'fa-exclamation-triangle';
                } else if (riskText.toLowerCase().includes('moderate')) {
                    riskColor = '#f59e0b';
                    riskIcon = 'fa-exclamation-circle';
                } else {
                    riskColor = '#10b981';
                    riskIcon = 'fa-heart';
                }
                
                const date = new Date(prediction.created_at).toLocaleDateString();
                const time = new Date(prediction.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                
                return `
                    <div class="col-md-6 mb-4">
                        <div style="background: rgba(244, 114, 182, 0.1); border: 1px solid rgba(244, 114, 182, 0.3); border-radius: 20px; padding: 1.5rem; transition: all 0.3s ease; cursor: pointer;" onclick="showPatientDetails(${prediction.id})" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 15px 35px rgba(236, 72, 153, 0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                            
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                                <div style="padding: 0.3rem 0.8rem; border-radius: 15px; font-size: 0.75rem; font-weight: 600; display: flex; align-items: center; gap: 0.3rem; background: rgba(${riskColor === '#ef4444' ? '239, 68, 68' : riskColor === '#f59e0b' ? '245, 158, 11' : '34, 197, 94'}, 0.1); color: ${riskColor};">
                                    <i class="fas ${riskIcon}"></i>
                                    ${riskText}
                                </div>
                                <div style="font-size: 0.75rem; color: #9d174d; text-align: right;">
                                    ${date}<br>
                                    ${time}
                                </div>
                            </div>
                            
                            <div style="display: flex; align-items: center; gap: 0.8rem; margin-bottom: 1rem;">
                                <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #ec4899, #be185d); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 1.1rem;">
                                    ${(inputData.patientName || inputData.patient_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase()}
                                </div>
                                <div>
                                    <h6 style="margin: 0; color: #831843; font-weight: 600; font-size: 1rem;">${inputData.patientName || inputData.patient_name || 'Unknown Patient'}</h6>
                                    <div style="display: flex; gap: 1rem; margin: 0; font-size: 0.8rem; color: #9d174d;">
                                        <span><i class="fas fa-birthday-cake"></i> Age: ${inputData.age || 'N/A'}</span>
                                        <span><i class="fas ${inputData.sex === '1' || inputData.sex === 1 ? 'fa-mars' : inputData.sex === '0' || inputData.sex === 0 ? 'fa-venus' : 'fa-question'}"></i> ${inputData.sex === '1' || inputData.sex === 1 ? 'Male' : inputData.sex === '0' || inputData.sex === 0 ? 'Female' : 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                                <div style="text-align: center; padding: 0.8rem; background: rgba(236, 72, 153, 0.05); border-radius: 12px;">
                                    <div style="font-size: 0.7rem; color: #9d174d; margin-bottom: 0.2rem; text-transform: uppercase; font-weight: 500;">Blood Pressure</div>
                                    <div style="font-size: 1.1rem; font-weight: 700; color: #831843;">${inputData.trestbps || 'N/A'}</div>
                                </div>
                                <div style="text-align: center; padding: 0.8rem; background: rgba(236, 72, 153, 0.05); border-radius: 12px;">
                                    <div style="font-size: 0.7rem; color: #9d174d; margin-bottom: 0.2rem; text-transform: uppercase; font-weight: 500;">Cholesterol</div>
                                    <div style="font-size: 1.1rem; font-weight: 700; color: #831843;">${inputData.chol || 'N/A'}</div>
                                </div>
                            </div>
                            
                            <div style="padding-top: 1rem; border-top: 1px solid rgba(236, 72, 153, 0.1);">
                                <button style="background: linear-gradient(135deg, #ec4899, #be185d); border: none; color: white; padding: 0.6rem 1.5rem; border-radius: 20px; font-weight: 600; font-size: 0.8rem; cursor: pointer; transition: all 0.3s ease; width: 100%;" onclick="event.stopPropagation(); showPatientDetails(${prediction.id})" onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 15px rgba(236, 72, 153, 0.3)';" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';">
                                    <i class="fas fa-eye"></i> View Details
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            historyList.innerHTML = historyHTML;
            if (emptyState) emptyState.style.display = 'none';
            
            // Store predictions globally for showPatientDetails function
            window.globalPredictions = predictions;
            
            // Initialize filters after loading history
            setTimeout(() => {
                initHistoryFilters();
            }, 100);
        } else {
            historyList.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
        }
    })
    .catch(error => {
        console.error('Error loading history:', error);
        const historyList = document.getElementById('historyList');
        if (historyList) {
            historyList.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger" role="alert">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Failed to load prediction history. Please try again.
                    </div>
                </div>
            `;
        }
    });
}

// Override the original loadPredictionHistory function
function loadPredictionHistory() {
    loadPredictionHistoryWithFilters();
}

// Function to use parsed medical data for prediction
async function useParsedDataForPrediction(documentId) {
    try {
        // Get the document details first
        const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const doc = await response.json();
            
            if (doc.parsed_data) {
                // Close the modal first
                const modal = bootstrap.Modal.getInstance(document.getElementById('documentModal'));
                if (modal) {
                    modal.hide();
                }
                
                // Navigate to prediction form
                navigateTo('predict');
                
                // Wait a bit for the form to load, then fill it
                setTimeout(() => {
                    fillPredictionFormWithParsedData(doc.parsed_data, doc.original_filename);
                    showNotification('Medical data loaded from document! Review and submit for prediction.', 'success');
                }, 500);
            } else {
                showNotification('No parsed medical data available in this document', 'error');
            }
        } else {
            showNotification('Failed to load document data', 'error');
        }
    } catch (error) {
        console.error('Error using parsed data:', error);
        showNotification('Error loading document data', 'error');
    }
}

// Function to fill prediction form with parsed data
function fillPredictionFormWithParsedData(parsedData, filename) {
    console.log('Filling form with parsed data:', parsedData);
    
    // Fill patient name with document filename (without extension)
    const patientNameField = document.getElementById('patientName');
    if (patientNameField) {
        const nameFromFile = filename.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        patientNameField.value = nameFromFile || 'Document Patient';
    }
    
    // Fill all available fields
    const fieldMappings = {
        age: 'age',
        sex: 'sex', 
        cp: 'cp',
        trestbps: 'trestbps',
        chol: 'chol',
        fbs: 'fbs',
        restecg: 'restecg',
        thalach: 'thalach',
        exang: 'exang',
        oldpeak: 'oldpeak',
        slope: 'slope',
        ca: 'ca',
        thal: 'thal'
    };
    
    Object.entries(fieldMappings).forEach(([dataKey, fieldId]) => {
        const field = document.getElementById(fieldId);
        const value = parsedData[dataKey];
        
        if (field && value !== null && value !== undefined) {
            field.value = value;
            console.log(`✓ ${fieldId} filled with:`, value);
        }
    });
    
    // Scroll to the form
    const predictionForm = document.getElementById('predictionForm');
    if (predictionForm) {
        predictionForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Make functions globally available
window.loadUserDocuments = loadUserDocuments;
window.viewDocument = viewDocument;
window.downloadDocument = downloadDocument;
window.deleteDocument = deleteDocument;
window.displayPredictionResult = displayPredictionResult;
window.showMedicalReportTab = showMedicalReportTab;
window.generateMedicalReport = generateMedicalReport;
window.generatePDFReport = generatePDFReport;
window.loadPredictionHistory = loadPredictionHistory;
window.showPatientDetails = showPatientDetails;
window.deletePrediction = deletePrediction;
window.closeReport = closeReport;
window.filterHistory = filterHistory;
window.clearSearch = clearSearch;
window.initHistoryFilters = initHistoryFilters;
window.useParsedDataForPrediction = useParsedDataForPrediction;
window.fillPredictionFormWithParsedData = fillPredictionFormWithParsedData;

console.log('✅ App JavaScript loaded successfully with enhanced filtering');llPredictionFormWithParsedData = fillPredictionFormWithParsedData;

console.log('✅ App JavaScript loaded successfully with enhanced filtering');