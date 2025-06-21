const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

// @route   GET /users/search
// @desc    Search for users (excludes admins)
// @access  Private
router.get('/search', authMiddleware, userController.searchUsers);

// @route   GET /users
// @desc    Get all users with pagination and filtering (excludes admins)
// @access  Private
router.get('/', authMiddleware, userController.getAllUsers);

// @route   GET /users/direct-contacts
// @desc    Get direct message contacts
// @access  Private
router.get('/direct-contacts', authMiddleware, userController.getDirectMessageContacts);

// @route   POST /users/direct-message
// @desc    Send a direct message
// @access  Private
router.post('/direct-message', authMiddleware, userController.sendDirectMessage);

// @route   GET /users/:userId/messages
// @desc    Get direct messages with a specific user
// @access  Private
router.get('/:userId/messages', authMiddleware, userController.getDirectMessages);

module.exports = router;