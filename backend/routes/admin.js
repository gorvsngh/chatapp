const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const adminController = require('../controllers/adminController');

// @route   GET /admin/messages
// @desc    Get all messages
// @access  Private (Admin only)
router.get(
    '/messages', [authMiddleware, roleMiddleware(['admin'])],
    adminController.getAllMessages
);

module.exports = router;