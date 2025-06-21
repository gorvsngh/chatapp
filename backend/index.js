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
        origin: '*',
    },
});

app.use(cors());
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

    socket.on('joinGroup', (groupId) => {
        socket.join(groupId);
    });

    socket.on('leaveGroup', (groupId) => {
        socket.leave(groupId);
    });

    socket.on('sendMessage', async({ groupId, senderId, text }) => {
        try {
            console.log('Attempting to save message:', { groupId, senderId, text });
            const message = new Message({
                groupId,
                senderId,
                text,
            });
            const savedMessage = await message.save();
            console.log('Message saved successfully:', savedMessage);

            const populatedMessage = await Message.findById(savedMessage._id).populate('senderId', 'name');

            io.to(groupId).emit('message', populatedMessage);
        } catch (err) {
            console.error('!!!!!!!! FAILED TO SAVE MESSAGE !!!!!!!!');
            console.error('Error details:', err);
            console.error('Request data:', { groupId, senderId, text });
            // Optionally, emit an error back to the sender
            socket.emit('messageError', {
                error: 'Could not save message.',
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