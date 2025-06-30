const Category = require('../../models/Category');
const Product = require('../../models/Product');
const User = require('../../models/User');
const { validateCategoryData, sanitizeInput } = require('../../utils/validation');
const { uploadCategoryImage, deleteImage, extractPublicId } = require('../../config/cloudinary');

// List all categories with pagination and search
const listCategories = async (req, res, next) => {
    try {
        const { createPagination, buildQueryParams } = require('../../utils/pagination');
        const searchQuery = req.query.search || '';

        // Build search filter
        let filter = { isDeleted: false };
        if (searchQuery.trim()) {
            const regex = new RegExp(sanitizeInput(searchQuery), 'i');
            filter.$or = [
                { name: regex },
                { description: regex }
            ];
        }

        // Get total count for pagination
        const totalCategories = await Category.countDocuments(filter);

        // Create pagination object
        const pagination = createPagination(req.query, totalCategories, 'ADMIN_CATEGORIES');

        // Get categories with pagination
        const categories = await Category.find(filter)
            .sort({ createdAt: -1 })
            .skip(pagination.skip)
            .limit(pagination.limit);

        // Get product count for each category
        const categoriesWithProductCount = await Promise.all(
            categories.map(async (category) => {
                const productCount = await Product.countDocuments({ 
                    categoryId: category._id,
                    isDeleted: false 
                });
                return {
                    ...category.toObject(),
                    productCount
                };
            })
        );

        // Get current admin user data
        const currentAdmin = await User.findById(req.session.admin)
            .select('fullname email avatar isAdmin');

        // Build query parameters for pagination links
        const queryParams = buildQueryParams(req.query, ['search']);

        res.render('admin/categories', {
            categories: categoriesWithProductCount,
            currentPage: pagination.currentPage,
            totalPages: pagination.totalPages,
            totalCategories: pagination.totalItems,
            searchQuery,
            hasNextPage: pagination.hasNextPage,
            hasPrevPage: pagination.hasPrevPage,
            nextPage: pagination.nextPage,
            prevPage: pagination.prevPage,
            pagination,
            baseUrl: '/admin/categories',
            queryParams,
            user: currentAdmin,
            activePage: 'products',
            additionalCSS: ['/css/admin.css', '/css/pagination.css'],
            layout: false
        });

    } catch (error) {
        console.error('Error listing categories:', error);
        next(error);
    }
};

// Add category page
const addCategoryPage = async (req, res, next) => {
    try {
        res.render('admin/add-category', {
            error: null,
            success: null,
            formData: {},
            layout: false
        });
    } catch (error) {
        console.error('Error rendering add category page:', error);
        next(error);
    }
};

// Handle add category
const postAddCategory = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const formData = { name, description };

        // Validate input
        const errors = validateCategoryData({ name, description });

        if (Object.keys(errors).length > 0) {
            return res.render('admin/add-category', {
                error: Object.values(errors)[0],
                success: null,
                formData,
                layout: false
            });
        }

        // Check if category already exists
        const existingCategory = await Category.findOne({
            name: { $regex: new RegExp(`^${sanitizeInput(name)}$`, 'i') },
            isDeleted: false
        });

        if (existingCategory) {
            return res.render('admin/add-category', {
                error: 'Category with this name already exists',
                success: null,
                formData,
                layout: false
            });
        }

        // Create new category
        const categoryData = {
            name: sanitizeInput(name),
            description: sanitizeInput(description)
        };

        const newCategory = new Category(categoryData);
        await newCategory.save();

        res.render('admin/add-category', {
            error: null,
            success: 'Category added successfully!',
            formData: {},
            layout: false
        });

    } catch (error) {
        console.error('Error adding category:', error);
        next(error);
    }
};

// Edit category page
const editCategoryPage = async (req, res, next) => {
    try {
        const categoryId = req.params.id;
        const category = await Category.findById(categoryId);

        if (!category || category.isDeleted) {
            return res.redirect('/admin/categories');
        }

        // Get current admin user data
        const currentAdmin = await User.findById(req.session.admin)
            .select('fullname email avatar isAdmin');

        res.render('admin/edit-category', {
            category,
            error: null,
            success: null,
            user: currentAdmin,
            activePage: 'categories',
            layout: false
        });

    } catch (error) {
        console.error('Error rendering edit category page:', error);
        next(error);
    }
};

