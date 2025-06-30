/**
 * Pagination Accessibility Enhancements
 * Ensures all pagination components meet WCAG 2.1 AA standards
 */

class PaginationAccessibility {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.enhanceAllPagination();
            this.setupKeyboardNavigation();
            this.setupScreenReaderSupport();
            this.setupFocusManagement();
        });
    }

    /**
     * Enhance all pagination components on the page
     */
    enhanceAllPagination() {
        const paginationContainers = document.querySelectorAll('.pagination-container');
        paginationContainers.forEach(container => {
            this.enhancePaginationContainer(container);
        });
    }

    /**
     * Enhance a single pagination container
     */
    enhancePaginationContainer(container) {
        const nav = container.querySelector('.pagination-nav');
        const pagination = container.querySelector('.pagination');
        
        if (!nav || !pagination) return;

        // Ensure proper ARIA attributes
        this.setAriaAttributes(nav, pagination);
        
        // Enhance pagination links
        this.enhancePaginationLinks(pagination);
        
        // Add live region for announcements
        this.addLiveRegion(container);
        
        // Add skip links if needed
        this.addSkipLinks(container);
    }

    /**
     * Set proper ARIA attributes
     */
    setAriaAttributes(nav, pagination) {
        // Navigation landmark
        if (!nav.getAttribute('aria-label')) {
            nav.setAttribute('aria-label', 'Pagination Navigation');
        }
        nav.setAttribute('role', 'navigation');

        // Pagination list
        pagination.setAttribute('role', 'list');
        
        // Ensure each page item has proper role
        const pageItems = pagination.querySelectorAll('.page-item');
        pageItems.forEach(item => {
            item.setAttribute('role', 'listitem');
        });
    }

    /**
     * Enhance pagination links with accessibility features
     */
    enhancePaginationLinks(pagination) {
        const pageLinks = pagination.querySelectorAll('.page-link');
        
        pageLinks.forEach(link => {
            // Skip if it's a disabled link or current page
            if (link.classList.contains('disabled') || link.classList.contains('current')) {
                this.enhanceDisabledOrCurrentLink(link);
                return;
            }

            // Enhance active links
            this.enhanceActiveLink(link);
        });
    }

    /**
     * Enhance disabled or current page links
     */
    enhanceDisabledOrCurrentLink(link) {
        const pageItem = link.closest('.page-item');
        
        if (link.classList.contains('current') || pageItem.classList.contains('active')) {
            // Current page
            link.setAttribute('aria-current', 'page');
            link.setAttribute('aria-label', `Current page, page ${link.textContent.trim()}`);
            link.removeAttribute('href'); // Remove href to prevent navigation
            link.setAttribute('tabindex', '0'); // Keep focusable for screen readers
        } else if (link.classList.contains('disabled') || pageItem.classList.contains('disabled')) {
            // Disabled link
            link.setAttribute('aria-disabled', 'true');
            link.setAttribute('tabindex', '-1'); // Remove from tab order
            link.removeAttribute('href'); // Remove href to prevent navigation
            
            // Add appropriate aria-label
            const text = link.textContent.trim().toLowerCase();
            if (text.includes('previous')) {
                link.setAttribute('aria-label', 'Previous page (disabled)');
            } else if (text.includes('next')) {
                link.setAttribute('aria-label', 'Next page (disabled)');
            }
        }
    }

    /**
     * Enhance active pagination links
     */
    enhanceActiveLink(link) {
        const text = link.textContent.trim();
        const pageItem = link.closest('.page-item');
        
        // Ensure proper tabindex
        link.setAttribute('tabindex', '0');
        
        // Add descriptive aria-labels
        if (text.toLowerCase().includes('previous')) {
            link.setAttribute('aria-label', 'Go to previous page');
        } else if (text.toLowerCase().includes('next')) {
            link.setAttribute('aria-label', 'Go to next page');
        } else if (text.toLowerCase().includes('first')) {
            link.setAttribute('aria-label', 'Go to first page');
        } else if (text.toLowerCase().includes('last')) {
            link.setAttribute('aria-label', 'Go to last page');
        } else if (/^\d+$/.test(text)) {
            link.setAttribute('aria-label', `Go to page ${text}`);
        }

        // Add click handler for announcements
        link.addEventListener('click', (e) => {
            this.announcePageChange(link);
        });
    }

    /**
     * Setup keyboard navigation for pagination
     */
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            const activeElement = document.activeElement;
            
            // Only handle if focus is on pagination
            if (!activeElement.classList.contains('page-link')) return;
            
            const pagination = activeElement.closest('.pagination');
            if (!pagination) return;
            
            const pageLinks = Array.from(pagination.querySelectorAll('.page-link:not([aria-disabled="true"])'));
            const currentIndex = pageLinks.indexOf(activeElement);
            
            let targetIndex = -1;
            
            switch (e.key) {
                case 'ArrowLeft':
                case 'ArrowUp':
                    e.preventDefault();
                    targetIndex = Math.max(0, currentIndex - 1);
                    break;
                    
                case 'ArrowRight':
                case 'ArrowDown':
                    e.preventDefault();
                    targetIndex = Math.min(pageLinks.length - 1, currentIndex + 1);
                    break;
                    
                case 'Home':
                    e.preventDefault();
                    targetIndex = 0;
                    break;
                    
                case 'End':
                    e.preventDefault();
                    targetIndex = pageLinks.length - 1;
                    break;
                    
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    activeElement.click();
                    return;
            }
            
            if (targetIndex >= 0 && targetIndex < pageLinks.length) {
                pageLinks[targetIndex].focus();
            }
        });
    }

    /**
     * Setup screen reader support
     */
    setupScreenReaderSupport() {
        // Add instructions for screen reader users
        const paginationContainers = document.querySelectorAll('.pagination-container');
        
        paginationContainers.forEach(container => {
            const nav = container.querySelector('.pagination-nav');
            if (!nav) return;
            
            // Add screen reader instructions
            const instructions = document.createElement('div');
            instructions.className = 'sr-only';
            instructions.textContent = 'Use arrow keys to navigate between pages, Enter or Space to select a page.';
            nav.insertBefore(instructions, nav.firstChild);
        });
    }

    /**
     * Setup focus management
     */
    setupFocusManagement() {
        // Ensure focus is managed properly when pagination updates
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    const addedNodes = Array.from(mutation.addedNodes);
                    addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const paginationContainer = node.querySelector?.('.pagination-container') || 
                                                      (node.classList?.contains('pagination-container') ? node : null);
                            
                            if (paginationContainer) {
                                this.enhancePaginationContainer(paginationContainer);
                                this.manageFocusAfterUpdate(paginationContainer);
                            }
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Manage focus after pagination update
     */
    manageFocusAfterUpdate(container) {
        // If there was a focused pagination link before update, try to maintain focus
        const currentPageLink = container.querySelector('.page-link[aria-current="page"]');
        if (currentPageLink) {
            // Small delay to ensure DOM is updated
            setTimeout(() => {
                currentPageLink.focus();
            }, 100);
        }
    }

    /**
     * Add live region for announcements
     */
    addLiveRegion(container) {
        if (container.querySelector('.pagination-live-region')) return;
        
        const liveRegion = document.createElement('div');
        liveRegion.className = 'pagination-live-region sr-only';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        container.appendChild(liveRegion);
    }

    /**
     * Add skip links for better navigation
     */
    addSkipLinks(container) {
        const pagination = container.querySelector('.pagination');
        if (!pagination || container.querySelector('.pagination-skip-links')) return;
        
        const skipLinks = document.createElement('div');
        skipLinks.className = 'pagination-skip-links sr-only-focusable';
        skipLinks.innerHTML = `
            <a href="#pagination-end-${this.generateId()}" class="skip-link">
                Skip pagination
            </a>
        `;
        
        const endMarker = document.createElement('div');
        endMarker.id = skipLinks.querySelector('.skip-link').getAttribute('href').substring(1);
        endMarker.className = 'pagination-end-marker';
        endMarker.setAttribute('tabindex', '-1');
        
        container.insertBefore(skipLinks, container.firstChild);
        container.appendChild(endMarker);
    }

    /**
     * Announce page changes to screen readers
     */
    announcePageChange(link) {
        const container = link.closest('.pagination-container');
        const liveRegion = container?.querySelector('.pagination-live-region');
        
        if (!liveRegion) return;
        
        const pageText = link.textContent.trim();
        let announcement = '';
        
        if (pageText.toLowerCase().includes('previous')) {
            announcement = 'Loading previous page';
        } else if (pageText.toLowerCase().includes('next')) {
            announcement = 'Loading next page';
        } else if (/^\d+$/.test(pageText)) {
            announcement = `Loading page ${pageText}`;
        } else {
            announcement = 'Loading page';
        }
        
        liveRegion.textContent = announcement;
        
        // Clear announcement after a delay
        setTimeout(() => {
            liveRegion.textContent = '';
        }, 1000);
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
}

// Initialize accessibility enhancements
new PaginationAccessibility();

// Add CSS for screen reader only content
document.addEventListener('DOMContentLoaded', () => {
    if (!document.querySelector('#pagination-accessibility-styles')) {
        const styles = document.createElement('style');
        styles.id = 'pagination-accessibility-styles';
        styles.textContent = `
            .sr-only {
                position: absolute !important;
                width: 1px !important;
                height: 1px !important;
                padding: 0 !important;
                margin: -1px !important;
                overflow: hidden !important;
                clip: rect(0, 0, 0, 0) !important;
                white-space: nowrap !important;
                border: 0 !important;
            }

            .sr-only-focusable:focus,
            .sr-only-focusable:focus-within {
                position: static !important;
                width: auto !important;
                height: auto !important;
                padding: inherit !important;
                margin: inherit !important;
                overflow: visible !important;
                clip: auto !important;
                white-space: normal !important;
            }

            .skip-link {
                position: absolute;
                top: -40px;
                left: 6px;
                background: var(--color-primary, #3b82f6);
                color: var(--color-white, #ffffff);
                padding: 8px 16px;
                text-decoration: none;
                border-radius: 4px;
                z-index: 1000;
                transition: top 0.3s ease;
            }

            .skip-link:focus {
                top: 6px;
            }

            .pagination-end-marker {
                height: 0;
                overflow: hidden;
            }

            /* High contrast mode support */
            @media (prefers-contrast: high) {
                .page-link {
                    border-width: 2px !important;
                }
                
                .page-item.active .page-link,
                .page-link.current {
                    border-width: 3px !important;
                    outline: 2px solid currentColor;
                    outline-offset: 2px;
                }
            }

            /* Focus indicators */
            .page-link:focus {
                outline: 2px solid var(--color-primary, #3b82f6);
                outline-offset: 2px;
                box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
            }

            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
                .page-link {
                    transition: none !important;
                }
                
                .skip-link {
                    transition: none !important;
                }
            }
        `;
        document.head.appendChild(styles);
    }
});
