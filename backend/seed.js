const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const connectDB = require('./config/db');

connectDB();

const createUser = async() => {
    try {
        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash('password123', salt);

        const users = [{
                regNo: 'HOD001',
                name: 'Dr. Smith',
                password: password,
                role: 'hod',
                department: 'CSE',
                year: 2024
            },
            {
                regNo: 'FAC001',
                name: 'Prof. Jones',
                password: password,
                role: 'faculty',
                department: 'CSE',
                year: 2024
            },
            {
                regNo: 'STU001',
                name: 'John Doe',
                password: password,
                role: 'student',
                department: 'CSE',
                year: 2024
            },
            {
                regNo: 'ADM001',
                name: 'Admin User',
                password: password,
                role: 'admin',
                department: 'Admin',
                year: 2024
            }
        ];

        await User.insertMany(users);
        console.log('Users created');
        mongoose.connection.close();
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

createUser();