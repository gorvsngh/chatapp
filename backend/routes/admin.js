const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const adminController = require('../controllers/adminController');

// Dashboard
router.get(
    '/dashboard', 
    [authMiddleware, roleMiddleware(['admin'])],
    adminController.getDashboardStats
);

// Messages Management
router.get(
    '/messages', 
    [authMiddleware, roleMiddleware(['admin'])],
    adminController.getAllMessages
);

router.delete(
    '/messages/:id', 
    [authMiddleware, roleMiddleware(['admin'])],
    adminController.deleteMessage
);

// Users Management
router.get(
    '/users', 
    [authMiddleware, roleMiddleware(['admin'])],
    adminController.getAllUsers
);

router.post(
    '/users', 
    [authMiddleware, roleMiddleware(['admin'])],
    adminController.createUser
);

router.post(
    '/users/bulk', 
    [authMiddleware, roleMiddleware(['admin'])],
    adminController.bulkCreateUsers
);

router.post(
    '/users/upload', 
    [authMiddleware, roleMiddleware(['admin']), adminController.upload.single('file')],
    adminController.uploadUsersFromSheet
);

router.put(
    '/users/:id', 
    [authMiddleware, roleMiddleware(['admin'])],
    adminController.updateUser
);

router.delete(
    '/users/:id', 
    [authMiddleware, roleMiddleware(['admin'])],
    adminController.deleteUser
);

// Groups Management
router.get(
    '/groups', 
    [authMiddleware, roleMiddleware(['admin'])],
    adminController.getAllGroups
);

router.put(
    '/groups/:id', 
    [authMiddleware, roleMiddleware(['admin'])],
    adminController.updateGroup
);

router.delete(
    '/groups/:id', 
    [authMiddleware, roleMiddleware(['admin'])],
    adminController.deleteGroup
);

module.exports = router;