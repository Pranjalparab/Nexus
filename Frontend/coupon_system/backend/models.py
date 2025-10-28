from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import uuid
from enum import Enum

db = SQLAlchemy()

class ThemeType(Enum):
    BTS = "BTS"
    ANIME = "ANIME"
    KPOP = "KPOP"
    MANGA = "MANGA"
    OTHER = "OTHER"

class ProductCategory(Enum):
    KEYCHAIN = "KEYCHAIN"
    BRACELET = "BRACELET"
    STICKER = "STICKER"
    POSTER = "POSTER"
    CLOTHING = "CLOTHING"
    ACCESSORIES = "ACCESSORIES"

class CouponType(Enum):
    PERCENTAGE = "PERCENTAGE"
    FIXED_AMOUNT = "FIXED_AMOUNT"
    FREE_SHIPPING = "FREE_SHIPPING"
    BUY_ONE_GET_ONE = "BOGO"

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    redemptions = db.relationship('CouponRedemption', backref='user', lazy=True)
    
    def __repr__(self):
        return f'<User {self.username}>'

class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.Enum(ProductCategory), nullable=False)
    theme = db.Column(db.Enum(ThemeType), nullable=False)
    price = db.Column(db.Float, nullable=False)
    image_url = db.Column(db.String(500))
    stock_quantity = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<Product {self.name}>'

class Coupon(db.Model):
    __tablename__ = 'coupons'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    coupon_type = db.Column(db.Enum(CouponType), nullable=False)
    
    # Discount details
    discount_value = db.Column(db.Float)  # percentage or fixed amount
    min_purchase_amount = db.Column(db.Float, default=0)
    max_discount_amount = db.Column(db.Float)  # for percentage coupons
    
    # Validity
    valid_from = db.Column(db.DateTime, default=datetime.utcnow)
    valid_until = db.Column(db.DateTime)
    usage_limit = db.Column(db.Integer)  # total usage limit
    usage_limit_per_user = db.Column(db.Integer, default=1)
    
    # Theme and product restrictions
    applicable_themes = db.Column(db.String(500))  # JSON string of theme types
    applicable_categories = db.Column(db.String(500))  # JSON string of product categories
    applicable_product_ids = db.Column(db.String(500))  # JSON string of specific product IDs
    
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    redemptions = db.relationship('CouponRedemption', backref='coupon', lazy=True)
    
    def __repr__(self):
        return f'<Coupon {self.code}>'
    
    @property
    def is_valid(self):
        now = datetime.utcnow()
        if not self.is_active:
            return False
        if self.valid_until and now > self.valid_until:
            return False
        if now < self.valid_from:
            return False
        if self.usage_limit and len(self.redemptions) >= self.usage_limit:
            return False
        return True
    
    def get_usage_count(self):
        return len([r for r in self.redemptions if r.is_used])
    
    def can_user_use(self, user_id):
        if not self.is_valid:
            return False
        user_redemptions = [r for r in self.redemptions if r.user_id == user_id and r.is_used]
        return len(user_redemptions) < self.usage_limit_per_user

class CouponRedemption(db.Model):
    __tablename__ = 'coupon_redemptions'
    
    id = db.Column(db.Integer, primary_key=True)
    coupon_id = db.Column(db.Integer, db.ForeignKey('coupons.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Order details
    order_id = db.Column(db.String(100))  # external order reference
    discount_applied = db.Column(db.Float, nullable=False)
    original_amount = db.Column(db.Float, nullable=False)
    final_amount = db.Column(db.Float, nullable=False)
    
    is_used = db.Column(db.Boolean, default=False)
    used_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<CouponRedemption {self.coupon.code} by {self.user.username}>'

class CouponUsageLog(db.Model):
    __tablename__ = 'coupon_usage_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    coupon_code = db.Column(db.String(50), nullable=False)
    user_id = db.Column(db.Integer)
    action = db.Column(db.String(50))  # 'validate', 'apply', 'cancel'
    success = db.Column(db.Boolean)
    error_message = db.Column(db.Text)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.String(500))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<CouponUsageLog {self.coupon_code} - {self.action}>'
