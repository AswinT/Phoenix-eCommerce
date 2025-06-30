// Validation utility functions

const validateEmail = (email) => {
    // Email addresses should only contain: A-Z, a-z, 0-9, underscore (_), period (.), and @ symbol
    const emailRegex = /^[A-Za-z0-9_.]+@[A-Za-z0-9_.]+\.[A-Za-z0-9_.]{2,}$/;
    return emailRegex.test(email);
};

const validateMobile = (mobile) => {
    // Phone numbers must be 10 digits and start with 6, 7, 8, or 9
    const mobileRegex = /^[6-9][0-9]{9}$/;
    return mobileRegex.test(mobile);
};

const validatePassword = (password) => {
    // At least 8 characters, uppercase, lowercase, number, special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#@$!%*?&])[A-Za-z\d#@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};

const validateName = (name) => {
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    return nameRegex.test(name.trim());
};

const validatePrice = (price) => {
    return !isNaN(price) && parseFloat(price) > 0;
};

const validateStock = (stock) => {
    return !isNaN(stock) && parseInt(stock) >= 0;
};

const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input.trim()
        .replace(/[<>]/g, '')
        .replace(/['"]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .replace(/script/gi, '');
};

const validateProductData = (data) => {
    const errors = {};

    if (!data.name || data.name.trim().length < 2) {
        errors.name = 'Product name must be at least 2 characters long';
    }

    if (!data.description || data.description.trim().length < 10) {
        errors.description = 'Description must be at least 10 characters long';
    }

    if (!data.category) {
        errors.category = 'Category is required';
    }

    if (!data.brand || data.brand.trim().length < 2) {
        errors.brand = 'Brand name must be at least 2 characters long';
    }

    if (!data.modelNumber || data.modelNumber.trim().length < 2) {
        errors.modelNumber = 'Model number must be at least 2 characters long';
    }

    // Technical specifications are required but can have default values
    if (!data.driverSize) {
        errors.driverSize = 'Driver size is required';
    }
    
    if (!data.connectivity) {
        errors.connectivity = 'Connectivity is required';
    }
    
    if (!data.color) {
        errors.color = 'Color is required';
    }

    if (!validatePrice(data.regularPrice)) {
        errors.regularPrice = 'Regular price must be a valid positive number';
    }

    if (!validatePrice(data.salePrice)) {
        errors.salePrice = 'Sale price must be a valid positive number';
    }

    if (data.regularPrice && data.salePrice && parseFloat(data.salePrice) > parseFloat(data.regularPrice)) {
        errors.salePrice = 'Sale price cannot be higher than regular price';
    }

    if (!validateStock(data.stock)) {
        errors.stock = 'Stock must be a valid non-negative number';
    }

    return errors;
};

const validateCategoryData = ({ name, description }) => {
    const errors = {};

    // Validate name
    if (!name || name.trim().length < 2 || name.trim().length > 50) {
        errors.name = 'Category name must be between 2 and 50 characters';
    }

    // Validate description
    if (!description || description.trim().length === 0 || description.trim().length > 500) {
        errors.description = 'Description must not be empty and less than 500 characters';
    }

    return errors;
};

const validateUserData = (data) => {
    const errors = {};

    if (!data.fullname || !validateName(data.fullname)) {
        errors.fullname = 'Full name must be 2-50 characters long and contain only letters and spaces';
    }

    if (!data.email || !validateEmail(data.email)) {
        errors.email = 'Email must contain only letters, numbers, underscore, period, and @ symbol';
    }

    if (data.mobile && !validateMobile(data.mobile)) {
        errors.mobile = 'Mobile number must be 10 digits and start with 6, 7, 8, or 9';
    }

    if (data.password && !validatePassword(data.password)) {
        errors.password = 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character';
    }

    if (data.confirmPassword && data.password !== data.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
};

module.exports = {
    validateEmail,
    validateMobile,
    validatePassword,
    validateName,
    validatePrice,
    validateStock,
    sanitizeInput,
    validateProductData,
    validateCategoryData,
    validateUserData
};
