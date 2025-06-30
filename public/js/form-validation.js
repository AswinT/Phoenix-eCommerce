/**
 * Comprehensive Form Validation System
 * Replaces HTML5 required attributes with custom JavaScript validation
 */

class FormValidator {
    constructor(formElement, options = {}) {
        this.form = formElement;
        this.options = {
            validateOnBlur: true,
            validateOnInput: true,
            showSuccessStates: false,
            errorClass: 'field-error',
            successClass: 'field-success',
            invalidClass: 'is-invalid',
            validClass: 'is-valid',
            ...options
        };
        
        this.validators = {};
        this.errorMessages = {};
        this.isValid = true;
        
        this.init();
    }

    init() {
        // Add novalidate to form to disable browser validation
        this.form.setAttribute('novalidate', '');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize error containers
        this.initializeErrorContainers();
    }

    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => {
            if (!this.validateForm()) {
                e.preventDefault();
                this.focusFirstError();
            }
        });

        // Field validation on blur and input
        const fields = this.form.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            if (this.options.validateOnBlur) {
                field.addEventListener('blur', () => this.validateField(field));
            }
            
            if (this.options.validateOnInput) {
                field.addEventListener('input', () => {
                    // Clear error on input if field was previously invalid
                    if (field.classList.contains(this.options.invalidClass)) {
                        this.clearFieldError(field);
                        this.validateField(field);
                    }
                });
            }
        });
    }

    initializeErrorContainers() {
        const fields = this.form.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            const errorContainer = this.getErrorContainer(field);
            if (!errorContainer) {
                this.createErrorContainer(field);
            }
        });
    }

    createErrorContainer(field) {
        const errorDiv = document.createElement('div');
        errorDiv.id = `${field.id || field.name}-error`;
        errorDiv.className = this.options.errorClass;
        errorDiv.setAttribute('role', 'alert');
        errorDiv.setAttribute('aria-live', 'polite');
        errorDiv.style.display = 'none';
        
        // Insert after the field or its wrapper
        const wrapper = field.closest('.form-group, .input-wrapper, .form-input-group') || field.parentNode;
        wrapper.insertAdjacentElement('afterend', errorDiv);
        
        return errorDiv;
    }

    getErrorContainer(field) {
        return document.getElementById(`${field.id || field.name}-error`);
    }

    // Validation Rules
    addValidator(fieldName, validator, message) {
        if (!this.validators[fieldName]) {
            this.validators[fieldName] = [];
        }
        this.validators[fieldName].push({ validator, message });
    }

    // Built-in validators
    static validators = {
        required: (value) => value && value.toString().trim() !== '',
        
        email: (value) => {
            // Email addresses should only contain: A-Z, a-z, 0-9, underscore (_), period (.), and @ symbol
            const emailRegex = /^[A-Za-z0-9_.]+@[A-Za-z0-9_.]+\.[A-Za-z0-9_.]{2,}$/;
            return !value || emailRegex.test(value);
        },
        
        minLength: (min) => (value) => !value || value.length >= min,
        
        maxLength: (max) => (value) => !value || value.length <= max,
        
        pattern: (regex) => (value) => !value || regex.test(value),
        
        number: (value) => !value || !isNaN(value),
        
        min: (min) => (value) => !value || parseFloat(value) >= min,
        
        max: (max) => (value) => !value || parseFloat(value) <= max,
        
        phone: (value) => {
            // Phone numbers must be 10 digits and start with 6, 7, 8, or 9
            const phoneRegex = /^[6-9][0-9]{9}$/;
            return !value || phoneRegex.test(value.replace(/\s/g, ''));
        },
        
        url: (value) => {
            try {
                return !value || new URL(value);
            } catch {
                return false;
            }
        },
        
        passwordStrength: (value) => {
            if (!value) return true;
            return value.length >= 8 && 
                   /[A-Z]/.test(value) && 
                   /[a-z]/.test(value) && 
                   /[0-9]/.test(value) && 
                   /[#!@$%^&*(),.?":{}|<>]/.test(value);
        },
        
        match: (targetFieldName) => (value, form) => {
            const targetField = form.querySelector(`[name="${targetFieldName}"]`);
            return !value || !targetField || value === targetField.value;
        }
    };

    // Error messages
    static messages = {
        required: 'This field is required',
        email: 'Email must contain only letters, numbers, underscore, period, and @ symbol',
        minLength: (min) => `Must be at least ${min} characters long`,
        maxLength: (max) => `Must be no more than ${max} characters long`,
        pattern: 'Please enter a valid format',
        number: 'Please enter a valid number',
        min: (min) => `Must be at least ${min}`,
        max: (max) => `Must be no more than ${max}`,
        phone: 'Phone number must be 10 digits and start with 6, 7, 8, or 9',
        url: 'Please enter a valid URL',
        passwordStrength: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
        match: 'Fields do not match'
    };

    validateField(field) {
        const fieldName = field.name || field.id;
        const value = field.value;
        const validators = this.validators[fieldName] || [];
        
        // Clear previous state
        this.clearFieldError(field);
        
        // Run validators
        for (const { validator, message } of validators) {
            if (!validator(value, this.form)) {
                this.showFieldError(field, message);
                return false;
            }
        }
        
        // Show success state if enabled
        if (this.options.showSuccessStates && value) {
            this.showFieldSuccess(field);
        }
        
        return true;
    }

    validateForm() {
        const fields = this.form.querySelectorAll('input, select, textarea');
        let isFormValid = true;
        
        fields.forEach(field => {
            if (!this.validateField(field)) {
                isFormValid = false;
            }
        });
        
        this.isValid = isFormValid;
        return isFormValid;
    }

    showFieldError(field, message) {
        const errorContainer = this.getErrorContainer(field);
        if (errorContainer) {
            errorContainer.textContent = message;
            errorContainer.style.display = 'block';
            errorContainer.style.color = '#ef4444';
            errorContainer.style.fontSize = '0.875rem';
            errorContainer.style.marginTop = '0.25rem';
        }
        
        field.classList.add(this.options.invalidClass);
        field.classList.remove(this.options.validClass);
        field.setAttribute('aria-invalid', 'true');
        field.setAttribute('aria-describedby', errorContainer?.id || '');
    }

    showFieldSuccess(field) {
        field.classList.add(this.options.validClass);
        field.classList.remove(this.options.invalidClass);
        field.setAttribute('aria-invalid', 'false');
    }

    clearFieldError(field) {
        const errorContainer = this.getErrorContainer(field);
        if (errorContainer) {
            errorContainer.textContent = '';
            errorContainer.style.display = 'none';
        }
        
        field.classList.remove(this.options.invalidClass, this.options.validClass);
        field.removeAttribute('aria-invalid');
        field.removeAttribute('aria-describedby');
    }

    focusFirstError() {
        const firstErrorField = this.form.querySelector(`.${this.options.invalidClass}`);
        if (firstErrorField) {
            firstErrorField.focus();
            firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // Utility methods for common validation setups
    setupRequiredField(fieldName, customMessage) {
        this.addValidator(fieldName, FormValidator.validators.required, 
            customMessage || FormValidator.messages.required);
    }

    setupEmailField(fieldName, customMessage) {
        this.addValidator(fieldName, FormValidator.validators.email, 
            customMessage || FormValidator.messages.email);
    }

    setupPasswordField(fieldName, minLength = 8, requireStrength = false) {
        this.addValidator(fieldName, FormValidator.validators.minLength(minLength), 
            FormValidator.messages.minLength(minLength));
        
        if (requireStrength) {
            this.addValidator(fieldName, FormValidator.validators.passwordStrength, 
                FormValidator.messages.passwordStrength);
        }
    }

    setupMatchField(fieldName, targetFieldName, customMessage) {
        this.addValidator(fieldName, FormValidator.validators.match(targetFieldName), 
            customMessage || FormValidator.messages.match);
    }

    setupNumberField(fieldName, min, max) {
        this.addValidator(fieldName, FormValidator.validators.number, 
            FormValidator.messages.number);
        
        if (min !== undefined) {
            this.addValidator(fieldName, FormValidator.validators.min(min), 
                FormValidator.messages.min(min));
        }
        
        if (max !== undefined) {
            this.addValidator(fieldName, FormValidator.validators.max(max), 
                FormValidator.messages.max(max));
        }
    }
}

// Auto-initialize forms with data-validate attribute
document.addEventListener('DOMContentLoaded', function() {
    const forms = document.querySelectorAll('form[data-validate]');
    forms.forEach(form => {
        new FormValidator(form);
    });
});
// Export for manual initialization
window.FormValidator = FormValidator;

