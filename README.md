# Phoenix Headphones 🎧

A modern e-commerce web application for headphones built with Node.js, Express, and MongoDB. Features a complete admin panel for product management and a user-friendly shopping interface.

## 🚀 Features

### User Features
- **Product Catalog**: Browse and search headphones by category, color, and specifications
- **Product Details**: Detailed product pages with images, descriptions, and reviews
- **User Authentication**: Secure login/signup with email verification via OTP
- **Social Login**: Google OAuth integration for quick access
- **Password Recovery**: Forgot password functionality with OTP verification
- **Product Reviews**: Rate and review products, vote on helpful reviews
- **Responsive Design**: Mobile-friendly interface with modern UI

### Admin Features
- **Admin Dashboard**: Comprehensive overview of system metrics
- **User Management**: View, search, and manage user accounts (block/unblock)
- **Category Management**: Add, edit, and manage product categories with images
- **Product Management**: Full CRUD operations for products with multiple images
- **Status Management**: Toggle product and category active/inactive status
- **Bulk Operations**: Bulk user management capabilities
- **Secure Admin Panel**: Separate authentication system for administrators

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Passport.js** - Authentication middleware
- **bcryptjs** - Password hashing
- **express-session** - Session management

### Frontend
- **EJS** - Templating engine
- **Bootstrap** - CSS framework
- **JavaScript** - Client-side functionality
- **express-ejs-layouts** - Layout support

### File Upload & Storage
- **Cloudinary** - Image storage and optimization
- **Multer** - File upload handling
- **multer-storage-cloudinary** - Cloudinary integration

### Security & Performance
- **Helmet** - Security headers
- **Compression** - Response compression
- **nocache** - Cache control
- **dotenv** - Environment variable management

### Development & Testing
- **Nodemon** - Development server
- **Mocha** - Testing framework

## 🏗️ Project Setup from Scratch

This comprehensive guide will walk you through creating the entire Phoenix Headphones e-commerce project from scratch. Follow these steps sequentially to build a complete, production-ready application.

### 📋 Prerequisites and System Requirements

