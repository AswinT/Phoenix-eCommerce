const User = require('../models/User');

// Set user locals for all routes
const setUserLocals = async (req, res, next) => {
    try {
        // Initialize locals to prevent undefined errors
        res.locals.user = null;
        res.locals.username = null;
        res.locals.isAdmin = false;
        
        // For admin routes, prioritize admin session
        if (req.path.startsWith('/admin') && req.session.admin) {
            const admin = await User.findById(req.session.admin)
                .select('-password -otp -otpExpiry -resetPasswordToken -resetPasswordExpiry');
            
            if (admin && admin.isAdmin) {
                res.locals.user = admin;
                res.locals.username = admin.fullname || 'Admin';
                res.locals.isAdmin = true;
            } else {
                // Admin not found, only clear admin session data
                delete req.session.admin;
                delete req.session.adminEmail;
                delete req.session.adminName;
            }
        } 
        // For user routes, use the user session
        else if (req.session.user && !req.path.startsWith('/admin')) {
            const user = await User.findById(req.session.user)
                .select('-password -otp -otpExpiry -resetPasswordToken -resetPasswordExpiry');

            if (user && !user.isBlocked) {
                res.locals.user = user;
                res.locals.username = user.fullname || 'User';
            } else if (user && user.isBlocked) {
                // User is blocked, clear session and redirect to login
                delete req.session.user;
                delete req.session.username;
                
                // Only redirect if this is a page request (not an API request or AJAX)
                if (!req.xhr && req.headers.accept && req.headers.accept.includes('text/html')) {
                    return res.redirect('/login?status=blocked');
                }
            } else {
                // User not found, clear only user session variables instead of entire session
                delete req.session.user;
                delete req.session.username;
            }
        }
        
        next();
    } catch (error) {
        console.error('Error in setUserLocals middleware:', error);
        // On error, set safe defaults and continue
        res.locals.user = null;
        res.locals.username = null;
        res.locals.isAdmin = false;
        next();
    }
};

// Check if user is authenticated
const isUserAuthenticated = async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        const user = await User.findById(req.session.user);
        if (!user) {
            // Only clear user-related session data
            delete req.session.user;
            delete req.session.username;
            return res.redirect('/login');
        }

        if (user.isBlocked) {
            // Only clear user-related session data
            delete req.session.user;
            delete req.session.username;
            
            // Check if it's an AJAX request
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(403).json({ 
                    status: 'error',
                    message: 'Your account has been blocked. Please contact support.',
                    redirect: '/login?status=blocked'
                });
            }
            
            return res.redirect('/login?status=blocked');
        }

        next();
    } catch (error) {
        console.error('Error in isUserAuthenticated middleware:', error);
        res.status(500).render('error', { message: 'Internal server error' });
    }
};

// Check if user is not authenticated (for login/signup pages)
const isUserNotAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    next();
};

// Check if admin is authenticated
const isAdminAuthenticated = async (req, res, next) => {
    try {
        if (!req.session.admin) {
            return res.redirect('/admin/login');
        }

        // Verify the admin exists and has admin rights
        const admin = await User.findById(req.session.admin);
        if (!admin || !admin.isAdmin) {
            // Only clear admin session data
            delete req.session.admin;
            delete req.session.adminEmail;
            delete req.session.adminName;
            return res.redirect('/admin/login');
        }

        next();
    } catch (error) {
        console.error('Error in isAdminAuthenticated middleware:', error);
        res.status(500).render('admin/error', { 
            message: 'Internal server error',
            layout: false
        });
    }
};

// Check if admin is not authenticated (for admin login page)
const isAdminNotAuthenticated = (req, res, next) => {
    if (req.session.admin) {
        return res.redirect('/admin/dashboard');
    }
    next();
};

module.exports = {
    setUserLocals,
    isUserAuthenticated,
    isUserNotAuthenticated,
    isAdminAuthenticated,
    isAdminNotAuthenticated
};
