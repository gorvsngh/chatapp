const rateLimit = require('express-rate-limit');
const User = require('../models/User');

// Admin IP Whitelist (configure these IPs)
const ADMIN_WHITELIST_IPS = [
    '127.0.0.1',        // localhost
    '::1',              // localhost IPv6
    // Add your admin IPs here:
    // '192.168.1.100',    // Example admin IP
    // '203.0.113.45',     // Example office IP
];

// Enhanced rate limiting for admin routes
const adminRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: {
        error: 'Too many admin requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for whitelisted IPs in development
        if (process.env.NODE_ENV === 'development') {
            return ['127.0.0.1', '::1'].includes(req.ip);
        }
        return false;
    }
});

// Audit logging function
const logAdminActivity = async (req, action, details = {}) => {
    try {
        const logEntry = {
            timestamp: new Date(),
            userId: req.user?.id,
            userName: req.user?.name,
            action,
            details,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            route: req.originalUrl,
            method: req.method
        };
        
        console.log('🔒 ADMIN ACTIVITY:', JSON.stringify(logEntry, null, 2));
        
        // TODO: Store in database or send to logging service
        // await AdminLog.create(logEntry);
        
    } catch (error) {
        console.error('Failed to log admin activity:', error);
    }
};

// Get client IP address
const getClientIP = (req) => {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null);
};

// IP Whitelist middleware
const checkIPWhitelist = (req, res, next) => {
    const clientIP = getClientIP(req);
    
    // In development, allow local IPs
    if (process.env.NODE_ENV === 'development') {
        const devAllowedIPs = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
        if (devAllowedIPs.includes(clientIP)) {
            return next();
        }
    }
    
    if (!ADMIN_WHITELIST_IPS.includes(clientIP)) {
        console.log(`🚨 SECURITY ALERT: Unauthorized admin access attempt from IP: ${clientIP}`);
        
        logAdminActivity(req, 'UNAUTHORIZED_IP_ACCESS', {
            blockedIP: clientIP,
            timestamp: new Date()
        });
        
        return res.status(403).json({
            error: 'Access denied. Your IP address is not authorized for admin access.',
            code: 'IP_NOT_WHITELISTED'
        });
    }
    
    next();
};

// Enhanced admin role check with additional validations
const checkAdminRole = async (req, res, next) => {
    try {
        // Basic role check
        if (req.user.role !== 'admin') {
            logAdminActivity(req, 'UNAUTHORIZED_ROLE_ACCESS', {
                attemptedRole: req.user.role,
                requiredRole: 'admin'
            });
            
            return res.status(403).json({
                error: 'Access denied. Admin privileges required.',
                code: 'INSUFFICIENT_PRIVILEGES'
            });
        }

        // Check if user still exists and is active
        const currentUser = await User.findById(req.user.id).select('-password');
        if (!currentUser) {
            return res.status(401).json({
                error: 'Admin user not found. Please login again.',
                code: 'USER_NOT_FOUND'
            });
        }

        // Check if user is still admin (role might have been changed)
        if (currentUser.role !== 'admin') {
            return res.status(403).json({
                error: 'Admin privileges have been revoked. Please contact system administrator.',
                code: 'ROLE_REVOKED'
            });
        }

        // Add current user data to request
        req.currentUser = currentUser;
        
        // Log successful admin access
        logAdminActivity(req, 'ADMIN_ACCESS_GRANTED', {
            adminId: currentUser._id,
            adminName: currentUser.name
        });
        
        next();
    } catch (error) {
        console.error('Admin role check error:', error);
        res.status(500).json({
            error: 'Internal server error during authorization',
            code: 'AUTH_ERROR'
        });
    }
};

// Time-based access control (optional)
const checkBusinessHours = (req, res, next) => {
    const now = new Date();
    const hour = now.getHours();
    
    // Allow access only between 6 AM and 11 PM (modify as needed)
    const BUSINESS_START = 6;
    const BUSINESS_END = 23;
    
    // Skip time check in development
    if (process.env.NODE_ENV === 'development') {
        return next();
    }
    
    if (hour < BUSINESS_START || hour > BUSINESS_END) {
        logAdminActivity(req, 'AFTER_HOURS_ACCESS_ATTEMPT', {
            attemptTime: now.toISOString(),
            hour: hour
        });
        
        return res.status(403).json({
            error: `Admin access is restricted outside business hours (${BUSINESS_START}:00 - ${BUSINESS_END}:00).`,
            code: 'OUTSIDE_BUSINESS_HOURS',
            allowedHours: `${BUSINESS_START}:00 - ${BUSINESS_END}:00`
        });
    }
    
    next();
};

// Security headers middleware for admin routes
const setAdminSecurityHeaders = (req, res, next) => {
    // Enhanced security headers for admin routes
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Content Security Policy for admin dashboard
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self';");
    
    next();
};

// Combined admin security middleware
const adminSecurity = [
    adminRateLimit,           // Rate limiting
    checkIPWhitelist,         // IP whitelist check
    setAdminSecurityHeaders,  // Security headers
    // checkBusinessHours,    // Uncomment for time-based access
    checkAdminRole           // Enhanced role check
];

// Middleware to log admin actions on specific routes
const logAdminAction = (action) => {
    return (req, res, next) => {
        // Store action info for post-request logging
        req.adminAction = action;
        
        // Override res.json to log after response
        const originalJson = res.json;
        res.json = function(data) {
            // Log the action with response status
            logAdminActivity(req, req.adminAction, {
                success: res.statusCode < 400,
                statusCode: res.statusCode,
                responseData: res.statusCode < 400 ? 'SUCCESS' : data.error || 'ERROR'
            });
            
            return originalJson.call(this, data);
        };
        
        next();
    };
};

module.exports = {
    adminSecurity,
    logAdminAction,
    logAdminActivity,
    adminRateLimit,
    checkIPWhitelist,
    checkAdminRole,
    checkBusinessHours,
    setAdminSecurityHeaders
}; 