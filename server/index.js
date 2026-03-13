const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();

const authRoutes = require('./routes/authRoute');
const projectRoutes = require('./routes/projectRoute');
const adminRoutes = require('./routes/adminRoute');
const engineRoutes = require('./routes/engineRoute');

// --- 1. BULLETPROOF CORS SETUP ---
app.use((req, res, next) => {
    const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://echoly-tau.vercel.app"
    ];

    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-auth-token, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    next();
});

// --- 2. BODY PARSERS ---
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- TEMP FOLDER CLEANUP ---
const tempDir = 'temp_uploads';
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
const cleanTempFolder = () => {
    fs.readdirSync(tempDir).forEach(file => {
        try { fs.unlinkSync(path.join(tempDir, file)); } 
        catch (err) { console.error(`Error deleting ${file}:`, err); }
    });
    console.log("Clarified: 🧹 Temp Folder Cleansed");
};
cleanTempFolder();

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/repurposer')
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- ROUTE MOUNTING ---
app.use('/api/auth', authRoutes);
app.use('/api', projectRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', engineRoutes);

// --- SERVER INITIALIZATION ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}...`);
});