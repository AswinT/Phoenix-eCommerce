document.addEventListener('DOMContentLoaded', () => {
    // Mobile navigation toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileNav = document.querySelector('.mobile-nav');
    const mobileNavClose = document.querySelector('.mobile-nav-close');
    const overlay = document.querySelector('.page-overlay') || createOverlay();
    
    // Setup AJAX error handling for blocked users
    setupAjaxErrorHandling();
    
    if (menuToggle && mobileNav) {
        menuToggle.addEventListener('click', () => {
            mobileNav.classList.add('active');
            overlay.style.display = 'block';
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (mobileNavClose && mobileNav) {
        mobileNavClose.addEventListener('click', () => {
            mobileNav.classList.remove('active');
            overlay.style.display = 'none';
            document.body.style.overflow = '';
        });
    }
    
    // Close mobile nav when clicking outside
    if (overlay) {
        overlay.addEventListener('click', () => {
            mobileNav.classList.remove('active');
            overlay.style.display = 'none';
            document.body.style.overflow = '';
        });
    }
    
    // Dropdown menus
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
        const toggleBtn = dropdown.querySelector('.dropdown-toggle');
        const menu = dropdown.querySelector('.dropdown-menu');
        
        if (toggleBtn && menu) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                menu.classList.toggle('show');
            });
        }
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        const openDropdowns = document.querySelectorAll('.dropdown-menu.show');
        openDropdowns.forEach(menu => {
            menu.classList.remove('show');
        });
    });
    
    // Product image gallery
    const productThumbnails = document.querySelectorAll('.thumbnail');
    const mainProductImage = document.querySelector('.product-image');
    
    if (productThumbnails.length && mainProductImage) {
        productThumbnails.forEach(thumbnail => {
            thumbnail.addEventListener('click', () => {
                const imgSrc = thumbnail.querySelector('img').getAttribute('src');
                mainProductImage.setAttribute('src', imgSrc);
                
                // Update active thumbnail
                productThumbnails.forEach(t => t.classList.remove('active'));
                thumbnail.classList.add('active');
                
                // Ensure zoom is working with the new image
                initImageZoom();
            });
        });
    }
    
    // Initialize image zoom if we're on a product detail page
    // initImageZoom();
    
    // Alert auto-dismiss
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        if (!alert.classList.contains('alert-persistent')) {
            setTimeout(() => {
                alert.style.opacity = '0';
                setTimeout(() => {
                    alert.remove();
                }, 300);
            }, 5000);
        }
        
        // Add close button functionality
        const closeBtn = alert.querySelector('.alert-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                alert.style.opacity = '0';
                setTimeout(() => {
                    alert.remove();
                }, 300);
            });
        }
    });
});

// Setup AJAX error handling for blocked users
function setupAjaxErrorHandling() {
    // Use the fetch API
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        return originalFetch.apply(this, args).then(async response => {
            if (response.status === 403) {
                try {
                    const data = await response.clone().json();
                    if (data.redirect && data.redirect.includes('status=blocked')) {
                        // Show SweetAlert and redirect
                        if (typeof Swal !== 'undefined') {
                            await Swal.fire({
                                title: 'Account Blocked',
                                text: 'Your account has been blocked by an administrator. Please contact customer support for assistance.',
                                icon: 'error',
                                confirmButtonText: 'OK',
                                confirmButtonColor: '#d33'
                            });
                        }
                        window.location.href = data.redirect;
                        return new Response(JSON.stringify({}), { 
                            status: 200,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                } catch (e) {
                    // Not JSON or other error, continue with original response
                }
            }
            return response;
        });
    };
    
    // For older jQuery AJAX if used
    if (typeof jQuery !== 'undefined') {
        $(document).ajaxError(function(event, jqXHR) {
            if (jqXHR.status === 403) {
                try {
                    const data = JSON.parse(jqXHR.responseText);
                    if (data.redirect && data.redirect.includes('status=blocked')) {
                        if (typeof Swal !== 'undefined') {
                            Swal.fire({
                                title: 'Account Blocked',
                                text: 'Your account has been blocked by an administrator. Please contact customer support for assistance.',
                                icon: 'error',
                                confirmButtonText: 'OK',
                                confirmButtonColor: '#d33'
                            }).then(() => {
                                window.location.href = data.redirect;
                            });
                        } else {
                            window.location.href = data.redirect;
                        }
                    }
                } catch (e) {
                    // Not JSON or other error, do nothing
                }
            }
        });
    }
}

// Create overlay for mobile menu
function createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'page-overlay';
    document.body.appendChild(overlay);
    return overlay;
}

// Image zoom functionality
// function initImageZoom() { ... }

// Initialize Cropper.js for admin product images if on admin page
function initImageCropper() {
    const imageInput = document.getElementById('product-images-input');
    const cropContainer = document.querySelector('.image-crop-container');
    const cropPreviewContainer = document.querySelector('.crop-preview');
    
    if (!imageInput || !cropContainer) return;
    
    // Check if Cropper.js is available
    if (typeof Cropper === 'undefined') {
        console.error('Cropper.js is not loaded');
        return;
    }
    
    let cropper;
    let croppedImages = [];
    
    imageInput.addEventListener('change', function(e) {
        const files = e.target.files;
        
        if (!files || files.length === 0) return;
        
        // Clear previous crops
        cropContainer.innerHTML = '';
        croppedImages = [];
        
        // Create elements for each image
        Array.from(files).forEach((file, index) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                // Create image element
                const imgContainer = document.createElement('div');
                imgContainer.className = 'cropper-container';
                
                const img = document.createElement('img');
                img.src = e.target.result;
                img.className = 'crop-image';
                img.dataset.index = index;
                
                imgContainer.appendChild(img);
                cropContainer.appendChild(imgContainer);
                
                // Initialize cropper
                if (index === 0) {
                    initCropper(img);
                    
                    // Add navigation buttons if multiple images
                    if (files.length > 1) {
                        createCropNavigation(files.length);
                    }
                }
            };
            
            reader.readAsDataURL(file);
        });
    });
    
    function initCropper(img) {
        // Destroy previous cropper if exists
        if (cropper) {
            cropper.destroy();
        }
        
        // Initialize new cropper
        cropper = new Cropper(img, {
            aspectRatio: 1, // Square crop by default
            viewMode: 1,
            preview: cropPreviewContainer,
            crop(event) {
                // Update cropped data
                const index = parseInt(img.dataset.index);
                croppedImages[index] = {
                    file: imageInput.files[index],
                    cropData: event.detail
                };
            }
        });
    }
    
    function createCropNavigation(count) {
        const nav = document.createElement('div');
        nav.className = 'crop-navigation';
        
        for (let i = 0; i < count; i++) {
            const btn = document.createElement('button');
            btn.className = 'crop-nav-btn';
            btn.textContent = i + 1;
            btn.dataset.index = i;
            
            if (i === 0) {
                btn.classList.add('active');
            }
            
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                const img = document.querySelector(`.crop-image[data-index="${index}"]`);
                
                // Save current crop
                if (cropper) {
                    const currentIndex = parseInt(cropper.image.dataset.index);
                    croppedImages[currentIndex] = {
                        file: imageInput.files[currentIndex],
                        cropData: cropper.getData()
                    };
                    
                    // Switch to new image
                    cropper.destroy();
                    initCropper(img);
                    
                    // Update active button
                    document.querySelectorAll('.crop-nav-btn').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                }
            });
            
            nav.appendChild(btn);
        }
        
        cropContainer.appendChild(nav);
    }
}

// Call the cropper initialization if we're on admin product page
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.admin-product-form')) {
        initImageCropper();
    }
}); 