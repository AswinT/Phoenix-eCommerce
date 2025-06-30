/**
 * 404 Not Found Handler Utility
 * Provides consistent 404 error handling across the application
 */

/**
 * Create a 404 error for user routes
 * @param {string} resource - The resource that was not found (optional)
 * @returns {Error} 404 error object
 */
const createUserNotFoundError = (resource = 'Page') => {
    const error = new Error(`${resource} not found`);
    error.status = 404;
    return error;
};

/**
 * Create a 404 error for admin routes
 * @param {string} resource - The resource that was not found (optional)
 * @returns {Error} 404 error object
 */
const createAdminNotFoundError = (resource = 'Admin page') => {
    const error = new Error(`${resource} not found`);
    error.status = 404;
    return error;
};

/**
 * Handle 404 for user routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @param {string} resource - The resource that was not found (optional)
 */
const handleUserNotFound = (req, res, next, resource = 'Page') => {
    const error = createUserNotFoundError(resource);
    next(error);
};

/**
 * Handle 404 for admin routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @param {string} resource - The resource that was not found (optional)
 */
const handleAdminNotFound = (req, res, next, resource = 'Admin page') => {
    const error = createAdminNotFoundError(resource);
    next(error);
};

/**
 * Middleware to handle 404 for specific resources
 * @param {string} resourceType - Type of resource (e.g., 'Product', 'Category', 'User')
 * @returns {Function} Express middleware function
 */
const notFoundMiddleware = (resourceType) => {
    return (req, res, next) => {
        const isAdminRoute = req.originalUrl.startsWith('/admin');
        const resource = `${resourceType}${isAdminRoute ? ' (Admin)' : ''}`;
        
        if (isAdminRoute) {
            handleAdminNotFound(req, res, next, resource);
        } else {
            handleUserNotFound(req, res, next, resource);
        }
    };
};

/**
 * Check if a resource exists and handle 404 if not
 * @param {any} resource - The resource to check
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @param {string} resourceName - Name of the resource for error message
 */
const checkResourceExists = (resource, req, res, next, resourceName = 'Resource') => {
    if (!resource) {
        const isAdminRoute = req.originalUrl.startsWith('/admin');
        if (isAdminRoute) {
            handleAdminNotFound(req, res, next, resourceName);
        } else {
            handleUserNotFound(req, res, next, resourceName);
        }
        return false;
    }
    return true;
};

/**
 * Handle API 404 responses (for AJAX requests)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const handleApiNotFound = (res, message = 'Resource not found') => {
    return res.status(404).json({
        success: false,
        message: message,
        error: 'Not Found'
    });
};

module.exports = {
    createUserNotFoundError,
    createAdminNotFoundError,
    handleUserNotFound,
    handleAdminNotFound,
    notFoundMiddleware,
    checkResourceExists,
    handleApiNotFound
};
