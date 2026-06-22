// Real Hospital Map with Leaflet + OpenStreetMap
let hospitalMap = null;
let hospitalMarkers = [];

const BANGALORE_HOSPITALS = [
    { name: "Apollo Hospital", lat: 12.8977, lng: 77.6003, area: "Bannerghatta Road", specialty: "Multi-Specialty", phone: "+91 80 2692 2222", type: "multi-specialty", rating: 4.5, emergency: true },
    { name: "Fortis Hospital", lat: 12.8988, lng: 77.6011, area: "Bannerghatta Road", specialty: "Cardiology", phone: "+91 80 6621 4444", type: "cardiac", rating: 4.3, emergency: true },
    { name: "Manipal Hospital", lat: 12.9716, lng: 77.6412, area: "HAL Airport Road", specialty: "Multi-Specialty", phone: "+91 80 2502 4444", type: "multi-specialty", rating: 4.4, emergency: true },
    { name: "Narayana Health City", lat: 12.8056, lng: 77.6736, area: "Bommasandra", specialty: "Cardiac Surgery", phone: "+91 80 7122 2222", type: "cardiac", rating: 4.6, emergency: true },
    { name: "Aster CMI Hospital", lat: 13.0358, lng: 77.6394, area: "Sahakara Nagar", specialty: "Multi-Specialty", phone: "+91 80 4344 4444", type: "multi-specialty", rating: 4.2, emergency: true },
    { name: "Sakra World Hospital", lat: 12.9279, lng: 77.6271, area: "Devarabeesanahalli", specialty: "Cardiology", phone: "+91 80 4969 4969", type: "cardiac", rating: 4.5, emergency: true },
    { name: "BGS Gleneagles", lat: 12.9081, lng: 77.4859, area: "Kengeri", specialty: "Multi-Specialty", phone: "+91 80 2222 2222", type: "multi-specialty", rating: 4.1, emergency: false },
    { name: "Jayadeva Institute", lat: 12.9279, lng: 77.5619, area: "Jayanagar", specialty: "Cardiac Surgery", phone: "+91 80 2649 2222", type: "cardiac", rating: 4.7, emergency: true },
    { name: "NIMHANS", lat: 12.9435, lng: 77.5962, area: "Hosur Road", specialty: "Neurology & Cardiology", phone: "+91 80 2699 5000", type: "government", rating: 4.8, emergency: true },
    { name: "St. John's Medical College", lat: 12.9298, lng: 77.6205, area: "Koramangala", specialty: "Multi-Specialty", phone: "+91 80 2206 5000", type: "multi-specialty", rating: 4.3, emergency: true },
    { name: "Columbia Asia Hospital", lat: 12.9698, lng: 77.7499, area: "Whitefield", specialty: "Multi-Specialty", phone: "+91 80 6797 7777", type: "private", rating: 4.2, emergency: true },
    { name: "Cloudnine Hospital", lat: 12.9279, lng: 77.6271, area: "Bellandur", specialty: "Maternity & Cardiology", phone: "+91 80 6599 9999", type: "private", rating: 4.4, emergency: false },
    { name: "Vikram Hospital", lat: 12.9698, lng: 77.5986, area: "Richmond Road", specialty: "Multi-Specialty", phone: "+91 80 2227 7979", type: "private", rating: 4.0, emergency: true },
    { name: "Sagar Hospitals", lat: 12.9698, lng: 77.5986, area: "Jayanagar", specialty: "Multi-Specialty", phone: "+91 80 2669 8888", type: "private", rating: 4.1, emergency: true },
    { name: "Ramaiah Medical College", lat: 13.0358, lng: 77.5833, area: "Mathikere", specialty: "Multi-Specialty", phone: "+91 80 2360 4050", type: "government", rating: 4.2, emergency: true }
];