**Required Software:**
- **Node.js** v18.0.0 or higher ([Download](https://nodejs.org/))
- **MongoDB** v6.0 or higher ([Download](https://www.mongodb.com/try/download/community))
- **Git** for version control ([Download](https://git-scm.com/))
- **Code Editor** (VS Code recommended)

**Required Accounts:**
- **Cloudinary Account** - For image storage ([Sign up](https://cloudinary.com/))
- **Gmail Account** - For email services (with App Password enabled)
- **Google Cloud Console** - For OAuth (optional, [Console](https://console.cloud.google.com/))

**System Requirements:**
- **RAM:** 4GB minimum, 8GB recommended
- **Storage:** 2GB free space
- **OS:** Windows 10+, macOS 10.15+, or Linux Ubuntu 18.04+

### 🚀 Step 1: Project Initialization

**1.1 Create Project Directory**
```bash
# Create and navigate to project directory
mkdir phoenix-headphones
cd phoenix-headphones

# Initialize Git repository
git init
```

**1.2 Initialize Node.js Project**
```bash
# Create package.json
npm init -y

# Update package.json with project details
```

**1.3 Create Basic Package.json**
```json
{
  "name": "phoenix-headphones",
  "version": "1.0.0",
  "description": "Modern e-commerce web application for headphones",
  "main": "app.js",
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js",
    "test": "mocha test/**/*.test.js --timeout 5000",
    "test:pagination": "mocha test/pagination.test.js --timeout 5000",
    "test:watch": "mocha test/**/*.test.js --watch --timeout 5000"
  },
  "keywords": ["ecommerce", "headphones", "nodejs", "express", "mongodb"],
  "author": "Your Name",
  "license": "ISC"
}
```

### 🗄️ Step 2: Database Setup

**2.1 Install and Start MongoDB**
```bash
# For Windows (using Chocolatey)
choco install mongodb

# For macOS (using Homebrew)
brew tap mongodb/brew
brew install mongodb-community

# For Ubuntu
sudo apt-get install mongodb

# Start MongoDB service
# Windows: net start MongoDB
# macOS/Linux: brew services start mongodb-community
# Or: sudo systemctl start mongod
```

**2.2 Create Database and Collections**
```bash
# Connect to MongoDB
mongosh

# Create database
use phoenix-headphones

# Create collections (will be created automatically by Mongoose)
# db.createCollection("users")
# db.createCollection("products")
# db.createCollection("categories")
# db.createCollection("reviews")
```

**2.3 Create Admin User (Run after app setup)**
```javascript
// This will be added to a setup script later
const User = require('./models/User');

const createAdminUser = async () => {
    const adminExists = await User.findOne({ isAdmin: true });
    if (!adminExists) {
        // Let the User model handle password hashing via pre-save middleware
        await User.create({
            fullname: 'Admin User',
            email: 'admin@phoenix.com',
            password: 'admin123', // Plain password - will be hashed by User model
            isAdmin: true,
            isVerified: true
        });
        console.log('Admin user created: admin@phoenix.com / admin123');
    }
};
```

### 🔧 Step 3: Environment Configuration

**3.1 Create .env File**
```bash
# Create environment file
touch .env
```

**3.2 Add Environment Variables**
```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/phoenix-headphones

# Session Configuration
SESSION_SECRET_KEY=your-super-secret-session-key-change-this-in-production

# Server Configuration
PORT=4000
NODE_ENV=development

# Cloudinary Configuration (Image Storage)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Email Configuration (Gmail)
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASS=your-gmail-app-password

# Google OAuth Configuration (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**3.3 How to Obtain API Keys**

**Cloudinary Setup:**
1. Sign up at [cloudinary.com](https://cloudinary.com/)
2. Go to Dashboard
3. Copy Cloud Name, API Key, and API Secret

**Gmail App Password:**
1. Enable 2-Factor Authentication on your Google account
2. Go to Google Account Settings > Security > App passwords
3. Generate app password for "Mail"
4. Use this password in EMAIL_PASS

**Google OAuth (Optional):**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs: `http://localhost:4000/auth/google/callback`

### 📦 Step 4: Dependencies Installation

**4.1 Install Production Dependencies**
```bash
# Core framework and database
npm install express mongoose dotenv

# Authentication and security
npm install passport passport-local passport-google-oauth20 bcryptjs express-session helmet nocache

# Template engine and layouts
npm install ejs express-ejs-layouts

# File upload and image processing
npm install multer multer-storage-cloudinary cloudinary

# Email service
npm install nodemailer

# Performance optimization
npm install compression
```

**4.2 Install Development Dependencies**
```bash
# Development tools
npm install --save-dev nodemon mocha

# Optional: Additional testing tools
npm install --save-dev chai supertest
```

**4.3 Dependency Explanations**

| Package | Purpose | Why Needed |
|---------|---------|------------|
| `express` | Web framework | Core server functionality |
| `mongoose` | MongoDB ODM | Database modeling and queries |
| `ejs` | Template engine | Server-side rendering |
| `passport` | Authentication | User login/logout handling |
| `bcryptjs` | Password hashing | Secure password storage |
| `multer` | File uploads | Handle image uploads |
| `cloudinary` | Image storage | Cloud-based image management |
| `nodemailer` | Email service | Send OTP and notifications |
| `helmet` | Security headers | Protect against common vulnerabilities |
| `compression` | Response compression | Improve performance |
| `nodemon` | Development server | Auto-restart on file changes |

### 📁 Step 5: File Structure Creation

**5.1 Create Directory Structure**
```bash
# Create main directories
mkdir config controllers middlewares models routes utils views public test

# Create subdirectories
mkdir controllers/admin controllers/user
mkdir views/admin views/user views/partials
mkdir public/css public/js public/images public/video
mkdir public/css/components public/css/user public/css/admin
mkdir test/unit test/integration
```

**5.2 Create Core Files**
```bash
# Create main application files
touch app.js
touch .gitignore

# Create configuration files
touch config/database.js config/passport.js config/cloudinary.js

# Create middleware files
touch middlewares/authMiddleware.js middlewares/errorHandler.js

# Create model files
touch models/User.js models/Product.js models/Category.js models/Review.js

# Create route files
touch routes/userRoutes.js routes/adminRoutes.js

# Create utility files
touch utils/validation.js utils/emailService.js utils/pagination.js utils/imageCropper.js utils/notFoundHandler.js

# Create view files
touch views/layout.ejs
touch views/partials/header.ejs views/partials/footer.ejs views/partials/pagination.ejs
touch views/user/home.ejs views/user/login.ejs views/user/signup.ejs views/user/products.ejs views/user/product-detail.ejs
touch views/admin/dashboard.ejs views/admin/login.ejs views/admin/products.ejs views/admin/categories.ejs

# Create CSS files
touch public/css/main.css public/css/form-validation.css
touch public/css/components/forms.css public/css/components/alerts.css public/css/components/buttons.css
touch public/css/user/login.css public/css/user/product-detail.css
touch public/css/admin.css

# Create JavaScript files
touch public/js/main.js public/js/form-validation.js

# Create test files
touch test/pagination.test.js test/user.test.js
```

**5.3 Create .gitignore File**
```gitignore
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Temporary files
tmp/
temp/
```

### 🏗️ Step 6: Core Implementation Steps

**6.1 Create Database Connection (config/database.js)**
```javascript
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

**6.2 Create Basic Express App (app.js)**
```javascript
require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const nocache = require('nocache');
const compression = require('compression');
const helmet = require('helmet');
const expressLayouts = require('express-ejs-layouts');
const connectDB = require('./config/database');

// Validate required environment variables
const requiredEnvVars = ['SESSION_SECRET_KEY', 'MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
    console.error('Please check your .env file and ensure all required variables are set.');
    process.exit(1);
}

// Connect to MongoDB
connectDB();

// Security and performance middleware
if (process.env.NODE_ENV === 'production') {
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                imgSrc: ["'self'", "data:", "https:"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
            },
        },
    }));
}

// Compression middleware
app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
}));

// Basic middleware
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');
app.use(express.static(path.join(__dirname, 'public')));
app.use(nocache());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Set view directories
app.set('views', [
    path.join(__dirname, 'views'),
    path.join(__dirname, 'views/user'),
    path.join(__dirname, 'views/admin')
]);

// Basic route for testing
app.get('/', (req, res) => {
    res.render('user/home', { title: 'Phoenix Headphones' });
});

// 404 handler
app.use('*', (req, res, next) => {
    const error = new Error(`Page not found - ${req.originalUrl}`);
    error.status = 404;
    next(error);
});

// Error handling middleware
app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';

    console.error('Error:', err);

    res.status(status).render('user/error', {
        message,
        status,
        error: process.env.NODE_ENV === 'development' ? err.stack : {}
    });
});

const PORT = process.env.PORT || 4000;

const startServer = (port) => {
    const server = app.listen(port)
        .on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.log(`Port ${port} is busy, trying ${port + 1}...`);
                startServer(port + 1);
            } else {
                console.error('Server error:', err);
            }
        })
        .on('listening', () => {
            console.log(`Phoenix Headphones server running on http://localhost:${port}`);
        });
};

