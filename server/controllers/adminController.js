const User = require('../models/User');
const Project = require('../models/Project');

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (e) {
        res.status(500).json({ msg: "Server Error" });
    }
};

const getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find({}).populate('userId', 'name email').sort({ createdAt: -1 });
        res.json(projects);
    } catch (e) {
        res.status(500).json({ msg: "Server Error" });
    }
};

module.exports = { getAllUsers, getAllProjects };
