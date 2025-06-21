const Message = require('../models/Message');
const User = require('../models/User');
const Group = require('../models/Group');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const XLSX = require('xlsx');

// Helper function to automatically join appropriate groups (same as in authController)
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
        // Don't throw error - user creation should still succeed even if auto-join fails
    }
};

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Accept Excel and CSV files
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
            file.mimetype === 'application/vnd.ms-excel' ||
            file.mimetype === 'text/csv') {
            cb(null, true);
        } else {
            cb(new Error('Only Excel and CSV files are allowed'), false);
        }
    }
});

exports.upload = upload;

exports.uploadUsersFromSheet = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            return res.status(400).json({ msg: 'No data found in the uploaded file' });
        }

        // Process the data
        const users = data.map(row => {
            // Map common column names to our schema
            const name = row.Name || row.name || row.NAME || row['Student Name'] || row['Full Name'];
            const regNo = row.RegNo || row.regNo || row.REGNO || row['Registration Number'] || row['Reg No'];
            const password = row.Password || row.password || row.PASSWORD || regNo; // Use regNo as default password
            const role = (row.Role || row.role || row.ROLE || 'student').toLowerCase();
            const department = row.Department || row.department || row.DEPARTMENT || row.Dept || row.dept;
            const year = parseInt(row.Year || row.year || row.YEAR || 1);

            return {
                name,
                regNo,
                password,
                role: ['student', 'teacher', 'hod', 'admin'].includes(role) ? role : 'student',
                department,
                year: isNaN(year) ? 1 : year
            };
        }).filter(user => user.name && user.regNo); // Filter out incomplete records

        if (users.length === 0) {
            return res.status(400).json({ 
                msg: 'No valid user records found. Please ensure your file has columns: Name, RegNo, Role, Department, Year' 
            });
        }

        // Use the existing bulkCreateUsers logic
        const results = {
            created: [],
            errors: [],
            skipped: []
        };

        for (const userData of users) {
            try {
                const { name, regNo, password, role, department, year } = userData;

                // Check if user already exists
                const existingUser = await User.findOne({ regNo });
                if (existingUser) {
                    results.skipped.push({
                        regNo,
                        name,
                        reason: 'User already exists'
                    });
                    continue;
                }

                // Hash password
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);

                // Create user
                const user = new User({
                    name,
                    regNo,
                    password: hashedPassword,
                    role,
                    department,
                    year
                });

                await user.save();

                results.created.push({
                    regNo: user.regNo,
                    name: user.name,
                    role: user.role
                });
            } catch (error) {
                results.errors.push({
                    regNo: userData.regNo || 'Unknown',
                    name: userData.name || 'Unknown',
                    error: error.message
                });
            }
        }

        res.json({
            message: `File upload completed. Created: ${results.created.length}, Skipped: ${results.skipped.length}, Errors: ${results.errors.length}`,
            results
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Error processing file: ' + err.message });
    }
};

// Messages Management
exports.getAllMessages = async (req, res) => {
    try {
        const { page = 1, limit = 50, groupId, senderId } = req.query;
        const query = {};
        
        if (groupId) query.groupId = groupId;
        if (senderId) query.senderId = senderId;

        const messages = await Message.find(query)
            .populate('senderId', 'name regNo role department')
            .populate('groupId', 'name type department')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Message.countDocuments(query);

        res.json({
            messages,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.deleteMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) {
            return res.status(404).json({ msg: 'Message not found' });
        }

        await Message.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Message deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Users Management
exports.getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 50, role, department, search } = req.query;
        const query = {};
        
        if (role) query.role = role;
        if (department) query.department = department;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { regNo: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await User.countDocuments(query);

        // Get user stats
        const stats = await User.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            users,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
            stats: stats.reduce((acc, stat) => {
                acc[stat._id] = stat.count;
                return acc;
            }, {})
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.createUser = async (req, res) => {
    try {
        const { name, regNo, email, password, role, department, year } = req.body;

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
            email: email || `${regNo}@college.edu`, // Default email if not provided
            password: hashedPassword,
            role,
            department,
            year
        });

        await user.save();

        // Auto-join appropriate groups
        await autoJoinGroups(user);

        // Return user without password
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json(userResponse);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.bulkCreateUsers = async (req, res) => {
    try {
        const { users } = req.body;
        const results = {
            created: [],
            errors: [],
            skipped: []
        };

        for (const userData of users) {
            try {
                const { name, regNo, password, role, department, year } = userData;

                // Check if user already exists
                const existingUser = await User.findOne({ regNo });
                if (existingUser) {
                    results.skipped.push({
                        regNo,
                        name,
                        reason: 'User already exists'
                    });
                    continue;
                }

                // Hash password
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);

                // Create user
                const user = new User({
                    name,
                    regNo,
                    password: hashedPassword,
                    role,
                    department,
                    year
                });

                await user.save();

                results.created.push({
                    regNo: user.regNo,
                    name: user.name,
                    role: user.role
                });
            } catch (error) {
                results.errors.push({
                    regNo: userData.regNo || 'Unknown',
                    name: userData.name || 'Unknown',
                    error: error.message
                });
            }
        }

        res.json({
            message: `Bulk creation completed. Created: ${results.created.length}, Skipped: ${results.skipped.length}, Errors: ${results.errors.length}`,
            results
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { name, role, department, year } = req.body;
        
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { name, role, department, year },
            { new: true }
        ).select('-password');

        res.json(updatedUser);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Remove user from all groups
        await Group.updateMany(
            { members: req.params.id },
            { $pull: { members: req.params.id } }
        );

        // Delete user's messages
        await Message.deleteMany({ senderId: req.params.id });

        // Delete user
        await User.findByIdAndDelete(req.params.id);

        res.json({ msg: 'User deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Groups Management
exports.getAllGroups = async (req, res) => {
    try {
        const { page = 1, limit = 50, type, department, search } = req.query;
        const query = {};
        
        if (type) query.type = type;
        if (department) query.department = department;
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const groups = await Group.find(query)
            .populate('createdBy', 'name regNo role')
            .populate('members', 'name regNo role')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Group.countDocuments(query);

        // Get group stats
        const stats = await Group.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            groups,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
            stats: stats.reduce((acc, stat) => {
                acc[stat._id] = stat.count;
                return acc;
            }, {})
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.updateGroup = async (req, res) => {
    try {
        const { name, description, type, department } = req.body;
        
        const group = await Group.findById(req.params.id);
        if (!group) {
            return res.status(404).json({ msg: 'Group not found' });
        }

        const updatedGroup = await Group.findByIdAndUpdate(
            req.params.id,
            { name, description, type, department },
            { new: true }
        ).populate('createdBy', 'name regNo role')
         .populate('members', 'name regNo role');

        res.json(updatedGroup);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.deleteGroup = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) {
            return res.status(404).json({ msg: 'Group not found' });
        }

        // Delete all messages in the group
        await Message.deleteMany({ groupId: req.params.id });

        // Delete group
        await Group.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Group deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Dashboard Statistics
exports.getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalGroups = await Group.countDocuments();
        const totalMessages = await Message.countDocuments();

        // Users by role
        const usersByRole = await User.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Groups by type
        const groupsByType = await Group.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Messages by date (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const messagesByDate = await Message.aggregate([
            {
                $match: {
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt'
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Recent activity
        const recentMessages = await Message.find()
            .populate('senderId', 'name regNo role')
            .populate('groupId', 'name')
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            overview: {
                totalUsers,
                totalGroups,
                totalMessages
            },
            usersByRole: usersByRole.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            groupsByType: groupsByType.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            messagesByDate,
            recentActivity: recentMessages
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};