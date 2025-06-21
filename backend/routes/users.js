const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

// @route   GET /users/search
// @desc    Search for users
// @access  Private
router.get('/search', authMiddleware, userController.searchUsers);

module.exports = router;