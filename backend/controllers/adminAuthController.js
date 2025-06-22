const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Admin login attempt tracking (in-memory, use Redis in production)
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 3;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Clean up old login attempts
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of loginAttempts.entries()) {
        if (now - data.lastAttempt > LOCKOUT_DURATION) {
            loginAttempts.delete(key);
        }
    }
}, 5 * 60 * 1000); // Clean every 5 minutes

// Get client IP for tracking
const getClientIP = (req) => {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null);
};

// Log security events
const logSecurityEvent = (event, details) => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        event,
        details
    };
    console.log('🛡️ ADMIN SECURITY EVENT:', JSON.stringify(logEntry, null, 2));
    
    // TODO: Send to security monitoring system
    // SecurityLogger.log(logEntry);
};

// Admin login with enhanced security
exports.adminLogin = async (req, res) => {
    const { regNo, password } = req.body;
    const clientIP = getClientIP(req);
    const userAgent = req.get('User-Agent');
    
    try {
        // Check for account lockout
        const attemptKey = `${regNo}:${clientIP}`;
        const attempts = loginAttempts.get(attemptKey);
        
        if (attempts && attempts.count >= MAX_LOGIN_ATTEMPTS) {
            const lockoutRemaining = LOCKOUT_DURATION - (Date.now() - attempts.lastAttempt);
            
            if (lockoutRemaining > 0) {
                logSecurityEvent('ADMIN_LOGIN_BLOCKED_LOCKOUT', {
                    regNo,
                    ip: clientIP,
                    attempts: attempts.count,
                    lockoutRemaining: Math.ceil(lockoutRemaining / 1000 / 60) // minutes
                });
                
                return res.status(423).json({
                    error: 'Account temporarily locked due to multiple failed attempts',
                    lockoutMinutes: Math.ceil(lockoutRemaining / 1000 / 60),
                    code: 'ACCOUNT_LOCKED'
                });
            } else {
                // Lockout expired, reset attempts
                loginAttempts.delete(attemptKey);
            }
        }

        // Find user with admin role
        const user = await User.findOne({ regNo, role: 'admin' });

        if (!user) {
            // Record failed attempt for non-existent admin
            const currentAttempts = attempts ? attempts.count + 1 : 1;
            loginAttempts.set(attemptKey, {
                count: currentAttempts,
                lastAttempt: Date.now()
            });

            logSecurityEvent('ADMIN_LOGIN_FAILED_USER_NOT_FOUND', {
                regNo,
                ip: clientIP,
                userAgent,
                attempts: currentAttempts
            });

            return res.status(401).json({
                error: 'Invalid admin credentials',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            // Record failed attempt
            const currentAttempts = attempts ? attempts.count + 1 : 1;
            loginAttempts.set(attemptKey, {
                count: currentAttempts,
                lastAttempt: Date.now()
            });

            logSecurityEvent('ADMIN_LOGIN_FAILED_WRONG_PASSWORD', {
                adminId: user._id,
                adminName: user.name,
                regNo,
                ip: clientIP,
                userAgent,
                attempts: currentAttempts
            });

            return res.status(401).json({
                error: 'Invalid admin credentials',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Successful login - clear any failed attempts
        loginAttempts.delete(attemptKey);

        // Log successful admin login
        logSecurityEvent('ADMIN_LOGIN_SUCCESS', {
            adminId: user._id,
            adminName: user.name,
            regNo: user.regNo,
            ip: clientIP,
            userAgent,
            loginTime: new Date().toISOString()
        });

        // Create JWT payload with admin-specific claims
        const payload = {
            user: {
                id: user.id,
                role: user.role,
                department: user.department
            },
            admin: true, // Special admin flag
            loginTime: Date.now(),
            ip: clientIP
        };

        // Create token with shorter expiry for admin sessions
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '4h' }, // Shorter session for admins
            (err, token) => {
                if (err) {
                    logSecurityEvent('ADMIN_JWT_GENERATION_ERROR', {
                        adminId: user._id,
                        error: err.message
                    });
                    throw err;
                }

                // Return admin data (excluding password)
                const adminData = {
                    id: user.id,
                    regNo: user.regNo,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    department: user.department
                };

                res.json({
                    token,
                    user: adminData,
                    message: 'Admin login successful',
                    sessionExpiry: '4 hours'
                });
            }
        );

    } catch (err) {
        logSecurityEvent('ADMIN_LOGIN_ERROR', {
            regNo,
            ip: clientIP,
            error: err.message
        });

        console.error('Admin login error:', err.message);
        res.status(500).json({
            error: 'Internal server error during admin authentication',
            code: 'AUTH_ERROR'
        });
    }
};

// Admin session validation (enhanced token verification)
exports.validateAdminSession = async (req, res) => {
    try {
        const token = req.header('x-auth-token') || 
                     (req.header('Authorization') && req.header('Authorization').replace('Bearer ', ''));

        if (!token) {
            return res.status(401).json({
                valid: false,
                error: 'No token provided',
                code: 'NO_TOKEN'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Additional admin session validations
        if (!decoded.admin) {
            return res.status(403).json({
                valid: false,
                error: 'Not an admin session',
                code: 'NOT_ADMIN_SESSION'
            });
        }

        // Check if user still exists and is still admin
        const user = await User.findById(decoded.user.id).select('-password');
        if (!user || user.role !== 'admin') {
            return res.status(401).json({
                valid: false,
                error: 'Admin user not found or role changed',
                code: 'ADMIN_INVALID'
            });
        }

        // Check session age (force relogin after 4 hours)
        const sessionAge = Date.now() - decoded.loginTime;
        const maxSessionAge = 4 * 60 * 60 * 1000; // 4 hours

        if (sessionAge > maxSessionAge) {
            return res.status(401).json({
                valid: false,
                error: 'Admin session expired',
                code: 'SESSION_EXPIRED'
            });
        }

        res.json({
            valid: true,
            user: {
                id: user._id,
                regNo: user.regNo,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department
            },
            sessionExpiry: new Date(decoded.loginTime + maxSessionAge)
        });

    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                valid: false,
                error: 'Admin session expired',
                code: 'TOKEN_EXPIRED'
            });
        }

        return res.status(401).json({
            valid: false,
            error: 'Invalid admin session',
            code: 'INVALID_TOKEN'
        });
    }
};

// Admin logout with session cleanup
exports.adminLogout = async (req, res) => {
    try {
        const clientIP = getClientIP(req);
        
        logSecurityEvent('ADMIN_LOGOUT', {
            adminId: req.user.id,
            adminName: req.currentUser?.name,
            ip: clientIP,
            logoutTime: new Date().toISOString()
        });

        res.json({
            message: 'Admin logged out successfully'
        });

    } catch (err) {
        console.error('Admin logout error:', err.message);
        res.status(500).json({
            error: 'Error during admin logout',
            code: 'LOGOUT_ERROR'
        });
    }
};

// Get admin login attempts info (for security monitoring)
exports.getLoginAttempts = async (req, res) => {
    try {
        const attempts = Array.from(loginAttempts.entries()).map(([key, data]) => {
            const [regNo, ip] = key.split(':');
            return {
                regNo,
                ip,
                attempts: data.count,
                lastAttempt: new Date(data.lastAttempt),
                isLocked: data.count >= MAX_LOGIN_ATTEMPTS
            };
        });

        res.json({
            currentAttempts: attempts,
            maxAttempts: MAX_LOGIN_ATTEMPTS,
            lockoutDuration: LOCKOUT_DURATION / 1000 / 60 // in minutes
        });

    } catch (err) {
        console.error('Error getting login attempts:', err.message);
        res.status(500).json({
            error: 'Error retrieving login attempts',
            code: 'ATTEMPTS_ERROR'
        });
    }
}; 