const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const groupController = require('../controllers/groupController');
const Group = require('../models/Group');

// @route   GET /groups
// @desc    Get all groups
// @access  Private
router.get('/', authMiddleware, async(req, res) => {
    try {
        const groups = await Group.find();
        res.json(groups);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// @route   POST /groups
// @desc    Create a group
// @access  Private (HOD and Admin only)
router.post('/', [authMiddleware, roleMiddleware(['hod', 'admin'])], groupController.createGroup);

// @route   GET /groups/:id/messages
// @desc    Get messages in a group
// @access  Private
router.get('/:id/messages', authMiddleware, groupController.getGroupMessages);

// @route   POST /groups/:id/message
// @desc    Send a message in a group
// @access  Private
router.post('/:id/message', authMiddleware, (req, res) => {
    res.send('Send group message route');
});

module.exports = router;