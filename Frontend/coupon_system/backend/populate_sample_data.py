from datetime import datetime, timedelta
import json
from app import app
from models import db, User, Product, Coupon
from models import ThemeType, ProductCategory, CouponType
from werkzeug.security import generate_password_hash

def populate_sample_data():
    """Populate the database with sample data"""
    
    with app.app_context():
        # Clear existing data (optional)
        db.drop_all()
        db.create_all()
        
        # Create sample users
        users = [
            User(
                username="btsfan123",
                email="btsfan@example.com",
                password_hash=generate_password_hash("password123")
            ),
            User(
                username="animelover",
                email="anime@example.com",
                password_hash=generate_password_hash("password123")
            ),
            User(
                username="kpopaddict",
                email="kpop@example.com",
                password_hash=generate_password_hash("password123")
            )
        ]
        
        for user in users:
            db.session.add(user)
        
        # Create BTS themed products
        bts_products = [
            Product(
                name="BTS RM Keychain",
                description="Official RM leader keychain with purple heart design",
                category=ProductCategory.KEYCHAIN,
                theme=ThemeType.BTS,
                price=999.00,
                image_url="https://example.com/bts-rm-keychain.jpg",
                stock_quantity=50
            ),
            Product(
                name="BTS Jimin Bracelet",
                description="Silver bracelet with Jimin's signature and ARMY charm",
                category=ProductCategory.BRACELET,
                theme=ThemeType.BTS,
                price=1999.00,
                image_url="https://example.com/bts-jimin-bracelet.jpg",
                stock_quantity=30
            ),
            Product(
                name="BTS V Poster Set",
                description="Set of 3 high-quality V posters from different eras",
                category=ProductCategory.POSTER,
                theme=ThemeType.BTS,
                price=1599.00,
                image_url="https://example.com/bts-v-poster.jpg",
                stock_quantity=25
            ),
            Product(
                name="BTS Jungkook Hoodie",
                description="Comfortable hoodie with Jungkook's Golden theme design",
                category=ProductCategory.CLOTHING,
                theme=ThemeType.BTS,
                price=3999.00,
                image_url="https://example.com/bts-jk-hoodie.jpg",
                stock_quantity=20
            ),
            Product(
                name="BTS ARMY Sticker Pack",
                description="Pack of 20 waterproof BTS and ARMY themed stickers",
                category=ProductCategory.STICKER,
                theme=ThemeType.BTS,
                price=699.00,
                image_url="https://example.com/bts-stickers.jpg",
                stock_quantity=100
            )
        ]
        
        # Create Anime themed products
        anime_products = [
            Product(
                name="Naruto Uzumaki Keychain",
                description="Cute chibi Naruto keychain with orange jumpsuit",
                category=ProductCategory.KEYCHAIN,
                theme=ThemeType.ANIME,
                price=899.00,
                image_url="https://example.com/naruto-keychain.jpg",
                stock_quantity=60
            ),
            Product(
                name="Attack on Titan Bracelet",
                description="Survey Corps themed leather bracelet",
                category=ProductCategory.BRACELET,
                theme=ThemeType.ANIME,
                price=1899.00,
                image_url="https://example.com/aot-bracelet.jpg",
                stock_quantity=40
            ),
            Product(
                name="Dragon Ball Z Poster",
                description="Epic Goku vs Vegeta battle poster",
                category=ProductCategory.POSTER,
                theme=ThemeType.ANIME,
                price=1399.00,
                image_url="https://example.com/dbz-poster.jpg",
                stock_quantity=35
            ),
            Product(
                name="My Hero Academia Stickers",
                description="Set of hero costume stickers from Class 1-A",
                category=ProductCategory.STICKER,
                theme=ThemeType.ANIME,
                price=649.00,
                image_url="https://example.com/mha-stickers.jpg",
                stock_quantity=80
            ),
            Product(
                name="Demon Slayer Tote Bag",
                description="Canvas tote bag with Tanjiro's water breathing design",
                category=ProductCategory.ACCESSORIES,
                theme=ThemeType.ANIME,
                price=1549.00,
                image_url="https://example.com/ds-tote.jpg",
                stock_quantity=25
            )
        ]
        
        # Add all products
        all_products = bts_products + anime_products
        for product in all_products:
            db.session.add(product)
        
        db.session.commit()
        
        # Create sample coupons
        coupons = [
            # BTS themed coupons
            Coupon(
                code="BTS20OFF",
                name="BTS Fans 20% Off",
                description="Get 20% off all BTS merchandise",
                coupon_type=CouponType.PERCENTAGE,
                discount_value=20.0,
                min_purchase_amount=2000.0,
                max_discount_amount=4000.0,
                valid_from=datetime.utcnow(),
                valid_until=datetime.utcnow() + timedelta(days=30),
                usage_limit=100,
                usage_limit_per_user=2,
                applicable_themes=json.dumps(["BTS"]),
                is_active=True
            ),
            Coupon(
                code="ARMYLOVE",
                name="ARMY Love Special",
                description="₹800 off BTS keychains and accessories",
                coupon_type=CouponType.FIXED_AMOUNT,
                discount_value=800.0,
                min_purchase_amount=1500.0,
                valid_from=datetime.utcnow(),
                valid_until=datetime.utcnow() + timedelta(days=15),
                usage_limit=50,
                usage_limit_per_user=1,
                applicable_themes=json.dumps(["BTS"]),
                applicable_categories=json.dumps(["KEYCHAIN", "ACCESSORIES"]),
                is_active=True
            ),
            # Anime themed coupons
            Coupon(
                code="ANIME15",
                name="Anime Lovers Discount",
                description="15% off all anime products",
                coupon_type=CouponType.PERCENTAGE,
                discount_value=15.0,
                min_purchase_amount=1200.0,
                max_discount_amount=2500.0,
                valid_from=datetime.utcnow(),
                valid_until=datetime.utcnow() + timedelta(days=25),
                usage_limit=200,
                usage_limit_per_user=3,
                applicable_themes=json.dumps(["ANIME"]),
                is_active=True
            ),
            Coupon(
                code="OTAKU2024",
                name="Otaku New Year Special",
                description="Buy one get one free on anime stickers",
                coupon_type=CouponType.BUY_ONE_GET_ONE,
                min_purchase_amount=800.0,
                valid_from=datetime.utcnow(),
                valid_until=datetime.utcnow() + timedelta(days=20),
                usage_limit=75,
                usage_limit_per_user=2,
                applicable_themes=json.dumps(["ANIME"]),
                applicable_categories=json.dumps(["STICKER"]),
                is_active=True
            ),
            # General coupons
            Coupon(
                code="FREESHIP",
                name="Free Shipping",
                description="Free shipping on orders over ₹2500",
                coupon_type=CouponType.FREE_SHIPPING,
                min_purchase_amount=2500.0,
                valid_from=datetime.utcnow(),
                valid_until=datetime.utcnow() + timedelta(days=45),
                usage_limit=500,
                usage_limit_per_user=5,
                is_active=True
            ),
            Coupon(
                code="NEWBIE10",
                name="New Customer Welcome",
                description="₹800 off your first order",
                coupon_type=CouponType.FIXED_AMOUNT,
                discount_value=800.0,
                min_purchase_amount=2000.0,
                valid_from=datetime.utcnow(),
                valid_until=datetime.utcnow() + timedelta(days=60),
                usage_limit=1000,
                usage_limit_per_user=1,
                is_active=True
            )
        ]
        
        for coupon in coupons:
            db.session.add(coupon)
        
        db.session.commit()
        
        print("✅ Sample data populated successfully!")
        print(f"Created {len(users)} users")
        print(f"Created {len(all_products)} products")
        print(f"Created {len(coupons)} coupons")
        
        print("\n🔑 Sample Login Credentials:")
        print("Username: btsfan123, Password: password123")
        print("Username: animelover, Password: password123") 
        print("Username: kpopaddict, Password: password123")
        
        print("\n🎫 Sample Coupon Codes:")
        for coupon in coupons:
            print(f"- {coupon.code}: {coupon.name}")

if __name__ == "__main__":
    populate_sample_data()
