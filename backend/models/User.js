const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    regNo: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['student', 'faculty', 'hod', 'admin'],
        required: true,
    },
    department: {
        type: String,
        required: true,
    },
    year: {
        type: Number,
        required: true,
    },
});

module.exports = mongoose.model('User', UserSchema);