require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const nocache = require('nocache');
const compression = require('compression');
const helmet = require('helmet');
const expressLayouts = require('express-ejs-layouts');
const passport = require('./config/passport');
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

// Import routes
const userRouter = require('./routes/userRoutes');
const adminRouter = require('./routes/adminRoutes');

// Import middleware
const authMiddleware = require('./middlewares/authMiddleware');
const errorHandler = require('./middlewares/errorHandler');

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

// Apply layout middleware only to non-admin routes for complete UI separation
app.use((req, res, next) => {
    if (!req.path.startsWith('/admin')) {
        expressLayouts(req, res, next);
    } else {
        // Skip layout for admin routes to ensure complete UI separation
        next();
    }
});

app.set('layout', 'layout');
app.use(express.static(path.join(__dirname, 'public')));
app.use(nocache());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: false, // Changed from true for security
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Dynamic based on environment
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Set view directories
app.set('views', [
    path.join(__dirname, 'views'),
    path.join(__dirname, 'views/user'),
    path.join(__dirname, 'views/admin')
]);

// Global middleware for user data
app.use(authMiddleware.setUserLocals);

// Routes
app.use('/', userRouter);
app.use('/admin', adminRouter);

// 404 handler - must be after all other routes
app.use('*', (req, res, next) => {
    const error = new Error(`Page not found - ${req.originalUrl}`);
    error.status = 404;
    next(error);
});

// Error handling middleware
app.use(errorHandler);

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
