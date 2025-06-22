require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Group = require('./models/Group');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected for test user creation');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    }
};

const testUsers = [
    // Admin User
    {
        name: 'Admin User',
        regNo: 'ADMIN001',
        email: 'admin@college.edu',
        password: 'admin123',
        role: 'admin',
        department: 'Computer Science',
        year: 4
    },
    
    // Faculty
    {
        name: 'Dr. Rajesh Kumar',
        regNo: 'TEACH001',
        email: 'rajesh@college.edu',
        password: 'faculty123',
        role: 'faculty',
        department: 'Computer Science',
        year: 1
    },
    {
        name: 'Prof. Priya Sharma',
        regNo: 'TEACH002',
        email: 'priya@college.edu',
        password: 'faculty123',
        role: 'faculty',
        department: 'Information Technology',
        year: 1
    },
    
    // HOD
    {
        name: 'Dr. Amit Singh',
        regNo: 'HOD001',
        email: 'amit.hod@college.edu',
        password: 'hod123',
        role: 'hod',
        department: 'Computer Science',
        year: 1
    },
    
    // Students
    {
        name: 'Rahul Verma',
        regNo: 'STU001',
        email: 'rahul@college.edu',
        password: 'student123',
        role: 'student',
        department: 'Computer Science',
        year: 3
    },
    {
        name: 'Anita Patel',
        regNo: 'STU002',
        email: 'anita@college.edu',
        password: 'student123',
        role: 'student',
        department: 'Information Technology',
        year: 2
    },
    {
        name: 'Vikash Kumar',
        regNo: 'STU003',
        email: 'vikash@college.edu',
        password: 'student123',
        role: 'student',
        department: 'Computer Science',
        year: 1
    },
    {
        name: 'Deepika Singh',
        regNo: 'STU004',
        email: 'deepika@college.edu',
        password: 'student123',
        role: 'student',
        department: 'Electronics',
        year: 2
    },
    {
        name: 'Arjun Gupta',
        regNo: 'STU005',
        email: 'arjun@college.edu',
        password: 'student123',
        role: 'student',
        department: 'Mechanical',
        year: 4
    }
];

const testGroups = [
    {
        name: 'CS General',
        description: 'General discussion for Computer Science department',
        type: 'department',
        department: 'Computer Science'
    },
    {
        name: 'IT Hub',
        description: 'Information Technology department discussions',
        type: 'department',
        department: 'Information Technology'
    },
    {
        name: 'CS Third Year',
        description: 'Computer Science third year class group',
        type: 'class',
        department: 'Computer Science',
        year: 3
    },
    {
        name: 'College Announcements',
        description: 'Official college announcements and notices',
        type: 'general'
    },
    {
        name: 'Tech Events',
        description: 'Technical events and competitions',
        type: 'general'
    }
];

const createTestUsers = async () => {
    try {
        console.log('🧪 Creating test users...\n');
        
        // Clear existing test users (optional)
        const existingTestUsers = await User.find({
            regNo: { $in: testUsers.map(u => u.regNo) }
        });
        
        if (existingTestUsers.length > 0) {
            console.log('⚠️  Found existing test users. Removing them first...');
            await User.deleteMany({
                regNo: { $in: testUsers.map(u => u.regNo) }
            });
            console.log('✅ Existing test users removed\n');
        }

        // Create new test users
        const createdUsers = [];
        
        for (const userData of testUsers) {
            const { password, ...userInfo } = userData;
            
            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            
            // Create user
            const user = new User({
                ...userInfo,
                password: hashedPassword
            });
            
            await user.save();
            createdUsers.push(user);
            
            console.log(`✅ Created ${userData.role}: ${userData.name} (${userData.regNo})`);
        }
        
        console.log(`\n🎉 Successfully created ${createdUsers.length} test users!\n`);
        
        // Display login credentials
        console.log('📋 TEST LOGIN CREDENTIALS:');
        console.log('=' .repeat(50));
        
        testUsers.forEach(user => {
            console.log(`${user.role.toUpperCase().padEnd(8)} | ${user.regNo.padEnd(10)} | ${user.password}`);
        });
        
        console.log('=' .repeat(50));
        console.log('\n🔐 ADMIN ACCESS:');
        console.log('URL: http://localhost:5173/admin-login');
        console.log('Username: ADMIN001');
        console.log('Password: admin123');
        
        return createdUsers;
        
    } catch (error) {
        console.error('❌ Error creating test users:', error.message);
        throw error;
    }
};

const createTestGroups = async (users) => {
    try {
        console.log('\n🏘️  Creating test groups...\n');
        
        // Get admin user to be group creator
        const adminUser = users.find(u => u.role === 'admin');
        
        // Clear existing test groups (optional)
        const existingGroups = await Group.find({
            name: { $in: testGroups.map(g => g.name) }
        });
        
        if (existingGroups.length > 0) {
            console.log('⚠️  Found existing test groups. Removing them first...');
            await Group.deleteMany({
                name: { $in: testGroups.map(g => g.name) }
            });
            console.log('✅ Existing test groups removed\n');
        }
        
        const createdGroups = [];
        
        for (const groupData of testGroups) {
            // Find eligible members for this group
            let eligibleUsers = [];
            
            if (groupData.type === 'general') {
                eligibleUsers = users; // All users
            } else if (groupData.type === 'department') {
                eligibleUsers = users.filter(u => u.department === groupData.department);
            } else if (groupData.type === 'class') {
                eligibleUsers = users.filter(u => 
                    u.department === groupData.department && u.year === groupData.year
                );
            }
            
            const group = new Group({
                ...groupData,
                createdBy: adminUser._id,
                members: eligibleUsers.map(u => u._id)
            });
            
            await group.save();
            createdGroups.push(group);
            
            console.log(`✅ Created group: ${groupData.name} (${eligibleUsers.length} members)`);
        }
        
        console.log(`\n🎉 Successfully created ${createdGroups.length} test groups!\n`);
        
        return createdGroups;
        
    } catch (error) {
        console.error('❌ Error creating test groups:', error.message);
        throw error;
    }
};

const main = async () => {
    try {
        await connectDB();
        
        console.log('🚀 Starting test data creation...\n');
        
        const users = await createTestUsers();
        const groups = await createTestGroups(users);
        
        console.log('✨ TEST DATA CREATION COMPLETE! ✨\n');
        console.log('🔗 Quick Links:');
        console.log('👤 User Login: http://localhost:5173/login');
        console.log('🛡️  Admin Login: http://localhost:5173/admin-login');
        console.log('📱 Main App: http://localhost:5173\n');
        
        console.log('💡 Test with different roles:');
        console.log('- Students: STU001, STU002, STU003 (password: student123)');
        console.log('- Faculty: TEACH001 (password: faculty123)');
        console.log('- HOD: HOD001 (password: hod123)');
        console.log('- Admin: ADMIN001 (password: admin123)\n');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Failed to create test data:', error.message);
        process.exit(1);
    }
};

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { createTestUsers, createTestGroups }; 