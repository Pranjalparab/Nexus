# 🎫 BTS & Anime Coupon System

A comprehensive coupon management system designed for BTS and Anime merchandise stores. This system provides a complete backend API and frontend integration examples for managing discount coupons, product catalogs, and user authentication.

## ✨ Features

### 🎯 Core Features
- **Multi-type Coupons**: Percentage, fixed amount, free shipping, and BOGO discounts
- **Theme-based Products**: BTS and Anime themed merchandise (keychains, bracelets, posters, etc.)
- **Smart Validation**: Real-time coupon validation with cart item restrictions
- **User Management**: Registration, authentication, and usage tracking
- **Flexible Restrictions**: Coupons can be restricted by theme, category, or specific products

### 🔒 Security Features
- JWT-based authentication
- Password hashing
- Usage limits per user and globally
- Request logging for analytics

### 📊 Analytics
- Coupon usage tracking
- User redemption history
- Popular coupon analytics

## 🏗️ Architecture

```
coupon_system/
├── backend/                    # Python Flask API
│   ├── app.py                 # Main Flask application
│   ├── models.py              # Database models
│   ├── coupon_service.py      # Business logic
│   ├── populate_sample_data.py # Sample data script
│   ├── requirements.txt       # Python dependencies
│   └── .env.example          # Environment configuration
├── frontend/                  # Integration examples
│   ├── index.html            # Demo HTML page
│   └── coupon-integration.js # JavaScript API wrapper
└── docs/                     # Documentation
    └── README.md             # This file
```

## 🚀 Quick Start

### Backend Setup

1. **Install Python Dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Set up Environment**:
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

3. **Run the Application**:
   ```bash
   python app.py
   ```
   Server will start at `http://localhost:5000`

4. **Populate Sample Data**:
   ```bash
   python populate_sample_data.py
   ```

### Frontend Demo

1. **Open the demo**:
   - Navigate to `frontend/index.html`
   - Open in a web browser (use Live Server for best experience)

2. **Test the system**:
   - Login with sample credentials: `btsfan123` / `password123`
   - Add products to cart
   - Apply coupon codes like `BTS20OFF`, `ANIME15`

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Products
- `GET /api/products` - Get all products (with optional theme/category filters)
- `GET /api/products/{id}` - Get specific product

### Coupons
- `POST /api/coupons/validate` - Validate coupon code
- `POST /api/coupons/apply` - Apply coupon (requires auth)
- `GET /api/coupons` - Get available coupons
- `GET /api/coupons/user-history` - Get user's coupon history

### Analytics
- `GET /api/analytics/coupons` - Get coupon usage statistics

## 🎫 Sample Coupon Codes

| Code | Type | Discount | Restrictions |
|------|------|----------|--------------|
| `BTS20OFF` | Percentage | 20% off | BTS products, min $25 |
| `ARMYLOVE` | Fixed | $10 off | BTS keychains/accessories, min $20 |
| `ANIME15` | Percentage | 15% off | Anime products, min $15 |
| `OTAKU2024` | BOGO | Buy one get one | Anime stickers |
| `FREESHIP` | Free shipping | Free shipping | Orders over $30 |
| `NEWBIE10` | Fixed | $10 off | First-time users, min $25 |

## 🎨 Product Categories & Themes

### Themes
- **BTS**: Korean pop group merchandise
- **ANIME**: Japanese animation products
- **KPOP**: General K-Pop items
- **MANGA**: Manga-related products
- **OTHER**: Miscellaneous items

### Categories
- **KEYCHAIN**: Key accessories
- **BRACELET**: Wrist accessories
- **STICKER**: Decorative stickers
- **POSTER**: Wall art
- **CLOTHING**: Apparel items
- **ACCESSORIES**: General accessories

## 🔧 Integration Guide

### JavaScript Integration

