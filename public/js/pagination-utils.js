/**
 * Enhanced Pagination Utilities with Loading States and Error Handling
 */

class PaginationManager {
    constructor(options = {}) {
        this.container = options.container || document.body;
        this.loadingClass = options.loadingClass || 'pagination-loading';
        this.errorClass = options.errorClass || 'pagination-error';
        this.onPageChange = options.onPageChange || (() => {});
        this.onError = options.onError || this.defaultErrorHandler.bind(this);
        this.currentPage = 1;
        this.isLoading = false;
    }

    /**
     * Show loading state for pagination
     */
    showLoading() {
        this.isLoading = true;
        this.container.classList.add(this.loadingClass);
        
        // Disable all pagination links
        const paginationLinks = this.container.querySelectorAll('.pagination .page-link');
        paginationLinks.forEach(link => {
            link.style.pointerEvents = 'none';
            link.style.opacity = '0.6';
        });

        // Add loading spinner if not exists
        if (!this.container.querySelector('.pagination-spinner')) {
            const spinner = this.createSpinner();
            const paginationContainer = this.container.querySelector('.pagination-container');
            if (paginationContainer) {
                paginationContainer.appendChild(spinner);
            }
        }
    }

    /**
     * Hide loading state for pagination
     */
    hideLoading() {
        this.isLoading = false;
        this.container.classList.remove(this.loadingClass);
        
        // Re-enable all pagination links
        const paginationLinks = this.container.querySelectorAll('.pagination .page-link');
        paginationLinks.forEach(link => {
            link.style.pointerEvents = '';
            link.style.opacity = '';
        });

        // Remove loading spinner
        const spinner = this.container.querySelector('.pagination-spinner');
        if (spinner) {
            spinner.remove();
        }
    }

    /**
     * Show error state for pagination
     */
    showError(message = 'Error loading page') {
        this.hideLoading();
        this.container.classList.add(this.errorClass);
        
        // Show error message
        const errorElement = this.createErrorMessage(message);
        const paginationContainer = this.container.querySelector('.pagination-container');
        if (paginationContainer) {
            paginationContainer.appendChild(errorElement);
        }
    }

    /**
     * Hide error state for pagination
     */
    hideError() {
        this.container.classList.remove(this.errorClass);
        const errorElement = this.container.querySelector('.pagination-error-message');
        if (errorElement) {
            errorElement.remove();
        }
    }

    /**
     * Navigate to a specific page with loading and error handling
     */
    async navigateToPage(page, additionalParams = {}) {
        if (this.isLoading) return;

        try {
            this.hideError();
            this.showLoading();
            
            const result = await this.onPageChange(page, additionalParams);
            this.currentPage = page;
            
            this.hideLoading();
            return result;
        } catch (error) {
            this.hideLoading();
            this.onError(error);
            throw error;
        }
    }

    /**
     * Create loading spinner element
     */
    createSpinner() {
        const spinner = document.createElement('div');
        spinner.className = 'pagination-spinner';
        spinner.innerHTML = `
            <div class="spinner-icon"></div>
            <span class="spinner-text">Loading...</span>
        `;
        return spinner;
    }

    /**
     * Create error message element
     */
    createErrorMessage(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'pagination-error-message';
        errorElement.innerHTML = `
            <div class="error-icon">
                <span class="material-icons">error_outline</span>
            </div>
            <span class="error-text">${message}</span>
            <button class="retry-btn" onclick="this.parentElement.remove()">
                <span class="material-icons">refresh</span>
                Retry
            </button>
        `;
        return errorElement;
    }

    /**
     * Default error handler
     */
    defaultErrorHandler(error) {
        console.error('Pagination error:', error);
        const message = error.message || 'Failed to load page. Please try again.';
        this.showError(message);
    }

    /**
     * Initialize pagination event listeners
     */
    initializePaginationLinks() {
        const paginationContainer = this.container.querySelector('.pagination-container');
        if (!paginationContainer) return;

        // Add click handlers to pagination links
        paginationContainer.addEventListener('click', async (e) => {
            const pageLink = e.target.closest('.page-link');
            if (!pageLink || pageLink.classList.contains('disabled') || this.isLoading) {
                e.preventDefault();
                return;
            }

            // Extract page number from href or data attribute
            const href = pageLink.getAttribute('href');
            if (href && href !== '#') {
                e.preventDefault();
                const url = new URL(href, window.location.origin);
                const page = parseInt(url.searchParams.get('page')) || 1;
                await this.navigateToPage(page);
            }
        });
    }

