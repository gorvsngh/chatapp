# Chat Application

A real-time chat application built with React (TypeScript) frontend and Node.js backend with Socket.IO for real-time messaging.

## Features

- **Real-time Messaging**: Instant message delivery using Socket.IO
- **User Authentication**: Secure login and registration system
- **Group Chats**: Create and join group conversations
- **Private Messaging**: One-on-one conversations
- **User Profiles**: Manage user information and settings
- **Admin Panel**: Administrative controls for user management
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Socket.IO Client** for real-time communication
- **CSS Modules** for styling
- **React Router** for navigation

### Backend
- **Node.js** with Express
- **Socket.IO** for real-time features
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcrypt** for password hashing

## Project Structure

```
chatapp/
├── backend/                 # Node.js backend
│   ├── config/             # Database configuration
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Authentication middleware
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   └── index.js           # Server entry point
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── pages/         # Page components
│   │   ├── services/      # API and socket services
│   │   ├── types/         # TypeScript type definitions
│   │   └── theme/         # Theme configuration
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chatapp
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**

   Create a `.env` file in the backend directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/chatapp
   JWT_SECRET=your_jwt_secret_here
   ```

5. **Start the development servers**

   Backend (from backend directory):
   ```bash
   npm run dev
   ```

   Frontend (from frontend directory):
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Users
- `GET /api/users` - Get all users
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Groups
- `POST /api/groups` - Create group
- `GET /api/groups` - Get user's groups
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group

### Messages
- `GET /api/messages/:groupId` - Get group messages
- `POST /api/messages` - Send message

## Socket.IO Events

### Client to Server
- `join_room` - Join a chat room
- `leave_room` - Leave a chat room
- `send_message` - Send a message

### Server to Client
- `receive_message` - Receive a new message
- `user_joined` - User joined the room
- `user_left` - User left the room

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please open an issue on GitHub. 