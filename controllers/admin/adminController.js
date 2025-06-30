const User = require('../../models/User');
const Product = require('../../models/Product');
const Category = require('../../models/Category');
const bcrypt = require('bcryptjs');
const { validateEmail, sanitizeInput } = require('../../utils/validation');

// Admin login page
const loginPage = (req, res, next) => {
    try {
        res.render('admin/login', {
            error: null,
            success: null,
            additionalCSS: ['/css/admin.css'],
            layout: false
        });
    } catch (error) {
        console.error('Error rendering admin login page:', error);
        next(error);
    }
};

// Handle admin login
const postLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validation
        const errors = {};
        
        if (!email || !email.trim()) {
            errors.email = 'Email is required';
        } else if (!validateEmail(email)) {
            errors.email = 'Please enter a valid email address';
        }

        if (!password || !password.trim()) {
            errors.password = 'Password is required';
        }

        if (Object.keys(errors).length > 0) {
            return res.render('admin/login', {
                error: 'Please fill in all required fields correctly',
                success: null,
                formData: { email },
                additionalCSS: ['/css/admin.css'],
                layout: false
            });
        }

        // Find admin user
        const admin = await User.findOne({ 
            email: sanitizeInput(email.toLowerCase()),
            isAdmin: true 
        });

        if (!admin) {
            return res.render('admin/login', {
                error: 'Invalid credentials or unauthorized access',
                success: null,
                formData: { email },
                additionalCSS: ['/css/admin.css'],
                layout: false
            });
        }

        // Check if admin is blocked
        if (admin.isBlocked) {
            return res.render('admin/login', {
                error: 'Your account has been blocked. Please contact support.',
                success: null,
                formData: { email },
                additionalCSS: ['/css/admin.css'],
                layout: false
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.render('admin/login', {
                error: 'Invalid credentials',
                success: null,
                formData: { email },
                additionalCSS: ['/css/admin.css'],
                layout: false
            });
        }

        // Set session
        req.session.admin = admin._id;
        req.session.adminEmail = admin.email;
        req.session.adminName = admin.fullname;

        res.redirect('/admin/dashboard');

    } catch (error) {
        console.error('Error in admin login:', error);
        next(error);
    }
};

// Admin dashboard
const dashboard = async (req, res, next) => {
    try {
        // Get current admin user data
        const currentAdmin = await User.findById(req.session.admin)
            .select('fullname email avatar isAdmin');

        // Get dashboard statistics
        const [totalUsers, totalProducts, totalCategories, activeProducts] = await Promise.all([
            User.countDocuments({ isAdmin: false }),
            Product.countDocuments(),
            Category.countDocuments(),
            Product.countDocuments({ isListed: true, isDeleted: false })
        ]);

        // Get recent users (last 5)
        const recentUsers = await User.find({ isAdmin: false })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('fullname email createdAt isBlocked');

        // Get low stock products
        const lowStockProducts = await Product.find({
            stock: { $lte: 10 },
            isListed: true,
            isDeleted: false
        })
        .populate('category', 'name')
        .limit(5)
        .select('name stock category');

        const dashboardData = {
            stats: {
                revenue: 24580, // Mock data - replace with actual revenue calculation
                orders: 156, // Mock data - replace with actual order count
                customers: totalUsers,
                products: totalProducts
            },
            recentUsers,
            lowStockProducts,
            topProducts: [], // Mock data - will show placeholder products
            recentOrders: [], // Mock data - will show placeholder orders
            user: currentAdmin, // Pass current admin user data
            activePage: 'dashboard', // For sidebar active state
            additionalCSS: ['/css/admin.css'] // Include admin CSS
        };

        // Render without layout
        res.render('admin/dashboard', { ...dashboardData, layout: false });

    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        next(error);
    }
};

// Admin logout
const logout = (req, res, next) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying admin session:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Logout failed' 
                });
            }
            res.clearCookie('connect.sid');
            res.redirect('/admin/login');
        });
    } catch (error) {
        console.error('Error in admin logout:', error);
        next(error);
    }
};

module.exports = {
    loginPage,
    postLogin,
    dashboard,
    logout
};
