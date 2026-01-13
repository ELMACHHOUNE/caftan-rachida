# 🚀 Development Setup Guide

This guide will help you set up and run the complete caftan e-commerce application with both frontend and backend.

## Prerequisites

Before starting, ensure you have:
- ✅ Node.js (v16 or higher)
- ✅ MongoDB (local installation or MongoDB Atlas account)
- ✅ Git

## 🗄️ Database Setup

### Option 1: Local MongoDB
1. **Install MongoDB Community Edition**
   - Windows: Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
   - macOS: `brew install mongodb/brew/mongodb-community`
   - Linux: Follow [MongoDB installation guide](https://docs.mongodb.com/manual/installation/)

2. **Start MongoDB service:**
   ```bash
   # Windows (as Administrator)
   net start MongoDB
   
   # macOS/Linux
   sudo systemctl start mongod
   # or
   brew services start mongodb/brew/mongodb-community
   ```

### Option 2: MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a new cluster
3. Get connection string
4. Update `server/.env` with your Atlas connection string

## 🛠️ Installation & Setup

### 1. Server Setup
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Configure environment
# Copy and edit the .env file with your settings
cp .env .env.local

# Test setup and create admin user
npm run setup
```

**Expected output:**
```
✅ Database connected successfully
👑 Creating default admin user...
✅ Admin user created successfully
📧 Email: admin@caftan.com
🔑 Password: Admin123!
```

### 2. Frontend Setup
```bash
# Go back to root directory
cd ..

# Install frontend dependencies (if not already done)
npm install

# Start the development server
npm run dev
```

### 3. Start Backend Server
```bash
# In a new terminal, start the backend
cd server
npm run dev
```

## 🔧 Environment Configuration

### Server (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/caftan-ecommerce
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=30d
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 🚀 Running the Application

1. **Start Backend Server** (Terminal 1):
   ```bash
   cd server
   npm run dev
   ```
   
2. **Start Frontend** (Terminal 2):
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

## 🧪 Testing the Integration

### 1. Test API Health
```bash
curl http://localhost:5000/api/health
```

### 2. Test Admin Login
- Go to: http://localhost:3000/login
- Email: `business.aguizoul@gmail.com`
- Password: `Admin123!`

### 3. Test User Registration
- Go to: http://localhost:3000/register
- Create a new user account

## 📊 Admin Access

⚠️ **Important:** Admin access is restricted to authorized emails only.

### Current Admin Account:
- **Email:** business.aguizoul@gmail.com
- **Password:** [Use your account password]
- **Role:** Admin (full access)

**Note:** Only the email `business.aguizoul@gmail.com` has admin privileges. Other accounts with admin role will still be denied access for security.

## 🔍 API Endpoints

### Authentication
- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login
- GET `/api/auth/me` - Get current user
- PUT `/api/auth/profile` - Update profile

### Products
- GET `/api/products` - Get all products
- GET `/api/products/:id` - Get single product
- POST `/api/products` - Create product (Admin)
- PUT `/api/products/:id` - Update product (Admin)

### Categories
- GET `/api/categories` - Get all categories
- POST `/api/categories` - Create category (Admin)

### Orders
- POST `/api/orders` - Create order
- GET `/api/orders/my-orders` - Get user orders
- GET `/api/orders` - Get all orders (Admin)

## 🛠️ Development Scripts

### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Backend
```bash
npm run dev      # Start with nodemon (auto-restart)
npm start        # Start production server
npm run setup    # Setup database and admin user
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
1. **Service not running:**
   ```bash
   # Check if MongoDB is running
   ps aux | grep mongod  # macOS/Linux
   Get-Process | findstr mongod  # Windows PowerShell
   ```

2. **Port conflicts:**
   - MongoDB default port: 27017
   - Change port in connection string if needed

3. **Permission issues:**
   - Ensure MongoDB has write permissions to data directory

### API Connection Issues
1. **CORS errors:**
   - Check `FRONTEND_URL` in server `.env`
   - Verify ports match

2. **JWT errors:**
   - Clear localStorage and try again
   - Check JWT_SECRET is set

### Frontend Issues
1. **Module not found:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Environment variables:**
   - Ensure `.env.local` exists with `NEXT_PUBLIC_API_URL`

## 📱 Features Available

### ✅ Authentication System
- User registration and login
- JWT token management
- Protected routes
- Admin role management

### ✅ Product Management
- Product catalog
- Search and filtering
- Category organization
- Admin CRUD operations

### ✅ User Interface
- Responsive design
- Modern UI components
- Loading states
- Error handling

### ✅ Admin Features
- User management
- Product management
- Order tracking
- Analytics (coming soon)

## 🎯 Next Steps

1. **Add sample data:**
   - Create categories and products via admin panel
   - Test the complete user flow

2. **Customize design:**
   - Update colors and branding
   - Add your own product images

3. **Deploy:**
   - Frontend: Vercel, Netlify
   - Backend: Railway, Render, Heroku
   - Database: MongoDB Atlas

## 🆘 Need Help?

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify all environment variables are set correctly
3. Ensure both servers are running
4. Check browser console for error messages

Happy coding! 🎉