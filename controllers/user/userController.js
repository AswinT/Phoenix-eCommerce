const User = require('../../models/User');
const Product = require('../../models/Product');
const Category = require('../../models/Category');
const bcrypt = require('bcryptjs');
const { generateOTP, sendOTPEmail } = require('../../utils/emailService');
const { validateUserData, sanitizeInput } = require('../../utils/validation');

// Helper function to safely get timestamp from otpExpiry
const getOtpExpiryTimestamp = (otpExpiry) => {
    if (!otpExpiry) {
        return null;
    }

    // If it's already a number (timestamp), return it
    if (typeof otpExpiry === 'number') {
        return otpExpiry;
    }

    // If it's a string, try to parse it as a date
    if (typeof otpExpiry === 'string') {
        const date = new Date(otpExpiry);
        return isNaN(date.getTime()) ? null : date.getTime();
    }

    // If it's a Date object, get the timestamp
    if (otpExpiry instanceof Date) {
        return otpExpiry.getTime();
    }

    // If it has a getTime method, try to use it
    if (typeof otpExpiry.getTime === 'function') {
        try {
            return otpExpiry.getTime();
        } catch (error) {
            console.error('Error calling getTime on otpExpiry:', error);
            return null;
        }
    }

    // Fallback: try to convert to number
    const timestamp = Number(otpExpiry);
    return isNaN(timestamp) ? null : timestamp;
};

// Helper function to safely get Date object from otpExpiry
const getOtpExpiryDate = (otpExpiry) => {
    if (!otpExpiry) {
        return null;
    }

    // If it's already a Date object, return it
    if (otpExpiry instanceof Date) {
        return otpExpiry;
    }

    // If it's a number (timestamp), create Date from it
    if (typeof otpExpiry === 'number') {
        return new Date(otpExpiry);
    }

    // If it's a string, try to parse it as a date
    if (typeof otpExpiry === 'string') {
        const date = new Date(otpExpiry);
        return isNaN(date.getTime()) ? null : date;
    }

    // Fallback: try to convert to number and create Date
    const timestamp = Number(otpExpiry);
    return isNaN(timestamp) ? null : new Date(timestamp);
};

