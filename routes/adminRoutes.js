const express = require('express');
const router = express.Router();
const { isAdminAuthenticated, isAdminNotAuthenticated } = require('../middlewares/authMiddleware');
const { uploadCategoryImage, uploadProductImages } = require('../config/cloudinary');
const multer = require('multer');

// Middleware for handling Multer errors
const handleMulterErrors = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        return res.status(400).json({
            success: false,
            error: err.message
        });
    } else if (err) {
        // An unknown error occurred when uploading
        return res.status(400).json({
            success: false,
            error: err.message || 'File upload error'
        });
    }
    next();
};

// Import controllers
const adminController = require('../controllers/admin/adminController');
const adminUserController = require('../controllers/admin/adminUserController');
const adminCategoryController = require('../controllers/admin/adminCategoryController');
const adminProductController = require('../controllers/admin/adminProductController');

// Admin authentication routes
router.get('/login', isAdminNotAuthenticated, adminController.loginPage);
router.post('/login', isAdminNotAuthenticated, adminController.postLogin);
router.get('/logout', isAdminAuthenticated, adminController.logout);
router.post('/logout', isAdminAuthenticated, adminController.logout);

// Admin dashboard
router.get('/', isAdminAuthenticated, adminController.dashboard);
router.get('/dashboard', isAdminAuthenticated, adminController.dashboard);

// User management routes
router.get('/users', isAdminAuthenticated, adminUserController.listUsers);
router.get('/users/search', isAdminAuthenticated, adminUserController.searchUsers);
router.post('/users/toggle-status', isAdminAuthenticated, adminUserController.toggleUserBlock);
router.post('/users/toggle-block', isAdminAuthenticated, adminUserController.toggleUserBlock); // Keep for compatibility

// Customer management routes
router.get('/customers', isAdminAuthenticated, adminUserController.listUsers);
router.get('/customers/blocked', isAdminAuthenticated, adminUserController.listBlockedCustomers);
router.post('/customers/bulk-toggle', isAdminAuthenticated, adminUserController.bulkToggleCustomers);

// Category management routes
router.get('/categories', isAdminAuthenticated, adminCategoryController.listCategories);
router.get('/categories/add', isAdminAuthenticated, adminCategoryController.addCategoryPage);
router.post('/categories/add', isAdminAuthenticated, uploadCategoryImage.single('image'), adminCategoryController.postAddCategory);
router.get('/categories/edit/:id', isAdminAuthenticated, adminCategoryController.editCategoryPage);
router.post('/categories/edit/:id', isAdminAuthenticated, uploadCategoryImage.single('image'), adminCategoryController.postEditCategory);
router.post('/categories/toggle-status/:id', isAdminAuthenticated, adminCategoryController.toggleCategoryStatus);
router.delete('/categories/:id', isAdminAuthenticated, adminCategoryController.deleteCategory);
router.get('/categories/search', isAdminAuthenticated, adminCategoryController.searchCategories);

// Product management routes
router.get('/products', isAdminAuthenticated, adminProductController.listProducts);
router.get('/products/new', isAdminAuthenticated, adminProductController.addProductPage);
router.get('/products/add', isAdminAuthenticated, adminProductController.addProductPage); // Keep both for compatibility
router.get('/products/search', isAdminAuthenticated, adminProductController.searchProducts);

// Modified to use a more direct approach with better error handling
router.post('/products/add', 
    isAdminAuthenticated, 
    (req, res, next) => {
        try {
            console.log('Processing product add request with images');
            const upload = uploadProductImages.array('images', 10);
            
            upload(req, res, function(err) {
                if (err instanceof multer.MulterError) {
                    // A Multer error occurred when uploading
                    console.error('Multer error during upload:', err);
                    return res.status(400).json({
                        success: false,
                        error: err.message || 'Error uploading files (size or format issue)'
                    });
                } else if (err) {
                    // An unknown error occurred when uploading
                    console.error('Unknown error during upload:', err);
                    return res.status(400).json({
                        success: false,
                        error: err.message || 'File upload error'
                    });
                }
                
                // No errors, continue to controller
                console.log('Files uploaded successfully, proceeding to controller');
                next();
            });
        } catch (e) {
            console.error('Exception in file upload middleware:', e);
            return res.status(500).json({
                success: false,
                error: 'Server error during file upload'
            });
        }
    },
    adminProductController.postAddProduct);

router.get('/products/edit/:id', isAdminAuthenticated, adminProductController.editProductPage);
router.get('/products/:id/edit', isAdminAuthenticated, adminProductController.editProductPage);
router.post('/products/edit/:id',
    isAdminAuthenticated,
    (req, res, next) => {
        const upload = uploadProductImages.array('images', 10);
        upload(req, res, function(err) {
            if (err) {
                return handleMulterErrors(err, req, res, next);
            }
            next();
        });
    },
    adminProductController.postEditProduct);
router.post('/products/:id/edit',
    isAdminAuthenticated,
    (req, res, next) => {
        const upload = uploadProductImages.array('images', 10);
        upload(req, res, function(err) {
            if (err) {
                return handleMulterErrors(err, req, res, next);
            }
            next();
        });
    },
    adminProductController.postEditProduct);
router.post('/products/toggle-status/:id', isAdminAuthenticated, adminProductController.toggleProductStatus);
router.delete('/products/:id', isAdminAuthenticated, adminProductController.deleteProduct);

module.exports = router;
