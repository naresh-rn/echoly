const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

const authRoutes = require('./routes/authRoute');
const projectRoutes = require('./routes/projectRoute');
const adminRoutes = require('./routes/adminRoute');
const engineRoutes = require('./routes/engineRoute');

console.log(`[SYSTEM] Starting server from: ${__dirname}`);
console.log(`[DATABASE] Target URI: ${process.env.MONGO_URI ? process.env.MONGO_URI.split('@')[1] : 'UNDEFINED'}`);

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
const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            console.error('❌ MONGO_URI is not defined in environment variables.');
            return;
        }

        console.log(`[DATABASE] Attempting to connect to: ${uri.split('@')[1] || 'URL Hidden'}`);
        
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000, // Fail after 5 seconds instead of 30
            socketTimeoutMS: 45000,
        });
        
        console.log('✅ Connected to MongoDB established successfully');
    } catch (err) {
        console.error('❌ FATAL: MongoDB Connection Failed');
        console.error(`Reason: ${err.message}`);
        // Log more details if it's a timeout
        if (err.name === 'MongooseServerSelectionError') {
            console.error('Tip: Check if your Railway database is active and accepting connections from your current IP.');
        }
    }
};

connectDB();

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