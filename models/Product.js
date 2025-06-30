const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 200
    },
    modelNumber: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    category: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    color: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    brand: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    driverSize: {
        type: String,
        required: true,
        trim: true,
        maxlength: 20
    },
    connectivity: {
        type: String,
        required: true,
        enum: ['Wired', 'Wireless', 'Both'],
        default: 'Wireless'
    },
    noiseCancellation: {
        type: Boolean,
        default: false
    },
    microphoneIncluded: {
        type: Boolean,
        default: true
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    regularPrice: {
        type: Number,
        required: true,
        min: 0
    },
    salePrice: {
        type: Number,
        required: true,
        min: 0
    },
    warranty: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50,
        default: '1 Year'
    },
    images: [{
        url: {
            type: String,
            required: true
        },
        isMain: {
            type: Boolean,
            default: false
        },
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            default: () => new mongoose.Types.ObjectId()
        }
    }],
    isExisting: {
        type: Boolean,
        default: true
    },
    // Legacy compatibility fields
    isListed: {
        type: Boolean,
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    offer: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    ratings: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        count: {
            type: Number,
            default: 0
        }
    },
    tags: [{
        type: String,
        trim: true
    }]
}, {
    timestamps: true
});

// Index for better query performance
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ categoryId: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ modelNumber: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isListed: 1, isDeleted: 1 });
productSchema.index({ regularPrice: 1 });
productSchema.index({ salePrice: 1 });
productSchema.index({ 'ratings.average': -1 });
productSchema.index({ connectivity: 1 });
productSchema.index({ noiseCancellation: 1 });

// Virtual for checking if product is available
productSchema.virtual('isAvailable').get(function() {
    return this.isActive && this.isListed && !this.isDeleted && this.stock > 0;
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
    if (this.regularPrice > this.salePrice) {
        return Math.round(((this.regularPrice - this.salePrice) / this.regularPrice) * 100);
    }
    return 0;
});

// Virtual for main image
productSchema.virtual('mainImage').get(function() {
    const mainImg = this.images.find(img => img.isMain);
    return mainImg ? mainImg.url : (this.images.length > 0 ? this.images[0].url : null);
});

// Virtual for additional images
productSchema.virtual('additionalImages').get(function() {
    return this.images.filter(img => !img.isMain).map(img => img.url);
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
