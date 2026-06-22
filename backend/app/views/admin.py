from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models import User, Prediction, MedicalDocument
from app.auth_utils import get_current_user, role_required
from datetime import datetime
import time

admin_bp = Blueprint('admin', __name__)

def admin_required_check():
    user = get_current_user()
    if not user or user.role != 'admin':
        return None, jsonify({'error': 'Admin access required'}), 403
    return user, None, None

@admin_bp.route('/api/admin/dashboard', methods=['GET'])
@jwt_required()
def admin_dashboard():
    user = get_current_user()
    if not user or user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    total_users = User.query.count()
    total_predictions = Prediction.query.count()
    total_documents = MedicalDocument.query.count()

    # Risk distribution
    all_predictions = Prediction.query.all()
    risk_counts = {'Low Risk': 0, 'Moderate Risk': 0, 'High Risk': 0}
    for p in all_predictions:
        import json
        try:
            result = json.loads(p.result) if p.result else {}
            cat = result.get('risk_category', 'Low Risk')
            if cat in risk_counts:
                risk_counts[cat] += 1
            else:
                risk_counts['Low Risk'] += 1
        except:
            risk_counts['Low Risk'] += 1

    # Recent activity (last 5 predictions)
    recent = Prediction.query.order_by(Prediction.created_at.desc()).limit(5).all()
    recent_activity = []
    for p in recent:
        u = User.query.get(p.user_id)
        recent_activity.append({
            'id': p.id,
            'username': u.username if u else 'Unknown',
            'risk_category': p.to_dict().get('risk_category', 'Unknown'),
            'created_at': p.created_at.isoformat()
        })

    return jsonify({
        'total_users': total_users,
        'total_predictions': total_predictions,
        'total_documents': total_documents,
        'risk_distribution': risk_counts,
        'recent_activity': recent_activity
    })


@admin_bp.route('/api/admin/users', methods=['GET'])
@jwt_required()
def admin_users():
    user = get_current_user()
    if not user or user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    pagination = User.query.order_by(User.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'users': [u.to_dict() for u in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    })


@admin_bp.route('/api/admin/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def admin_update_user(user_id):
    current = get_current_user()
    if not current or current.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    target = User.query.get(user_id)
    if not target:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()
    if 'role' in data and data['role'] in ['patient', 'admin']:
        target.role = data['role']
    if 'is_verified' in data:
        target.is_verified = bool(data['is_verified'])

    db.session.commit()
    return jsonify({'message': 'User updated', 'user': target.to_dict()})


@admin_bp.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def admin_delete_user(user_id):
    current = get_current_user()
    if not current or current.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    if current.id == user_id:
        return jsonify({'error': 'Cannot delete your own account'}), 400

    target = User.query.get(user_id)
    if not target:
        return jsonify({'error': 'User not found'}), 404

    # Delete related records
    Prediction.query.filter_by(user_id=user_id).delete()
    MedicalDocument.query.filter_by(user_id=user_id).delete()
    db.session.delete(target)
    db.session.commit()

    return jsonify({'message': 'User deleted successfully'})


@admin_bp.route('/api/admin/predictions', methods=['GET'])
@jwt_required()
def admin_predictions():
    user = get_current_user()
    if not user or user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    pagination = Prediction.query.order_by(Prediction.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)

    results = []
    for p in pagination.items:
        d = p.to_dict()
        u = User.query.get(p.user_id)
        d['username'] = u.username if u else 'Unknown'
        results.append(d)

    return jsonify({
        'predictions': results,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    })


@admin_bp.route('/api/admin/system-health', methods=['GET'])
@jwt_required()
def system_health():
    user = get_current_user()
    if not user or user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    db_status = 'healthy'
    try:
        db.session.execute(db.text('SELECT 1'))
    except Exception as e:
        db_status = f'error: {str(e)}'

    return jsonify({
        'database': db_status,
        'uptime': 'online',
        'timestamp': datetime.utcnow().isoformat(),
        'total_users': User.query.count(),
        'total_predictions': Prediction.query.count()
    })
