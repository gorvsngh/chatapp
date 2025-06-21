const Message = require('../models/Message');

exports.getAllMessages = async(req, res) => {
    try {
        const messages = await Message.find()
            .populate('senderId', 'name')
            .populate('groupId', 'name');
        res.json(messages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};