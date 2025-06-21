const Group = require('../models/Group');
const Message = require('../models/Message');

exports.createGroup = async(req, res) => {
    const { name, description, type, department, members = [] } = req.body;

    try {
        // Validate required fields
        if (!name) {
            return res.status(400).json({ msg: 'Group name is required' });
        }

        // Validate members if provided
        if (members && !Array.isArray(members)) {
            return res.status(400).json({ msg: 'Members must be an array' });
        }

        // Validate that all members are valid ObjectIds if provided
        let validMembers = [];
        if (members && members.length > 0) {
            const mongoose = require('mongoose');
            validMembers = members.filter(memberId => mongoose.Types.ObjectId.isValid(memberId));

            if (validMembers.length !== members.length) {
                return res.status(400).json({ msg: 'Invalid member IDs provided' });
            }
        }

        // Ensure the creator is included in members
        const allMembers = [...new Set([...validMembers, req.user.id])];

        const newGroup = new Group({
            name,
            description,
            type,
            department,
            createdBy: req.user.id,
            members: allMembers,
        });

        const group = await newGroup.save();
        res.json(group);
    } catch (err) {
        console.error('Error creating group:', err.message);
        console.error('Full error:', err);
        res.status(500).send('Server error');
    }
};

exports.joinGroup = async(req, res) => {
    try {
        const groupId = req.params.id;
        const userId = req.user.id;
        const user = req.user;

        // Check if group exists
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ msg: 'Group not found' });
        }

        // Check if user is already a member
        if (group.members.includes(userId)) {
            return res.status(400).json({ msg: 'You are already a member of this group' });
        }

        // Check if user is eligible to join the group
        const canJoin = 
            group.type === 'general' || // General groups are open to all
            group.department === user.department || // Department-specific groups
            (group.type === 'class' && group.department === user.department); // Class groups in same department

        if (!canJoin) {
            return res.status(403).json({ msg: 'You are not eligible to join this group' });
        }

        // Add user to group members
        group.members.push(userId);
        await group.save();

        // Return updated group with populated members
        const updatedGroup = await Group.findById(groupId)
            .populate('members', 'name regNo role')
            .populate('createdBy', 'name regNo role');

        res.json({ msg: 'Successfully joined the group', group: updatedGroup });
    } catch (err) {
        console.error('Error joining group:', err.message);
        res.status(500).send('Server error');
    }
};

exports.leaveGroup = async(req, res) => {
    try {
        const groupId = req.params.id;
        const userId = req.user.id;

        // Check if group exists
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ msg: 'Group not found' });
        }

        // Check if user is a member
        if (!group.members.includes(userId)) {
            return res.status(400).json({ msg: 'You are not a member of this group' });
        }

        // Prevent group creator from leaving
        if (group.createdBy.toString() === userId) {
            return res.status(400).json({ msg: 'Group creator cannot leave the group' });
        }

        // Remove user from group members
        group.members = group.members.filter(member => member.toString() !== userId);
        await group.save();

        res.json({ msg: 'Successfully left the group' });
    } catch (err) {
        console.error('Error leaving group:', err.message);
        res.status(500).send('Server error');
    }
};

exports.getGroupMessages = async(req, res) => {
    try {
        const groupId = req.params.id;
        const userId = req.user.id;

        // Check if group exists and user is a member
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ msg: 'Group not found' });
        }

        // Check if user is a member of the group
        if (!group.members.includes(userId)) {
            return res.status(403).json({ msg: 'You are not a member of this group' });
        }

        const messages = await Message.find({ groupId: req.params.id }).populate(
            'senderId',
            'name _id profilePic'
        );
        res.json(messages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};