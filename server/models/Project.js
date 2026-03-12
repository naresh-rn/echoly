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
    // Combined the duplicate source definitions here
    source: {
        type: { type: String, enum:['YOUTUBE', 'BLOG', 'TEXT', 'FILE'], required: true },
        url: String,
        publicId: String, // Tracks Cloudinary assets
        rawTranscript: String // Core text extracted before AI processing
    },
    configuration: {
        tone: { type: String, default: 'PROFESSIONAL' },
        language: { type: String, default: 'EN' }
    },
    assets:[
        {
            platform: String,
            content: String,
            status: { type: String, default: 'COMPLETED' },
            generatedAt: { type: Date, default: Date.now }
        }
    ],
    status: { type: String, default: 'COMPLETED' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Project', ProjectSchema);