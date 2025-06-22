const User = require('../models/User');
const Message = require('../models/Message');

exports.searchUsers = async(req, res) => {
    const { q } = req.query;

    try {
        const users = await User.find({
            $and: [
                {
                    $or: [
                        { name: { $regex: q, $options: 'i' } },
                        { regNo: { $regex: q, $options: 'i' } },
                    ],
                },
                { role: { $ne: 'admin' } }, // Exclude admins from search
                { _id: { $ne: req.user.id } }, // Exclude current user
            ],
        }).select('-password').limit(20); // Limit results to 20 users

        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getAllUsers = async(req, res) => {
    const { page = 1, limit = 20, department, year, role } = req.query;

    try {
        const query = {
            role: { $ne: 'admin' }, // Exclude admins
            _id: { $ne: req.user.id }, // Exclude current user
        };

        if (department) query.department = department;
        if (year) query.year = parseInt(year);
        if (role && role !== 'admin') query.role = role;

        const users = await User.find(query)
            .select('-password')
            .sort({ name: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await User.countDocuments(query);

        res.json({
            users,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.sendDirectMessage = async(req, res) => {
    try {
        const { receiverId, text } = req.body;
        const senderId = req.user.id;

        // Validate receiver exists and is not admin
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (receiver.role === 'admin') {
            return res.status(403).json({ msg: 'Cannot send direct messages to admin users' });
        }

        if (receiverId === senderId) {
            return res.status(400).json({ msg: 'Cannot send message to yourself' });
        }

        const message = new Message({
            senderId,
            receiverId,
            text,
            messageType: 'direct',
        });

        await message.save();

        const populatedMessage = await Message.findById(message._id)
            .populate('senderId', 'name regNo profilePic')
            .populate('receiverId', 'name regNo profilePic');

        res.json(populatedMessage);
    } catch (err) {
        console.error('Error sending direct message:', err.message);
        res.status(500).send('Server error');
    }
};

exports.getDirectMessages = async(req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.id;

        // Validate the other user exists and is not admin
        const otherUser = await User.findById(userId);
        if (!otherUser) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (otherUser.role === 'admin') {
            return res.status(403).json({ msg: 'Cannot view messages with admin users' });
        }

        // Get messages between current user and the specified user
        const messages = await Message.find({
            messageType: 'direct',
            $or: [
                { senderId: currentUserId, receiverId: userId },
                { senderId: userId, receiverId: currentUserId },
            ],
        })
        .populate('senderId', 'name regNo profilePic')
        .populate('receiverId', 'name regNo profilePic')
        .sort({ createdAt: 1 });

        res.json(messages);
    } catch (err) {
        console.error('Error getting direct messages:', err.message);
        res.status(500).send('Server error');
    }
};

exports.getDirectMessageContacts = async(req, res) => {
    try {
        const currentUserId = req.user.id;

        // Get all direct messages involving current user
        const messages = await Message.find({
            messageType: 'direct',
            $or: [
                { senderId: currentUserId },
                { receiverId: currentUserId },
            ],
        })
        .populate('senderId', 'name regNo profilePic')
        .populate('receiverId', 'name regNo profilePic')
        .sort({ createdAt: -1 });

        // Group messages by contact and get the latest message for each
        const contactsMap = new Map();

        messages.forEach(message => {
            // Safety check for null populated fields
            if (!message.senderId || !message.receiverId) {
                console.warn('Skipping message with null sender/receiver:', message._id);
                return;
            }

            const contact = message.senderId._id.toString() === currentUserId 
                ? message.receiverId 
                : message.senderId;
            
            const contactId = contact._id.toString();
            
            // Skip if contact is the current user (safety check)
            if (contactId === currentUserId) {
                return;
            }
            
            if (!contactsMap.has(contactId)) {
                contactsMap.set(contactId, {
                    user: contact,
                    lastMessage: message,
                    unreadCount: 0,
                });
            }
        });

        const contacts = Array.from(contactsMap.values());

        res.json(contacts);
    } catch (err) {
        console.error('Error getting direct message contacts:', err.message);
        res.status(500).send('Server error');
    }
};