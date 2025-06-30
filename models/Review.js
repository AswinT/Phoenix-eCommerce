const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    comment: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    isVerifiedPurchase: {
        type: Boolean,
        default: false
    },
    helpfulVotes: {
        type: Number,
        default: 0
    },
    votedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    moderatorNotes: {
        type: String,
        default: null
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for better query performance
reviewSchema.index({ product: 1, status: 1, isDeleted: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ createdAt: -1 });

// Compound index for product reviews with status
reviewSchema.index({ product: 1, status: 1, createdAt: -1 });

// Virtual for checking if review is active
reviewSchema.virtual('isActive').get(function() {
    return this.status === 'approved' && !this.isDeleted;
});

// Static method to calculate product rating statistics
reviewSchema.statics.calculateProductRating = async function(productId) {
    try {
        const stats = await this.aggregate([
            {
                $match: {
                    product: new mongoose.Types.ObjectId(productId),
                    status: 'approved',
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 },
                    ratingBreakdown: {
                        $push: '$rating'
                    }
                }
            }
        ]);

        if (stats.length === 0) {
            return {
                average: 0,
                count: 0,
                breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            };
        }

        const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        stats[0].ratingBreakdown.forEach(rating => {
            breakdown[rating]++;
        });

        return {
            average: Math.round(stats[0].averageRating * 10) / 10,
            count: stats[0].totalReviews,
            breakdown: breakdown
        };
    } catch (error) {
        console.error('Error calculating product rating:', error);
        return {
            average: 0,
            count: 0,
            breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
    }
};

// Instance method to check if user can vote on this review
reviewSchema.methods.canUserVote = function(userId) {
    return !this.votedUsers.includes(userId);
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
