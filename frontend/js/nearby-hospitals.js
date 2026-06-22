// Nearby Hospitals Functionality for Bangalore
const BANGALORE_HOSPITALS = [
    {
        id: 1,
        name: "Fortis Hospital Bannerghatta Road",
        type: "multi-specialty",
        address: "154/9, Opp. IIM-B, Bannerghatta Road, Bangalore - 560076",
        phone: "+91 80 6621 4444",
        rating: 4.5,
        distance: "2.5 km",
        specialties: ["Cardiology", "Neurology", "Oncology", "Emergency Care"],
        coordinates: { lat: 12.8988, lng: 77.6011 },
        image: "https://via.placeholder.com/300x200/ec4899/ffffff?text=Fortis+Hospital",
        website: "https://www.fortishealthcare.com",
        emergency: true,
        description: "Leading multi-specialty hospital with advanced cardiac care facilities and 24/7 emergency services."
    },
    {
        id: 2,
        name: "Manipal Hospital HAL Airport Road",
        type: "multi-specialty",
        address: "98, HAL Airport Road, Bangalore - 560017",
        phone: "+91 80 2502 4444",
        rating: 4.4,
        distance: "3.2 km",
        specialties: ["Cardiology", "Cardiac Surgery", "Emergency Care", "ICU"],
        coordinates: { lat: 12.9716, lng: 77.6412 },
        image: "https://via.placeholder.com/300x200/be185d/ffffff?text=Manipal+Hospital",
        website: "https://www.manipalhospitals.com",
        emergency: true,
        description: "Renowned for cardiac care with state-of-the-art facilities and experienced cardiologists."
    },
    {
        id: 3,
        name: "Apollo Hospital Bannerghatta",
        type: "multi-specialty",
        address: "154/11, Opp. IIM-B, Bannerghatta Road, Bangalore - 560076",
        phone: "+91 80 2692 2222",
        rating: 4.6,
        distance: "2.8 km",
        specialties: ["Cardiology", "Cardiac Surgery", "Interventional Cardiology", "Emergency"],
        coordinates: { lat: 12.8977, lng: 77.6003 },
        image: "https://via.placeholder.com/300x200/f472b6/ffffff?text=Apollo+Hospital",
        website: "https://www.apollohospitals.com",
        emergency: true,
        description: "Premier healthcare destination with comprehensive cardiac care and advanced medical technology."
    },
    {
        id: 4,
        name: "Narayana Health City",
        type: "cardiac",
        address: "258/A, Bommasandra Industrial Area, Bangalore - 560099",
        phone: "+91 80 7122 2222",
        rating: 4.7,
        distance: "8.5 km",
        specialties: ["Cardiac Surgery", "Pediatric Cardiology", "Heart Transplant", "Emergency"],
        coordinates: { lat: 12.8056, lng: 77.6736 },
        image: "https://via.placeholder.com/300x200/ec4899/ffffff?text=Narayana+Health",
        website: "https://www.narayanahealth.org",
        emergency: true,
        description: "Asia's largest cardiac care center with world-class facilities and renowned cardiac surgeons."
    },
    {
        id: 5,
        name: "Aster CMI Hospital",
        type: "multi-specialty",
        address: "#43/2, New Airport Road, NH-7, Sahakara Nagar, Bangalore - 560092",
        phone: "+91 80 4344 4444",
        rating: 4.3,
        distance: "5.1 km",
        specialties: ["Cardiology", "Emergency Care", "Critical Care", "Interventional Cardiology"],
        coordinates: { lat: 13.0358, lng: 77.6394 },
        image: "https://via.placeholder.com/300x200/be185d/ffffff?text=Aster+CMI",
        website: "https://www.asterhospitals.in",
        emergency: true,
        description: "Modern multi-specialty hospital with advanced cardiac care and emergency services."
    },
    {
        id: 6,
        name: "Sakra World Hospital",
        type: "multi-specialty",
        address: "#52/2, Devarabeesanahalli, Outer Ring Road, Bangalore - 560103",
        phone: "+91 80 4969 4969",
        rating: 4.4,
        distance: "6.3 km",
        specialties: ["Cardiology", "Cardiac Surgery", "Emergency Care", "Preventive Health"],
        coordinates: { lat: 12.9279, lng: 77.6271 },
        image: "https://via.placeholder.com/300x200/f472b6/ffffff?text=Sakra+World",
        website: "https://www.sakraworldhospital.com",
        emergency: true,
        description: "International standard healthcare with comprehensive cardiac services and preventive care programs."
    },
    {
        id: 7,
        name: "BGS Gleneagles Global Hospital",
        type: "multi-specialty",
        address: "#67, Uttarahalli Road, Kengeri, Bangalore - 560060",
        phone: "+91 80 2222 2222",
        rating: 4.2,
        distance: "7.8 km",
        specialties: ["Cardiology", "Cardiac Surgery", "Emergency Care", "Rehabilitation"],
        coordinates: { lat: 12.9081, lng: 77.4859 },
        image: "https://via.placeholder.com/300x200/ec4899/ffffff?text=BGS+Gleneagles",
        website: "https://www.bgsglobalhospitals.com",
        emergency: true,
        description: "Comprehensive healthcare facility with specialized cardiac care and rehabilitation services."
    },
    {
        id: 8,
        name: "Jayadeva Institute of Cardiovascular Sciences",
        type: "cardiac",
        address: "BG Road, Jayanagar 9th Block, Bangalore - 560069",
        phone: "+91 80 2649 2222",
        rating: 4.5,
        distance: "4.7 km",
        specialties: ["Cardiology", "Cardiac Surgery", "Pediatric Cardiology", "Research"],
        coordinates: { lat: 12.9279, lng: 77.5619 },
        image: "https://via.placeholder.com/300x200/be185d/ffffff?text=Jayadeva+Institute",
        website: "https://www.jayadevacardiology.com",
        emergency: true,
        description: "Premier cardiac specialty institute with advanced research facilities and expert cardiac care."
    },
    {
        id: 9,
        name: "Vikram Hospital",
        type: "multi-specialty",
        address: "No.70/1, Millers Road, Vasanth Nagar, Bangalore - 560052",
        phone: "+91 80 4040 4040",
        rating: 4.1,
        distance: "3.9 km",
        specialties: ["Cardiology", "Emergency Care", "Critical Care", "Preventive Health"],
        coordinates: { lat: 12.9716, lng: 77.5946 },
        image: "https://via.placeholder.com/300x200/f472b6/ffffff?text=Vikram+Hospital",
        website: "https://www.vikramhospital.com",
        emergency: true,
        description: "Trusted healthcare provider with comprehensive medical services and emergency care."
    },
    {
        id: 10,
        name: "St. John's Medical College Hospital",
        type: "government",
        address: "Sarjapur Road, Bangalore - 560034",
        phone: "+91 80 4963 3333",
        rating: 4.3,
        distance: "5.5 km",
        specialties: ["Cardiology", "Emergency Care", "Teaching Hospital", "Research"],
        coordinates: { lat: 12.9279, lng: 77.6271 },
        image: "https://via.placeholder.com/300x200/ec4899/ffffff?text=St+Johns+Hospital",
        website: "https://www.stjohns.in",
        emergency: true,
        description: "Leading medical college hospital with excellent cardiac care and emergency services."
    }
];

