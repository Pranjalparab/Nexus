from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import json
import os
from dotenv import load_dotenv

from models import db, User, Product, Coupon, CouponRedemption, CouponUsageLog
from models import ThemeType, ProductCategory, CouponType
from coupon_service import CouponService

load_dotenv()

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-change-this')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///coupon_system.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-string')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# Initialize extensions
db.init_app(app)
jwt = JWTManager(app)
CORS(app)

# Initialize coupon service
coupon_service = CouponService()

# Create tables
with app.app_context():
    db.create_all()

# Helper functions
def log_coupon_usage(coupon_code, user_id, action, success, error_message=None):
    """Log coupon usage for analytics and debugging"""
    log_entry = CouponUsageLog(
        coupon_code=coupon_code,
        user_id=user_id,
        action=action,
        success=success,
        error_message=error_message,
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )
    db.session.add(log_entry)
    db.session.commit()

def serialize_coupon(coupon):
    """Serialize coupon object to JSON"""
    return {
        'id': coupon.id,
        'code': coupon.code,
        'name': coupon.name,
        'description': coupon.description,
        'coupon_type': coupon.coupon_type.value,
        'discount_value': coupon.discount_value,
        'min_purchase_amount': coupon.min_purchase_amount,
        'max_discount_amount': coupon.max_discount_amount,
        'valid_from': coupon.valid_from.isoformat() if coupon.valid_from else None,
        'valid_until': coupon.valid_until.isoformat() if coupon.valid_until else None,
        'usage_limit': coupon.usage_limit,
        'usage_limit_per_user': coupon.usage_limit_per_user,
        'applicable_themes': json.loads(coupon.applicable_themes) if coupon.applicable_themes else [],
        'applicable_categories': json.loads(coupon.applicable_categories) if coupon.applicable_categories else [],
        'applicable_product_ids': json.loads(coupon.applicable_product_ids) if coupon.applicable_product_ids else [],
        'is_active': coupon.is_active,
        'is_valid': coupon.is_valid,
        'usage_count': coupon.get_usage_count(),
        'created_at': coupon.created_at.isoformat()
    }

def serialize_product(product):
    """Serialize product object to JSON"""
    return {
        'id': product.id,
        'name': product.name,
        'description': product.description,
        'category': product.category.value,
        'theme': product.theme.value,
        'price': product.price,
        'image_url': product.image_url,
        'stock_quantity': product.stock_quantity,
        'is_active': product.is_active,
        'created_at': product.created_at.isoformat()
    }

