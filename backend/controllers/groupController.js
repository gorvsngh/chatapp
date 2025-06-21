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

exports.getGroupMessages = async(req, res) => {
    try {
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