# Phoenix Headphones 🎧

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

A modern e-commerce web application for headphones built with Node.js, Express, and MongoDB. Features a complete admin panel for product management and a user-friendly shopping interface.

## ✨ Features

### 👥 User Features
- **Product Catalog** - Browse and search headphones by category, color, and specifications
- **Product Details** - Detailed product pages with images, descriptions, and reviews
- **Authentication** - Secure login/signup with email verification via OTP
- **Social Login** - Google OAuth integration for quick access
- **Password Recovery** - Forgot password functionality with OTP verification
- **Product Reviews** - Rate and review products, vote on helpful reviews
- **Responsive Design** - Mobile-friendly interface with modern UI

### 🔧 Admin Features
- **Dashboard** - Comprehensive overview of system metrics
- **User Management** - View, search, and manage user accounts (block/unblock)
- **Category Management** - Add, edit, and manage product categories with images
- **Product Management** - Full CRUD operations for products with multiple images
- **Status Management** - Toggle product and category active/inactive status
- **Bulk Operations** - Bulk user management capabilities

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Backend** | Node.js, Express.js, MongoDB, Mongoose |
| **Authentication** | Passport.js, bcryptjs, express-session |
| **Frontend** | EJS, Bootstrap, JavaScript |
| **File Storage** | Cloudinary, Multer |
| **Security** | Helmet, Compression, nocache |
| **Development** | Nodemon, Mocha |

## 📋 Prerequisites

Before getting started, ensure you have:

- **Node.js** v18.0.0 or higher
- **MongoDB** v6.0 or higher (local or cloud instance)
- **Cloudinary account** (for image storage)
- **Gmail account** (for email services)

## ⚙️ Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd phoenix-headphones
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/phoenix-headphones

# Session
SESSION_SECRET_KEY=your-super-secret-session-key

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Email Service (Gmail)
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASS=your-gmail-app-password

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Server
PORT=4000
NODE_ENV=development
```

### 3. Start the Application
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

### 4. Access the Application
- **User Interface**: http://localhost:4000
- **Admin Panel**: http://localhost:4000/admin
- **Default Admin**: admin@phoenix.com / admin123

## 🗂️ Project Structure

```
phoenix-headphones/
├── 📁 config/              # Configuration files
│   ├── cloudinary.js       # Cloudinary setup
│   ├── database.js         # MongoDB connection
│   └── passport.js         # Authentication strategies
├── 📁 controllers/         # Route controllers
│   ├── admin/              # Admin controllers
│   └── user/               # User controllers
├── 📁 middlewares/         # Custom middleware
├── 📁 models/              # MongoDB schemas
├── 📁 public/              # Static assets
│   ├── css/
│   ├── js/
│   └── images/
├── 📁 routes/              # Route definitions
├── 📁 utils/               # Utility functions
├── 📁 views/               # EJS templates
│   ├── admin/              # Admin panel views
│   ├── user/               # User interface views
│   └── partials/           # Reusable components
├── 📁 test/                # Test files
├── app.js                  # Main application file
└── package.json            # Dependencies and scripts
```

## 🔧 Configuration Guide

### Cloudinary Setup
1. Sign up at [cloudinary.com](https://cloudinary.com/)
2. Go to Dashboard and copy your credentials
3. Add to `.env` file

### Gmail App Password
1. Enable 2-Factor Authentication on your Google account
2. Go to Google Account Settings > Security > App passwords
3. Generate app password for "Mail"
4. Use this password in `EMAIL_PASS`

### Google OAuth (Optional)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project and enable Google+ API
3. Create OAuth 2.0 credentials
4. Add redirect URI: `http://localhost:4000/auth/google/callback`

## 📱 API Endpoints

### User Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Home page |
| `GET` | `/products` | Product listing |
| `GET` | `/product/:id` | Product details |
| `POST` | `/login` | User login |
| `POST` | `/signup` | User registration |
| `GET` | `/auth/google` | Google OAuth |

### Admin Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin` | Admin dashboard |
| `GET` | `/admin/products` | Product management |
| `GET` | `/admin/categories` | Category management |
| `GET` | `/admin/users` | User management |
| `POST` | `/admin/products/toggle-status/:id` | Toggle product status |

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:pagination

# Run tests in watch mode
npm run test:watch
```

## 🔒 Security Features

- **Authentication** - Session-based authentication with Passport.js
- **Password Security** - bcrypt hashing with salt rounds
- **Input Validation** - Server-side validation for all inputs
- **Security Headers** - Helmet.js for security headers
- **Environment Variables** - Sensitive data stored securely
- **CSRF Protection** - Built-in Express security measures

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=your-production-mongodb-uri
SESSION_SECRET_KEY=your-production-session-secret
# ... other production variables
```

### Performance Optimizations
- Response compression enabled
- Static file caching
- Image optimization via Cloudinary
- Session configuration optimized for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in the `/docs` folder
- Review the test files for usage examples

## 🔄 Recent Updates

- ✅ Fixed product status toggle functionality
- ✅ Improved category status management
- ✅ Enhanced error handling and user feedback
- ✅ Added comprehensive logging for debugging
- ✅ Implemented robust form validation system

---

**Built with ❤️ using Node.js, Express, and MongoDB**