# Authentication Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Validate input
        if not data.get('username') or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Username, email, and password are required'}), 400
        
        # Check if user exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        # Create user
        user = User(
            username=data['username'],
            email=data['email'],
            password_hash=generate_password_hash(data['password'])
        )
        
        db.session.add(user)
        db.session.commit()
        
        # Generate access token
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'message': 'User registered successfully',
            'access_token': access_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()
        
        if not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Username and password are required'}), 400
        
        user = User.query.filter_by(username=data['username']).first()
        
        if user and check_password_hash(user.password_hash, data['password']):
            access_token = create_access_token(identity=user.id)
            return jsonify({
                'message': 'Login successful',
                'access_token': access_token,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                }
            }), 200
        
        return jsonify({'error': 'Invalid credentials'}), 401
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Product Routes
@app.route('/api/products', methods=['GET'])
def get_products():
    """Get all products with optional filtering"""
    try:
        theme = request.args.get('theme')
        category = request.args.get('category')
        
        query = Product.query.filter_by(is_active=True)
        
        if theme:
            try:
                theme_enum = ThemeType(theme.upper())
                query = query.filter_by(theme=theme_enum)
            except ValueError:
                return jsonify({'error': 'Invalid theme'}), 400
        
        if category:
            try:
                category_enum = ProductCategory(category.upper())
                query = query.filter_by(category=category_enum)
            except ValueError:
                return jsonify({'error': 'Invalid category'}), 400
        
        products = query.all()
        return jsonify({
            'products': [serialize_product(p) for p in products]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Get a specific product"""
    try:
        product = Product.query.get_or_404(product_id)
        return jsonify({'product': serialize_product(product)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Coupon Routes
@app.route('/api/coupons/validate', methods=['POST'])
def validate_coupon():
    """Validate a coupon code"""
    try:
        data = request.get_json()
        coupon_code = data.get('code', '').strip().upper()
        user_id = data.get('user_id')
        cart_items = data.get('cart_items', [])  # List of {product_id, quantity, price}
        
        if not coupon_code:
            return jsonify({'error': 'Coupon code is required'}), 400
        
        result = coupon_service.validate_coupon(coupon_code, user_id, cart_items)
        
        # Log the validation attempt
        log_coupon_usage(coupon_code, user_id, 'validate', result['valid'], 
                        result.get('message') if not result['valid'] else None)
        
        return jsonify(result), 200 if result['valid'] else 400
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/coupons/apply', methods=['POST'])
@jwt_required()
def apply_coupon():
    """Apply a coupon to an order"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        coupon_code = data.get('code', '').strip().upper()
        order_id = data.get('order_id')
        cart_items = data.get('cart_items', [])
        original_amount = data.get('original_amount')
        
        if not all([coupon_code, order_id, cart_items, original_amount]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        result = coupon_service.apply_coupon(coupon_code, user_id, order_id, cart_items, original_amount)
        
        # Log the application attempt
        log_coupon_usage(coupon_code, user_id, 'apply', result.get('success', False),
                        result.get('message') if not result.get('success') else None)
        
        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify(result), 400
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/coupons', methods=['GET'])
def get_available_coupons():
    """Get all available coupons"""
    try:
        theme = request.args.get('theme')
        category = request.args.get('category')
        
        query = Coupon.query.filter_by(is_active=True)
        
        # Filter by current date
        now = datetime.utcnow()
        query = query.filter(Coupon.valid_from <= now)
        query = query.filter((Coupon.valid_until.is_(None)) | (Coupon.valid_until > now))
        
        coupons = query.all()
        
        # Filter by theme or category if specified
        filtered_coupons = []
        for coupon in coupons:
            if theme or category:
                applicable_themes = json.loads(coupon.applicable_themes) if coupon.applicable_themes else []
                applicable_categories = json.loads(coupon.applicable_categories) if coupon.applicable_categories else []
                
                if theme and theme.upper() not in applicable_themes:
                    continue
                if category and category.upper() not in applicable_categories:
                    continue
            
            filtered_coupons.append(coupon)
        
        return jsonify({
            'coupons': [serialize_coupon(c) for c in filtered_coupons]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/coupons/user-history', methods=['GET'])
@jwt_required()
def get_user_coupon_history():
    """Get user's coupon usage history"""
    try:
        user_id = get_jwt_identity()
        
        redemptions = CouponRedemption.query.filter_by(user_id=user_id).order_by(CouponRedemption.created_at.desc()).all()
        
        history = []
        for redemption in redemptions:
            history.append({
                'id': redemption.id,
                'coupon_code': redemption.coupon.code,
                'coupon_name': redemption.coupon.name,
                'order_id': redemption.order_id,
                'discount_applied': redemption.discount_applied,
                'original_amount': redemption.original_amount,
                'final_amount': redemption.final_amount,
                'is_used': redemption.is_used,
                'used_at': redemption.used_at.isoformat() if redemption.used_at else None,
                'created_at': redemption.created_at.isoformat()
            })
        
        return jsonify({'history': history}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Analytics Routes (for admin)
@app.route('/api/analytics/coupons', methods=['GET'])
def get_coupon_analytics():
    """Get coupon usage analytics"""
    try:
        # Get usage statistics
        total_coupons = Coupon.query.count()
        active_coupons = Coupon.query.filter_by(is_active=True).count()
        total_redemptions = CouponRedemption.query.filter_by(is_used=True).count()
        
        # Most used coupons
        most_used_query = db.session.query(
            Coupon.code,
            Coupon.name,
            db.func.count(CouponRedemption.id).label('usage_count')
        ).join(CouponRedemption).filter(CouponRedemption.is_used == True).group_by(Coupon.id).order_by(db.func.count(CouponRedemption.id).desc()).limit(10)
        
        most_used = [{'code': row.code, 'name': row.name, 'usage_count': row.usage_count} 
                    for row in most_used_query.all()]
        
        return jsonify({
            'total_coupons': total_coupons,
            'active_coupons': active_coupons,
            'total_redemptions': total_redemptions,
            'most_used_coupons': most_used
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Health check
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0'
    }), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
