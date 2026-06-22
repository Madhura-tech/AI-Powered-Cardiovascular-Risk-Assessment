from app import create_app, db
from app.models import User, Prediction, MedicalDocument

try:
    from app.realtime import socketio
    use_socketio = True
except:
    use_socketio = False

app = create_app()

if use_socketio:
    socketio.init_app(app)

@app.shell_context_processor
def make_shell_context():
    return {
        'db': db,
        'User': User,
        'Prediction': Prediction,
        'MedicalDocument': MedicalDocument
    }

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    
    if use_socketio:
        socketio.run(app, debug=True, host='0.0.0.0', port=5000)
    else:
        app.run(debug=True, host='0.0.0.0', port=5000)