const User = require('../models/User');
const Project = require('../models/Project');
const cloudinary = require('cloudinary').v2;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'COMMAND_GRID_SECRET_2026';

const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        user = new User({ name, email, password });
        await user.save();

        const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '7d' });
        res.status(200).json({
            token,
            user: { id: user._id, email: user.email, name: user.name, isAdmin: user.isAdmin }
        });
    } catch (err) {
        console.error("DEBUGGING ERROR:", err);
        res.status(500).json({
            msg: 'Server Error',
            actualError: err.message
        });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

        const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user._id, email: user.email, name: user.name, isAdmin: user.isAdmin } });
    } catch (err) {
        res.status(500).json({ msg: 'Server error during login' });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).send('Session Expired');
    }
};

const deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Find all projects to clean up Cloudinary assets
        const projects = await Project.find({ userId });
        for (const project of projects) {
            if (project.source && project.source.publicId) {
                try {
                    await cloudinary.uploader.destroy(project.source.publicId);
                } catch (cloudinaryErr) {
                    console.error(`Failed to delete cloudinary asset ${project.source.publicId}:`, cloudinaryErr);
                }
            }
        }

        // 2. Delete all projects
        await Project.deleteMany({ userId });

        // 3. Delete the user
        await User.findByIdAndDelete(userId);

        res.json({ success: true, message: "Account and associated data deleted permanently." });
    } catch (err) {
        console.error("Account Deletion Error:", err);
        res.status(500).json({ msg: 'Server error during account deletion' });
    }
};

const updateBrandVoice = async (req, res) => {
    try {
        const { brandVoice } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: { brandVoice } },
            { new: true }
        ).select('-password');
        
        res.json({ success: true, brandVoice: user.brandVoice });
    } catch (err) {
        res.status(500).json({ msg: 'Failed to update brand voice' });
    }
};

const updateApiKeys = async (req, res) => {
    try {
        const { apiKeys } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: { apiKeys } },
            { new: true }
        ).select('-password');
        
        res.json({ success: true, apiKeys: user.apiKeys });
    } catch (err) {
        res.status(500).json({ msg: 'Failed to update API Keys' });
    }
};

const updatePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid current password' });

        user.password = newPassword; // Mongoose middleware will hash this
        await user.save();

        res.json({ success: true, msg: 'Password updated successfully' });
    } catch (err) {
        console.error("Update Password Error:", err);
        res.status(500).json({ msg: 'Server error during password update' });
    }
};

module.exports = { registerUser, loginUser, getMe, deleteAccount, updateBrandVoice, updatePassword, updateApiKeys };
