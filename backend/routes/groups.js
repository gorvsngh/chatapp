const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const groupController = require('../controllers/groupController');
const Group = require('../models/Group');

// @route   GET /groups
// @desc    Get user's groups (groups where user is a member)
// @access  Private
router.get('/', authMiddleware, async(req, res) => {
    try {
        const groups = await Group.find({ members: req.user.id })
            .populate('members', 'name regNo role')
            .populate('createdBy', 'name regNo role')
            .sort({ createdAt: -1 });
        res.json(groups);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// @route   GET /groups/discover
// @desc    Get groups available for user to join (based on department/type)
// @access  Private
router.get('/discover', authMiddleware, async(req, res) => {
    try {
        const user = req.user;
        const userGroups = await Group.find({ members: user.id }).select('_id');
        const userGroupIds = userGroups.map(group => group._id);

        // Find groups user can potentially join
        const availableGroups = await Group.find({
            _id: { $nin: userGroupIds }, // Not already a member
            $or: [
                { type: 'general' }, // General groups are open to all
                { department: user.department }, // Department-specific groups
                { type: 'class', department: user.department } // Class groups in same department
            ]
        })
        .populate('createdBy', 'name regNo role')
        .populate('members', 'name regNo role')
        .sort({ createdAt: -1 });

        res.json(availableGroups);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST /groups/:id/join
// @desc    Join a group
// @access  Private
router.post('/:id/join', authMiddleware, groupController.joinGroup);

// @route   POST /groups/:id/leave
// @desc    Leave a group
// @access  Private
router.post('/:id/leave', authMiddleware, groupController.leaveGroup);

// @route   POST /groups
// @desc    Create a group
// @access  Private (HOD and Admin only)
router.post('/', [authMiddleware, roleMiddleware(['hod', 'admin'])], groupController.createGroup);

// @route   GET /groups/:id/messages
// @desc    Get messages in a group
// @access  Private (Only group members)
router.get('/:id/messages', authMiddleware, groupController.getGroupMessages);

// @route   POST /groups/:id/message
// @desc    Send a message in a group
// @access  Private
router.post('/:id/message', authMiddleware, (req, res) => {
    res.send('Send group message route');
});

module.exports = router;