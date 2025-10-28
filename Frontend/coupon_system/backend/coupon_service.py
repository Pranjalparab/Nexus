from datetime import datetime
import json
from models import db, Coupon, CouponRedemption, Product, User
from models import CouponType, ThemeType, ProductCategory

class CouponService:
    """Service class for handling coupon operations"""
    
    def validate_coupon(self, coupon_code, user_id=None, cart_items=None):
        """
        Validate a coupon code against cart items
        
        Args:
            coupon_code (str): The coupon code to validate
            user_id (int, optional): User ID for user-specific validations
            cart_items (list, optional): List of cart items with product_id, quantity, price
            
        Returns:
            dict: Validation result with status and details
        """
        try:
            # Find coupon
            coupon = Coupon.query.filter_by(code=coupon_code, is_active=True).first()
            if not coupon:
                return {
                    'valid': False,
                    'message': 'Coupon code not found or inactive'
                }
            
            # Check basic validity
            if not coupon.is_valid:
                return {
                    'valid': False,
                    'message': 'Coupon has expired or reached usage limit'
                }
            
            # Check user-specific usage limit
            if user_id and not coupon.can_user_use(user_id):
                return {
                    'valid': False,
                    'message': 'You have already used this coupon the maximum number of times'
                }
            
            # If no cart items provided, just return basic validation
            if not cart_items:
                return {
                    'valid': True,
                    'coupon': self._serialize_coupon_for_validation(coupon),
                    'message': 'Coupon is valid'
                }
            
            # Calculate cart total and validate against coupon restrictions
            cart_total = sum(item.get('price', 0) * item.get('quantity', 1) for item in cart_items)
            
            # Check minimum purchase amount
            if coupon.min_purchase_amount and cart_total < coupon.min_purchase_amount:
                return {
                    'valid': False,
                    'message': f'Minimum purchase amount of ${coupon.min_purchase_amount:.2f} required'
                }
            
            # Check product/theme/category restrictions
            if not self._validate_cart_against_restrictions(coupon, cart_items):
                return {
                    'valid': False,
                    'message': 'This coupon is not applicable to the items in your cart'
                }
            
            # Calculate discount
            discount_info = self._calculate_discount(coupon, cart_items, cart_total)
            
            return {
                'valid': True,
                'coupon': self._serialize_coupon_for_validation(coupon),
                'discount': discount_info,
                'message': 'Coupon is valid and applicable'
            }
            
        except Exception as e:
            return {
                'valid': False,
                'message': f'Error validating coupon: {str(e)}'
            }
    
    def apply_coupon(self, coupon_code, user_id, order_id, cart_items, original_amount):
        """
        Apply a coupon to an order and create redemption record
        
        Args:
            coupon_code (str): The coupon code to apply
            user_id (int): User ID
            order_id (str): External order ID
            cart_items (list): List of cart items
            original_amount (float): Original order amount
            
        Returns:
            dict: Application result
        """
        try:
            # First validate the coupon
            validation_result = self.validate_coupon(coupon_code, user_id, cart_items)
            if not validation_result['valid']:
                return {
                    'success': False,
                    'message': validation_result['message']
                }
            
            coupon = Coupon.query.filter_by(code=coupon_code).first()
            discount_info = validation_result['discount']
            
            # Calculate final amount
            discount_amount = discount_info['discount_amount']
            final_amount = max(0, original_amount - discount_amount)
            
            # Create redemption record
            redemption = CouponRedemption(
                coupon_id=coupon.id,
                user_id=user_id,
                order_id=order_id,
                discount_applied=discount_amount,
                original_amount=original_amount,
                final_amount=final_amount,
                is_used=True,
                used_at=datetime.utcnow()
            )
            
            db.session.add(redemption)
            db.session.commit()
            
            return {
                'success': True,
                'redemption_id': redemption.id,
                'discount_applied': discount_amount,
                'original_amount': original_amount,
                'final_amount': final_amount,
                'coupon_details': validation_result['coupon'],
                'message': 'Coupon applied successfully'
            }
            
        except Exception as e:
            db.session.rollback()
            return {
                'success': False,
                'message': f'Error applying coupon: {str(e)}'
            }
    
    def _validate_cart_against_restrictions(self, coupon, cart_items):
        """Check if cart items match coupon restrictions"""
        
        # Parse restrictions
        applicable_themes = json.loads(coupon.applicable_themes) if coupon.applicable_themes else []
        applicable_categories = json.loads(coupon.applicable_categories) if coupon.applicable_categories else []
        applicable_product_ids = json.loads(coupon.applicable_product_ids) if coupon.applicable_product_ids else []
        
        # If no restrictions, coupon applies to all items
        if not any([applicable_themes, applicable_categories, applicable_product_ids]):
            return True
        
        # Check each cart item
        valid_items = []
        
        for item in cart_items:
            product_id = item.get('product_id')
            if not product_id:
                continue
                
            product = Product.query.get(product_id)
            if not product:
                continue
            
            item_valid = False
            
            # Check specific product IDs
            if applicable_product_ids and product_id in applicable_product_ids:
                item_valid = True
            
            # Check themes
            if applicable_themes and product.theme.value in applicable_themes:
                item_valid = True
            
            # Check categories
            if applicable_categories and product.category.value in applicable_categories:
                item_valid = True
            
            if item_valid:
                valid_items.append(item)
        
        # At least one item must be valid for the coupon to apply
        return len(valid_items) > 0
    
    def _calculate_discount(self, coupon, cart_items, cart_total):
        """Calculate discount amount based on coupon type"""
        
        if coupon.coupon_type == CouponType.PERCENTAGE:
            discount_amount = cart_total * (coupon.discount_value / 100)
            
            # Apply maximum discount limit if set
            if coupon.max_discount_amount:
                discount_amount = min(discount_amount, coupon.max_discount_amount)
                
            return {
                'type': 'percentage',
                'percentage': coupon.discount_value,
                'discount_amount': round(discount_amount, 2),
                'max_discount': coupon.max_discount_amount
            }
        
        elif coupon.coupon_type == CouponType.FIXED_AMOUNT:
            discount_amount = min(coupon.discount_value, cart_total)
            
            return {
                'type': 'fixed_amount',
                'fixed_amount': coupon.discount_value,
                'discount_amount': round(discount_amount, 2)
            }
        
        elif coupon.coupon_type == CouponType.FREE_SHIPPING:
            # This would typically be handled by the shipping calculation system
            # For now, we'll assume a fixed shipping cost to discount
            shipping_cost = 100.0  # This should come from shipping calculation (₹100)
            
            return {
                'type': 'free_shipping',
                'discount_amount': round(shipping_cost, 2),
                'description': 'Free shipping'
            }
        
        elif coupon.coupon_type == CouponType.BUY_ONE_GET_ONE:
            # Find applicable items and calculate BOGO discount
            applicable_items = self._get_applicable_items(coupon, cart_items)
            bogo_discount = self._calculate_bogo_discount(applicable_items)
            
            return {
                'type': 'buy_one_get_one',
                'discount_amount': round(bogo_discount, 2),
                'description': 'Buy one get one free on applicable items'
            }
        
        return {
            'type': 'unknown',
            'discount_amount': 0
        }
    
    def _get_applicable_items(self, coupon, cart_items):
        """Get cart items that the coupon applies to"""
        applicable_items = []
        
        # Parse restrictions
        applicable_themes = json.loads(coupon.applicable_themes) if coupon.applicable_themes else []
        applicable_categories = json.loads(coupon.applicable_categories) if coupon.applicable_categories else []
        applicable_product_ids = json.loads(coupon.applicable_product_ids) if coupon.applicable_product_ids else []
        
        for item in cart_items:
            product_id = item.get('product_id')
            if not product_id:
                continue
                
            product = Product.query.get(product_id)
            if not product:
                continue
            
            # If no restrictions, all items are applicable
            if not any([applicable_themes, applicable_categories, applicable_product_ids]):
                applicable_items.append(item)
                continue
            
            # Check restrictions
            if (applicable_product_ids and product_id in applicable_product_ids) or \
               (applicable_themes and product.theme.value in applicable_themes) or \
               (applicable_categories and product.category.value in applicable_categories):
                applicable_items.append(item)
        
        return applicable_items
    
    def _calculate_bogo_discount(self, applicable_items):
        """Calculate BOGO discount for applicable items"""
        total_discount = 0
        
        for item in applicable_items:
            quantity = item.get('quantity', 1)
            price = item.get('price', 0)
            
            # For each pair, discount the lower price item
            free_items = quantity // 2
            total_discount += free_items * price
        
        return total_discount
    
    def _serialize_coupon_for_validation(self, coupon):
        """Serialize coupon for validation response"""
        return {
            'id': coupon.id,
            'code': coupon.code,
            'name': coupon.name,
            'description': coupon.description,
            'type': coupon.coupon_type.value,
            'discount_value': coupon.discount_value,
            'min_purchase_amount': coupon.min_purchase_amount,
            'max_discount_amount': coupon.max_discount_amount,
            'valid_until': coupon.valid_until.isoformat() if coupon.valid_until else None,
            'usage_count': coupon.get_usage_count(),
            'usage_limit': coupon.usage_limit
        }
