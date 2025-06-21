const User = require('../models/User');

exports.searchUsers = async(req, res) => {
    const { q } = req.query;

    try {
        const users = await User.find({
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { regNo: { $regex: q, $options: 'i' } },
            ],
        }).select('-password');

        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};