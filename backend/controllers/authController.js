const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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