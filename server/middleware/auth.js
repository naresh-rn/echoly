const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'COMMAND_GRID_SECRET_2026';

const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, isAdmin }
        next();
    } catch (e) {
        res.status(400).json({ msg: 'Token is not valid' });
    }
};

const adminAuth = async (req, res, next) => {
    // Re-use auth middleware first, then augment
    auth(req, res, async () => {
        try {
            const user = await User.findById(req.user.id);
            if (!user || user.isAdmin !== true) {
                return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
            }
            next();
        } catch (e) {
            res.status(500).json({ msg: 'Server error checking admin privileges' });
        }
    });
};

module.exports = { auth, adminAuth };
