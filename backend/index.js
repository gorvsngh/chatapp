require('dotenv').config();

const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const Message = require('./models/Message');

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
    cors: {
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173'],
        credentials: true
    },
});

app.use(cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173'],
    credentials: true
}));
app.use(express.json());

app.use('/auth', require('./routes/auth'));
app.use('/users', require('./routes/users'));
app.use('/groups', require('./routes/groups'));
app.use('/admin', require('./routes/admin'));

app.get('/', (req, res) => {
    res.send('Server is running');
});

io.on('connection', (socket) => {
    console.log('New client connected');

    // Join user's personal room for direct messages
    socket.on('joinUser', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined their personal room`);
    });

    // Leave user's personal room
    socket.on('leaveUser', (userId) => {
        socket.leave(`user_${userId}`);
        console.log(`User ${userId} left their personal room`);
    });

    // Join group room
    socket.on('joinGroup', (groupId) => {
        socket.join(groupId);
        console.log(`User joined group ${groupId}`);
    });

    // Leave group room
    socket.on('leaveGroup', (groupId) => {
        socket.leave(groupId);
        console.log(`User left group ${groupId}`);
    });

    // Send group message
    socket.on('sendMessage', async({ groupId, senderId, text }) => {
        try {
            console.log('Attempting to save group message:', { groupId, senderId, text });
            const message = new Message({
                groupId,
                senderId,
                text,
                messageType: 'group',
            });
            const savedMessage = await message.save();
            console.log('Group message saved successfully:', savedMessage);

            const populatedMessage = await Message.findById(savedMessage._id)
                .populate('senderId', 'name regNo profilePic');

            io.to(groupId).emit('message', populatedMessage);
        } catch (err) {
            console.error('!!!!!!!! FAILED TO SAVE GROUP MESSAGE !!!!!!!!');
            console.error('Error details:', err);
            console.error('Request data:', { groupId, senderId, text });
            socket.emit('messageError', {
                error: 'Could not save group message.',
                details: err.message
            });
        }
    });

    // Send direct message
    socket.on('sendDirectMessage', async({ senderId, receiverId, text }) => {
        try {
            console.log('Attempting to save direct message:', { senderId, receiverId, text });
            
            // Validate ObjectIds
            const mongoose = require('mongoose');
            if (!mongoose.Types.ObjectId.isValid(senderId)) {
                throw new Error(`Invalid senderId: ${senderId}`);
            }
            if (!mongoose.Types.ObjectId.isValid(receiverId)) {
                throw new Error(`Invalid receiverId: ${receiverId}`);
            }

            // Check if users exist
            const User = require('./models/User');
            const sender = await User.findById(senderId);
            const receiver = await User.findById(receiverId);
            
            if (!sender) {
                throw new Error(`Sender not found: ${senderId}`);
            }
            if (!receiver) {
                throw new Error(`Receiver not found: ${receiverId}`);
            }

            console.log('Users validated:', { 
                sender: sender.name, 
                receiver: receiver.name 
            });

            const message = new Message({
                senderId,
                receiverId,
                text,
                messageType: 'direct',
            });
            const savedMessage = await message.save();
            console.log('Direct message saved successfully:', savedMessage);

            const populatedMessage = await Message.findById(savedMessage._id)
                .populate('senderId', 'name regNo profilePic')
                .populate('receiverId', 'name regNo profilePic');

            // Send to both sender and receiver
            io.to(`user_${senderId}`).emit('directMessage', populatedMessage);
            io.to(`user_${receiverId}`).emit('directMessage', populatedMessage);
        } catch (err) {
            console.error('!!!!!!!! FAILED TO SAVE DIRECT MESSAGE !!!!!!!!');
            console.error('Error details:', err.message);
            console.error('Full error:', err);
            console.error('Request data:', { senderId, receiverId, text });
            socket.emit('messageError', {
                error: 'Could not save direct message.',
                details: err.message
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));