// Handle edit category
const postEditCategory = async (req, res, next) => {
    try {
        const categoryId = req.params.id;
        const { name, description } = req.body;

        // Find existing category
        const category = await Category.findById(categoryId);
        if (!category || category.isDeleted) {
            return res.redirect('/admin/categories');
        }

        // Validate input
        const errors = validateCategoryData({ name, description });

        if (Object.keys(errors).length > 0) {
            return res.render('admin/edit-category', {
                category: { ...category.toObject(), name, description },
                error: Object.values(errors)[0],
                success: null,
                layout: false
            });
        }

        // Check if category name already exists (excluding current category)
        const existingCategory = await Category.findOne({
            name: { $regex: new RegExp(`^${sanitizeInput(name)}$`, 'i') },
            _id: { $ne: categoryId },
            isDeleted: false
        });

        if (existingCategory) {
            return res.render('admin/edit-category', {
                category: { ...category.toObject(), name, description },
                error: 'Category with this name already exists',
                success: null,
                layout: false
            });
        }

        // Update category data
        const updateData = {
            name: sanitizeInput(name),
            description: sanitizeInput(description)
        };

        await Category.findByIdAndUpdate(categoryId, updateData);

        res.render('admin/edit-category', {
            category: { ...category.toObject(), ...updateData },
            error: null,
            success: 'Category updated successfully!',
            layout: false
        });

    } catch (error) {
        console.error('Error editing category:', error);
        next(error);
    }
};

// Toggle category status (list/unlist)
const toggleCategoryStatus = async (req, res, next) => {
    try {
        const categoryId = req.params.id;

        // Validate categoryId
        if (!categoryId) {
            return res.status(400).json({
                success: false,
                message: 'Category ID is required'
            });
        }

        // Validate ObjectId format
        if (!categoryId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID format'
            });
        }

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        if (category.isDeleted) {
            return res.status(400).json({
                success: false,
                message: 'Cannot update status of deleted category'
            });
        }

        // Toggle status
        const previousStatus = category.isListed;
        category.isListed = !category.isListed;
        await category.save();

        // Update related products
        const productUpdateResult = await Product.updateMany(
            { categoryId: categoryId, isDeleted: false },
            { isListed: category.isListed }
        );

        const action = category.isListed ? 'listed' : 'unlisted';

        console.log(`Category ${category.name} (${categoryId}) status changed from ${previousStatus} to ${category.isListed}. Updated ${productUpdateResult.modifiedCount} products.`);

        res.json({
            success: true,
            message: `Category "${category.name}" ${action} successfully`,
            isListed: category.isListed,
            categoryId: category._id,
            productsUpdated: productUpdateResult.modifiedCount
        });

    } catch (error) {
        console.error('Error toggling category status:', error);

        // Provide more specific error messages based on error type
        let errorMessage = 'Failed to update category status';
        let statusCode = 500;

        if (error.name === 'CastError') {
            errorMessage = 'Invalid category ID format';
            statusCode = 400;
        } else if (error.name === 'ValidationError') {
            errorMessage = 'Category validation failed';
            statusCode = 400;
        } else if (error.code === 11000) {
            errorMessage = 'Category update conflict';
            statusCode = 409;
        }

        res.status(statusCode).json({
            success: false,
            message: errorMessage
        });
    }
};

// Search categories (AJAX endpoint)
const searchCategories = async (req, res, next) => {
    try {
        const searchQuery = req.query.query || '';

        if (!searchQuery.trim()) {
            return res.json({ success: false, message: 'Search query is required' });
        }

        const regex = new RegExp(sanitizeInput(searchQuery), 'i');
        const categories = await Category.find({
            isDeleted: false,
            $or: [
                { name: regex },
                { description: regex }
            ]
        })
        .sort({ createdAt: -1 })
        .limit(20);

        // Get product count for each category
        const categoriesWithProductCount = await Promise.all(
            categories.map(async (category) => {
                const productCount = await Product.countDocuments({ 
                    category: category._id,
                    isDeleted: false 
                });
                return {
                    ...category.toObject(),
                    productCount
                };
            })
        );

        res.json({ success: true, categories: categoriesWithProductCount });

    } catch (error) {
        console.error('Error searching categories:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Delete category (soft delete)
const deleteCategory = async (req, res, next) => {
    try {
        const categoryId = req.params.id;

        // Find the category
        const category = await Category.findById(categoryId);
        if (!category || category.isDeleted) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Check if category has products
        const productCount = await Product.countDocuments({
            categoryId: categoryId,
            isDeleted: false
        });

        if (productCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category. It has ${productCount} product(s) associated with it. Please move or delete the products first.`
            });
        }

        // Soft delete the category
        category.isDeleted = true;
        category.isListed = false;
        await category.save();

        res.json({
            success: true,
            message: 'Category deleted successfully',
            categoryId: category._id
        });

    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete category. Please try again.'
        });
    }
};

module.exports = {
    listCategories,
    addCategoryPage,
    postAddCategory,
    editCategoryPage,
    postEditCategory,
    toggleCategoryStatus,
    deleteCategory,
    searchCategories
};
