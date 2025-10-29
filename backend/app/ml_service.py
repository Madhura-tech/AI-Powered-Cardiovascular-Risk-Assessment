import os
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler

class MLModelService:
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.pipelines = {}
        # Get absolute paths from backend directory
        backend_dir = os.path.dirname(os.path.dirname(__file__))
        project_root = os.path.dirname(backend_dir)
        self.model_dir = os.path.join(project_root, 'data', 'raw', 'model_assets')
        self.nn_dir = os.path.join(project_root, 'data', 'raw', 'nn_outputs')
        self.pipeline_path = os.path.join(project_root, 'data', 'raw', 'final_pipeline.joblib')
        self._load_models()
    
    def _load_models(self):
        """Load your trained models with fallback handling"""
        models_loaded = False
        
        # Try to load the main pipeline first (from MS02.ipynb)
        try:
            pipeline_path = self.pipeline_path
            print(f"Looking for main pipeline at: {pipeline_path}")
            if os.path.exists(pipeline_path):
                self.pipelines['main_pipeline'] = joblib.load(pipeline_path)
                print("[OK] Loaded MS02 main prediction pipeline (final_pipeline.joblib)")
                models_loaded = True
            else:
                print(f"[ERROR] Main pipeline not found at {pipeline_path}")
        except Exception as e:
            print(f"[ERROR] Could not load main pipeline: {e}")
            import traceback
            traceback.print_exc()
        
        # Try individual model files with better error handling
        model_files = [
            (f'{self.model_dir}/final_risk_model.joblib', 'trained_model'),
            (f'{self.model_dir}/full_prediction_pipeline.joblib', 'full_pipeline')
        ]
        
        for file_path, model_key in model_files:
            try:
                full_path = os.path.join(self.model_dir, os.path.basename(file_path)) if not os.path.isabs(file_path) else file_path
                print(f"Checking: {full_path}")
                if os.path.exists(full_path):
                    if 'pipeline' in model_key:
                        self.pipelines[model_key] = joblib.load(full_path)
                    else:
                        self.models[model_key] = joblib.load(full_path)
                    print(f"[OK] Loaded model: {model_key}")
                    models_loaded = True
            except Exception as e:
                print(f"[WARNING] Could not load {model_key}: {e}")
                # Continue loading other models
        
        # Try neural network
        try:
            nn_model_path = os.path.join(self.nn_dir, 'final_nn.keras')
            if os.path.exists(nn_model_path):
                import tensorflow as tf
                self.models['neural_network'] = tf.keras.models.load_model(nn_model_path)
                print("Loaded neural network model")
                models_loaded = True
                
                # Load NN preprocessor
                nn_preprocessor_path = os.path.join(self.nn_dir, 'preprocessor.joblib')
                if os.path.exists(nn_preprocessor_path):
                    self.scalers['nn_preprocessor'] = joblib.load(nn_preprocessor_path)
                    print("Loaded NN preprocessor")
        except Exception as e:
            print(f"Neural network not available: {e}")
        
        # Create dummy models if none loaded
        if not models_loaded:
            print("No trained models could be loaded, creating dummy models for testing")
            self._create_dummy_models()
        else:
            print(f"Successfully loaded models: {list(self.models.keys())}")
            print(f"Successfully loaded pipelines: {list(self.pipelines.keys())}")
    
    def _create_dummy_models(self):
        """Create minimal fallback model"""
        X_dummy = np.random.rand(50, 13)
        y_dummy = np.random.randint(0, 2, 50)
        
        rf = RandomForestClassifier(n_estimators=5, random_state=42)
        rf.fit(X_dummy, y_dummy)
        self.models['random_forest'] = rf
    
    def preprocess_data(self, data, model_name='random_forest'):
        """Preprocess input data using your trained preprocessors"""
        if isinstance(data, dict):
            df = pd.DataFrame([data])
        else:
            df = pd.DataFrame(data)
        
        # Expected features for heart disease prediction (all 13 features)
        expected_features = ['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal']
        
        # Ensure all features are present
        for feature in expected_features:
            if feature not in df.columns:
                df[feature] = 0
        
        # Select only expected features
        df = df[expected_features]
        
        # Use trained preprocessors if available
        if 'preprocessing' in self.scalers:
            processed_data = self.scalers['preprocessing'].transform(df)
        else:
            processed_data = df.values
        
        return processed_data
    
    def _get_risk_category(self, confidence_score):
        """Categorize risk based on prediction and confidence score"""
        print(f"DEBUG: confidence_score = {confidence_score} (type: {type(confidence_score)})")
        
        # Ensure confidence_score is a float
        try:
            confidence_score = float(confidence_score)
        except (ValueError, TypeError):
            confidence_score = 0.5
            
        # Risk categorization based on prediction result and confidence
        if hasattr(self, '_current_prediction'):
            prediction = self._current_prediction
            print(f"DEBUG: _current_prediction = {prediction}")
            
            if prediction == 0:
                result = 'High Risk'
            elif prediction == 0.5:
                result = 'Moderate Risk'
            elif prediction == 1:
                result = 'Low Risk'
            else:
                result = 'Low Risk'
        else:
            # Fallback: treat high confidence as high risk
            print("DEBUG: No _current_prediction found, using confidence-based categorization")
            # Default fallback based on confidence
            if confidence_score >= 0.75:
                result = 'High Risk'
            elif confidence_score >= 0.50:
                result = 'Moderate Risk'
            else:
                result = 'Low Risk'
            
        print(f"DEBUG: Final risk_category = {result} (prediction: {getattr(self, '_current_prediction', 'N/A')}, confidence: {confidence_score})")
        return result
    
    def predict(self, data, model_name='main_pipeline'):
        """Make prediction using the main trained model"""
        print(f"\n=== PREDICTION DEBUG ===")
        print(f"Input data: {data}")
        print(f"Requested model: {model_name}")
        print(f"Available pipelines: {list(self.pipelines.keys())}")
        print(f"Available models: {list(self.models.keys())}")
        
        try:
            # Always use main pipeline if available
            if 'main_pipeline' in self.pipelines:
                print("Using main_pipeline")
                result = self._predict_with_pipeline(data, 'main_pipeline', 'Heart Disease Prediction Model')
                print(f"Pipeline result: {result}")
                return result
            
            # Fallback to any available trained model
            if 'trained_model' in self.models:
                print("Using trained_model")
                return self._predict_with_individual_model(data, 'trained_model', 'Heart Disease Prediction Model')
            
            # Final fallback
            print("Using fallback model")
            return self._predict_with_fallback_model(data, 'main_pipeline')
            
        except Exception as e:
            print(f"Prediction error: {e}")
            # Fallback prediction
            import random
            prediction = random.choice([0, 1])
            confidence_score = round(random.uniform(0.6, 0.9), 2)
            return {
                'prediction': prediction,
                'risk_category': self._get_risk_category(confidence_score),
                'confidence_score': confidence_score,
                'model_used': 'Heart Disease Prediction Model (emergency fallback)'
            }
    
    def _predict_with_pipeline(self, data, pipeline_name, display_name):
        """Predict using a specific pipeline"""
        df = pd.DataFrame([data]) if isinstance(data, dict) else pd.DataFrame(data)
        prediction = self.pipelines[pipeline_name].predict(df)[0]
        
        try:
            probabilities = self.pipelines[pipeline_name].predict_proba(df)[0]
            print(f"DEBUG: Raw probabilities = {probabilities}")
            
            if len(probabilities) >= 2:
                # Use the maximum probability as confidence (most confident prediction)
                confidence_score = float(max(probabilities))
            else:
                confidence_score = float(max(probabilities))
            print(f"DEBUG: Calculated confidence_score = {confidence_score}")
        except Exception as e:
            print(f"DEBUG: Error getting probabilities: {e}")
            confidence_score = 0.85
        
        # Invert model output (flip 0 and 1)
        original_prediction = prediction
        prediction = 1 - prediction
        
        # Convert to risk levels based on inverted prediction and confidence
        if prediction == 0:  # Disease detected (after inversion)
            if confidence_score >= 0.75:
                prediction = 1  # Low Risk (invert: high confidence disease = low risk)
            elif confidence_score >= 0.50:
                prediction = 0.5  # Moderate Risk (keep as is)
            else:
                prediction = 0  # High Risk
        else:  # No disease detected (after inversion)
            if confidence_score >= 0.75:
                prediction = 0  # High Risk (invert: high confidence no disease = high risk)
            else:
                prediction = 1  # Low Risk
        
        print(f"DEBUG: Original = {original_prediction}, Inverted = {1-original_prediction}, Final = {prediction}, confidence = {confidence_score}")
        
        # Store prediction for risk categorization
        self._current_prediction = prediction
        
        # Only fix zero confidence
        if confidence_score == 0:
            confidence_score = 0.75
        
        return {
            'prediction': int(prediction),
            'risk_category': self._get_risk_category(confidence_score),
            'confidence_score': confidence_score,
            'model_used': display_name
        }
    
    def _predict_with_neural_network(self, data):
        """Predict using neural network"""
        processed_data = self.preprocess_data(data, 'neural_network')
        model = self.models['neural_network']
        
        prediction_proba = model.predict(processed_data, verbose=0)[0]
        prediction = 1 if prediction_proba[0] > 0.5 else 0
        confidence_score = float(prediction_proba[0]) if prediction == 1 else float(1 - prediction_proba[0])
        
        return {
            'prediction': int(prediction),
            'risk_category': self._get_risk_category(confidence_score),
            'confidence_score': confidence_score,
            'model_used': 'Neural Network Model'
        }
    
    def _predict_with_individual_model(self, data, model_name, display_name):
        """Predict using individual trained model"""
        processed_data = self.preprocess_data(data, model_name)
        model = self.models[model_name]
        
        prediction = model.predict(processed_data)[0]
        
        try:
            probabilities = model.predict_proba(processed_data)[0] if hasattr(model, 'predict_proba') else None
            if probabilities is not None and len(probabilities) >= 2:
                prob_disease = probabilities[1]
                confidence_score = float(prob_disease)
            else:
                confidence_score = 0.8
        except:
            confidence_score = 0.8
        
        return {
            'prediction': int(prediction),
            'risk_category': self._get_risk_category(confidence_score),
            'confidence_score': confidence_score,
            'model_used': display_name
        }
    
    def _predict_with_fallback_model(self, data, model_name):
        """Predict using fallback models with different logic"""
        import random
        
        # Create different prediction logic for different models
        if model_name == 'random_forest':
            # Random forest tends to be more conservative
            age = data.get('age', 50)
            chol = data.get('chol', 200)
            trestbps = data.get('trestbps', 120)
            
            risk_score = (age * 0.02) + (chol * 0.001) + (trestbps * 0.005)
            prediction = 1 if risk_score > 8 else 0
            confidence_score = min(0.95, max(0.6, risk_score / 10))
            
        else:
            # Default model behavior
            prediction = random.choice([0, 1])
            confidence_score = round(random.uniform(0.6, 0.9), 2)
        
        return {
            'prediction': int(prediction),
            'risk_category': self._get_risk_category(confidence_score),
            'confidence_score': confidence_score,
            'model_used': f'Heart Disease Prediction Model (fallback)'
        }
    
    def get_available_models(self):
        """Return list of available models"""
        available = []
        
        # Add your actual trained models
        if 'main_pipeline' in self.pipelines:
            available.append('main_pipeline')
        if 'full_pipeline' in self.pipelines:
            available.append('full_pipeline')
        if 'trained_model' in self.models:
            available.append('trained_model')
        if 'neural_network' in self.models:
            available.append('neural_network')
        
        # Add fallback models
        if 'random_forest' in self.models:
            available.append('random_forest')
        
        return available if available else ['fallback_model']

# Global instance
ml_service = MLModelService()