```javascript
// Initialize the API client
const api = new CouponSystemAPI('http://localhost:5000/api');

// Validate a coupon
const validation = await api.validateCoupon('BTS20OFF', userId, cartItems);
if (validation.valid) {
    console.log(`Discount: $${validation.discount.discount_amount}`);
}

// Apply a coupon
const application = await api.applyCoupon('BTS20OFF', orderId, cartItems, totalAmount);
if (application.success) {
    console.log(`Final amount: $${application.final_amount}`);
}
```

### Cart Item Format

```javascript
const cartItems = [
    {
        product_id: 1,
        quantity: 2,
        price: 12.99
    },
    // ... more items
];
```

### API Response Examples

**Coupon Validation Success:**
```json
{
    "valid": true,
    "coupon": {
        "id": 1,
        "code": "BTS20OFF",
        "name": "BTS Fans 20% Off",
        "type": "PERCENTAGE",
        "discount_value": 20.0
    },
    "discount": {
        "type": "percentage",
        "percentage": 20,
        "discount_amount": 5.00
    },
    "message": "Coupon is valid and applicable"
}
```

**Coupon Application Success:**
```json
{
    "success": true,
    "redemption_id": 123,
    "discount_applied": 5.00,
    "original_amount": 25.00,
    "final_amount": 20.00,
    "message": "Coupon applied successfully"
}
```

## 🎯 Coupon Types Explained

### 1. Percentage Discount
- Applies a percentage off the cart total
- Can have maximum discount limits
- Example: 20% off with max $50 discount

### 2. Fixed Amount Discount
- Applies a fixed dollar amount off
- Cannot exceed cart total
- Example: $10 off your order

### 3. Free Shipping
- Removes shipping costs
- Typically requires minimum purchase
- Example: Free shipping on orders over $30

### 4. Buy One Get One (BOGO)
- Free items based on quantity
- Applies to applicable products only
- Example: Buy 2 stickers, get 1 free

## 🔒 Security Considerations

1. **Environment Variables**: Store sensitive data in `.env` file
2. **JWT Tokens**: Use strong secret keys and appropriate expiration
3. **Password Hashing**: Passwords are hashed using Werkzeug
4. **Rate Limiting**: Consider adding rate limiting for production
5. **Input Validation**: All inputs are validated server-side

## 🚀 Production Deployment

### Database Migration
For production, consider using PostgreSQL:
```bash
# Install PostgreSQL driver
pip install psycopg2-binary

# Update DATABASE_URL in .env
DATABASE_URL=postgresql://username:password@localhost/coupon_system
```

### Environment Configuration
```bash
# Production settings
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=your-production-secret-key
JWT_SECRET_KEY=your-production-jwt-key
```

### Docker Deployment (Optional)
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY backend/ .
RUN pip install -r requirements.txt
EXPOSE 5000
CMD ["python", "app.py"]
```

## 🔧 Customization

### Adding New Themes
1. Update `ThemeType` enum in `models.py`
2. Create products with the new theme
3. Update frontend theme styling

### Adding New Coupon Types
1. Add new type to `CouponType` enum
2. Implement logic in `coupon_service.py`
3. Update frontend display logic

### Custom Validation Rules
Extend the `CouponService.validate_coupon()` method to add:
- Time-based restrictions
- User tier limitations
- Product combination rules
- Geographic restrictions

## 📊 Analytics & Monitoring

The system includes built-in analytics:
- Coupon usage statistics
- Popular products tracking
- User behavior analysis
- Error logging

Access analytics via `/api/analytics/coupons` endpoint.

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**: Update `CORS_ORIGINS` in backend configuration
2. **Database Errors**: Ensure database is properly initialized
3. **Authentication Issues**: Check JWT secret key consistency
4. **Coupon Not Applying**: Verify cart items meet coupon restrictions

### Debug Mode
Enable debug logging by setting `FLASK_DEBUG=True` in your `.env` file.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.

## 🎉 Conclusion

This coupon system provides a solid foundation for any e-commerce application focusing on themed merchandise. The modular design allows for easy customization and extension to meet specific business requirements.

For questions or support, please refer to the API documentation or create an issue in the project repository.
