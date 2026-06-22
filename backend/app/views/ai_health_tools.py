from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

ai_tools_bp = Blueprint('ai_tools', __name__)

# AI Symptom Checker
@ai_tools_bp.route('/symptom-checker', methods=['POST'])
@jwt_required()
def symptom_checker():
    data = request.get_json()
    symptoms = data.get('symptoms', [])
    
    risk_score = len(symptoms) * 15
    if risk_score > 100:
        risk_score = 100
    
    conditions = []
    recommendations = []
    
    if any(s in symptoms for s in ['chest_pain', 'shortness_of_breath', 'irregular_heartbeat']):
        conditions.append({'name': 'Cardiovascular Concern', 'probability': min(85, risk_score + 20), 'severity': 'High'})
        recommendations.extend(['Consult cardiologist immediately', 'Monitor blood pressure regularly'])
    
    if 'fatigue' in symptoms:
        conditions.append({'name': 'General Fatigue', 'probability': 60, 'severity': 'Moderate'})
        recommendations.extend(['Ensure 7-8 hours sleep', 'Check vitamin D and B12 levels'])
    
    if 'dizziness' in symptoms:
        conditions.append({'name': 'Blood Pressure Irregularity', 'probability': 55, 'severity': 'Moderate'})
        recommendations.append('Check blood pressure twice daily')
    
    return jsonify({
        'success': True,
        'risk_score': risk_score,
        'conditions': conditions,
        'recommendations': recommendations,
        'urgency': 'High' if risk_score > 70 else 'Moderate' if risk_score > 40 else 'Low'
    })

# AI Health Coach
@ai_tools_bp.route('/health-coach', methods=['POST'])
@jwt_required()
def health_coach():
    data = request.get_json()
    user_data = data.get('user_data', {})
    
    age = user_data.get('age', 50)
    bmi = user_data.get('bmi', 25)
    activity_level = user_data.get('activity_level', 'moderate')
    
    diet_plan = []
    exercise_plan = []
    lifestyle_tips = []
    
    if bmi > 25:
        diet_plan.extend(['Reduce calorie intake by 300-500 cal/day', 'Increase fiber (25-30g daily)', 'Limit processed foods'])
    else:
        diet_plan.extend(['Balanced diet with lean proteins', '5 servings fruits/vegetables daily'])
    
    diet_plan.extend(['Omega-3 foods (salmon, walnuts)', 'Limit sodium <2300mg/day'])
    
    if activity_level == 'low':
        exercise_plan.extend(['Start 15-20 min walking daily', 'Increase to 30 min, 5 days/week'])
    elif activity_level == 'moderate':
        exercise_plan.extend(['30-45 min cardio, 5 days/week', 'Strength training 2-3 days/week'])
    else:
        exercise_plan.extend(['Maintain current routine', 'Add HIIT 2x/week'])
    
    lifestyle_tips.extend(['7-8 hours quality sleep', 'Stress management (meditation, yoga)', 'Stay hydrated (8-10 glasses)', 'Health check-ups every 6 months'])
    
    if age > 40:
        lifestyle_tips.append('Annual cardiac screening')
    
    return jsonify({
        'success': True,
        'personalized_plan': {'diet': diet_plan, 'exercise': exercise_plan, 'lifestyle': lifestyle_tips},
        'weekly_goals': {'exercise_minutes': 150, 'water_intake_liters': 2.5, 'sleep_hours': 56},
        'motivation': 'Small consistent steps lead to big health improvements!'
    })

# AI Risk Calculator
@ai_tools_bp.route('/risk-calculator', methods=['POST'])
@jwt_required()
def risk_calculator():
    data = request.get_json()
    
    age = data.get('age', 50)
    cholesterol = data.get('cholesterol', 200)
    bp = data.get('blood_pressure', 120)
    smoking = data.get('smoking', False)
    diabetes = data.get('diabetes', False)
    family_history = data.get('family_history', False)
    
    risk = 0
    
    if age > 65:
        risk += 30
    elif age > 55:
        risk += 20
    elif age > 45:
        risk += 10
    
    if cholesterol > 240:
        risk += 25
    elif cholesterol > 200:
        risk += 15
    
    if bp > 140:
        risk += 20
    elif bp > 130:
        risk += 10
    
    if smoking:
        risk += 20
    if diabetes:
        risk += 15
    if family_history:
        risk += 10
    
    risk = min(risk, 100)
    
    return jsonify({
        'success': True,
        'ten_year_risk': risk,
        'risk_category': 'High' if risk > 60 else 'Moderate' if risk > 30 else 'Low',
        'recommendations': ['Regular cardiovascular monitoring', 'Lifestyle modifications', 'Consider medication if high risk', 'Annual health screenings']
    })

# AI Nutrition Advisor
@ai_tools_bp.route('/nutrition-advisor', methods=['POST'])
@jwt_required()
def nutrition_advisor():
    data = request.get_json()
    
    age = data.get('age', 50)
    weight = data.get('weight', 70)
    height = data.get('height', 170)
    goal = data.get('goal', 'maintain')
    activity = data.get('activity_level', 'moderate')
    
    bmi = weight / ((height/100) ** 2)
    
    # Calculate daily calorie needs
    bmr = 10 * weight + 6.25 * height - 5 * age + 5
    activity_multiplier = {'low': 1.2, 'moderate': 1.55, 'high': 1.9}.get(activity, 1.55)
    tdee = bmr * activity_multiplier
    
    if goal == 'lose':
        calories = tdee - 500
    elif goal == 'gain':
        calories = tdee + 300
    else:
        calories = tdee
    
    protein = weight * 1.6
    fats = calories * 0.25 / 9
    carbs = (calories - (protein * 4) - (fats * 9)) / 4
    
    meal_plan = {
        'breakfast': ['Oatmeal with berries', 'Greek yogurt', 'Whole grain toast', 'Green tea'],
        'lunch': ['Grilled chicken salad', 'Quinoa bowl', 'Steamed vegetables', 'Olive oil dressing'],
        'dinner': ['Baked salmon', 'Brown rice', 'Roasted vegetables', 'Side salad'],
        'snacks': ['Almonds (handful)', 'Apple with peanut butter', 'Protein shake', 'Carrot sticks with hummus']
    }
    
    supplements = ['Omega-3 (1000mg)', 'Vitamin D (2000 IU)', 'Multivitamin', 'Magnesium (400mg)']
    
    if age > 50:
        supplements.extend(['Calcium (1000mg)', 'CoQ10 (100mg)'])
    
    return jsonify({
        'success': True,
        'daily_nutrition': {
            'calories': round(calories),
            'protein_g': round(protein),
            'carbs_g': round(carbs),
            'fats_g': round(fats)
        },
        'bmi': round(bmi, 1),
        'bmi_category': 'Underweight' if bmi < 18.5 else 'Normal' if bmi < 25 else 'Overweight' if bmi < 30 else 'Obese',
        'meal_plan': meal_plan,
        'supplements': supplements,
        'hydration': f'{round(weight * 0.033, 1)}L water daily',
        'tips': ['Eat every 3-4 hours', 'Avoid processed foods', 'Cook at home', 'Read nutrition labels']
    })
