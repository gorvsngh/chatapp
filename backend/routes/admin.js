const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { adminSecurity, logAdminAction } = require('../middleware/adminSecurityMiddleware');
const adminController = require('../controllers/adminController');

// Apply enhanced admin security to all routes
router.use(authMiddleware);
router.use(adminSecurity);

// Dashboard - Most sensitive admin route
router.get(
    '/dashboard', 
    logAdminAction('DASHBOARD_ACCESS'),
    adminController.getDashboardStats
);

// Messages Management - High sensitivity
router.get(
    '/messages', 
    logAdminAction('VIEW_ALL_MESSAGES'),
    adminController.getAllMessages
);

router.delete(
    '/messages/:id', 
    logAdminAction('DELETE_MESSAGE'),
    adminController.deleteMessage
);

// Users Management - Critical operations
router.get(
    '/users', 
    logAdminAction('VIEW_ALL_USERS'),
    adminController.getAllUsers
);

router.post(
    '/users', 
    logAdminAction('CREATE_USER'),
    adminController.createUser
);

router.post(
    '/users/bulk', 
    logAdminAction('BULK_CREATE_USERS'),
    adminController.bulkCreateUsers
);

router.post(
    '/users/upload', 
    adminController.upload.single('file'),
    logAdminAction('UPLOAD_USERS_FILE'),
    adminController.uploadUsersFromSheet
);

router.put(
    '/users/:id', 
    logAdminAction('UPDATE_USER'),
    adminController.updateUser
);

router.delete(
    '/users/:id', 
    logAdminAction('DELETE_USER'),
    adminController.deleteUser
);

// Groups Management - Moderate sensitivity
router.get(
    '/groups', 
    logAdminAction('VIEW_ALL_GROUPS'),
    adminController.getAllGroups
);

router.put(
    '/groups/:id', 
    logAdminAction('UPDATE_GROUP'),
    adminController.updateGroup
);

router.delete(
    '/groups/:id', 
    logAdminAction('DELETE_GROUP'),
    adminController.deleteGroup
);

module.exports = router;