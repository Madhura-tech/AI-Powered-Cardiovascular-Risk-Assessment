// Prediction Form Fix
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        const form = document.getElementById('predictionForm');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                console.log('Prediction form submitted');
                
                // Call the handlePrediction function if it exists
                if (typeof handlePrediction === 'function') {
                    handlePrediction(e);
                } else if (typeof window.handlePrediction === 'function') {
                    window.handlePrediction(e);
                } else {
                    console.error('handlePrediction function not found');
                }
            });
            console.log('Prediction form fix applied');
        }
    }, 1000);
});