// Initialize hospitals functionality
function initializeNearbyHospitals() {
    console.log('Initializing nearby hospitals functionality...');
    
    // Load hospitals list immediately
    loadHospitalsList();
    
    // Setup search and filter functionality
    setupHospitalFilters();
    
    console.log('✅ Nearby hospitals initialized successfully');
}

// Load and display hospitals list
function loadHospitalsList(filteredHospitals = null) {
    const hospitalsList = document.getElementById('hospitalsList');
    if (!hospitalsList) {
        console.error('Hospitals list container not found');
        return;
    }
    
    const hospitals = filteredHospitals || BANGALORE_HOSPITALS;
    
    const hospitalsHTML = hospitals.map(hospital => {
        const specialtiesHTML = hospital.specialties.slice(0, 3).map(specialty => 
            `<span style="background: rgba(236, 72, 153, 0.1); color: #be185d; padding: 0.2rem 0.5rem; border-radius: 10px; font-size: 0.7rem; font-weight: 500; margin-right: 0.3rem;">${specialty}</span>`
        ).join('');
        
        const ratingStars = generateStarRating(hospital.rating);
        
        return `
            <div class="col-md-6 col-lg-4 mb-4">
                <div style="background: rgba(244, 114, 182, 0.1); border: 1px solid rgba(244, 114, 182, 0.3); border-radius: 20px; padding: 1.5rem; transition: all 0.3s ease; height: 100%; cursor: pointer;" 
                     onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 15px 35px rgba(236, 72, 153, 0.2)'" 
                     onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'"
                     onclick="showHospitalDetails(${hospital.id})">\n                    
                    <!-- Hospital Image -->\n                    <div style="height: 150px; background: url('${hospital.image}') center/cover; border-radius: 15px; margin-bottom: 1rem; position: relative; overflow: hidden;">\n                        <div style="position: absolute; top: 0.5rem; right: 0.5rem; background: rgba(255, 255, 255, 0.9); padding: 0.3rem 0.6rem; border-radius: 10px; font-size: 0.7rem; font-weight: 600; color: #831843;">\n                            <i class="fas fa-map-marker-alt" style="color: #ec4899; margin-right: 0.2rem;"></i>\n                            ${hospital.distance}\n                        </div>\n                        ${hospital.emergency ? '<div style="position: absolute; top: 0.5rem; left: 0.5rem; background: #ef4444; color: white; padding: 0.3rem 0.6rem; border-radius: 10px; font-size: 0.7rem; font-weight: 600;"><i class="fas fa-ambulance"></i> 24/7</div>' : ''}\n                    </div>\n                    \n                    <!-- Hospital Info -->\n                    <div style="margin-bottom: 1rem;">\n                        <h6 style="color: #831843; font-weight: 600; margin-bottom: 0.5rem; font-size: 1rem; line-height: 1.3;">${hospital.name}</h6>\n                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">\n                            <div style="color: #f59e0b;">${ratingStars}</div>\n                            <span style="color: #9d174d; font-size: 0.8rem; font-weight: 500;">${hospital.rating}</span>\n                        </div>\n                        <p style="color: #9d174d; margin: 0; font-size: 0.8rem; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${hospital.address}</p>\n                    </div>\n                    \n                    <!-- Specialties -->\n                    <div style="margin-bottom: 1rem;">\n                        ${specialtiesHTML}\n                        ${hospital.specialties.length > 3 ? `<span style="color: #9d174d; font-size: 0.7rem;">+${hospital.specialties.length - 3} more</span>` : ''}\n                    </div>\n                    \n                    <!-- Action Buttons -->\n                    <div style="display: flex; gap: 0.5rem; margin-top: auto;">\n                        <button onclick="event.stopPropagation(); callHospital('${hospital.phone}')" style="flex: 1; background: linear-gradient(135deg, #10b981, #059669); border: none; color: white; padding: 0.6rem; border-radius: 10px; font-weight: 600; font-size: 0.8rem; cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">\n                            <i class="fas fa-phone"></i> Call\n                        </button>\n                        <button onclick="event.stopPropagation(); getDirections(${hospital.coordinates.lat}, ${hospital.coordinates.lng}, '${hospital.name}')" style="flex: 1; background: linear-gradient(135deg, #ec4899, #be185d); border: none; color: white; padding: 0.6rem; border-radius: 10px; font-weight: 600; font-size: 0.8rem; cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">\n                            <i class="fas fa-directions"></i> Directions\n                        </button>\n                    </div>\n                </div>\n            </div>\n        `;\n    }).join('');\n    \n    hospitalsList.innerHTML = hospitalsHTML;\n}\n\n// Generate star rating HTML\nfunction generateStarRating(rating) {\n    const fullStars = Math.floor(rating);\n    const hasHalfStar = rating % 1 !== 0;\n    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);\n    \n    let starsHTML = '';\n    \n    // Full stars\n    for (let i = 0; i < fullStars; i++) {\n        starsHTML += '<i class="fas fa-star"></i>';\n    }\n    \n    // Half star\n    if (hasHalfStar) {\n        starsHTML += '<i class="fas fa-star-half-alt"></i>';\n    }\n    \n    // Empty stars\n    for (let i = 0; i < emptyStars; i++) {\n        starsHTML += '<i class="far fa-star"></i>';\n    }\n    \n    return starsHTML;\n}\n\n// Setup search and filter functionality\nfunction setupHospitalFilters() {\n    const searchInput = document.getElementById('hospitalSearchInput');\n    const typeFilter = document.getElementById('hospitalTypeFilter');\n    \n    if (searchInput) {\n        searchInput.addEventListener('input', filterHospitals);
        searchInput.addEventListener('input', filterHospitalMap);\n    }\n    \n    if (typeFilter) {\n        typeFilter.addEventListener('change', filterHospitals);\n    }\n}\n\n// Filter hospitals based on search and type\nfunction filterHospitals() {\n    const searchTerm = document.getElementById('hospitalSearchInput')?.value.toLowerCase() || '';\n    const typeFilter = document.getElementById('hospitalTypeFilter')?.value || '';\n    \n    const filteredHospitals = BANGALORE_HOSPITALS.filter(hospital => {\n        const matchesSearch = searchTerm === '' || \n            hospital.name.toLowerCase().includes(searchTerm) ||\n            hospital.address.toLowerCase().includes(searchTerm) ||\n            hospital.specialties.some(specialty => specialty.toLowerCase().includes(searchTerm));\n        \n        const matchesType = typeFilter === '' || hospital.type === typeFilter;\n        \n        return matchesSearch && matchesType;\n    });\n    \n    loadHospitalsList(filteredHospitals);\n}\n\n// Show hospital details in modal\nfunction showHospitalDetails(hospitalId) {\n    const hospital = BANGALORE_HOSPITALS.find(h => h.id === hospitalId);\n    if (!hospital) {\n        console.error('Hospital not found:', hospitalId);\n        return;\n    }\n    \n    const specialtiesHTML = hospital.specialties.map(specialty => \n        `<span style="background: rgba(236, 72, 153, 0.1); color: #be185d; padding: 0.3rem 0.8rem; border-radius: 15px; font-size: 0.8rem; font-weight: 500; margin-right: 0.5rem; margin-bottom: 0.5rem; display: inline-block;">${specialty}</span>`\n    ).join('');\n    \n    const ratingStars = generateStarRating(hospital.rating);\n    \n    const modalHTML = `\n        <div class="modal fade" id="hospitalModal" tabindex="-1">\n            <div class="modal-dialog modal-lg">\n                <div class="modal-content" style="background: linear-gradient(135deg, #fdf2f8, #fce7f3); border: none; border-radius: 20px;">\n                    <div class="modal-header" style="background: linear-gradient(135deg, #ec4899, #be185d); color: white; border-radius: 20px 20px 0 0; border: none;">\n                        <h5 class="modal-title" style="font-weight: 600;">\n                            <i class="fas fa-hospital me-2"></i>\n                            ${hospital.name}\n                        </h5>\n                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>\n                    </div>\n                    <div class="modal-body" style="padding: 2rem; color: #831843;">\n                        <!-- Hospital Image -->\n                        <div style="height: 200px; background: url('${hospital.image}') center/cover; border-radius: 15px; margin-bottom: 2rem; position: relative;">\n                            ${hospital.emergency ? '<div style="position: absolute; top: 1rem; left: 1rem; background: #ef4444; color: white; padding: 0.5rem 1rem; border-radius: 15px; font-weight: 600;"><i class="fas fa-ambulance"></i> 24/7 Emergency</div>' : ''}\n                            <div style="position: absolute; top: 1rem; right: 1rem; background: rgba(255, 255, 255, 0.9); padding: 0.5rem 1rem; border-radius: 15px; font-weight: 600; color: #831843;">\n                                <i class="fas fa-map-marker-alt" style="color: #ec4899; margin-right: 0.5rem;"></i>\n                                ${hospital.distance}\n                            </div>\n                        </div>\n                        \n                        <!-- Hospital Information -->\n                        <div style="background: rgba(236, 72, 153, 0.1); border: 1px solid rgba(236, 72, 153, 0.3); border-radius: 15px; padding: 1.5rem; margin-bottom: 2rem;">\n                            <div class="row">\n                                <div class="col-md-6">\n                                    <h6 style="color: #831843; font-weight: 600; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">\n                                        <i class="fas fa-info-circle" style="color: #ec4899;"></i>\n                                        Hospital Information\n                                    </h6>\n                                    <p style="margin-bottom: 0.5rem;"><strong>Type:</strong> ${hospital.type.charAt(0).toUpperCase() + hospital.type.slice(1).replace('-', ' ')}</p>\n                                    <p style="margin-bottom: 0.5rem;"><strong>Rating:</strong> <span style="color: #f59e0b;">${ratingStars}</span> ${hospital.rating}/5</p>\n                                    <p style="margin-bottom: 0.5rem;"><strong>Distance:</strong> ${hospital.distance}</p>\n                                </div>\n                                <div class="col-md-6">\n                                    <h6 style="color: #831843; font-weight: 600; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">\n                                        <i class="fas fa-map-marker-alt" style="color: #ec4899;"></i>\n                                        Contact Information\n                                    </h6>\n                                    <p style="margin-bottom: 0.5rem;"><strong>Phone:</strong> <a href="tel:${hospital.phone}" style="color: #ec4899; text-decoration: none;">${hospital.phone}</a></p>\n                                    <p style="margin-bottom: 0.5rem;"><strong>Website:</strong> <a href="${hospital.website}" target="_blank" style="color: #ec4899; text-decoration: none;">Visit Website</a></p>\n                                </div>\n                            </div>\n                            <div style="margin-top: 1rem;">\n                                <p style="margin-bottom: 0.5rem;"><strong>Address:</strong> ${hospital.address}</p>\n                                <p style="margin-bottom: 0;"><strong>Description:</strong> ${hospital.description}</p>\n                            </div>\n                        </div>\n                        \n                        <!-- Specialties -->\n                        <div style="background: rgba(244, 114, 182, 0.1); border: 1px solid rgba(244, 114, 182, 0.3); border-radius: 15px; padding: 1.5rem; margin-bottom: 2rem;">\n                            <h6 style="color: #831843; font-weight: 600; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">\n                                <i class="fas fa-stethoscope" style="color: #ec4899;"></i>\n                                Medical Specialties\n                            </h6>\n                            <div>\n                                ${specialtiesHTML}\n                            </div>\n                        </div>\n                    </div>\n                    <div class="modal-footer" style="background: rgba(236, 72, 153, 0.05); border-radius: 0 0 20px 20px; border: none; padding: 1.5rem; display: flex; gap: 1rem; justify-content: center;">\n                        <button type="button" onclick="callHospital('${hospital.phone}')" style="background: linear-gradient(135deg, #10b981, #059669); border: none; color: white; padding: 0.75rem 1.5rem; border-radius: 15px; font-weight: 600;">\n                            <i class="fas fa-phone me-1"></i>Call Hospital\n                        </button>\n                        <button type="button" onclick="getDirections(${hospital.coordinates.lat}, ${hospital.coordinates.lng}, '${hospital.name}')" style="background: linear-gradient(135deg, #ec4899, #be185d); border: none; color: white; padding: 0.75rem 1.5rem; border-radius: 15px; font-weight: 600;">\n                            <i class="fas fa-directions me-1"></i>Get Directions\n                        </button>\n                        <button type="button" data-bs-dismiss="modal" style="background: rgba(236, 72, 153, 0.1); border: 1px solid rgba(236, 72, 153, 0.3); color: #831843; padding: 0.75rem 1.5rem; border-radius: 15px; font-weight: 600;">\n                            <i class="fas fa-times me-1"></i>Close\n                        </button>\n                    </div>\n                </div>\n            </div>\n        </div>\n    `;\n    \n    // Remove existing modal if any\n    const existingModal = document.getElementById('hospitalModal');\n    if (existingModal) {\n        existingModal.remove();\n    }\n    \n    // Add modal to body\n    document.body.insertAdjacentHTML('beforeend', modalHTML);\n    \n    // Show modal\n    const modal = new bootstrap.Modal(document.getElementById('hospitalModal'));\n    modal.show();\n    \n    // Clean up modal after it's hidden\n    document.getElementById('hospitalModal').addEventListener('hidden.bs.modal', function() {\n        this.remove();\n    });\n}\n\n// Call hospital function\nfunction callHospital(phoneNumber) {\n    window.location.href = `tel:${phoneNumber}`;\n}\n\n// Get directions function\nfunction getDirections(lat, lng, hospitalName) {\n    // Open Google Maps with directions\n    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(hospitalName)}`;\n    window.open(googleMapsUrl, '_blank');\n}\n\n// Load hospital map (placeholder function)\nfunction loadHospitalMap() {\n    const mapContainer = document.getElementById('hospitalMap');\n    if (!mapContainer) return;\n    \n    // Show loading state\n    mapContainer.innerHTML = `\n        <div style="text-align: center; color: #831843;">\n            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #ec4899; margin-bottom: 1rem;"></i>\n            <p>Loading interactive map...</p>\n        </div>\n    `;\n    \n    // Simulate loading and show embedded map\n    setTimeout(() => {\n        mapContainer.innerHTML = `\n            <div style="position: relative; width: 100%; height: 100%; border-radius: 15px; overflow: hidden;">\n                <iframe \n                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d248849.886539092!2d77.49085452148437!3d12.953945614117647!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae1670c9b44e6d%3A0xf8dfc3e8517e4fe0!2sBengaluru%2C%20Karnataka!5e0!3m2!1sen!2sin!4v1699000000000!5m2!1sen!2sin&q=hospitals+near+bangalore"\n                    width="100%" \n                    height="100%" \n                    style="border:0; border-radius: 15px;" \n                    allowfullscreen="" \n                    loading="lazy" \n                    referrerpolicy="no-referrer-when-downgrade">\n                </iframe>\n                <div style="position: absolute; top: 1rem; left: 1rem; background: rgba(255, 255, 255, 0.9); padding: 0.5rem 1rem; border-radius: 10px; font-weight: 600; color: #831843; font-size: 0.9rem;">\n                    <i class="fas fa-map-marker-alt" style="color: #ec4899; margin-right: 0.5rem;"></i>\n                    Hospitals in Bangalore\n                </div>\n            </div>\n        `;\n    }, 2000);\n}\n\n// Initialize when nearby hospitals section is loaded\nfunction initNearbyHospitalsSection() {\n    // Check if we're on the nearby hospitals section\n    const nearbyHospitalsSection = document.getElementById('nearby-hospitals');\n    if (nearbyHospitalsSection && !nearbyHospitalsSection.classList.contains('d-none')) {\n        initializeNearbyHospitals();\n    }\n}\n\n// Make functions globally available\nwindow.initializeNearbyHospitals = initializeNearbyHospitals;\nwindow.loadHospitalsList = loadHospitalsList;\nwindow.filterHospitals = filterHospitals;\nwindow.showHospitalDetails = showHospitalDetails;\nwindow.callHospital = callHospital;\nwindow.getDirections = getDirections;\nwindow.loadHospitalMap = loadHospitalMap;\nwindow.initNearbyHospitalsSection = initNearbyHospitalsSection;\n\nconsole.log('✅ Nearby Hospitals functionality loaded successfully');

// Open full map
function openFullMap() {
    window.open('https://www.google.com/maps/search/hospitals+in+bangalore/@12.9716,77.5946,11z', '_blank');
}

window.openFullMap = openFullMap;\n