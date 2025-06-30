const Product = require('../../models/Product');
const Category = require('../../models/Category');
const User = require('../../models/User');
const { validateProductData, sanitizeInput } = require('../../utils/validation');
const { deleteImage, extractPublicId } = require('../../config/cloudinary');
const cloudinary = require('cloudinary');

// List all products with pagination and search
const listProducts = async (req, res, next) => {
    try {
        const { createPagination, buildQueryParams } = require('../../utils/pagination');
        const searchQuery = req.query.search || '';

        // Build search filter
        let filter = { isDeleted: false };
        if (searchQuery.trim()) {
            const regex = new RegExp(sanitizeInput(searchQuery), 'i');
            filter.$or = [
                { name: regex },
                { description: regex },
                { brand: regex },
                { modelNumber: regex },
                { category: regex }
            ];
        }

        // Get total count for pagination
        const totalProducts = await Product.countDocuments(filter);

        // Create pagination object
        const pagination = createPagination(req.query, totalProducts, 'ADMIN_PRODUCTS');

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

        // Get products with pagination
        const products = await Product.find(filter)
            .populate('categoryId', 'name')
            .sort({ createdAt: -1 })
            .skip(pagination.skip)
            .limit(pagination.limit);

        // Get current admin user data
        const currentAdmin = await User.findById(req.session.admin)
            .select('fullname email avatar isAdmin');

        // Build query parameters for pagination links
        const queryParams = buildQueryParams(req.query, ['search']);

        // Check if this is an AJAX request
        const isAjax = req.headers['x-requested-with'] === 'XMLHttpRequest';

        const renderData = {
            products,
            currentPage: pagination.currentPage,
            totalPages: pagination.totalPages,
            totalProducts: pagination.totalItems,
            pageNumbers,
            searchQuery,
            hasNextPage: pagination.hasNextPage,
            hasPrevPage: pagination.hasPrevPage,
            nextPage: pagination.nextPage,
            prevPage: pagination.prevPage,
            pagination,
            baseUrl: '/admin/products',
            queryParams,
            user: currentAdmin,
            activePage: 'products',
            additionalCSS: ['/css/admin.css', '/css/pagination.css'],
            layout: false
        };

        if (isAjax) {
            // For AJAX requests, return just the products section
            res.render('admin/products', renderData);
        } else {
            // For regular requests, return the full page
            res.render('admin/products', renderData);
        }

    } catch (error) {
        console.error('Error listing products:', error);
        next(error);
    }
};

// Add product page
const addProductPage = async (req, res, next) => {
    try {
        // Get all active categories
        const categories = await Category.find({ 
            isListed: true, 
            isDeleted: false 
        }).sort({ name: 1 });

        res.render('admin/add-product', {
            categories,
            error: null,
            success: null,
            formData: {},
            layout: false
        });
    } catch (error) {
        console.error('Error rendering add product page:', error);
        next(error);
    }
};

// Handle add product
const postAddProduct = async (req, res) => {
    try {
        // Process boolean fields properly
        const formData = {
            ...req.body,
            // Convert checkbox values to boolean
            noiseCancellation: req.body.noiseCancellation === 'on',
            microphoneIncluded: req.body.microphoneIncluded === 'on',
        };
        
        // Set default values for required fields if they're empty
        if (!formData.driverSize) formData.driverSize = 'N/A';
        if (!formData.color) formData.color = 'N/A';
        if (!formData.connectivity) formData.connectivity = 'Wireless'; // Default from schema

        // Validate form data first
        const errors = validateProductData(formData);
        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                success: false,
                error: Object.values(errors)[0] // Return the first error
            });
        }

        // Validate that at least 3 images were uploaded
        if (!req.files || req.files.length < 3) {
            return res.status(400).json({
                success: false,
                error: 'Please upload at least 3 product images'
            });
        }

        // Validate that the category exists
        const categoryDoc = await Category.findOne({
            name: formData.category,
            isListed: true,
            isDeleted: false
        });
        if (!categoryDoc) {
            return res.status(400).json({
                success: false,
                error: 'Invalid category selected'
            });
        }

        // Get the main image index
        const mainImageIndex = parseInt(formData.mainImageIndex) || 0;

        // Process the uploaded images - they should already be uploaded to Cloudinary by the multer middleware
        const imageUrls = req.files.map((file, index) => ({
            url: file.path,
            isMain: index === mainImageIndex
        }));

        // Create the product with the uploaded image URLs
        const product = new Product({
            ...formData,
            categoryId: categoryDoc._id,
            images: imageUrls
        });

        await product.save();

        res.status(201).json({
            success: true,
            message: 'Product added successfully',
            product
        });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error adding product'
        });
    }
};

