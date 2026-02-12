const mongoose = require('mongoose');

const AssetSchema = new mongoose.Schema({
    originalContent: { type: String, required: true },
    generatedContent: { type: String, required: true },
    platform: { type: String, default: 'LinkedIn' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Asset', AssetSchema);