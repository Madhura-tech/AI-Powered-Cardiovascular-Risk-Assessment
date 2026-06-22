// Direct hospital loading
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const hospitalsList = document.getElementById('hospitalsList');
        if (hospitalsList && hospitalsList.innerHTML.trim() === '') {
            console.log('Loading hospitals directly...');
            
            const hospitalsHTML = `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div style="background: rgba(244, 114, 182, 0.1); border: 1px solid rgba(244, 114, 182, 0.3); border-radius: 20px; padding: 1.5rem;">
                        <h6 style="color: #831843; font-weight: 600;">Fortis Hospital Bannerghatta Road</h6>
                        <p style="color: #9d174d; font-size: 0.9rem;">154/9, Opp. IIM-B, Bannerghatta Road, Bangalore - 560076</p>
                        <p style="color: #831843;"><strong>Phone:</strong> +91 80 6621 4444</p>
                        <div style="display: flex; gap: 0.5rem;">
                            <button style="background: #10b981; color: white; border: none; padding: 0.5rem 1rem; border-radius: 10px;">Call</button>
                            <button style="background: #ec4899; color: white; border: none; padding: 0.5rem 1rem; border-radius: 10px;">Directions</button>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 col-lg-4 mb-4">
                    <div style="background: rgba(244, 114, 182, 0.1); border: 1px solid rgba(244, 114, 182, 0.3); border-radius: 20px; padding: 1.5rem;">
                        <h6 style="color: #831843; font-weight: 600;">Apollo Hospital Bannerghatta</h6>
                        <p style="color: #9d174d; font-size: 0.9rem;">154/11, Opp. IIM-B, Bannerghatta Road, Bangalore - 560076</p>
                        <p style="color: #831843;"><strong>Phone:</strong> +91 80 2692 2222</p>
                        <div style="display: flex; gap: 0.5rem;">
                            <button style="background: #10b981; color: white; border: none; padding: 0.5rem 1rem; border-radius: 10px;">Call</button>
                            <button style="background: #ec4899; color: white; border: none; padding: 0.5rem 1rem; border-radius: 10px;">Directions</button>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 col-lg-4 mb-4">
                    <div style="background: rgba(244, 114, 182, 0.1); border: 1px solid rgba(244, 114, 182, 0.3); border-radius: 20px; padding: 1.5rem;">
                        <h6 style="color: #831843; font-weight: 600;">Manipal Hospital HAL Airport Road</h6>
                        <p style="color: #9d174d; font-size: 0.9rem;">98, HAL Airport Road, Bangalore - 560017</p>
                        <p style="color: #831843;"><strong>Phone:</strong> +91 80 2502 4444</p>
                        <div style="display: flex; gap: 0.5rem;">
                            <button style="background: #10b981; color: white; border: none; padding: 0.5rem 1rem; border-radius: 10px;">Call</button>
                            <button style="background: #ec4899; color: white; border: none; padding: 0.5rem 1rem; border-radius: 10px;">Directions</button>
                        </div>
                    </div>
                </div>
            `;
            
            hospitalsList.innerHTML = hospitalsHTML;
            console.log('Hospitals loaded directly');
        }
    }, 1000);
});