// Edit product page
const editProductPage = async (req, res, next) => {
    try {
        const productId = req.params.id;
        
        // Get product
        const product = await Product.findById(productId).populate('categoryId');
        if (!product || product.isDeleted) {
            return res.redirect('/admin/products');
        }

        // Get all active categories
        const categories = await Category.find({ 
            isListed: true, 
            isDeleted: false 
        }).sort({ name: 1 });

        res.render('admin/edit-product', {
            product,
            categories,
            error: null,
            success: null,
            layout: false
        });

    } catch (error) {
        console.error('Error rendering edit product page:', error);
        next(error);
    }
};

// Handle edit product
const postEditProduct = async (req, res, next) => {
    try {
        const productId = req.params.id;

        // Process boolean fields properly (same as add product)
        const formData = {
            ...req.body,
            // Convert checkbox values to boolean
            noiseCancellation: req.body.noiseCancellation === 'on',
            microphoneIncluded: req.body.microphoneIncluded === 'on',
        };

        // Find existing product
        const product = await Product.findById(productId);
        if (!product || product.isDeleted) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // Set default values for required fields if they're empty (same as add product)
        if (!formData.driverSize) formData.driverSize = 'N/A';
        if (!formData.color) formData.color = 'N/A';
        if (!formData.connectivity) formData.connectivity = 'Wireless';

        // Validate input (same validation as add product)
        const errors = validateProductData({
            name: formData.name,
            description: formData.description,
            category: formData.category,
            brand: formData.brand,
            modelNumber: formData.modelNumber,
            regularPrice: formData.regularPrice,
            salePrice: formData.salePrice,
            stock: formData.stock,
            driverSize: formData.driverSize,
            connectivity: formData.connectivity,
            color: formData.color
        });

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                success: false,
                error: Object.values(errors)[0] // Return the first error
            });
        }

        // Find category by name to get categoryId
        const categoryDoc = await Category.findOne({
            name: formData.category,
            isListed: true,
            isDeleted: false
        });
        if (!categoryDoc) {
            return res.status(400).json({
                success: false,
                error: 'Invalid category selected'
            });
        }

        // Prepare update data (same structure as add product)
        const updateData = {
            name: sanitizeInput(formData.name),
            description: sanitizeInput(formData.description),
            category: sanitizeInput(formData.category),
            categoryId: categoryDoc._id,
            brand: sanitizeInput(formData.brand),
            modelNumber: sanitizeInput(formData.modelNumber),
            regularPrice: parseFloat(formData.regularPrice),
            salePrice: parseFloat(formData.salePrice),
            driverSize: sanitizeInput(formData.driverSize) || 'N/A',
            connectivity: formData.connectivity || 'Wireless',
            noiseCancellation: formData.noiseCancellation,
            microphoneIncluded: formData.microphoneIncluded,
            color: sanitizeInput(formData.color) || 'N/A',
            stock: parseInt(formData.stock),
            warranty: sanitizeInput(formData.warranty) || '1 Year',
            offer: formData.offer ? parseInt(formData.offer) : 0,
            tags: formData.tags ? formData.tags.split(',').map(tag => sanitizeInput(tag.trim())).filter(tag => tag) : []
        };

        // Handle images (improved logic)
        let finalImages = [];

        // Handle existing images if any
        if (formData.existingImages) {
            const existingImagesArray = Array.isArray(formData.existingImages) ? formData.existingImages : [formData.existingImages];
            const isMainImageArray = Array.isArray(formData.isMainImage) ? formData.isMainImage : [formData.isMainImage];

            finalImages = existingImagesArray.map((url, index) => ({
                url: url,
                isMain: isMainImageArray[index] === 'true'
            }));
        }

        // Handle new uploaded images if any
        if (req.files && req.files.length > 0) {
            // Get the main image index for new images
            const mainImageIndex = parseInt(formData.mainImageIndex) || 0;
            const newImages = req.files.map((file, index) => ({
                url: file.path,
                isMain: finalImages.length === 0 && index === mainImageIndex // Set main only if no existing images
            }));
            finalImages = [...finalImages, ...newImages];
        }

        // Ensure at least one image exists (same validation as add product)
        if (finalImages.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'At least one product image is required'
            });
        }

        // If no main image is set, set the first image as main
        if (!finalImages.some(img => img.isMain)) {
            finalImages[0].isMain = true;
        }

        // Update images in the product data
        updateData.images = finalImages;

        // Update product
        await Product.findByIdAndUpdate(productId, updateData);

        // Return JSON response (same as add product)
        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            productId: productId
        });

    } catch (error) {
        console.error('Error editing product:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error updating product'
        });
    }
};

