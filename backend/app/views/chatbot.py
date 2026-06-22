from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import re
import random

chatbot_bp = Blueprint('chatbot', __name__)

class AdvancedChatbot:
    def __init__(self):
        self.responses = {
            'greeting': [
                "Hello! I'm Dr. AI, your personal heart health assistant. How can I help you today?",
                "Hi there! I'm here to help with your heart health questions. What's on your mind?",
                "Good day! I'm your AI cardiovascular health advisor. How may I assist you?"
            ],
            'chest_pain': "💔 **Chest Pain Information:**\nChest pain can vary from sharp stabbing to dull pressure. Heart-related chest pain often feels like pressure or squeezing in the center of your chest.\n\n🚨 **Seek immediate help if you have:**\n• Crushing chest pain\n• Pain spreading to arms, neck, jaw\n• Shortness of breath\n• Nausea or sweating\n\n📞 Call emergency services immediately!",
            'blood_pressure': "📊 **Blood Pressure Guidelines:**\n• Normal: Less than 120/80 mmHg\n• Elevated: 120-129 systolic\n• Stage 1 Hypertension: 130-139/80-89 mmHg\n• Stage 2 Hypertension: 140/90+ mmHg\n\n💡 **Natural ways to lower BP:**\n• Reduce sodium intake\n• Exercise regularly\n• Maintain healthy weight\n• Limit alcohol\n• Manage stress",
            'diet': "🍎 **Heart-Healthy Diet Plan:**\n• 🐟 Fatty fish 2x/week (salmon, mackerel)\n• 🥜 Nuts and seeds daily\n• 🫒 Olive oil instead of butter\n• 🥬 Leafy greens and colorful vegetables\n• 🚫 Limit processed foods and added sugars\n\n**Sample meal:** Grilled salmon, quinoa, steamed broccoli, mixed berries",
            'exercise': "💪 **Exercise for Heart Health:**\n• 🚶♀️ 150 min moderate cardio/week\n• 🏋️♂️ 2 days strength training\n• 🧘♀️ Flexibility work\n\n**Beginner routine:**\n• Week 1-2: 10 min walks daily\n• Week 3-4: 15 min walks + light stretching\n• Week 5+: Add 2 days of bodyweight exercises",
            'stress': "🧠 **Stress & Heart Health:**\nChronic stress raises blood pressure and increases heart disease risk.\n\n**Quick stress relief:**\n• 4-7-8 breathing: Inhale 4, hold 7, exhale 8\n• 10-minute meditation\n• Progressive muscle relaxation\n• Regular physical activity\n\nTry the breathing technique now!",
            'prediction': "🔬 **AI Health Prediction:**\nOur ML model analyzes 13 health parameters for personalized risk assessment.\n\n**You'll need:**\n• Age, gender\n• Blood pressure reading\n• Cholesterol levels\n• ECG results\n• Exercise tolerance\n\n🎯 Click 'Health Check' to start your assessment!"
        }
    
    def analyze_message(self, message):
        message = message.lower().strip()
        
        if any(word in message for word in ['hello', 'hi', 'hey', 'good morning']):
            return random.choice(self.responses['greeting'])
        elif any(word in message for word in ['chest pain', 'heart pain', 'chest hurt']):
            return self.responses['chest_pain']
        elif any(word in message for word in ['blood pressure', 'bp', 'hypertension']):
            return self.responses['blood_pressure']
        elif any(word in message for word in ['diet', 'food', 'nutrition', 'eat']):
            return self.responses['diet']
        elif any(word in message for word in ['exercise', 'workout', 'fitness', 'gym']):
            return self.responses['exercise']
        elif any(word in message for word in ['stress', 'anxiety', 'worried', 'tension']):
            return self.responses['stress']
        elif any(word in message for word in ['prediction', 'test', 'assessment', 'risk']):
            return self.responses['prediction']
        elif any(word in message for word in ['thank', 'thanks']):
            return "You're welcome! I'm here to help with your heart health journey. Stay healthy! 💙"
        elif any(word in message for word in ['bye', 'goodbye']):
            return "Take care of your heart! Remember, small daily choices make a big difference. 👋💙"
        else:
            return "I can help with:\n• 💔 Chest pain and symptoms\n• 📊 Blood pressure info\n• 🍎 Heart-healthy diet tips\n• 💪 Exercise recommendations\n• 🧠 Stress management\n• 🔬 Risk assessment\n\nWhat interests you most?"

def get_bot_response(message):
    chatbot = AdvancedChatbot()
    return chatbot.analyze_message(message)

@chatbot_bp.route('/chat', methods=['POST'])
@jwt_required()
def chat():
    try:
        data = request.get_json()
        message = data.get('message', '').strip()
        user_id = get_jwt_identity()
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        response = get_bot_response(message)
        
        return jsonify({
            'response': response,
            'timestamp': '2024-01-01 12:00:00',
            'user_id': user_id,
            'message_id': f"msg_{hash(message + str(user_id))}"
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500