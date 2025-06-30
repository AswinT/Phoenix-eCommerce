const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Default error values
    let status = err.status || 500;
    let message = err.message || 'Internal Server Error';

    // Handle specific error types
    if (err.name === 'ValidationError') {
        status = 400;
        message = 'Validation Error';
    } else if (err.name === 'CastError') {
        status = 400;
        message = 'Invalid ID format';
    } else if (err.code === 11000) {
        status = 400;
        message = 'Duplicate field value';
    }

    // Handle 404 errors specifically
    if (status === 404) {
        try {
            if (req.originalUrl.startsWith('/admin')) {
                return res.status(404).render('admin/404', { layout: false });
            } else {
                // For user routes, we need to use the layout system
                return res.status(404).render('user/404', {
                    layout: 'layout',
                    title: '404 - Page Not Found'
                });
            }
        } catch (renderError) {
            console.error('Error rendering 404 page:', renderError);
            // Fallback to simple text response
            return res.status(404).send(`
                <html>
                    <head><title>404 - Page Not Found</title></head>
                    <body>
                        <h1>404 - Page Not Found</h1>
                        <p>The page you're looking for doesn't exist.</p>
                        <p><a href="/">Return to Home</a></p>
                    </body>
                </html>
            `);
        }
    }

    // Check if it's an admin route
    if (req.originalUrl.startsWith('/admin')) {
        return res.status(status).render('admin/error', {
            message,
            status,
            error: process.env.NODE_ENV === 'development' ? err.stack : {},
            layout: false
        });
    }

    // Check if it's an AJAX request
    if (req.xhr || req.headers.accept.includes('application/json')) {
        return res.status(status).json({
            success: false,
            message,
            error: process.env.NODE_ENV === 'development' ? err.stack : {}
        });
    }

    // Regular user error page
    return res.status(status).render('user/error', {
        message,
        status,
        error: process.env.NODE_ENV === 'development' ? err.stack : {}
    });
};

module.exports = errorHandler;
