const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: function() {
            return this.messageType === 'group';
        },
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: function() {
            return this.messageType === 'direct';
        },
    },
    text: {
        type: String,
        required: true,
    },
    messageType: {
        type: String,
        enum: ['group', 'direct'],
        required: true,
        default: 'group',
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Message', MessageSchema);