startServer(PORT);

module.exports = app;
```

**6.3 Create User Model (models/User.js)**
```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    mobile: {
        type: String,
        required: false,
        match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number']
    },
    password: {
        type: String,
        required: false, // Not required for social login users
        minlength: 6
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    otp: {
        type: String,
        default: null
    },
    otpExpiry: {
        type: Date,
        default: null
    },
    resetPasswordToken: {
        type: String,
        default: null
    },
    resetPasswordExpiry: {
        type: Date,
        default: null
    },
    profileImage: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Password hash middleware
userSchema.pre('save', async function(next) {
    const user = this;

    if (!user.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(user.password, salt);
        user.password = hash;
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        if (!this.password) return false;
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

// Indexes for better query performance
userSchema.index({ isBlocked: 1, isDeleted: 1 });

const User = mongoose.model('User', userSchema);
module.exports = User;
```

**6.4 Create Category Model (models/Category.js)**
```javascript
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    isListed: {
        type: Boolean,
        default: true
    },
    slug: {
        type: String,
        unique: true,
        sparse: true
    },
    sortOrder: {
        type: Number,
        default: 0
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Pre-save hook to generate slug
categorySchema.pre('save', function(next) {
    if (this.isModified('name') || !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    next();
});

// Indexes for better query performance
categorySchema.index({ isListed: 1, isDeleted: 1 });
categorySchema.index({ sortOrder: 1 });

// Virtual for active categories
categorySchema.virtual('isActive').get(function() {
    return this.isListed && !this.isDeleted;
});

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
```

### 🎨 Step 7: Frontend Assets Setup

**7.1 Create Basic Layout (views/layout.ejs)**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><%= title || 'Phoenix Headphones' %></title>

    <!-- CSS Files -->
    <link rel="stylesheet" href="/css/main.css">
    <% if (typeof additionalCSS !== 'undefined' && additionalCSS) { %>
        <% additionalCSS.forEach(function(css) { %>
            <link rel="stylesheet" href="<%= css %>">
        <% }); %>
    <% } %>

    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
</head>
<body>
    <!-- Header -->
    <%- include('partials/header') %>

    <!-- Main Content -->
    <main class="main-content">
        <%- body %>
    </main>

    <!-- Footer -->
    <%- include('partials/footer') %>

    <!-- JavaScript Files -->
    <script src="/js/main.js"></script>
    <% if (typeof additionalJS !== 'undefined' && additionalJS) { %>
        <% additionalJS.forEach(function(js) { %>
            <script src="<%= js %>"></script>
        <% }); %>
    <% } %>
</body>
</html>
```

**7.2 Create Main CSS (public/css/main.css)**
```css
/* CSS Custom Properties */
:root {
    /* Colors */
    --color-primary: #2563eb;
    --color-secondary: #64748b;
    --color-success: #22c55e;
    --color-error: #ef4444;
    --color-warning: #f59e0b;
    --color-info: #3b82f6;

    /* Text Colors */
    --text-primary: #1f2937;
    --text-secondary: #6b7280;
    --text-muted: #9ca3af;

    /* Background Colors */
    --bg-primary: #ffffff;
    --bg-secondary: #f9fafb;
    --bg-dark: #111827;

    /* Border Colors */
    --border-primary: #e5e7eb;
    --border-secondary: #d1d5db;

    /* Spacing */
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;
    --spacing-xl: 2rem;
    --spacing-2xl: 3rem;

    /* Typography */
    --font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --font-size-xs: 0.75rem;
    --font-size-sm: 0.875rem;
    --font-size-base: 1rem;
    --font-size-lg: 1.125rem;
    --font-size-xl: 1.25rem;
    --font-size-2xl: 1.5rem;
    --font-size-3xl: 1.875rem;

    /* Font Weights */
    --font-weight-normal: 400;
    --font-weight-medium: 500;
    --font-weight-semibold: 600;
    --font-weight-bold: 700;

    /* Line Heights */
    --line-height-tight: 1.25;
    --line-height-normal: 1.5;
    --line-height-relaxed: 1.75;

    /* Border Radius */
    --border-radius-sm: 0.25rem;
    --border-radius-md: 0.375rem;
    --border-radius-lg: 0.5rem;
    --border-radius-xl: 0.75rem;

    /* Shadows */
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

    /* Transitions */
    --transition-fast: 0.15s ease-in-out;
    --transition-base: 0.3s ease-in-out;
    --transition-slow: 0.5s ease-in-out;
}

/* Reset and Base Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: var(--font-family-primary);
    font-size: var(--font-size-base);
    line-height: var(--line-height-normal);
    color: var(--text-primary);
    background-color: var(--bg-primary);
}

/* Typography */
h1, h2, h3, h4, h5, h6 {
    font-weight: var(--font-weight-semibold);
    line-height: var(--line-height-tight);
    margin-bottom: var(--spacing-md);
}

h1 { font-size: var(--font-size-3xl); }
h2 { font-size: var(--font-size-2xl); }
h3 { font-size: var(--font-size-xl); }
h4 { font-size: var(--font-size-lg); }

p {
    margin-bottom: var(--spacing-md);
}

a {
    color: var(--color-primary);
    text-decoration: none;
    transition: var(--transition-fast);
}

a:hover {
    text-decoration: underline;
}

/* Layout */
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--spacing-md);
}

.main-content {
    min-height: calc(100vh - 200px);
    padding: var(--spacing-lg) 0;
}

/* Responsive Design */
@media (max-width: 768px) {
    .container {
        padding: 0 var(--spacing-sm);
    }

    .main-content {
        padding: var(--spacing-md) 0;
    }
}
```

### 🧪 Step 8: Testing Setup

**8.1 Create Test Configuration**
```javascript
// test/setup.js
const mongoose = require('mongoose');
require('dotenv').config();

// Test database connection
const connectTestDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/phoenix-test');
        console.log('Test database connected');
    } catch (error) {
        console.error('Test database connection failed:', error);
        process.exit(1);
    }
};

// Clean up test database
const cleanupTestDB = async () => {
    try {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    } catch (error) {
        console.error('Test cleanup failed:', error);
    }
};

module.exports = { connectTestDB, cleanupTestDB };
```

**8.2 Create Sample Test (test/pagination.test.js)**
```javascript
const { expect } = require('chai');
const { createPagination } = require('../utils/pagination');

describe('Pagination Utility', () => {
    it('should create correct pagination object', () => {
        const pagination = createPagination(1, 10, 100);

        expect(pagination).to.have.property('currentPage', 1);
        expect(pagination).to.have.property('totalPages', 10);
        expect(pagination).to.have.property('totalItems', 100);
        expect(pagination).to.have.property('limit', 10);
    });

    it('should handle edge cases', () => {
        const pagination = createPagination(0, 10, 5);

        expect(pagination.currentPage).to.equal(1);
        expect(pagination.totalPages).to.equal(1);
    });
});
```

**8.3 Run Tests**
```bash
# Run all tests
npm test

# Run specific test file
npm run test:pagination

# Run tests in watch mode (for development)
npm run test:watch
```

### 🚀 Step 9: Implementation Order

Follow this logical sequence to build features incrementally:

**Phase 1: Foundation (Week 1)**
1. ✅ Set up project structure and dependencies
2. ✅ Create database models (User, Category, Product)
3. ✅ Implement basic Express app with middleware
4. ✅ Set up authentication middleware
5. ✅ Create basic views and layouts

**Phase 2: Authentication (Week 2)**
1. 🔄 Implement user registration with OTP verification
2. 🔄 Create login/logout functionality
3. 🔄 Add password reset with email
4. 🔄 Implement Google OAuth (optional)
5. 🔄 Create admin authentication system

**Phase 3: Core Features (Week 3-4)**
1. 🔄 Build product catalog and search
2. 🔄 Implement category management
3. 🔄 Create product detail pages
4. 🔄 Add image upload with Cloudinary
5. 🔄 Implement product reviews system

**Phase 4: Admin Panel (Week 5)**
1. 🔄 Create admin dashboard
2. 🔄 Build user management interface
3. 🔄 Implement product management CRUD
4. 🔄 Add category management features
5. 🔄 Create admin analytics and reports

**Phase 5: Enhancement (Week 6)**
1. 🔄 Add advanced search and filtering
2. 🔄 Implement pagination and sorting
3. 🔄 Create responsive design
4. 🔄 Add form validation and error handling
5. 🔄 Optimize performance and security

### 🌐 Step 10: Deployment Preparation

**10.1 Production Environment Variables**
```env
# Production .env file
NODE_ENV=production
PORT=80
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/phoenix-production
SESSION_SECRET_KEY=super-secure-random-string-for-production
CLOUDINARY_CLOUD_NAME=your-production-cloudinary
CLOUDINARY_API_KEY=your-production-api-key
CLOUDINARY_API_SECRET=your-production-api-secret
EMAIL_USER=your-production-email@domain.com
EMAIL_PASS=your-production-email-password
```

**10.2 Production Optimizations**
```javascript
// Add to app.js for production
if (process.env.NODE_ENV === 'production') {
    // Enable trust proxy for reverse proxies
    app.set('trust proxy', 1);

    // Secure session cookies
    app.use(session({
        // ... existing config
        cookie: {
            secure: true, // HTTPS only
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000
        }
    }));

    // Additional security headers
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                imgSrc: ["'self'", "data:", "https:", "https://res.cloudinary.com"],
                scriptSrc: ["'self'"],
            },
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    }));
}
```

**10.3 Deployment Checklist**
- [ ] Set up production MongoDB database
- [ ] Configure production Cloudinary account
- [ ] Set up production email service
- [ ] Configure domain and SSL certificate
- [ ] Set up environment variables on hosting platform
- [ ] Configure reverse proxy (Nginx) if needed
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Test all functionality in production environment
- [ ] Set up CI/CD pipeline (optional)

**10.4 Hosting Options**
- **Heroku**: Easy deployment with add-ons for MongoDB
- **DigitalOcean**: VPS with full control
- **AWS**: Scalable cloud infrastructure
- **Vercel**: Good for static assets and serverless functions
- **Railway**: Modern platform with simple deployment

### 🎯 Quick Start Commands

After completing the setup, use these commands to start development:

```bash
# Start development server
npm run dev

# Start production server
npm start

# Run tests
npm test

# Check for issues
npm audit

# Update dependencies
npm update
```

### 📚 Next Steps

1. **Follow the implementation phases** in the suggested order
2. **Test each feature** thoroughly before moving to the next
3. **Commit frequently** to track your progress
4. **Document your changes** as you build
5. **Deploy early and often** to catch issues early

This comprehensive setup guide provides everything needed to recreate the Phoenix Headphones e-commerce application from scratch. Each step builds upon the previous one, ensuring a solid foundation for a production-ready application.

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Cloudinary account (for image storage)
- Gmail account (for email services)

## ⚙️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cur-phoenix
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/phoenix-headphones

   # Session
   SESSION_SECRET_KEY=your-super-secret-session-key

   # Cloudinary (for image uploads)
   CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret

   # Google OAuth
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret

   # Email Service (Gmail)
   EMAIL_USER=your-gmail-address
   EMAIL_PASS=your-gmail-app-password

   # Server
   PORT=4000
   NODE_ENV=development
   ```

4. **Start the application**
   ```bash
   # Development mode with auto-restart
   npm run dev

   # Production mode
   npm start
   ```

5. **Access the application**
   - User Interface: http://localhost:4000
   - Admin Panel: http://localhost:4000/admin

## 🗂️ Project Structure

```
cur-phoenix/
├── config/                 # Configuration files
│   ├── cloudinary.js      # Cloudinary setup
│   ├── database.js        # MongoDB connection
│   └── passport.js        # Authentication strategies
├── controllers/           # Route controllers
│   ├── admin/            # Admin controllers
│   └── user/             # User controllers
├── middlewares/          # Custom middleware
├── models/               # MongoDB schemas
├── public/               # Static assets
│   ├── css/
│   ├── js/
│   └── images/
├── routes/               # Route definitions
├── utils/                # Utility functions
├── views/                # EJS templates
│   ├── admin/           # Admin panel views
│   ├── user/            # User interface views
│   └── partials/        # Reusable components
├── test/                 # Test files
├── app.js               # Main application file
└── package.json         # Dependencies and scripts
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:pagination

# Run tests in watch mode
npm run test:watch
```

## 📱 API Endpoints

### User Routes
- `GET /` - Home page
- `GET /products` - Product listing
- `GET /product/:id` - Product details
- `POST /login` - User login
- `POST /signup` - User registration
- `GET /auth/google` - Google OAuth

### Admin Routes
- `GET /admin` - Admin dashboard
- `GET /admin/products` - Product management
- `GET /admin/categories` - Category management
- `GET /admin/users` - User management
- `POST /admin/products/toggle-status/:id` - Toggle product status

## 🔒 Security Features

- **Authentication**: Session-based authentication with Passport.js
- **Password Security**: bcrypt hashing with salt rounds
- **CSRF Protection**: Built-in Express security measures
- **Input Validation**: Server-side validation for all inputs
- **Security Headers**: Helmet.js for security headers
- **Environment Variables**: Sensitive data stored in environment variables

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

## � Writing Simple Backend Code

This project follows clean, maintainable coding principles that make the backend easy to understand and extend. Here are the key patterns used:

### 🏗️ Architecture Patterns

**1. MVC Structure**
```javascript
// Clear separation of concerns
controllers/     // Business logic
models/         // Data models
views/          // Templates
routes/         // Route definitions
```

**2. Middleware-First Approach**
```javascript
// Clean, reusable middleware
router.get('/products', isUserAuthenticated, productController.listProducts);
router.post('/admin/products', isAdminAuthenticated, uploadImages, controller.addProduct);
```

**3. Consistent Error Handling**
```javascript
const someController = async (req, res, next) => {
    try {
        // Main logic here
        const result = await SomeModel.find(filter);
        res.render('template', { data: result });
    } catch (error) {
        console.error('Error in someController:', error);
        next(error); // Pass to error handler
    }
};
```

### 🎯 Code Principles

**1. Descriptive Naming**
```javascript
// ✅ Good - Clear intent
const isUserAuthenticated = (req, res, next) => { ... }
const listProducts = async (req, res, next) => { ... }
const toggleProductStatus = async (req, res, next) => { ... }

// ❌ Avoid - Unclear purpose
const check = (req, res, next) => { ... }
const handle = async (req, res, next) => { ... }
```

**2. Single Responsibility**
```javascript
// Each function does one thing well
const validateEmail = (email) => { /* only validates email */ }
const sanitizeInput = (input) => { /* only sanitizes input */ }
const hashPassword = (password) => { /* only hashes password */ }
```

**3. Consistent Response Patterns**
```javascript
// Success responses
res.status(200).json({
    success: true,
    message: "Operation completed successfully",
    data: result
});

// Error responses
res.status(400).json({
    success: false,
    message: "Validation failed",
    errors: validationErrors
});
```

**4. Input Validation & Sanitization**
```javascript
// Always validate and sanitize inputs
const { email, password } = req.body;

if (!email || !email.trim()) {
    errors.email = 'Email is required';
} else if (!validateEmail(email)) {
    errors.email = 'Please enter a valid email address';
}

const sanitizedEmail = sanitizeInput(email.toLowerCase());
```

**5. Environment-Based Configuration**
```javascript
// Use environment variables for configuration
const isProduction = process.env.NODE_ENV === 'production';
const dbUri = process.env.MONGODB_URI;
const sessionSecret = process.env.SESSION_SECRET_KEY;
```

### 🛡️ Security Best Practices

**1. Authentication Middleware**
```javascript
// Reusable auth checks
const isUserAuthenticated = async (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    // Additional user validation...
    next();
};
```

**2. Input Sanitization**
```javascript
// Always sanitize user inputs
const sanitizedQuery = sanitizeInput(searchQuery);
const regex = new RegExp(sanitizedQuery, 'i');
```

**3. Password Security**
```javascript
// Password hashing is handled by User model pre-save middleware
// For user creation, store plain password - let the model handle hashing
const newUser = new User({
    email: 'user@example.com',
    password: 'plainPassword', // Will be hashed automatically
    // ... other fields
});
await newUser.save();

// For password comparison during login
const isValidPassword = await bcrypt.compare(password, user.password);

// For direct updates (like password reset), manual hashing is needed
// because findOneAndUpdate bypasses pre-save middleware
const hashedPassword = await bcrypt.hash(newPassword, 10);
await User.findOneAndUpdate({ email }, { password: hashedPassword });
```

### 📊 Database Patterns

**1. Consistent Query Structure**
```javascript
// Build filters systematically
let filter = { isDeleted: false };
if (searchQuery.trim()) {
    filter.$or = [
        { name: new RegExp(sanitizeInput(searchQuery), 'i') },
        { description: new RegExp(sanitizeInput(searchQuery), 'i') }
    ];
}

const results = await Model.find(filter)
    .populate('relatedField', 'selectedFields')
    .sort(sortObject)
    .skip(pagination.skip)
    .limit(pagination.limit);
```

**2. Soft Delete Pattern**
```javascript
// Never hard delete, use soft delete
const deleteItem = async (id) => {
    return await Model.findByIdAndUpdate(id, {
        isDeleted: true,
        deletedAt: new Date()
    });
};
```

### 🔧 Utility Functions

**Keep utilities simple and focused:**
```javascript
// utils/validation.js
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const sanitizeInput = (input) => {
    return input.toString().trim().replace(/[<>]/g, '');
};

// utils/pagination.js
const createPagination = (page, limit, total) => {
    return {
        currentPage: parseInt(page) || 1,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        limit: parseInt(limit) || 10
    };
};
```

### 📋 Key Takeaways

1. **Keep functions small** - Each function should do one thing well
2. **Use descriptive names** - Code should read like documentation
3. **Handle errors consistently** - Always use try-catch and pass errors to middleware
4. **Validate everything** - Never trust user input
5. **Use middleware** - Keep route handlers clean by using middleware for common tasks
6. **Separate concerns** - Controllers handle requests, models handle data, utilities handle common functions
7. **Environment configuration** - Use .env files for all configuration
8. **Consistent patterns** - Follow the same patterns throughout the codebase

This approach makes the code:
- ✅ Easy to read and understand
- ✅ Simple to debug and maintain
- ✅ Straightforward to test
- ✅ Safe and secure by default
- ✅ Scalable for future features

## 🎨 Frontend Validation & User Experience

The frontend follows a comprehensive validation and styling system that provides immediate feedback and excellent user experience.

### 🔍 **Custom Form Validation System**

**1. JavaScript Validation Class**
```javascript
// Initialize form validation
const validator = new FormValidator(formElement, {
    validateOnBlur: true,      // Validate when user leaves field
    validateOnInput: true,     // Clear errors as user types
    showSuccessStates: false   // Show green checkmarks for valid fields
});

// Setup common field types
validator.setupRequiredField('email', 'Email is required');
validator.setupEmailField('email', 'Please enter a valid email');
validator.setupPasswordField('password', 8, true); // Min 8 chars, require strength
```

**2. Built-in Validation Rules**
```javascript
// Email validation - only allows letters, numbers, underscore, period, @
email: /^[A-Za-z0-9_.]+@[A-Za-z0-9_.]+\.[A-Za-z0-9_.]{2,}$/

// Phone validation - 10 digits starting with 6,7,8,9
phone: /^[6-9]\d{9}$/

// Password strength - uppercase, lowercase, number, special char
passwordStrength: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
```

**3. Real-time Validation**
```javascript
// Validates on blur (when user leaves field)
field.addEventListener('blur', () => this.validateField(field));

// Clears errors as user types corrections
field.addEventListener('input', () => {
    if (field.classList.contains('is-invalid')) {
        this.clearFieldError(field);
        this.validateField(field);
    }
});
```

### 🎯 **Error Display Patterns**

**1. Field-Level Error Messages**
```html
<!-- Error container automatically created for each field -->
<div class="form-field">
    <input type="email" id="email" name="email">
    <div id="email-error" class="field-error"></div>
</div>
```

**2. Visual Error States**
```css
/* Invalid field styling */
.form-control.is-invalid {
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
    background-image: url("data:image/svg+xml,error-icon");
}

/* Error message styling */
.field-error {
    color: #ef4444;
    font-size: 0.875rem;
    margin-top: 0.25rem;
    animation: slideInError 0.3s ease-out;
}
```

**3. Server Error Integration**
```javascript
// Handle server validation errors in EJS templates
<% if (conflictFields && conflictFields.email) { %>
    const emailInput = document.getElementById('email');
    emailInput.classList.add('error');
    emailInput.focus();
    emailInput.select();
<% } %>
```

### 🎨 **Styling System**

**1. CSS Custom Properties (Variables)**
```css
:root {
    /* Colors */
    --color-primary: #2563eb;
    --color-success: #22c55e;
    --color-error: #ef4444;
    --color-warning: #f59e0b;

    /* Spacing */
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;

    /* Typography */
    --font-size-sm: 0.875rem;
    --font-size-base: 1rem;
    --font-weight-medium: 500;

    /* Transitions */
    --transition-fast: 0.15s ease-in-out;
    --transition-base: 0.3s ease-in-out;
}
```

**2. Component-Based CSS Structure**
```
public/css/
├── main.css              # Global styles and variables
├── form-validation.css   # Validation-specific styles
└── components/
    ├── forms.css         # Form component styles
    ├── alerts.css        # Alert component styles
    └── buttons.css       # Button component styles
```

**3. Consistent Form Styling**
```css
/* Form field wrapper */
.form-field {
    margin-bottom: var(--spacing-6);
    position: relative;
}

/* Input styling with focus states */
.form-control {
    width: 100%;
    padding: var(--spacing-3) var(--spacing-4);
    border: 1px solid var(--border-secondary);
    border-radius: var(--input-border-radius);
    transition: all var(--transition-fast);
}

.form-control:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}
```

### 🔔 **User Feedback System**

**1. Toast Notifications**
```javascript
// Show success/error messages
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => toast.remove(), 5000);
}
```

**2. Alert Components**
```html
<!-- Server-rendered alerts -->
<% if (error) { %>
    <div class="alert alert--error">
        <div class="alert__icon">⚠️</div>
        <div class="alert__content">
            <div class="alert__message"><%= error %></div>
        </div>
        <button class="alert__close">&times;</button>
    </div>
<% } %>
```

**3. Loading States**
```javascript
// Disable form during submission
form.addEventListener('submit', (e) => {
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';
});
```

### 📱 **Responsive Design Patterns**

**1. Mobile-First Approach**
```css
/* Base styles for mobile */
.form-field {
    margin-bottom: 1rem;
}

/* Tablet and up */
@media (min-width: 768px) {
    .form-field {
        margin-bottom: 1.5rem;
    }
}

/* Desktop */
@media (min-width: 1024px) {
    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }
}
```

**2. Touch-Friendly Interactions**
```css
/* Larger touch targets for mobile */
@media (max-width: 767px) {
    .form-control {
        padding: 0.875rem 1rem;
        font-size: 1rem; /* Prevents zoom on iOS */
    }

    .btn {
        min-height: 44px; /* iOS recommended touch target */
    }
}
```

### ♿ **Accessibility Features**

**1. WCAG AA Compliance**
```css
/* High contrast focus indicators */
.form-control:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
}

/* Color contrast ratios meet WCAG AA standards */
.field-error {
    color: #dc2626; /* 4.5:1 contrast ratio */
}
```

**2. Screen Reader Support**
```html
<!-- Proper labeling -->
<label for="email" class="form-field__label">
    Email Address
    <span class="sr-only">(required)</span>
</label>
<input type="email" id="email" name="email"
       aria-describedby="email-error"
       aria-invalid="false">
<div id="email-error" class="field-error" role="alert"></div>
```

### 🎭 **Animation & Micro-interactions**

**1. Smooth Transitions**
```css
/* Error message slide-in animation */
@keyframes slideInError {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.field-error {
    animation: slideInError 0.3s ease-out;
}
```

**2. Interactive Feedback**
```css
/* Button hover states */
.btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Input focus animations */
.form-control:focus {
    transform: scale(1.02);
    transition: all 0.2s ease-out;
}
```

### 🛠️ **Frontend Development Patterns**

**1. Progressive Enhancement**
```javascript
// Start with basic HTML forms, enhance with JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Only add JavaScript enhancements after DOM is ready
    const form = document.getElementById('loginForm');
    if (form) {
        const validator = new FormValidator(form);
        // Form works without JavaScript, better with it
    }
});
```

**2. Graceful Degradation**
```html
<!-- Form works without JavaScript -->
<form action="/login" method="POST" novalidate>
    <input type="email" name="email" required>
    <button type="submit">Login</button>
