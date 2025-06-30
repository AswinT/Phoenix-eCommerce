/**
 * Pagination utility functions for consistent pagination across the application
 */

/**
 * Default page sizes for different page types
 */
const DEFAULT_PAGE_SIZES = {
    ADMIN_USERS: 15,
    ADMIN_PRODUCTS: 20,
    ADMIN_CATEGORIES: 15,
    ADMIN_ORDERS: 20,
    USER_PRODUCTS: 12,
    USER_WISHLIST: 24,
    USER_ORDERS: 10,
    HOMEPAGE_FEATURED: 8,
    REVIEWS: 10,
    SEARCH_RESULTS: 16
};

/**
 * Maximum allowed page size to prevent performance issues
 */
const MAX_PAGE_SIZE = 100;

/**
 * Validates and normalizes pagination parameters
 * @param {Object} query - Request query parameters
 * @param {string} pageType - Type of page (e.g., 'ADMIN_USERS', 'USER_PRODUCTS')
 * @returns {Object} Normalized pagination parameters
 */
const validatePaginationParams = (query = {}, pageType = 'USER_PRODUCTS') => {
    // Parse and validate page number
    let page = parseInt(query.page) || 1;
    if (page < 1) page = 1;

    // Parse and validate limit with defaults based on page type
    let limit = parseInt(query.limit) || DEFAULT_PAGE_SIZES[pageType] || DEFAULT_PAGE_SIZES.USER_PRODUCTS;
    if (limit < 1) limit = DEFAULT_PAGE_SIZES[pageType] || DEFAULT_PAGE_SIZES.USER_PRODUCTS;
    if (limit > MAX_PAGE_SIZE) limit = MAX_PAGE_SIZE;

    // Calculate skip value
    const skip = (page - 1) * limit;

    return {
        page,
        limit,
        skip,
        pageType
    };
};

/**
 * Calculates pagination metadata
 * @param {number} totalItems - Total number of items
 * @param {number} currentPage - Current page number
 * @param {number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
const calculatePaginationMeta = (totalItems, currentPage, limit) => {
    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;
    const nextPage = hasNextPage ? currentPage + 1 : null;
    const prevPage = hasPrevPage ? currentPage - 1 : null;
    
    // Calculate item range for current page
    const startItem = totalItems > 0 ? ((currentPage - 1) * limit) + 1 : 0;
    const endItem = Math.min(currentPage * limit, totalItems);

    return {
        currentPage,
        totalPages,
        totalItems,
        limit,
        hasNextPage,
        hasPrevPage,
        nextPage,
        prevPage,
        startItem,
        endItem
    };
};

/**
 * Creates a complete pagination object for use in views
 * @param {Object} query - Request query parameters
 * @param {number} totalItems - Total number of items
 * @param {string} pageType - Type of page
 * @returns {Object} Complete pagination object
 */
const createPagination = (query, totalItems, pageType = 'USER_PRODUCTS') => {
    const params = validatePaginationParams(query, pageType);
    const meta = calculatePaginationMeta(totalItems, params.page, params.limit);
    
    return {
        ...params,
        ...meta
    };
};

/**
 * Builds query parameters object for pagination links
 * @param {Object} query - Original request query
 * @param {Array} preserveParams - Parameters to preserve in pagination links
 * @returns {Object} Query parameters object
 */
const buildQueryParams = (query = {}, preserveParams = []) => {
    const params = {};
    
    // Default parameters to preserve
    const defaultPreserve = ['search', 'category', 'brand', 'sort', 'status', 'minPrice', 'maxPrice'];
    const allPreserve = [...defaultPreserve, ...preserveParams];
    
    allPreserve.forEach(param => {
        if (query[param] && query[param] !== '' && query[param] !== 'all') {
            params[param] = query[param];
        }
    });
    
    return params;
};

/**
 * Applies pagination to a Mongoose query
 * @param {Object} mongooseQuery - Mongoose query object
 * @param {Object} paginationParams - Pagination parameters from validatePaginationParams
 * @returns {Object} Modified query object
 */
const applyPaginationToQuery = (mongooseQuery, paginationParams) => {
    return mongooseQuery
        .skip(paginationParams.skip)
        .limit(paginationParams.limit);
};

/**
 * Creates pagination data for API responses
 * @param {Object} query - Request query parameters
 * @param {number} totalItems - Total number of items
 * @param {Array} items - Current page items
 * @param {string} pageType - Type of page
 * @returns {Object} API pagination response
 */
const createApiPaginationResponse = (query, totalItems, items, pageType = 'USER_PRODUCTS') => {
    const pagination = createPagination(query, totalItems, pageType);
    
    return {
        data: items,
        pagination: {
            currentPage: pagination.currentPage,
            totalPages: pagination.totalPages,
            totalItems: pagination.totalItems,
            itemsPerPage: pagination.limit,
            hasNextPage: pagination.hasNextPage,
            hasPrevPage: pagination.hasPrevPage,
            startItem: pagination.startItem,
            endItem: pagination.endItem
        }
    };
};

/**
 * Validates that a page number is within valid range
 * @param {number} page - Page number to validate
 * @param {number} totalPages - Total number of pages
 * @returns {number} Valid page number
 */
const validatePageRange = (page, totalPages) => {
    if (page < 1) return 1;
    if (page > totalPages && totalPages > 0) return totalPages;
    return page;
};

/**
 * Gets pagination configuration for a specific page type
 * @param {string} pageType - Type of page
 * @returns {Object} Pagination configuration
 */
const getPaginationConfig = (pageType) => {
    return {
        defaultLimit: DEFAULT_PAGE_SIZES[pageType] || DEFAULT_PAGE_SIZES.USER_PRODUCTS,
        maxLimit: MAX_PAGE_SIZE,
        pageType
    };
};

module.exports = {
    DEFAULT_PAGE_SIZES,
    MAX_PAGE_SIZE,
    validatePaginationParams,
    calculatePaginationMeta,
    createPagination,
    buildQueryParams,
    applyPaginationToQuery,
    createApiPaginationResponse,
    validatePageRange,
    getPaginationConfig
};