// Toggle product status (active/inactive)
const toggleProductStatus = async (req, res, next) => {
    try {
        console.log('Toggle product status request:', {
            productId: req.params.id,
            body: req.body,
            method: req.method,
            url: req.url
        });

        const productId = req.params.id;
        const { isActive } = req.body;

        // Validate product ID
        if (!productId || !productId.match(/^[0-9a-fA-F]{24}$/)) {
            console.log('Invalid product ID:', productId);
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID'
            });
        }

        const product = await Product.findById(productId);
        if (!product || product.isDeleted) {
            console.log('Product not found or deleted:', productId);
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        console.log('Current product status:', {
            isActive: product.isActive,
            isListed: product.isListed,
            requestedStatus: isActive,
            requestedStatusType: typeof isActive
        });

        // Update both isActive and isListed for consistency
        // isActive controls the product's active state
        // isListed controls visibility (should match isActive for consistency)

        // Handle boolean conversion properly - form data sends strings
        let newActiveStatus;
        if (isActive !== undefined) {
            // Convert string "true"/"false" to actual boolean
            if (typeof isActive === 'string') {
                newActiveStatus = isActive.toLowerCase() === 'true';
            } else {
                newActiveStatus = Boolean(isActive);
            }
        } else {
            // If no isActive provided, toggle current status
            newActiveStatus = !product.isActive;
        }

        console.log('Boolean conversion result:', {
            originalValue: isActive,
            originalType: typeof isActive,
            convertedValue: newActiveStatus,
            convertedType: typeof newActiveStatus
        });

        product.isActive = newActiveStatus;
        product.isListed = newActiveStatus; // Keep them in sync

        await product.save();

        console.log('Product status updated successfully:', {
            productId: product._id,
            newStatus: product.isActive
        });

        const action = product.isActive ? 'activated' : 'deactivated';

        res.json({
            success: true,
            message: `Product ${action} successfully`,
            isActive: product.isActive,
            isListed: product.isListed,
            productId: product._id
        });

    } catch (error) {
        console.error('Error toggling product status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update product status. Please try again.'
        });
    }
};

// Search products (AJAX endpoint)
const searchProducts = async (req, res, next) => {
    try {
        const searchQuery = req.query.query || '';

        if (!searchQuery.trim()) {
            return res.json({ success: false, message: 'Search query is required' });
        }

        const regex = new RegExp(sanitizeInput(searchQuery), 'i');
        const products = await Product.find({
            isDeleted: false,
            $or: [
                { name: regex },
                { description: regex },
                { brand: regex },
                { modelNumber: regex },
                { category: regex }
            ]
        })
        .populate('categoryId', 'name')
        .sort({ createdAt: -1 })
        .limit(20);

        res.json({ success: true, products });

    } catch (error) {
        console.error('Error searching products:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Delete product (soft delete)
const deleteProduct = async (req, res, next) => {
    try {
        const productId = req.params.id;

        // Find the product
        const product = await Product.findById(productId);
        if (!product || product.isDeleted) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Soft delete the product
        product.isDeleted = true;
        product.isListed = false;
        product.isActive = false;
        await product.save();

        res.json({
            success: true,
            message: 'Product deleted successfully',
            productId: product._id
        });

    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete product. Please try again.'
        });
    }
};

module.exports = {
    listProducts,
    addProductPage,
    postAddProduct,
    editProductPage,
    postEditProduct,
    deleteProduct,
    toggleProductStatus,
    searchProducts
};
