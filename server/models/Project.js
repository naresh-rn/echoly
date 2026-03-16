const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    source: {
        type: { type: String, enum: ['YOUTUBE', 'BLOG', 'TEXT', 'FILE'], required: true },
        url: String,
        publicId: String,
        rawTranscript: String
    },
    configuration: {
        tone: { type: String, default: 'PROFESSIONAL' },
        language: { type: String, default: 'EN' },
        useHashtags: { type: Boolean, default: false }
    },
    assets: [
        {
            platform: String,
            content: String,
            status: { type: String, default: 'COMPLETED' },
            generatedAt: { type: Date, default: Date.now }
        }
    ],
    status: { type: String, default: 'COMPLETED' },
    createdAt: { type: Date, default: Date.now }
}, { collection: 'projects' });
// Add compound index for fast queries by user and sort by creation date
ProjectSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Project', ProjectSchema);