    /**
     * Update pagination display after successful navigation
     */
    updatePaginationDisplay(paginationData) {
        const paginationContainer = this.container.querySelector('.pagination-container');
        if (!paginationContainer || !paginationData) return;

        // Update pagination info
        const paginationInfo = paginationContainer.querySelector('.pagination-info .pagination-text');
        if (paginationInfo && paginationData.startItem && paginationData.endItem && paginationData.totalItems) {
            paginationInfo.textContent = `Showing ${paginationData.startItem} to ${paginationData.endItem} of ${paginationData.totalItems} results`;
        }

        // Update active page
        const pageItems = paginationContainer.querySelectorAll('.page-item');
        pageItems.forEach(item => {
            item.classList.remove('active');
            const link = item.querySelector('.page-link');
            if (link && !link.classList.contains('disabled')) {
                const href = link.getAttribute('href');
                if (href) {
                    const url = new URL(href, window.location.origin);
                    const page = parseInt(url.searchParams.get('page')) || 1;
                    if (page === this.currentPage) {
                        item.classList.add('active');
                    }
                }
            }
        });
    }
}

/**
 * Enhanced form submission with pagination support
 */
class PaginationForm {
    constructor(formSelector, paginationManager) {
        this.form = document.querySelector(formSelector);
        this.paginationManager = paginationManager;
        this.init();
    }

    init() {
        if (!this.form) return;

        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                // Reset to page 1 when submitting form
                await this.paginationManager.navigateToPage(1, this.getFormData());
            } catch (error) {
                console.error('Form submission error:', error);
            }
        });
    }

    getFormData() {
        const formData = new FormData(this.form);
        const params = {};
        for (const [key, value] of formData.entries()) {
            if (value.trim()) {
                params[key] = value;
            }
        }
        return params;
    }
}

/**
 * Utility function to create a pagination manager for a specific container
 */
function createPaginationManager(containerSelector, options = {}) {
    const container = document.querySelector(containerSelector);
    if (!container) {
        console.warn(`Pagination container not found: ${containerSelector}`);
        return null;
    }

    const manager = new PaginationManager({
        container,
        ...options
    });

    manager.initializePaginationLinks();
    return manager;
}

/**
 * Global pagination utilities
 */
window.PaginationUtils = {
    PaginationManager,
    PaginationForm,
    createPaginationManager
};

// Auto-initialize pagination managers for common containers
document.addEventListener('DOMContentLoaded', () => {
    // Add loading and error styles if not already present
    if (!document.querySelector('#pagination-utils-styles')) {
        const styles = document.createElement('style');
        styles.id = 'pagination-utils-styles';
        styles.textContent = `
            .pagination-loading {
                position: relative;
            }

            .pagination-spinner {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                padding: 1rem;
                color: var(--color-gray-600, #6b7280);
                font-size: 0.875rem;
            }

            .spinner-icon {
                width: 16px;
                height: 16px;
                border: 2px solid var(--color-gray-300, #d1d5db);
                border-top-color: var(--color-primary, #3b82f6);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            .pagination-error-message {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                padding: 1rem;
                background: var(--color-red-50, #fef2f2);
                border: 1px solid var(--color-red-200, #fecaca);
                border-radius: 0.375rem;
                color: var(--color-red-700, #b91c1c);
                font-size: 0.875rem;
                margin-top: 1rem;
            }

            .error-icon .material-icons {
                font-size: 18px;
                color: var(--color-red-500, #ef4444);
            }

            .retry-btn {
                display: flex;
                align-items: center;
                gap: 0.25rem;
                padding: 0.25rem 0.5rem;
                background: var(--color-red-100, #fee2e2);
                border: 1px solid var(--color-red-300, #fca5a5);
                border-radius: 0.25rem;
                color: var(--color-red-700, #b91c1c);
                font-size: 0.75rem;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .retry-btn:hover {
                background: var(--color-red-200, #fecaca);
            }

            .retry-btn .material-icons {
                font-size: 14px;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(styles);
    }
});
