const express = require('express');
const router = express.Router();
const { adminRateLimit, logAdminAction, adminSecurity } = require('../middleware/adminSecurityMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const adminAuthController = require('../controllers/adminAuthController');

// Admin login route with enhanced rate limiting
router.post('/login', 
    adminRateLimit,  // Apply stricter rate limiting for admin login
    adminAuthController.adminLogin
);

// Admin session validation
router.post('/validate-session',
    adminAuthController.validateAdminSession
);

// Admin logout (requires authentication)
router.post('/logout',
    authMiddleware,
    adminSecurity,
    logAdminAction('ADMIN_LOGOUT'),
    adminAuthController.adminLogout
);

// Get login attempts info (admin only)
router.get('/login-attempts',
    authMiddleware,
    adminSecurity,
    logAdminAction('VIEW_LOGIN_ATTEMPTS'),
    adminAuthController.getLoginAttempts
);

module.exports = router; 