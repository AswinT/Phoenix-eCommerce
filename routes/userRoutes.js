const express = require('express');
const router = express.Router();
const passport = require('passport');
const { isUserAuthenticated, isUserNotAuthenticated } = require('../middlewares/authMiddleware');

// Import controllers
const userController = require('../controllers/user/userController');
const productController = require('../controllers/user/productController');
const reviewController = require('../controllers/user/reviewController');

// Home and landing pages
router.get('/', userController.homePage);

// Authentication routes
router.get('/login', isUserNotAuthenticated, userController.loginPage);
router.post('/login', isUserNotAuthenticated, userController.postLogin);
router.get('/signup', isUserNotAuthenticated, userController.signupPage);
router.post('/signup', isUserNotAuthenticated, userController.postSignup);
router.get('/verify-otp', userController.verifyOtpPage);
router.post('/verify-otp', userController.postVerifyOtp);
router.post('/resend-otp', userController.resendOtp);

// Forgot password routes
router.get('/forgot-password', isUserNotAuthenticated, userController.forgotPasswordPage);
router.post('/forgot-password', isUserNotAuthenticated, userController.postForgotPassword);
router.post('/verify-reset-otp', userController.verifyResetOtp);
router.get('/reset-password', userController.resetPasswordPage);
router.post('/reset-password', userController.postResetPassword);
router.post('/resend-reset-otp', userController.resendResetOtp);

// Social authentication routes
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    userController.socialAuthCallback
);

// Product routes
router.get('/products', productController.listProducts);
router.get('/product/:id', productController.viewProduct);

// Review routes
router.get('/api/products/:productId/reviews', reviewController.getProductReviews);
router.post('/api/products/:productId/reviews', isUserAuthenticated, reviewController.submitReview);
router.post('/api/reviews/:reviewId/vote', isUserAuthenticated, reviewController.voteReviewHelpful);
router.get('/api/user/reviews', isUserAuthenticated, reviewController.getUserReviews);



// User logout
router.post('/logout', userController.logout);

// Static pages
router.get('/about', (req, res) => {
    res.render('user/about');
});

router.get('/contact', (req, res) => {
    res.render('user/contact');
});

module.exports = router;
