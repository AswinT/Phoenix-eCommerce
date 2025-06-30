const Review = require('../../models/Review');
const Product = require('../../models/Product');
const User = require('../../models/User');

// Get reviews for a product
const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sort || 'newest'; // newest, oldest, highest, lowest, helpful
        
        // Validate product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Build sort criteria
        let sortCriteria = {};
        switch (sortBy) {
            case 'oldest':
                sortCriteria = { createdAt: 1 };
                break;
            case 'highest':
                sortCriteria = { rating: -1, createdAt: -1 };
                break;
            case 'lowest':
                sortCriteria = { rating: 1, createdAt: -1 };
                break;
            case 'helpful':
                sortCriteria = { helpfulVotes: -1, createdAt: -1 };
                break;
            default: // newest
                sortCriteria = { createdAt: -1 };
        }

        // Get reviews with pagination
        const reviews = await Review.find({
            product: productId,
            status: 'approved',
            isDeleted: false
        })
        .populate('user', 'fullname profileImage')
        .sort(sortCriteria)
        .limit(limit)
        .skip((page - 1) * limit);

        // Get total count for pagination
        const totalReviews = await Review.countDocuments({
            product: productId,
            status: 'approved',
            isDeleted: false
        });

        // Calculate rating statistics
        const ratingStats = await Review.calculateProductRating(productId);

        res.json({
            success: true,
            data: {
                reviews,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalReviews / limit),
                    totalReviews,
                    hasNext: page < Math.ceil(totalReviews / limit),
                    hasPrev: page > 1
                },
                ratingStats
            }
        });

    } catch (error) {
        console.error('Error fetching product reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reviews'
        });
    }
};

// Submit a new review
const submitReview = async (req, res) => {
    try {
        const { productId } = req.params;
        const { rating, title, comment } = req.body;
        const userId = req.user._id;

        // Validate input
        if (!rating || !title || !comment) {
            return res.status(400).json({
                success: false,
                message: 'Rating, title, and comment are required'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        // Validate product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check if user already reviewed this product
        const existingReview = await Review.findOne({
            product: productId,
            user: userId,
            isDeleted: false
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this product'
            });
        }

        // Create new review
        const review = new Review({
            product: productId,
            user: userId,
            rating: parseInt(rating),
            title: title.trim(),
            comment: comment.trim(),
            status: 'approved' // Auto-approve for now, can be changed to 'pending' for moderation
        });

        await review.save();

        // Update product rating
        const ratingStats = await Review.calculateProductRating(productId);
        await Product.findByIdAndUpdate(productId, {
            'ratings.average': ratingStats.average,
            'ratings.count': ratingStats.count
        });

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            data: review
        });

    } catch (error) {
        console.error('Error submitting review:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit review'
        });
    }
};

// Vote on review helpfulness
const voteReviewHelpful = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user._id;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check if user already voted
        if (!review.canUserVote(userId)) {
            return res.status(400).json({
                success: false,
                message: 'You have already voted on this review'
            });
        }

        // Add vote
        review.helpfulVotes += 1;
        review.votedUsers.push(userId);
        await review.save();

        res.json({
            success: true,
            message: 'Vote recorded successfully',
            data: {
                helpfulVotes: review.helpfulVotes
            }
        });

    } catch (error) {
        console.error('Error voting on review:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record vote'
        });
    }
};

// Get user's reviews
const getUserReviews = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const reviews = await Review.find({
            user: userId,
            isDeleted: false
        })
        .populate('product', 'name images')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit);

        const totalReviews = await Review.countDocuments({
            user: userId,
            isDeleted: false
        });

        res.json({
            success: true,
            data: {
                reviews,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalReviews / limit),
                    totalReviews,
                    hasNext: page < Math.ceil(totalReviews / limit),
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Error fetching user reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reviews'
        });
    }
};

module.exports = {
    getProductReviews,
    submitReview,
    voteReviewHelpful,
    getUserReviews
};
