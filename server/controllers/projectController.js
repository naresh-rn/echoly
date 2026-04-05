const Project = require('../models/Project');
const cloudinary = require('cloudinary').v2;

const getHistory = async (req, res) => {
    try {
        const history = await Project.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(history);
    } catch (e) {
        res.status(500).json({ msg: "Server Error" });
    }
};

const getProjectById = async (req, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.projectId, userId: req.user.id });
        if (!project) return res.status(404).json({ error: "Project not found" });
        res.json(project);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

const updateAsset = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { platform, content } = req.body;

        const updatedProject = await Project.findOneAndUpdate(
            { _id: projectId, userId: req.user.id, "assets.platform": platform.toUpperCase() },
            { $set: { "assets.$.content": content } },
            { new: true }
        );

        if (!updatedProject) return res.status(404).json({ error: "Asset or Project not found" });

        res.json({ success: true, message: "Asset updated successfully" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

const deleteProject = async (req, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.id, userId: req.user.id });
        if (!project) return res.status(404).json({ error: "Project not found" });

        if (project.source.publicId) {
            await cloudinary.uploader.destroy(project.source.publicId);
        }

        await Project.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Project wiped." });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

const deleteAsset = async (req, res) => {
    try {
        const { projectId, platform } = req.params;
        const updatedProject = await Project.findOneAndUpdate(
            { _id: projectId, userId: req.user.id },
            { $pull: { assets: { platform: platform.toUpperCase() } } },
            { new: true }
        );
        res.json({ success: true, assets: updatedProject.assets });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

const deleteAllHistory = async (req, res) => {
    try {
        await Project.deleteMany({ userId: req.user.id });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false });
    }
};


module.exports = {
    getHistory,
    getProjectById,
    updateAsset,
    deleteProject,
    deleteAsset,
    deleteAllHistory
};
