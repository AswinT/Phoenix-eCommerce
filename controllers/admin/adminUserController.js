const User = require('../../models/User');
const { sanitizeInput } = require('../../utils/validation');

// Helper function to calculate customer statistics
const calculateCustomerStats = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, newThisMonth, active, blocked] = await Promise.all([
        User.countDocuments({ isAdmin: false }),
        User.countDocuments({
            isAdmin: false,
            createdAt: { $gte: startOfMonth }
        }),
        User.countDocuments({
            isAdmin: false,
            isBlocked: false
        }),
        User.countDocuments({
            isAdmin: false,
            isBlocked: true
        })
    ]);

    return {
        total,
        newThisMonth,
        active,
        blocked,
        avgValue: 324 // Mock data - would calculate from orders
    };
};

// List all customers with enhanced data and pagination
const listUsers = async (req, res, next) => {
    try {
        const { createPagination, buildQueryParams } = require('../../utils/pagination');

        // Get current admin user data
        const currentAdmin = await User.findById(req.session.admin)
            .select('fullname email avatar isAdmin');

        const searchQuery = req.query.search || '';
        const statusFilter = req.query.status || 'all'; // all, active, blocked

        // Build search filter
        let filter = { isAdmin: false };

        // Add status filter
        if (statusFilter === 'active') {
            filter.isBlocked = false;
        } else if (statusFilter === 'blocked') {
            filter.isBlocked = true;
        }

        if (searchQuery.trim()) {
            const regex = new RegExp(sanitizeInput(searchQuery), 'i');
            filter.$or = [
                { fullname: regex },
                { email: regex },
                { mobile: regex }
            ];
        }

        // Get total count for pagination
        const totalUsers = await User.countDocuments(filter);

        // Create pagination object
        const pagination = createPagination(req.query, totalUsers, 'ADMIN_USERS');

        // Generate page numbers array for the new pagination template
        const generatePageNumbers = (currentPage, totalPages, maxVisible = 7) => {
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

        // Get users with enhanced data
        const users = await User.find(filter)
            .select('fullname email mobile isBlocked createdAt profileImage')
            .sort({ createdAt: -1 })
            .skip(pagination.skip)
            .limit(pagination.limit);

        // Enhance users with additional data (mock order data for now)
        const enhancedUsers = users.map(user => ({
            ...user.toObject(),
            orderCount: Math.floor(Math.random() * 20), // Mock data
            totalSpent: Math.floor(Math.random() * 2000), // Mock data
            status: user.isBlocked ? 'blocked' : 'active',
            avatar: user.profileImage || '/images/admin-avatar.svg'
        }));

        // Get customer statistics
        const customerStats = await calculateCustomerStats();

        // Build query parameters for pagination links
        const queryParams = buildQueryParams(req.query, ['search', 'status']);

        // Check if this is an AJAX request
        const isAjax = req.headers['x-requested-with'] === 'XMLHttpRequest';

        const renderData = {
            customers: enhancedUsers,
            customerStats,
            currentPage: pagination.currentPage,
            totalPages: pagination.totalPages,
            totalUsers: pagination.totalItems,
            pageNumbers,
            searchQuery,
            statusFilter,
            hasNextPage: pagination.hasNextPage,
            hasPrevPage: pagination.hasPrevPage,
            nextPage: pagination.nextPage,
            prevPage: pagination.prevPage,
            pagination,
            baseUrl: '/admin/users',
            queryParams,
            user: currentAdmin,
            activePage: 'customers',
            additionalCSS: ['/css/admin.css', '/css/pagination.css'],
            layout: false
        };

        if (isAjax) {
            // For AJAX requests, return just the customers section
            res.render('admin/customers', renderData);
        } else {
            // For regular requests, return the full page
            res.render('admin/customers', renderData);
        }

    } catch (error) {
        console.error('Error listing customers:', error);
        next(error);
    }
};

// List blocked customers specifically
const listBlockedCustomers = async (req, res, next) => {
    try {
        // Get current admin user data
        const currentAdmin = await User.findById(req.session.admin)
            .select('fullname email avatar isAdmin');

        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;
        const searchQuery = req.query.search || '';

        // Build search filter for blocked customers only
        let filter = { isAdmin: false, isBlocked: true };

        if (searchQuery.trim()) {
            const regex = new RegExp(sanitizeInput(searchQuery), 'i');
            filter.$or = [
                { fullname: regex },
                { email: regex },
                { mobile: regex }
            ];
        }

        // Get total count for pagination
        const totalUsers = await User.countDocuments(filter);
        const totalPages = Math.ceil(totalUsers / limit);

        // Get blocked users with enhanced data
        const users = await User.find(filter)
            .select('fullname email mobile isBlocked createdAt profileImage')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Enhance users with additional data
        const enhancedUsers = users.map(user => ({
            ...user.toObject(),
            orderCount: Math.floor(Math.random() * 20), // Mock data
            totalSpent: Math.floor(Math.random() * 2000), // Mock data
            status: 'blocked',
            avatar: user.profileImage || '/images/admin-avatar.svg'
        }));

        // Get customer statistics
        const customerStats = await calculateCustomerStats();

        res.render('admin/blocked-customers', {
            customers: enhancedUsers,
            customerStats,
            currentPage: page,
            totalPages,
            totalUsers,
            searchQuery,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            nextPage: page + 1,
            prevPage: page - 1,
            user: currentAdmin,
            activePage: 'customers',
            additionalCSS: ['/css/admin.css'],
            layout: false
        });

    } catch (error) {
        console.error('Error listing blocked customers:', error);
        next(error);
    }
};

// Search users (AJAX endpoint)
const searchUsers = async (req, res, next) => {
    try {
        const searchQuery = req.query.query || '';
        
        if (!searchQuery.trim()) {
            return res.json({ success: false, message: 'Search query is required' });
        }

        const regex = new RegExp(sanitizeInput(searchQuery), 'i');
        const users = await User.find({
            isAdmin: false,
            $or: [
                { fullname: regex },
                { email: regex },
                { mobile: regex }
            ]
        })
        .select('fullname email mobile isBlocked createdAt')
        .sort({ createdAt: -1 })
        .limit(20);

        res.json({ success: true, users });

    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Toggle user block/unblock status
const toggleUserBlock = async (req, res, next) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ 
                success: false, 
                message: 'User ID is required' 
            });
        }

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Prevent blocking admin users
        if (user.isAdmin) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot block admin users' 
            });
        }

        // Toggle block status
        user.isBlocked = !user.isBlocked;
        await user.save();

        const action = user.isBlocked ? 'blocked' : 'unblocked';
        
        res.json({ 
            success: true, 
            message: `User ${action} successfully`,
            isBlocked: user.isBlocked,
            userId: user._id
        });

    } catch (error) {
        console.error('Error toggling user block status:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Bulk block/unblock customers
const bulkToggleCustomers = async (req, res, next) => {
    try {
        const { customerIds, action } = req.body;

        if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Customer IDs are required'
            });
        }

        if (!action || !['block', 'unblock'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: 'Valid action (block/unblock) is required'
            });
        }

        // Find customers and exclude admin users
        const customers = await User.find({
            _id: { $in: customerIds },
            isAdmin: false
        });

        if (customers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No valid customers found'
            });
        }

        // Update customers
        const isBlocked = action === 'block';
        await User.updateMany(
            {
                _id: { $in: customers.map(c => c._id) },
                isAdmin: false
            },
            { isBlocked }
        );

        const actionText = action === 'block' ? 'blocked' : 'unblocked';

        res.json({
            success: true,
            message: `${customers.length} customer(s) ${actionText} successfully`,
            count: customers.length,
            action: actionText
        });

    } catch (error) {
        console.error('Error in bulk customer operation:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    listUsers,
    listBlockedCustomers,
    searchUsers,
    toggleUserBlock,
    bulkToggleCustomers
};
