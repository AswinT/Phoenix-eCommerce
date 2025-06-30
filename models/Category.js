const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    isListed: {
        type: Boolean,
        default: true
    },
    slug: {
        type: String,
        unique: true,
        sparse: true
    },
    sortOrder: {
        type: Number,
        default: 0
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Pre-save hook to generate slug
categorySchema.pre('save', function(next) {
    if (this.isModified('name') || !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    next();
});

// Index for better query performance
// Note: name already has a unique index from schema definition
categorySchema.index({ isListed: 1, isDeleted: 1 });
categorySchema.index({ sortOrder: 1 });

// Virtual for active categories
categorySchema.virtual('isActive').get(function() {
    return this.isListed && !this.isDeleted;
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
