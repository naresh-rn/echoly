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
        rawTranscript: String // The core text extracted before AI processing
    },
    
    configuration: {
        tone: { type: String, default: 'PROFESSIONAL' },
        language: { type: String, default: 'EN' }
    },
    // Assets are stored as an array of objects within the Project
    assets: [
        {
            platform: String,
            content: String,
            status: { type: String, default: 'COMPLETED' },
            generatedAt: { type: Date, default: Date.now }
        }
    ],
    status: { type: String, default: 'COMPLETED' },
    createdAt: { type: Date, default: Date.now },
    source: {
        type: { type: String },
        url: { type: String },
        publicId: { type: String }, // <--- Add this to track Cloudinary assets
        rawTranscript: { type: String }
  },
});

module.exports = mongoose.model('Project', ProjectSchema);