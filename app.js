require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const nocache = require('nocache');
const compression = require('compression');
const expressLayouts = require('express-ejs-layouts');
const passport = require('./config/passport');
const connectDB = require('./config/database');


// Connect to MongoDB
connectDB();

// Import routes
const userRouter = require('./routes/userRoutes');
const adminRouter = require('./routes/adminRoutes');

// Import middleware
const authMiddleware = require('./middlewares/authMiddleware');
const errorHandler = require('./middlewares/errorHandler');

// Compression middleware
app.use(compression());

// View engine setup
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');
app.set('views', path.join(__dirname, 'views'));

// Basic middleware
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
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

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
app.listen(PORT, () => {
    console.log(`Phoenix Headphones server running on http://localhost:${PORT}`);
});

module.exports = app;
