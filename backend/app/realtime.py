from flask_socketio import SocketIO, emit, join_room, leave_room
from flask import request
from flask_jwt_extended import decode_token
import random
import time

socketio = SocketIO(cors_allowed_origins="*", async_mode='threading')

# Store active connections
active_users = {}

@socketio.on('connect')
def handle_connect():
    print(f'Client connected: {request.sid}')
    emit('connection_response', {'status': 'connected', 'sid': request.sid})

@socketio.on('disconnect')
def handle_disconnect():
    print(f'Client disconnected: {request.sid}')
    if request.sid in active_users:
        del active_users[request.sid]

@socketio.on('join_monitoring')
def handle_join(data):
    """Join user's personal monitoring room"""
    user_id = data.get('user_id')
    room = f"user_{user_id}"
    join_room(room)
    active_users[request.sid] = user_id
    emit('joined_room', {'room': room, 'user_id': user_id})
    print(f'User {user_id} joined monitoring room')

@socketio.on('health_data')
def handle_health_data(data):
    """Receive and process real-time health data"""
    user_id = data.get('user_id')
    vitals = data.get('vitals', {})
    
    # Process vitals
    processed_data = {
        'timestamp': time.time(),
        'heart_rate': vitals.get('heart_rate', 0),
        'blood_pressure': vitals.get('blood_pressure', '0/0'),
        'oxygen_level': vitals.get('oxygen_level', 0),
        'temperature': vitals.get('temperature', 0),
        'status': calculate_health_status(vitals)
    }
    
    # Broadcast to user's room
    room = f"user_{user_id}"
    emit('vitals_update', processed_data, room=room)
    
    # Check for alerts
    alerts = check_health_alerts(vitals)
    if alerts:
        emit('health_alert', {'alerts': alerts, 'vitals': processed_data}, room=room)

@socketio.on('simulate_vitals')
def simulate_vitals(data):
    """Simulate real-time vitals for demo"""
    user_id = data.get('user_id')
    room = f"user_{user_id}"
    
    vitals = {
        'timestamp': time.time(),
        'heart_rate': random.randint(60, 100),
        'blood_pressure_systolic': random.randint(110, 140),
        'blood_pressure_diastolic': random.randint(70, 90),
        'oxygen_level': random.randint(95, 100),
        'temperature': round(random.uniform(36.5, 37.5), 1),
        'respiratory_rate': random.randint(12, 20)
    }
    
    vitals['status'] = calculate_health_status(vitals)
    emit('vitals_update', vitals, room=room)

def calculate_health_status(vitals):
    """Calculate overall health status from vitals"""
    hr = vitals.get('heart_rate', 75)
    o2 = vitals.get('oxygen_level', 98)
    
    if hr > 100 or hr < 60 or o2 < 95:
        return 'warning'
    elif hr > 90 or o2 < 97:
        return 'caution'
    return 'normal'

def check_health_alerts(vitals):
    """Check for critical health alerts"""
    alerts = []
    
    hr = vitals.get('heart_rate', 0)
    if hr > 120:
        alerts.append({'type': 'critical', 'message': 'Heart rate critically high'})
    elif hr < 50:
        alerts.append({'type': 'critical', 'message': 'Heart rate critically low'})
    
    o2 = vitals.get('oxygen_level', 0)
    if o2 < 90:
        alerts.append({'type': 'critical', 'message': 'Oxygen level critically low'})
    
    return alerts
