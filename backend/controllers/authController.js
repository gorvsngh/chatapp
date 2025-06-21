const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Group = require('../models/Group');

exports.register = async (req, res) => {
    const { name, regNo, email, password, department, year } = req.body;

    try {
        // Check if user already exists
        let user = await User.findOne({ regNo });
        if (user) {
            return res.status(400).json({ msg: 'User with this registration number already exists' });
        }

        // Check if email already exists
        let existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ msg: 'User with this email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        user = new User({
            name,
            regNo,
            email,
            password: hashedPassword,
            role: 'student', // Default role for registration
            department,
            year
        });

        await user.save();

        // Auto-join appropriate groups
        await autoJoinGroups(user);

        // Create JWT payload
        const payload = {
            user: {
                id: user.id,
                role: user.role,
                department: user.department
            },
        };

        jwt.sign(
            payload,
            'collegechat_jwt_secret_2024', 
            { expiresIn: 3600 },
            (err, token) => {
                if (err) throw err;
                
                // Send user data (excluding password) along with token
                const userData = {
                    id: user.id,
                    regNo: user.regNo,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    department: user.department,
                    year: user.year
                };
                res.json({ token, user: userData });
            }
        );
    } catch (err) {
        console.error('Registration error:', err.message);
        res.status(500).send('Server error');
    }
};

// Helper function to automatically join appropriate groups
const autoJoinGroups = async (user) => {
    try {
        // Find groups that the user should automatically join
        const eligibleGroups = await Group.find({
            $or: [
                { type: 'general' }, // General groups are open to all
                { department: user.department }, // Department-specific groups
                { type: 'class', department: user.department, year: user.year } // Class groups for same department and year
            ]
        });

        // Add user to eligible groups
        for (const group of eligibleGroups) {
            if (!group.members.includes(user._id)) {
                group.members.push(user._id);
                await group.save();
            }
        }

        console.log(`Auto-joined user ${user.regNo} to ${eligibleGroups.length} groups`);
    } catch (error) {
        console.error('Error auto-joining groups:', error.message);
        // Don't throw error - registration should still succeed even if auto-join fails
    }
};

exports.login = async(req, res) => {
    const { regNo, password } = req.body;

    try {
        let user = await User.findOne({ regNo });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const payload = {
            user: {
                id: user.id,
                role: user.role,
                department: user.department
            },
        };

        jwt.sign(
            payload,
            'collegechat_jwt_secret_2024', { expiresIn: 3600 },
            (err, token) => {
                if (err) throw err;
                // Send user data (excluding password) along with token
                const userData = {
                    id: user.id,
                    regNo: user.regNo,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    department: user.department,
                    year: user.year
                };
                res.json({ token, user: userData });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};