// Home page with featured products and pagination
const homePage = async (req, res, next) => {
    try {
        const { createPagination, buildQueryParams } = require('../../utils/pagination');
        let successMessage = null;

        // Check for auth success message
        if (req.query.auth === 'success') {
            successMessage = 'Successfully signed in with Google!';
        }

        // Get featured products filter
        const filter = {
            isActive: true,
            isListed: true,
            isDeleted: false
        };

        // Get all active categories for homepage display
        const categories = await Category.find({
            isListed: true,
            isDeleted: false
        })
        .sort({ sortOrder: 1, name: 1 })
        .select('name description slug');

        // Get total count for pagination
        const totalProducts = await Product.countDocuments(filter);

        // Create pagination object
        const pagination = createPagination(req.query, totalProducts, 'HOMEPAGE_FEATURED');

        // Generate page numbers array for the new pagination template
        const generatePageNumbers = (currentPage, totalPages, maxVisible = 5) => {
            const pages = [];

            if (totalPages <= maxVisible) {
                for (let i = 1; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                const halfVisible = Math.floor(maxVisible / 2);
                let start = Math.max(1, currentPage - halfVisible);
                let end = Math.min(totalPages, start + maxVisible - 1);

                // Adjust start if we're near the end
                if (end - start + 1 < maxVisible) {
                    start = Math.max(1, end - maxVisible + 1);
                }

                for (let i = start; i <= end; i++) {
                    pages.push(i);
                }
            }

            return pages;
        };

        const pageNumbers = generatePageNumbers(pagination.currentPage, pagination.totalPages);

        // Get featured products with pagination
        const featuredProducts = await Product.find(filter)
            .populate('categoryId', 'name')
            .sort({ 'ratings.average': -1, createdAt: -1 }) // Sort by rating first, then newest
            .skip(pagination.skip)
            .limit(pagination.limit);

        // Build query parameters for pagination links
        const queryParams = buildQueryParams(req.query, []);

        // Check if this is an AJAX request
        const isAjax = req.headers['x-requested-with'] === 'XMLHttpRequest';

        const renderData = {
            user: req.session.user,
            username: req.session.username,
            success: successMessage,
            error: null,
            featuredProducts,
            categories,
            currentPage: pagination.currentPage,
            totalPages: pagination.totalPages,
            totalProducts: pagination.totalItems,
            pageNumbers,
            hasNextPage: pagination.hasNextPage,
            hasPrevPage: pagination.hasPrevPage,
            nextPage: pagination.nextPage,
            prevPage: pagination.prevPage,
            pagination,
            baseUrl: '/',
            queryParams
        };

        if (isAjax) {
            // For AJAX requests, return just the featured products section
            res.render('user/home', renderData);
        } else {
            // For regular requests, return the full page
            res.render('user/home', renderData);
        }
    } catch (error) {
        console.error('Error rendering home page:', error);
        next(error);
    }
};

// Login page
const loginPage = (req, res, next) => {
    try {
        res.render('user/login', {
            error: null,
            success: null
        });
    } catch (error) {
        console.error('Error rendering login page:', error);
        next(error);
    }
};

// Handle login
const postLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Basic validation
        if (!email || !password) {
            return res.render('user/login', {
                error: 'Please fill in all fields',
                success: null
            });
        }

        // Find user
        const user = await User.findOne({ email: sanitizeInput(email.toLowerCase()) });
        if (!user) {
            return res.render('user/login', {
                error: 'Invalid email or password',
                success: null
            });
        }

        // Check if user is blocked
        if (user.isBlocked) {
            return res.render('user/login', {
                error: 'Your account has been blocked. Please contact support.',
                success: null
            });
        }

        // Check if user is verified
        if (!user.isVerified) {
            return res.render('user/login', {
                error: 'Please verify your email address first',
                success: null
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.render('user/login', {
                error: 'Invalid email or password',
                success: null
            });
        }

        // Set session
        req.session.user = user._id;
        req.session.username = user.fullname;

        res.redirect('/');

    } catch (error) {
        console.error('Error in user login:', error);
        next(error);
    }
};

// Signup page
const signupPage = (req, res, next) => {
    try {
        res.render('user/signup', {
            error: null,
            success: null,
            formData: {},
            conflictFields: null,
            errorMessages: null
        });
    } catch (error) {
        console.error('Error rendering signup page:', error);
        next(error);
    }
};

// Handle signup
const postSignup = async (req, res, next) => {
    try {
        const { fullname, email, mobile, password, confirmPassword } = req.body;
        const formData = { fullname, email, mobile };

        // Validate input
        const errors = validateUserData({ fullname, email, mobile, password, confirmPassword });

        if (Object.keys(errors).length > 0) {
            return res.render('user/signup', {
                error: Object.values(errors)[0],
                success: null,
                formData,
                conflictFields: null,
                errorMessages: null
            });
        }

        // Check for existing users with same email or phone
        const sanitizedEmail = sanitizeInput(email.toLowerCase());

        // Check for email conflict
        const existingEmailUser = await User.findOne({ email: sanitizedEmail });

        // Check for phone conflict
        const existingPhoneUser = await User.findOne({ mobile: mobile });

        // Handle different conflict scenarios
        if (existingEmailUser || existingPhoneUser) {
            let errorMessages = {};
            let conflictFields = {};

            if (existingEmailUser && existingPhoneUser) {
                // Both email and phone exist
                if (existingEmailUser._id.equals(existingPhoneUser._id)) {
                    // Same user has both email and phone
                    const emailError = 'This email is already registered. <a href="/login" class="error-link">Sign in instead</a> or <a href="/forgot-password" class="error-link">reset your password</a>.';
                    const mobileError = 'This phone number is already registered. <a href="/login" class="error-link">Sign in instead</a> or use a different number.';
                    errorMessages = { email: emailError, mobile: mobileError };
                    conflictFields = { email: true, mobile: true };
                } else {
                    // Different users have the email and phone
                    const emailError = 'This email is already registered to another account. Please use a different email address.';
                    const mobileError = 'This phone number is already registered to another account. Please use a different phone number.';
                    errorMessages = { email: emailError, mobile: mobileError };
                    conflictFields = { email: true, mobile: true };
                }
            } else if (existingEmailUser) {
                // Only email conflict
                const emailError = 'An account with this email address already exists. <a href="/login" class="error-link">Sign in instead</a> or <a href="/forgot-password" class="error-link">reset your password</a>.';
                errorMessages = { email: emailError };
                conflictFields = { email: true };
            } else if (existingPhoneUser) {
                // Only phone conflict
                const mobileError = 'An account with this phone number already exists. Please use a different phone number or <a href="/login" class="error-link">sign in instead</a>.';
                errorMessages = { mobile: mobileError };
                conflictFields = { mobile: true };
            }

            return res.render('user/signup', {
                error: null, // No general error
                success: null,
                formData,
                conflictFields,
                errorMessages
            });
        }

        // Generate OTP
        const otp = generateOTP();
        console.log('Generated OTP:', otp);
        const otpExpiryDate = new Date(Date.now() + 60 * 1000); // 1 minute (60 seconds)
        const otpExpiryTimestamp = otpExpiryDate.getTime(); // Store as timestamp for session consistency


        // Send OTP email
        const emailSent = await sendOTPEmail(email, otp, 'verification');
        if (!emailSent) {
            return res.render('user/signup', {
                error: 'Failed to send verification email. Please try again.',
                success: null,
                formData,
                conflictFields: null,
                errorMessages: null
            });
        }

        // Store user data in session temporarily (password will be hashed by User model pre-save middleware)
        req.session.tempUserData = {
            fullname: sanitizeInput(fullname),
            email: sanitizeInput(email.toLowerCase()),
            mobile: mobile,
            password: password, // Store plain password - let the User model handle hashing
            otp,
            otpExpiry: otpExpiryTimestamp // Store as timestamp to avoid Date object serialization issues
        };

        res.render('user/verify-otp', {
            mobile,
            otpExpiry: otpExpiryTimestamp, // Pass timestamp in milliseconds
            error: null,
        });

    } catch (error) {
        console.error('Error in user signup:', error);
        next(error);
    }
};

// Verify OTP page
const verifyOtpPage = (req, res, next) => {
    try {
        if (!req.session.tempUserData) {
            return res.redirect('/signup');
        }

        // Safely get the OTP expiry timestamp
        const otpExpiryTimestamp = getOtpExpiryTimestamp(req.session.tempUserData.otpExpiry);

        if (!otpExpiryTimestamp) {
            console.error('Invalid otpExpiry in session:', req.session.tempUserData.otpExpiry);
            return res.redirect('/signup');
        }

        res.render('user/verify-otp', {
            mobile: req.session.tempUserData.mobile,
            otpExpiry: otpExpiryTimestamp, // Pass timestamp in milliseconds
            error: null,
            success: null
        });
    } catch (error) {
        console.error('Error rendering verify OTP page:', error);
        next(error);
    }
};

// Handle OTP verification
const postVerifyOtp = async (req, res, next) => {
    try {
        const { otp } = req.body;

        if (!req.session.tempUserData) {
            return res.redirect('/signup');
        }

        const { email, mobile, otp: sessionOtp, otpExpiry } = req.session.tempUserData;

        // Safely get the OTP expiry timestamp and Date object
        const otpExpiryTimestamp = getOtpExpiryTimestamp(otpExpiry);
        const otpExpiryDate = getOtpExpiryDate(otpExpiry);

        if (!otpExpiryTimestamp || !otpExpiryDate) {
            console.error('Invalid otpExpiry in session during verification:', otpExpiry);
            return res.render('user/verify-otp', {
                mobile,
                otpExpiry: Date.now() + 60000, // Default to 1 minute from now
                error: 'Session expired. Please try signing up again.',
                success: null
            });
        }

        // Check if OTP is expired
        if (new Date() > otpExpiryDate) {
            return res.render('user/verify-otp', {
                mobile,
                otpExpiry: otpExpiryTimestamp,
                error: 'OTP has expired. Please request a new one.',
                success: null
            });
        }

        // Verify OTP
        if (otp !== sessionOtp) {
            return res.render('user/verify-otp', {
                mobile,
                otpExpiry: otpExpiryTimestamp,
                error: 'The verification code you entered is incorrect. Please check your code and try again.',
                success: null
            });
        }

        // Create user
        const userData = req.session.tempUserData;
        const newUser = new User({
            fullname: userData.fullname,
            email: userData.email,
            mobile: userData.mobile,
            password: userData.password,
            isVerified: true
        });

        await newUser.save();

        // Clear temp data
        delete req.session.tempUserData;

        res.render('user/login', {
            error: null,
            success: 'Account created successfully! Please login.'
        });

    } catch (error) {
        console.error('Error verifying OTP:', error);
        next(error);
    }
};

// Resend OTP
const resendOtp = async (req, res, next) => {
    try {
        if (!req.session.tempUserData) {
            return res.status(400).json({
                success: false,
                message: 'No signup session found'
            });
        }

        const { email } = req.session.tempUserData;
        const otp = generateOTP();
        console.log('Generated Resend OTP for signup:', otp);
        const otpExpiryDate = new Date(Date.now() + 60 * 1000); // 1 minute (60 seconds)
        const otpExpiryTimestamp = otpExpiryDate.getTime(); // Store as timestamp for consistency

        // Send new OTP
        const emailSent = await sendOTPEmail(email, otp, 'verification');
        if (!emailSent) {
            return res.status(500).json({
                success: false,
                message: 'Failed to send OTP'
            });
        }

        // Update session data (store as timestamp for consistency)
        req.session.tempUserData.otp = otp;
        req.session.tempUserData.otpExpiry = otpExpiryTimestamp;

        res.json({
            success: true,
            message: 'OTP sent successfully',
            otpExpiry: otpExpiryTimestamp // Include new expiry timestamp for frontend
        });

    } catch (error) {
        console.error('Error resending OTP:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Resend OTP for password reset
const resendResetOtp = async (req, res, next) => {
    try {
        if (!req.session.resetData) {
            return res.status(400).json({
                success: false,
                message: 'No password reset session found'
            });
        }

        const { email } = req.session.resetData;
        const otp = generateOTP();
        console.log('Generated Resend OTP for password reset:', otp);
        const otpExpiryDate = new Date(Date.now() + 60 * 1000); // 1 minute (60 seconds)
        const otpExpiryTimestamp = otpExpiryDate.getTime(); // Store as timestamp for consistency

        // Send new OTP
        const emailSent = await sendOTPEmail(email, otp, 'reset');
        if (!emailSent) {
            return res.status(500).json({
                success: false,
                message: 'Failed to send OTP'
            });
        }

        // Update session data (store as timestamp for consistency)
        req.session.resetData.otp = otp;
        req.session.resetData.otpExpiry = otpExpiryTimestamp;

        res.json({
            success: true,
            message: 'OTP sent successfully',
            otpExpiry: otpExpiryTimestamp // Include new expiry timestamp for frontend
        });

    } catch (error) {
        console.error('Error resending reset OTP:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Forgot password page
const forgotPasswordPage = (req, res, next) => {
    try {
        res.render('user/forgot-password', {
            error: null,
            success: null,
            formData: {}
        });
    } catch (error) {
        console.error('Error rendering forgot password page:', error);
        next(error);
    }
};

// Handle forgot password
const postForgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const formData = { email };

        if (!email) {
            return res.render('user/forgot-password', {
                error: 'Email is required',
                success: null,
                formData
            });
        }

        const user = await User.findOne({ email: sanitizeInput(email.toLowerCase()) });
        if (!user) {
            return res.render('user/forgot-password', {
                error: 'No account found with this email',
                success: null,
                formData
            });
        }

        // Generate OTP
        const otp = generateOTP();
        console.log('Generated OTP for password reset:', otp);
        const otpExpiryDate = new Date(Date.now() + 60 * 1000); // 1 minute (60 seconds)
        const otpExpiryTimestamp = otpExpiryDate.getTime(); // Store as timestamp for consistency

        // Send reset email
        const emailSent = await sendOTPEmail(email, otp, 'reset');
        if (!emailSent) {
            return res.render('user/forgot-password', {
                error: 'Failed to send verification email. Please try again.',
                success: null,
                formData
            });
        }

        // Store reset data in session (store otpExpiry as timestamp for consistency)
        req.session.resetData = {
            email,
            otp,
            otpExpiry: otpExpiryTimestamp
        };

        res.render('user/reset-password-otp', {
            email,
            otpExpiry: otpExpiryTimestamp, // Pass timestamp for timer initialization
            error: null,
            success: null
        });

    } catch (error) {
        console.error('Error in forgot password:', error);
        next(error);
    }
};

// Verify reset OTP
const verifyResetOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        if (!req.session.resetData) {
            return res.redirect('/forgot-password');
        }

        const { email: sessionEmail, otp: sessionOtp, otpExpiry } = req.session.resetData;

        // Verify email matches session email
        if (email !== sessionEmail) {
            return res.render('user/reset-password-otp', {
                email,
                otpExpiry: Date.now(), // Set expired timer
                error: 'Email mismatch. Please restart the password reset process.',
                success: null
            });
        }

        // Safely get the OTP expiry date
        const otpExpiryDate = getOtpExpiryDate(otpExpiry);

        if (!otpExpiryDate) {
            console.error('Invalid otpExpiry in session during verification:', otpExpiry);
            return res.render('user/reset-password-otp', {
                email,
                otpExpiry: Date.now(), // Set expired timer
                error: 'Session expired. Please try again.',
                success: null
            });
        }

        // Check if OTP is expired
        if (new Date() > otpExpiryDate) {
            return res.render('user/reset-password-otp', {
                email,
                otpExpiry: otpExpiry,
                error: 'Verification code has expired. Please request a new one.',
                success: null
            });
        }

        // Verify OTP
        if (otp !== sessionOtp) {
            return res.render('user/reset-password-otp', {
                email,
                otpExpiry: otpExpiry,
                error: 'The verification code you entered is incorrect. Please check your code and try again.',
                success: null
            });
        }

        // Keep the reset session but proceed to password reset page
        res.render('user/reset-password', {
            email,
            error: null,
            success: null
        });

    } catch (error) {
        console.error('Error verifying reset OTP:', error);
        next(error);
    }
};

// Reset password page (should only be accessible after verifying OTP)
const resetPasswordPage = (req, res, next) => {
    try {
        if (!req.session.resetData) {
            return res.redirect('/forgot-password');
        }

        res.render('user/reset-password', {
            email: req.session.resetData.email,
            error: null,
            success: null
        });
    } catch (error) {
        console.error('Error rendering reset password page:', error);
        next(error);
    }
};

// Handle reset password
const postResetPassword = async (req, res, next) => {
    try {
        const { email, newPassword, confirmPassword } = req.body;

        if (!req.session.resetData) {
            return res.redirect('/forgot-password');
        }

        const sessionEmail = req.session.resetData.email;

        // Verify email matches session email
        if (email !== sessionEmail) {
            return res.render('user/reset-password', {
                email: sessionEmail,
                error: 'Email mismatch. Please restart the password reset process.',
                success: null
            });
        }

        // Validate password
        if (!newPassword || !confirmPassword) {
            return res.render('user/reset-password', {
                email,
                error: 'Both password fields are required',
                success: null
            });
        }

        if (newPassword !== confirmPassword) {
            return res.render('user/reset-password', {
                email,
                error: 'Passwords do not match',
                success: null
            });
        }

        // Update password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.findOneAndUpdate(
            { email },
            { password: hashedPassword }
        );

        // Clear reset data
        delete req.session.resetData;

        res.render('user/login', {
            error: null,
            success: 'Password reset successfully! Please login with your new password.'
        });

    } catch (error) {
        console.error('Error resetting password:', error);
        next(error);
    }
};

// Social auth callback
const socialAuthCallback = (req, res) => {
    try {
        if (req.user) {
            // Check if user is blocked
            if (req.user.isBlocked) {
                return res.render('user/login', {
                    error: 'Your account has been blocked. Please contact support.',
                    success: null
                });
            }

            // Set session
            req.session.user = req.user._id;
            req.session.username = req.user.fullname;

            // Redirect to home with success message
            res.redirect('/?auth=success');
        } else {
            // Authentication failed
            res.render('user/login', {
                error: 'Authentication failed. Please try again.',
                success: null
            });
        }
    } catch (error) {
        console.error('Error in social auth callback:', error);
        res.render('user/login', {
            error: 'An error occurred during authentication. Please try again.',
            success: null
        });
    }
};

// Logout
const logout = (req, res, next) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Logout failed'
                });
            }
            res.clearCookie('connect.sid');
            res.redirect('/');
        });
    } catch (error) {
        console.error('Error in logout:', error);
        next(error);
    }
};



module.exports = {
    homePage,
    loginPage,
    postLogin,
    signupPage,
    postSignup,
    verifyOtpPage,
    postVerifyOtp,
    resendOtp,
    resendResetOtp,
    forgotPasswordPage,
    postForgotPassword,
    verifyResetOtp,
    resetPasswordPage,
    postResetPassword,
    socialAuthCallback,
    logout
};