function initRealHospitalMap() {
    const mapContainer = document.getElementById('hospitalMap');
    if (!mapContainer) {
        console.log('Hospital map container not found');
        return;
    }

    // Clear existing map if it exists
    if (hospitalMap) {
        hospitalMap.remove();
        hospitalMap = null;
        hospitalMarkers = [];
    }

    try {
        // Show loading state
        mapContainer.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 400px; background: linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(244, 114, 182, 0.05)); border-radius: 15px; color: #831843;">
                <div style="text-align: center;">
                    <div style="width: 40px; height: 40px; border: 4px solid #ec4899; border-top: 4px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                    <p style="font-weight: 600;">Loading Interactive Map...</p>
                </div>
            </div>
        `;

        setTimeout(() => {
            // Initialize map
            hospitalMap = L.map('hospitalMap').setView([12.9716, 77.5946], 11);

            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18
            }).addTo(hospitalMap);

            // Add hospital markers with custom icons
            BANGALORE_HOSPITALS.forEach(hospital => {
                const customIcon = L.divIcon({
                    className: 'custom-hospital-marker',
                    html: `<div style="background: linear-gradient(135deg, #ec4899, #be185d); width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; box-shadow: 0 4px 12px rgba(236, 72, 153, 0.4); border: 3px solid white;"><i class="fas fa-hospital"></i></div>`,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                });

                const marker = L.marker([hospital.lat, hospital.lng], { icon: customIcon })
                    .addTo(hospitalMap)
                    .bindPopup(`
                        <div style="text-align: center; min-width: 220px; padding: 15px; font-family: 'Inter', sans-serif;">
                            <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 0.8rem;">
                                <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #ec4899, #be185d); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">
                                    <i class="fas fa-hospital"></i>
                                </div>
                                <div>
                                    <h6 style="color: #831843; margin: 0; font-weight: 700; font-size: 1rem;">${hospital.name}</h6>
                                    <div style="display: flex; align-items: center; gap: 0.2rem; margin-top: 0.2rem;">
                                        ${generateStars(hospital.rating)}
                                        <span style="color: #9d174d; font-size: 0.8rem; margin-left: 0.3rem;">${hospital.rating}</span>
                                    </div>
                                </div>
                            </div>
                            <div style="text-align: left; margin-bottom: 1rem;">
                                <p style="margin: 0.4rem 0; color: #9d174d; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-map-marker-alt" style="color: #ec4899; width: 12px;"></i> ${hospital.area}</p>
                                <p style="margin: 0.4rem 0; color: #9d174d; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-stethoscope" style="color: #ec4899; width: 12px;"></i> ${hospital.specialty}</p>
                                <p style="margin: 0.4rem 0; color: #9d174d; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-phone" style="color: #ec4899; width: 12px;"></i> ${hospital.phone}</p>
                            </div>
                            <div style="display: flex; gap: 0.5rem; justify-content: center;">
                                <button onclick="window.open('tel:${hospital.phone}')" style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 0.5rem 1rem; border-radius: 10px; font-size: 0.8rem; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 0.3rem;">
                                    <i class="fas fa-phone"></i> Call
                                </button>
                                <button onclick="getDirections(${hospital.lat}, ${hospital.lng})" style="background: linear-gradient(135deg, #ec4899, #be185d); color: white; border: none; padding: 0.5rem 1rem; border-radius: 10px; font-size: 0.8rem; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 0.3rem;">
                                    <i class="fas fa-directions"></i> Directions
                                </button>
                            </div>
                        </div>
                    `);
                hospitalMarkers.push(marker);
            });

            // Try to get user's location and add marker
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        const userLat = position.coords.latitude;
                        const userLng = position.coords.longitude;
                        
                        // Add user location marker with pulsing effect
                        const userIcon = L.divIcon({
                            className: 'user-location-marker',
                            html: `
                                <div style="position: relative;">
                                    <div style="background: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); position: relative; z-index: 2;"></div>
                                    <div style="position: absolute; top: -5px; left: -5px; width: 30px; height: 30px; border-radius: 50%; background: rgba(59, 130, 246, 0.3); animation: pulse 2s infinite;"></div>
                                </div>
                            `,
                            iconSize: [20, 20],
                            iconAnchor: [10, 10]
                        });
                        
                        L.marker([userLat, userLng], { icon: userIcon })
                            .addTo(hospitalMap)
                            .bindPopup('<div style="text-align: center; padding: 10px;"><strong style="color: #3b82f6;">📍 Your Location</strong></div>');
                        
                        // Center map on user location
                        hospitalMap.setView([userLat, userLng], 12);
                    },
                    function(error) {
                        console.log('Geolocation error:', error.message);
                    }
                );
            }

            console.log('✅ Real hospital map loaded with', BANGALORE_HOSPITALS.length, 'hospitals');
            
            // Add map controls
            const customControl = L.control({position: 'topright'});
            customControl.onAdd = function(map) {
                const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
                div.style.backgroundColor = 'white';
                div.style.backgroundSize = '30px 30px';
                div.style.width = '40px';
                div.style.height = '40px';
                div.style.borderRadius = '8px';
                div.style.cursor = 'pointer';
                div.style.display = 'flex';
                div.style.alignItems = 'center';
                div.style.justifyContent = 'center';
                div.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
                div.innerHTML = '<i class="fas fa-location-arrow" style="color: #ec4899; font-size: 16px;"></i>';
                div.title = 'Find My Location';
                
                div.onclick = function(){
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(function(position) {
                            const lat = position.coords.latitude;
                            const lng = position.coords.longitude;
                            map.setView([lat, lng], 13);
                        });
                    }
                };
                
                return div;
            };
            customControl.addTo(hospitalMap);
            
            // Load hospital cards
            loadHospitalCards();
            
        }, 1000);
        
    } catch (error) {
        console.error('Error initializing hospital map:', error);
        mapContainer.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 400px; background: #f8f9fa; border-radius: 15px; color: #831843;">
                <div style="text-align: center;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #ec4899; margin-bottom: 1rem;"></i>
                    <p>Unable to load map. Please check your internet connection.</p>
                    <button onclick="initRealHospitalMap()" style="background: linear-gradient(135deg, #ec4899, #be185d); color: white; border: none; padding: 0.5rem 1rem; border-radius: 10px; margin-top: 0.5rem; cursor: pointer;">Retry</button>
                </div>
            </div>
        `;
    }
}

