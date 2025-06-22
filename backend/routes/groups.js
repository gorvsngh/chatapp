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

// @route   POST /groups/:id/members
// @desc    Add a member to a group
// @access  Private (Admin, HOD, or Group Admin only)
router.post('/:id/members', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.body;
        const groupId = req.params.id;
        console.log('Add member request:', { groupId, userId, user: req.user.id });
        
        // Find the group
        const group = await Group.findById(groupId);
        if (!group) {
            console.log('Group not found:', groupId);
            return res.status(404).json({ msg: 'Group not found' });
        }

        console.log('Group found:', { 
            groupId: group._id, 
            members: group.members.map(m => m.toString()),
            createdBy: group.createdBy?.toString(),
            admins: group.admins?.map(a => a.toString()) || []
        });

        // Check permissions: Admin, HOD, or Group Admin/Creator can add members
        const isAdmin = req.user.role === 'admin';
        const isHOD = req.user.role === 'hod';
        const isGroupAdmin = group.admins?.some(admin => admin.toString() === req.user.id);
        const isCreator = group.createdBy?.toString() === req.user.id;

        console.log('Permission check:', { isAdmin, isHOD, isGroupAdmin, isCreator });

        if (!isAdmin && !isHOD && !isGroupAdmin && !isCreator) {
            console.log('Permission denied for user:', req.user.id);
            return res.status(403).json({ msg: 'Not authorized to add members to this group' });
        }

        // Check if user is already a member
        const isAlreadyMember = group.members.some(memberId => memberId.toString() === userId);
        console.log('Is already member check:', { userId, isAlreadyMember });

        if (isAlreadyMember) {
            console.log('User is already a member:', userId);
            return res.status(400).json({ msg: 'User is already a member of this group' });
        }

        // Add user to group
        const originalLength = group.members.length;
        group.members.push(userId);
        console.log('Members after addition:', { 
            originalLength, 
            newLength: group.members.length,
            added: group.members.length - originalLength 
        });
        
        await group.save();
        console.log('Group saved successfully');

        // Populate the updated group
        const updatedGroup = await Group.findById(groupId)
            .populate('members', 'name regNo role email department year profilePic')
            .populate('createdBy', 'name regNo role')
            .populate('admins', 'name regNo role');

        console.log('Updated group populated, members count:', updatedGroup.members.length);

        res.json({ msg: 'Member added successfully', group: updatedGroup });
    } catch (err) {
        console.error('Error in add member:', err.message);
        console.error('Full error:', err);
        res.status(500).send('Server error');
    }
});

// @route   DELETE /groups/:id/members/:userId
// @desc    Remove a member from a group
// @access  Private (Admin, HOD, or Group Admin only)
router.delete('/:id/members/:userId', authMiddleware, async (req, res) => {
    try {
        const { id: groupId, userId } = req.params;
        console.log('Remove member request:', { groupId, userId, user: req.user.id });
        
        // Find the group
        const group = await Group.findById(groupId);
        if (!group) {
            console.log('Group not found:', groupId);
            return res.status(404).json({ msg: 'Group not found' });
        }

        console.log('Group found:', { 
            groupId: group._id, 
            members: group.members.map(m => m.toString()),
            createdBy: group.createdBy?.toString(),
            admins: group.admins?.map(a => a.toString()) || []
        });

        // Check permissions: Admin, HOD, or Group Admin/Creator can remove members
        const isAdmin = req.user.role === 'admin';
        const isHOD = req.user.role === 'hod';
        const isGroupAdmin = group.admins?.some(admin => admin.toString() === req.user.id);
        const isCreator = group.createdBy?.toString() === req.user.id;

        console.log('Permission check:', { isAdmin, isHOD, isGroupAdmin, isCreator });

        if (!isAdmin && !isHOD && !isGroupAdmin && !isCreator) {
            console.log('Permission denied for user:', req.user.id);
            return res.status(403).json({ msg: 'Not authorized to remove members from this group' });
        }

        // Check if user is a member
        const isMember = group.members.some(memberId => memberId.toString() === userId);
        console.log('Is member check:', { userId, isMember, members: group.members.map(m => m.toString()) });

        if (!isMember) {
            console.log('User is not a member:', userId);
            return res.status(400).json({ msg: 'User is not a member of this group' });
        }

        // Prevent removing the creator
        if (group.createdBy?.toString() === userId) {
            console.log('Attempting to remove creator:', userId);
            return res.status(400).json({ msg: 'Cannot remove the group creator' });
        }

        // Remove user from group
        const originalLength = group.members.length;
        group.members = group.members.filter(memberId => memberId.toString() !== userId);
        console.log('Members after removal:', { 
            originalLength, 
            newLength: group.members.length,
            removed: originalLength - group.members.length 
        });
        
        await group.save();
        console.log('Group saved successfully');

        // Populate the updated group
        const updatedGroup = await Group.findById(groupId)
            .populate('members', 'name regNo role email department year profilePic')
            .populate('createdBy', 'name regNo role')
            .populate('admins', 'name regNo role');

        console.log('Updated group populated, members count:', updatedGroup.members.length);

        res.json({ msg: 'Member removed successfully', group: updatedGroup });
    } catch (err) {
        console.error('Error in remove member:', err.message);
        console.error('Full error:', err);
        res.status(500).send('Server error');
    }
});

module.exports = router;