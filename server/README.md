# Caftan E-commerce Server

A RESTful API server built with Express.js, Node.js, MongoDB, and JWT authentication for the Caftan e-commerce platform.

## Features

- **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (User, Admin)
  - Password hashing with bcrypt
  - Input validation and sanitization

- **User Management**
  - User registration and login
  - Profile management
  - Admin user management
  - Password change functionality

- **Product Management**
  - CRUD operations for products
  - Image upload support (Cloudinary integration)
  - Product reviews and ratings
  - Search and filtering
  - Category-based organization

- **Category Management**
  - Hierarchical category structure
  - Parent-child relationships
  - Category-based product filtering

- **Order Management**
  - Order creation and tracking
  - Order status management
  - Payment integration ready
  - Order history and analytics

- **Security Features**
  - Rate limiting
  - CORS protection
  - Input validation
  - Error handling
  - Helmet for security headers

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcrypt
- **Validation:** express-validator
- **File Upload:** Multer + Cloudinary
- **Security:** Helmet, CORS, Rate limiting

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Installation

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   - Copy `.env.example` to `.env`
   - Update the environment variables:
   ```bash
   cp .env .env.local
   ```

4. **Configure Environment Variables:**
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/caftan-ecommerce
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=30d
   FRONTEND_URL=http://localhost:3000
   ```

5. **Start the server:**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | User login | Public |
| GET | `/api/auth/me` | Get current user | Private |
| PUT | `/api/auth/profile` | Update profile | Private |
| PUT | `/api/auth/change-password` | Change password | Private |

### User Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/users` | Get all users | Admin |
| GET | `/api/users/:id` | Get user by ID | Admin |
| PUT | `/api/users/:id` | Update user | Admin |
| DELETE | `/api/users/:id` | Delete user | Admin |

### Product Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/products` | Get all products | Public |
| GET | `/api/products/:id` | Get product by ID | Public |
| POST | `/api/products` | Create product | Admin |
| PUT | `/api/products/:id` | Update product | Admin |
| DELETE | `/api/products/:id` | Delete product | Admin |
| POST | `/api/products/:id/reviews` | Add product review | Private |

### Category Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/categories` | Get all categories | Public |
| GET | `/api/categories/tree` | Get category tree | Public |
| GET | `/api/categories/:id` | Get category by ID | Public |
| POST | `/api/categories` | Create category | Admin |
| PUT | `/api/categories/:id` | Update category | Admin |
| DELETE | `/api/categories/:id` | Delete category | Admin |

### Order Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/orders` | Create order | Private |
| GET | `/api/orders/my-orders` | Get user orders | Private |
| GET | `/api/orders` | Get all orders | Admin |
| GET | `/api/orders/:id` | Get order by ID | Private |
| PUT | `/api/orders/:id/status` | Update order status | Admin |
| PUT | `/api/orders/:id/cancel` | Cancel order | Private |

## Database Schema

### User Schema
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: ['user', 'admin'],
  avatar: String,
  phone: String,
  address: Object,
  isActive: Boolean,
  emailVerified: Boolean
}
```

### Product Schema
```javascript
{
  name: String,
  description: String,
  price: Number,
  category: ObjectId (ref: Category),
  images: [Object],
  colors: [Object],
  sizes: [Object],
  stock: Number,
  featured: Boolean,
  onSale: Boolean,
  ratings: Object,
  reviews: [Object]
}
```

### Order Schema
```javascript
{
  user: ObjectId (ref: User),
  orderItems: [Object],
  shippingAddress: Object,
  paymentMethod: String,
  subtotal: Number,
  taxAmount: Number,
  shippingCost: Number,
  totalAmount: Number,
  orderStatus: String,
  isPaid: Boolean,
  isDelivered: Boolean
}
```

## Error Handling

The API uses a centralized error handling middleware that returns consistent error responses:

```json
{
  "status": "error",
  "message": "Error description"
}
```

## Security Features

- **Authentication:** JWT tokens with expiration
- **Authorization:** Role-based access control
- **Rate Limiting:** Prevents API abuse
- **Input Validation:** Server-side validation for all inputs
- **Password Security:** bcrypt hashing with salt rounds
- **CORS:** Cross-origin resource sharing protection
- **Helmet:** Security headers middleware

## Development

### Code Structure
```
server/
├── middleware/     # Custom middleware
├── models/         # Mongoose schemas
├── routes/         # API routes
├── .env           # Environment variables
├── .gitignore     # Git ignore rules
├── package.json   # Dependencies
└── server.js      # Main application file
```

### Adding New Features

1. **Create Model:** Add new Mongoose schema in `models/`
2. **Create Routes:** Add API endpoints in `routes/`
3. **Add Middleware:** Create custom middleware in `middleware/`
4. **Update Server:** Register new routes in `server.js`

## Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-secure-production-secret
FRONTEND_URL=your-production-frontend-url
```

### MongoDB Atlas Setup
1. Create MongoDB Atlas account
2. Create cluster and database
3. Get connection string
4. Update `MONGODB_URI` in environment variables

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Create an issue on GitHub
- Contact: your-email@example.com