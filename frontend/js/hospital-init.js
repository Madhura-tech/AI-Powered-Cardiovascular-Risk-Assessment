// Hospital Map Initialization Fix
document.addEventListener('DOMContentLoaded', function() {
    console.log('Hospital map initialization script loaded');
    
    // Ensure functions are globally available
    if (typeof loadHospitalMap !== 'function') {
        console.warn('loadHospitalMap function not found, defining fallback');
        window.loadHospitalMap = function() {
            const mapContainer = document.getElementById('hospitalMap');
            if (!mapContainer) {
                console.error('Hospital map container not found');
                return;
            }
            
            console.log('Loading hospital map...');
            
            // Show loading state first
            mapContainer.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: rgba(236, 72, 153, 0.05); border-radius: 15px;">
                    <div style="text-align: center; color: #831843;">
                        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #ec4899; margin-bottom: 1rem;"></i>
                        <p>Loading interactive map...</p>
                    </div>
                </div>
            `;
            
            // Load the actual map after a short delay
            setTimeout(() => {
                mapContainer.innerHTML = `
                    <div style="position: relative; width: 100%; height: 100%; border-radius: 15px; overflow: hidden;">
                        <iframe 
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d248849.886539092!2d77.49085452148437!3d12.953945614117647!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae1670c9b44e6d%3A0xf8dfc3e8517e4fe0!2sBengaluru%2C%20Karnataka!5e0!3m2!1sen!2sin!4v1699000000000!5m2!1sen!2sin&q=hospitals+near+bangalore"
                            width="100%" 
                            height="100%" 
                            style="border:0; border-radius: 15px;" 
                            allowfullscreen="" 
                            loading="lazy"
                            referrerpolicy="no-referrer-when-downgrade">
                        </iframe>
                        <div style="position: absolute; top: 1rem; left: 1rem; background: rgba(255, 255, 255, 0.9); padding: 0.5rem 1rem; border-radius: 10px; font-weight: 600; color: #831843; font-size: 0.9rem; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                            <i class="fas fa-map-marker-alt" style="color: #ec4899; margin-right: 0.5rem;"></i>
                            Top Hospitals in Bangalore
                        </div>
                        <div style="position: absolute; bottom: 1rem; right: 1rem; background: rgba(236, 72, 153, 0.9); color: white; padding: 0.5rem 1rem; border-radius: 10px; font-weight: 600; font-size: 0.8rem; cursor: pointer; transition: all 0.3s ease;" onclick="openFullMap()" onmouseover="this.style.background='rgba(236, 72, 153, 1)'; this.style.transform='scale(1.05)'" onmouseout="this.style.background='rgba(236, 72, 153, 0.9)'; this.style.transform='scale(1)'">
                            <i class="fas fa-expand"></i> Full Map
                        </div>
                    </div>
                `;
                console.log('Hospital map loaded successfully');
            }, 1000);
        };
    }
    
    if (typeof openFullMap !== 'function') {
        window.openFullMap = function() {
            const url = 'https://www.google.com/maps/search/hospitals+in+bangalore/@12.9716,77.5946,11z';
            console.log('Opening full map:', url);
            window.open(url, '_blank');
        };
    }
    
    // Initialize hospitals when nearby-hospitals section is shown
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const nearbySection = document.getElementById('nearby-hospitals');
                if (nearbySection && !nearbySection.classList.contains('d-none')) {
                    console.log('Nearby hospitals section is now visible, initializing...');
                    if (typeof initializeNearbyHospitals === 'function') {
                        setTimeout(() => {
                            initializeNearbyHospitals();
                        }, 100);
                    }
                }
            }
        });
    });
    
    const nearbySection = document.getElementById('nearby-hospitals');
    if (nearbySection) {
        observer.observe(nearbySection, { attributes: true });
    }
    
    console.log('Hospital map initialization complete');
});