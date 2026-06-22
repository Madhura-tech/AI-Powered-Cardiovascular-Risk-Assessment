// Fix map loading
function loadHospitalMap() {
    const mapContainer = document.getElementById('hospitalMap');
    if (!mapContainer) {
        console.error('Hospital map container not found');
        return;
    }
    
    console.log('Loading real hospital map...');
    
    // Initialize real map with Leaflet
    if (typeof initRealHospitalMap === 'function') {
        initRealHospitalMap();
    } else {
        console.error('Real hospital map function not found');
    }
}

// Auto-load map when nearby hospitals section is shown
function autoLoadHospitalMap() {
    const nearbySection = document.getElementById('nearby-hospitals');
    if (nearbySection && !nearbySection.classList.contains('d-none')) {
        const mapContainer = document.getElementById('hospitalMap');
        if (mapContainer && mapContainer.innerHTML.includes('Interactive map will load here')) {
            console.log('Auto-loading hospital map...');
            loadHospitalMap();
        }
    }
}

// Open full map
function openFullMap() {
    window.open('https://www.google.com/maps/search/hospitals/@12.9716,77.5946,12z', '_blank');
}

window.loadHospitalMap = loadHospitalMap;
window.autoLoadHospitalMap = autoLoadHospitalMap;
window.openFullMap = openFullMap;

// Initialize map loading when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on nearby hospitals section and auto-load
    setTimeout(autoLoadHospitalMap, 500);
    
    // Set up observer to auto-load map when section becomes visible
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                setTimeout(autoLoadHospitalMap, 100);
            }
        });
    });
    
    const nearbySection = document.getElementById('nearby-hospitals');
    if (nearbySection) {
        observer.observe(nearbySection, { attributes: true });
    }
});

console.log('✅ Hospital map functionality loaded with auto-loading');