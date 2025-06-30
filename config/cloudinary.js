const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

// Check if Cloudinary environment variables are properly set
const cloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                           process.env.CLOUDINARY_API_KEY && 
                           process.env.CLOUDINARY_API_SECRET;

if (!cloudinaryConfigured) {
    console.error('⚠️ WARNING: Cloudinary environment variables are not properly set!');
    console.error('Please ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set in your .env file');
    console.error('Falling back to local storage for development. Images will not be properly saved!');
}

// Configure Cloudinary with better error handling
try {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'default',
        api_key: process.env.CLOUDINARY_API_KEY || '123456789012345',
        api_secret: process.env.CLOUDINARY_API_SECRET || 'dummy_secret',
        secure: true // Use HTTPS
    });
    
    // Test the configuration if credentials are provided
    if (cloudinaryConfigured) {
        cloudinary.api.ping((error, result) => {
            if (error) {
                console.error('❌ Cloudinary connection test failed:', error.message);
            } else {
                console.log('✅ Cloudinary connected successfully:', result.status);
            }
        });
    }
} catch (error) {
    console.error('❌ Error configuring Cloudinary:', error.message);
}

// Fallback storage if Cloudinary isn't available
const diskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

// Choose appropriate storage based on configuration
const useCloudinaryStorage = cloudinaryConfigured;

// Storage configuration for product images
const productStorage = useCloudinaryStorage ? 
    new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'phoenix-headphones/products',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            transformation: [
                { width: 800, height: 800, crop: 'limit', quality: 'auto' },
                { format: 'webp' }
            ],
            // Add timeout option if supported
            timeout: 120000
        }
    }) : diskStorage;

// Storage configuration for category images
const categoryStorage = useCloudinaryStorage ? 
    new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'phoenix-headphones/categories',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            transformation: [
                { width: 400, height: 300, crop: 'limit', quality: 'auto' },
                { format: 'webp' }
            ],
            timeout: 60000
        }
    }) : diskStorage;

// Storage configuration for user profile images
const profileStorage = useCloudinaryStorage ? 
    new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'phoenix-headphones/profiles',
            allowed_formats: ['jpg', 'jpeg', 'png'],
            transformation: [
                { width: 200, height: 200, crop: 'fill', gravity: 'face', quality: 'auto' },
                { format: 'webp' }
            ],
            timeout: 60000
        }
    }) : diskStorage;

// Multer configurations with improved error handling
const uploadProductImages = multer({
    storage: productStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        try {
            // Check if file is an image
            const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'];
            if (allowedMimeTypes.includes(file.mimetype)) {
                console.log(`✅ File accepted: ${file.originalname} (${file.mimetype})`);
                cb(null, true);
            } else {
                console.log(`❌ File rejected: ${file.originalname} (${file.mimetype}) - Invalid format`);
                cb(new Error(`Unsupported file format: ${file.mimetype}. Only images are allowed (jpg, jpeg, png, gif, webp, bmp, svg)`), false);
            }
        } catch (error) {
            console.error('Error in file filter:', error);
            cb(new Error('Internal error processing file upload'), false);
        }
    }
});

const uploadCategoryImage = multer({
    storage: categoryStorage,
    limits: {
        fileSize: 3 * 1024 * 1024 // 3MB limit
    },
    fileFilter: (req, file, cb) => {
        try {
            // Check if file is an image
            const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'];
            if (allowedMimeTypes.includes(file.mimetype)) {
                console.log(`✅ Category image accepted: ${file.originalname} (${file.mimetype})`);
                cb(null, true);
            } else {
                console.log(`❌ Category image rejected: ${file.originalname} (${file.mimetype}) - Invalid format`);
                cb(new Error(`Unsupported file format: ${file.mimetype}. Only images are allowed (jpg, jpeg, png, gif, webp, bmp, svg)`), false);
            }
        } catch (error) {
            console.error('Error in category file filter:', error);
            cb(new Error('Internal error processing category image upload'), false);
        }
    }
});

const uploadProfileImage = multer({
    storage: profileStorage,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB limit
    },
    fileFilter: (req, file, cb) => {
        try {
            // Check if file is an image
            const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
            if (allowedMimeTypes.includes(file.mimetype)) {
                console.log(`✅ Profile image accepted: ${file.originalname} (${file.mimetype})`);
                cb(null, true);
            } else {
                console.log(`❌ Profile image rejected: ${file.originalname} (${file.mimetype}) - Invalid format`);
                cb(new Error(`Unsupported file format: ${file.mimetype}. Only images are allowed (jpg, jpeg, png, gif, webp, bmp)`), false);
            }
        } catch (error) {
            console.error('Error in profile file filter:', error);
            cb(new Error('Internal error processing profile image upload'), false);
        }
    }
});

// Function to delete image from Cloudinary with better error handling
const deleteImage = async (publicId) => {
    if (!cloudinaryConfigured) {
        console.warn('⚠️ Cloudinary not configured, skipping image deletion:', publicId);
        return { result: 'skipped' };
    }
    
    try {
        console.log(`🗑️ Attempting to delete image: ${publicId}`);
        const result = await cloudinary.uploader.destroy(publicId);
        console.log(`✅ Image deletion result:`, result);
        return result;
    } catch (error) {
        console.error(`❌ Error deleting image from Cloudinary (${publicId}):`, error);
        return null;
    }
};

// Function to extract public ID from Cloudinary URL
const extractPublicId = (url) => {
    try {
        if (!url || !url.includes('cloudinary')) {
            // Handle local file paths differently
            if (url && url.startsWith('/uploads/')) {
                return url;
            }
            console.warn('⚠️ Not a Cloudinary URL or no URL provided:', url);
            return null;
        }
        
        const parts = url.split('/');
        const filename = parts[parts.length - 1];
        const publicId = filename.split('.')[0];
        const folder = parts[parts.length - 2];
        return `phoenix-headphones/${folder}/${publicId}`;
    } catch (error) {
        console.error('❌ Error extracting public ID:', error);
        return null;
    }
};

module.exports = {
    cloudinary,
    uploadProductImages,
    uploadCategoryImage,
    uploadProfileImage,
    deleteImage,
    extractPublicId
};