// Generate star rating display
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star" style="color: #fbbf24; font-size: 0.7rem;"></i>';
    }
    
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt" style="color: #fbbf24; font-size: 0.7rem;"></i>';
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star" style="color: #d1d5db; font-size: 0.7rem;"></i>';
    }
    
    return stars;
}

function filterHospitalMap() {
    const searchTerm = document.getElementById('hospitalSearchInput')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('hospitalTypeFilter')?.value || '';

    if (!hospitalMap) {
        console.log('Hospital map not initialized');
        return;
    }

    // Clear existing markers
    hospitalMarkers.forEach(marker => {
        if (hospitalMap.hasLayer(marker)) {
            hospitalMap.removeLayer(marker);
        }
    });
    hospitalMarkers = [];

    // Filter hospitals
    const filtered = BANGALORE_HOSPITALS.filter(hospital => {
        const matchesSearch = searchTerm === '' || 
            hospital.name.toLowerCase().includes(searchTerm) ||
            hospital.area.toLowerCase().includes(searchTerm) ||
            hospital.specialty.toLowerCase().includes(searchTerm);
        
        const matchesType = typeFilter === '' || hospital.type === typeFilter;

        return matchesSearch && matchesType;
    });

    // Add filtered markers
    filtered.forEach(hospital => {
        const customIcon = L.divIcon({
            className: 'custom-hospital-marker',
            html: `<div style="background: linear-gradient(135deg, #ec4899, #be185d); width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; box-shadow: 0 4px 12px rgba(236, 72, 153, 0.4); border: 3px solid white;"><i class="fas fa-hospital"></i></div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });

        const marker = L.marker([hospital.lat, hospital.lng], { icon: customIcon })
            .addTo(hospitalMap)
            .bindPopup(`
                <div style="text-align: center; min-width: 220px; padding: 15px; font-family: 'Inter', sans-serif;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 0.8rem;">
                        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #ec4899, #be185d); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">
                            <i class="fas fa-hospital"></i>
                        </div>
                        <div>
                            <h6 style="color: #831843; margin: 0; font-weight: 700; font-size: 1rem;">${hospital.name}</h6>
                            <div style="display: flex; align-items: center; gap: 0.2rem; margin-top: 0.2rem;">
                                ${generateStars(hospital.rating)}
                                <span style="color: #9d174d; font-size: 0.8rem; margin-left: 0.3rem;">${hospital.rating}</span>
                            </div>
                        </div>
                    </div>
                    <div style="text-align: left; margin-bottom: 1rem;">
                        <p style="margin: 0.4rem 0; color: #9d174d; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-map-marker-alt" style="color: #ec4899; width: 12px;"></i> ${hospital.area}</p>
                        <p style="margin: 0.4rem 0; color: #9d174d; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-stethoscope" style="color: #ec4899; width: 12px;"></i> ${hospital.specialty}</p>
                        <p style="margin: 0.4rem 0; color: #9d174d; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-phone" style="color: #ec4899; width: 12px;"></i> ${hospital.phone}</p>
                    </div>
                    <div style="display: flex; gap: 0.5rem; justify-content: center;">
                        <button onclick="window.open('tel:${hospital.phone}')" style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 0.5rem 1rem; border-radius: 10px; font-size: 0.8rem; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 0.3rem;">
                            <i class="fas fa-phone"></i> Call
                        </button>
                        <button onclick="getDirections(${hospital.lat}, ${hospital.lng})" style="background: linear-gradient(135deg, #ec4899, #be185d); color: white; border: none; padding: 0.5rem 1rem; border-radius: 10px; font-size: 0.8rem; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 0.3rem;">
                            <i class="fas fa-directions"></i> Directions
                        </button>
                    </div>
                </div>
            `);
        hospitalMarkers.push(marker);
    });

    console.log('Filtered to', filtered.length, 'hospitals');
    
    // Update hospital cards
    loadHospitalCards(filtered);
}

// Load hospital cards function
function loadHospitalCards(hospitalsToShow = BANGALORE_HOSPITALS) {
    const hospitalsList = document.getElementById('hospitalsList');
    if (!hospitalsList) return;
    
    const hospitalsHTML = hospitalsToShow.map(hospital => `
        <div class="col-md-6 col-lg-4 mb-3">
            <div style="background: rgba(244, 114, 182, 0.1); border: 1px solid rgba(244, 114, 182, 0.3); border-radius: 20px; padding: 1.5rem; transition: all 0.3s ease; height: 100%; cursor: pointer;" onclick="focusHospitalOnMap(${hospital.lat}, ${hospital.lng})" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 15px 35px rgba(236, 72, 153, 0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                    <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #ec4899, #be185d); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2rem;">
                        <i class="fas fa-hospital"></i>
                    </div>
                    <div style="flex: 1;">
                        <h6 style="color: #831843; margin: 0; font-weight: 600; font-size: 1rem;">${hospital.name}</h6>
                        <div style="display: flex; align-items: center; gap: 0.3rem; margin-top: 0.3rem;">
                            ${generateStars(hospital.rating)}
                            <span style="color: #9d174d; font-size: 0.8rem; margin-left: 0.3rem;">${hospital.rating}</span>
                        </div>
                        <p style="color: #9d174d; margin: 0.2rem 0 0 0; font-size: 0.8rem;"><i class="fas fa-map-marker-alt" style="color: #ec4899;"></i> ${hospital.area}</p>
                    </div>
                </div>
                <div style="margin-bottom: 1rem;">
                    <p style="color: #9d174d; margin: 0.3rem 0; font-size: 0.9rem;"><i class="fas fa-stethoscope" style="color: #ec4899; margin-right: 0.5rem;"></i> ${hospital.specialty}</p>
                    <p style="color: #9d174d; margin: 0.3rem 0; font-size: 0.9rem;"><i class="fas fa-phone" style="color: #ec4899; margin-right: 0.5rem;"></i> ${hospital.phone}</p>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="event.stopPropagation(); window.open('tel:${hospital.phone}')" style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 0.5rem 1rem; border-radius: 15px; font-size: 0.8rem; cursor: pointer; flex: 1; font-weight: 600;">
                        <i class="fas fa-phone"></i> Call
                    </button>
                    <button onclick="event.stopPropagation(); getDirections(${hospital.lat}, ${hospital.lng})" style="background: linear-gradient(135deg, #ec4899, #be185d); color: white; border: none; padding: 0.5rem 1rem; border-radius: 15px; font-size: 0.8rem; cursor: pointer; flex: 1; font-weight: 600;">
                        <i class="fas fa-directions"></i> Directions
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    hospitalsList.innerHTML = hospitalsHTML;
}

// Focus hospital on map
function focusHospitalOnMap(lat, lng) {
    if (hospitalMap) {
        hospitalMap.setView([lat, lng], 15);
        // Find and open the popup for this hospital
        hospitalMarkers.forEach(marker => {
            const markerLatLng = marker.getLatLng();
            if (Math.abs(markerLatLng.lat - lat) < 0.001 && Math.abs(markerLatLng.lng - lng) < 0.001) {
                marker.openPopup();
            }
        });
    }
}

// Get directions function
function getDirections(lat, lng) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                const url = `https://www.google.com/maps/dir/${userLat},${userLng}/${lat},${lng}`;
                window.open(url, '_blank');
            },
            function(error) {
                // Fallback: open Google Maps without user location
                const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
                window.open(url, '_blank');
            }
        );
    } else {
        // Fallback: open Google Maps without user location
        const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        window.open(url, '_blank');
    }
}

// Load hospital map function (called from HTML)
function loadHospitalMap() {
    initRealHospitalMap();
}

// Initialize nearby hospitals function
function initializeNearbyHospitals() {
    console.log('Initializing nearby hospitals...');
    
    // Set up search and filter event listeners
    const searchInput = document.getElementById('hospitalSearchInput');
    const typeFilter = document.getElementById('hospitalTypeFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterHospitalMap);
    }
    
    if (typeFilter) {
        typeFilter.addEventListener('change', filterHospitalMap);
    }
    
    // Load initial hospital cards
    loadHospitalCards();
    
    console.log('✅ Nearby hospitals initialized');
}

// Auto-initialize when nearby hospitals section is shown
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const nearbySection = document.getElementById('nearby-hospitals');
                    if (nearbySection && !nearbySection.classList.contains('d-none')) {
                        setTimeout(() => {
                            initializeNearbyHospitals();
                            // Auto-load map when section opens
                            initRealHospitalMap();
                        }, 500);
                    }
                }
            });
        });
        
        const nearbySection = document.getElementById('nearby-hospitals');
        if (nearbySection) {
            observer.observe(nearbySection, { attributes: true });
        }
    }, 1000);
});

// Make functions globally available
window.initRealHospitalMap = initRealHospitalMap;
window.filterHospitalMap = filterHospitalMap;
window.loadHospitalCards = loadHospitalCards;
window.focusHospitalOnMap = focusHospitalOnMap;
window.getDirections = getDirections;
window.loadHospitalMap = loadHospitalMap;
window.initializeNearbyHospitals = initializeNearbyHospitals;
window.generateStars = generateStars;