</form>

<!-- JavaScript enhances the experience -->
<script>
    // Add custom validation only if JavaScript is available
    if (typeof FormValidator !== 'undefined') {
        // Enhanced validation
    }
</script>
```

**3. Error Recovery**
```javascript
// Always provide fallbacks
try {
    // Enhanced functionality
    initializeAdvancedFeatures();
} catch (error) {
    console.warn('Advanced features unavailable:', error);
    // Fall back to basic functionality
    initializeBasicFeatures();
}
```

### 📋 **Frontend Best Practices**

**1. Performance**
- ✅ **Lazy load** non-critical JavaScript
- ✅ **Minimize DOM queries** - cache element references
- ✅ **Debounce** input validation to avoid excessive calls
- ✅ **Use CSS transforms** for animations (GPU accelerated)

**2. User Experience**
- ✅ **Immediate feedback** - validate on blur, clear errors on input
- ✅ **Clear error messages** - specific, actionable guidance
- ✅ **Consistent patterns** - same validation behavior across all forms
- ✅ **Loading states** - show progress during async operations

**3. Maintainability**
- ✅ **Component-based CSS** - reusable, modular styles
- ✅ **CSS custom properties** - centralized theming
- ✅ **Semantic HTML** - proper form structure and labeling
- ✅ **Separation of concerns** - HTML structure, CSS presentation, JS behavior

**4. Accessibility**
- ✅ **Keyboard navigation** - all interactive elements accessible via keyboard
- ✅ **Screen reader support** - proper ARIA labels and roles
- ✅ **High contrast** - WCAG AA compliant color ratios
- ✅ **Focus management** - clear focus indicators and logical tab order

### 🎯 **Key Frontend Takeaways**

1. **Start with HTML** - Build semantic, accessible forms first
2. **Enhance with CSS** - Use modern CSS features like custom properties and grid
3. **Add JavaScript progressively** - Forms should work without JS
4. **Validate early and often** - Real-time feedback improves UX
5. **Design for mobile first** - Touch-friendly, responsive design
6. **Test with real users** - Accessibility and usability testing
7. **Keep it simple** - Complex interactions should feel effortless
8. **Provide clear feedback** - Users should always know what's happening

This frontend approach ensures:
- 🚀 **Fast loading** and smooth interactions
- 📱 **Works on all devices** and screen sizes
- ♿ **Accessible to all users** including those with disabilities
- 🔧 **Easy to maintain** and extend with new features
- 🎨 **Consistent design** across the entire application

## �🔄 Recent Updates

- ✅ Fixed product status toggle functionality
- ✅ Improved category status management
- ✅ Enhanced error handling and user feedback
- ✅ Added comprehensive logging for debugging
- ✅ Implemented boolean conversion fixes

---

**Phoenix Headphones** - Delivering quality audio experiences through modern e-commerce technology.
