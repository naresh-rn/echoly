const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const yt = require('yt-dlp-exec');
const cheerio = require('cheerio');
const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Readable } = require('stream');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// --- MODELS ---
const User = require('./models/User');
// --- DIRECTORY SETUP & CLEANUP ---
const tempDir = 'temp_uploads';
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

// Wipe temp folder on server start to ensure a clean state
const cleanTempFolder = () => {
    fs.readdirSync(tempDir).forEach(file => fs.unlinkSync(path.join(tempDir, file)));
    console.log("🧹 Temp Folder Cleansed");
};
cleanTempFolder();
// --- PROJECT SCHEMA ---
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
        rawTranscript: String 
    },
    configuration: {
        tone: { type: String, default: 'PROFESSIONAL' },
        language: { type: String, default: 'EN' }
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
});



cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
// Fixed: Define the model as a constant so it's accessible in the routes below
const Project = mongoose.model('Project', ProjectSchema);

// --- MIDDLEWARE ---

const allowedOrigins = [
  'https://echoly-tau.vercel.app', // Your Vercel URL
  'http://localhost:3000',          // Local development
  'http://localhost:5173'           // Vite local development
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// 4. Body Parsers (Cleaned up: only use the 50mb one)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
// Remove: const upload = multer({ dest: 'uploads/' });
// Replace with:
const upload = multer({ dest: tempDir + '/' });
const JWT_SECRET = process.env.JWT_SECRET || 'COMMAND_GRID_SECRET_2026';

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/repurposer')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- AUTH MIDDLEWARE ---
const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        res.status(400).json({ msg: 'Token is not valid' });
    }
};

// --- AUTH ROUTES ---
// --- AUTH ROUTES ---
// --- AUTH ROUTES ---

// REGISTER
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        // DO NOT hash the password here. 
        // Just pass it to the model. The model's .pre('save') handles it.
        user = new User({ name, email, password });
        await user.save();

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.status(200).json({ 
            token, 
            user: { id: user._id, email: user.email, name: user.name } 
        });
    } catch (err) {
        console.error("DEBUGGING ERROR:", err); // Look at your terminal for this!
    res.status(500).json({ 
        msg: 'Server Error', 
        actualError: err.message // This sends the secret error to your browser console
    });
    }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
    } catch (err) {
        res.status(500).json({ msg: 'Server error during login' });
    }
});

// VERIFY (The Me Route)
app.get('/api/auth/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).send('Session Expired');
    }
});
// --- PLATFORM CONFIG ---
const PLATFORMS_CONFIG = [
  { id: 'linkedin', prompt: "LinkedIn Ghostwriter. Use PAS framework. Professional hook." },
  { id: 'twitter', prompt: "Viral X thread writer. 5-7 punchy posts." },
  { id: 'instagram', prompt: "Instagram Strategist. Caption and Story script." },
  { id: 'tiktok', prompt: "TikTok scriptwriter. 40-second viral script." },
  { id: 'newsletter', prompt: "Newsletter Editor. Subject line + executive summary." },
  { id: 'blog', prompt: "SEO tech blogger. 400-word draft." },
  { id: 'threads', prompt: "Conversational Threads influencer." },
  { id: 'facebook', prompt: "Community Manager. Story-driven post." },
  { id: 'pinterest', prompt: "Pinterest SEO. Title and Description." },
  { id: 'youtube', prompt: "YouTube Manager. Community tab update." },
  { id: 'medium', prompt: "Thought Leadership Writer. Narrative summary." },
  { id: 'reddit', prompt: "Expert Redditor. Subreddit-ready formatting." }
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- AI GENERATION ENGINE ---
async function generatePlatformText(platformId, text, tone) {
    const config = PLATFORMS_CONFIG.find(p => p.id === platformId);
    
    // Attempt the API call with retries
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        try {
            const completion = await groq.chat.completions.create({
                messages: [
                    { 
                        role: "system", 
                        content: `${config.prompt} Tone: ${tone}. Be concise.` 
                    },
                    // TRUNCATE MORE AGGRESSIVELY: 1000 chars is usually enough for a social post
                    { role: "user", content: text.substring(0, 1000) } 
                ],
                model: "llama-3.1-8b-instant", 
            });
            return completion.choices[0].message.content;
        } catch (error) {
            if (error.status === 429 && attempts < maxAttempts - 1) {
                attempts++;
                const waitTime = 2000 * attempts; // Wait 2s, then 4s...
                console.log(`🐢 Rate limit hit. Retrying in ${waitTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
                throw error; // If not a 429 or out of retries, fail
            }
        }
    }
}

// --- PROJECT ENGINE ROUTES ---
// ... (Your imports remain the same)

// Unified Repurpose Route
app.post('/api/repurpose-all', auth, upload.single('file'), async (req, res) => {
    // 1. SETUP SSE (Server-Sent Events) HEADERS
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Helper to send data chunks to the frontend
    const sendUpdate = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
        const { type, content, tone } = req.body;
        let textToProcess = "";
        let cloudUrl = "TEXT_INPUT";
        let cloudId = null;

        sendUpdate({ status: "Initializing Engine...", progress: 5 });

        // --- 2. EXTRACTION LAYER ---
        if (req.file) {
            sendUpdate({ status: "Uploading Audio to Cloud...", progress: 10 });
            const ext = path.extname(req.file.originalname);
            const safePath = req.file.path + ext;
            fs.renameSync(req.file.path, safePath);

            const cloudRes = await cloudinary.uploader.upload(safePath, { resource_type: "auto" });
            
            sendUpdate({ status: "Transcribing with AI...", progress: 15 });
            const transcription = await groq.audio.transcriptions.create({
                file: fs.createReadStream(safePath),
                model: "whisper-large-v3"
            });
            
            textToProcess = transcription.text;
            cloudUrl = cloudRes.secure_url;
            cloudId = cloudRes.public_id;
            fs.unlinkSync(safePath);

        } else if (type === 'youtube') {
            sendUpdate({ status: "Downloading YouTube Audio...", progress: 10 });
            const ytPath = path.join(tempDir, `yt-${Date.now()}.mp3`);
            await yt(content, { extractAudio: true, audioFormat: 'mp3', output: ytPath });
            
            sendUpdate({ status: "Transcribing Video Content...", progress: 15 });
            const transcription = await groq.audio.transcriptions.create({
                file: fs.createReadStream(ytPath),
                model: "whisper-large-v3"
            });
            textToProcess = transcription.text;
            fs.unlinkSync(ytPath);

        } else if (type === 'blog') {
            sendUpdate({ status: "Scraping Blog Content...", progress: 10 });
            const { data } = await axios.get(content, { 
                timeout: 10000,
                headers: { 'User-Agent': 'Mozilla/5.0' } 
            });
            const $ = cheerio.load(data);
            $('nav, footer, script, style').remove(); // Clean junk
            textToProcess = $('article').text() || $('main').text() || $('body').text();

        } else {
            textToProcess = content;
        }

        // --- 3. VALIDATION ---
        if (!textToProcess || textToProcess.length < 10) {
            sendUpdate({ error: "Source content too short." });
            return res.end();
        }

        sendUpdate({ status: "Source Verified. Starting AI Generation...", progress: 20 });

        // --- 4. SEQUENTIAL GENERATION LOOP ---
        const assetList = [];
        const bundle = {};

        for (let i = 0; i < PLATFORMS_CONFIG.length; i++) {
            const p = PLATFORMS_CONFIG[i];
            const currentProgress = 20 + Math.round(((i + 1) / PLATFORMS_CONFIG.length) * 75);

            // Trigger AI Generation for this platform
            const aiResult = await generatePlatformText(p.id, textToProcess, tone);
            
            // IMMEDIATE UPDATE: Push this specific card to the frontend right now
            sendUpdate({ 
                status: `${p.id.toUpperCase()} Generated!`, 
                progress: currentProgress,
                partialResult: {
                    platform: p.id.toLowerCase(),
                    content: aiResult
                }
            });

            // Store for final DB save
            assetList.push({ platform: p.id.toUpperCase(), content: aiResult });
            bundle[p.id.toLowerCase()] = aiResult;

            // Optional: Short delay to prevent hitting API rate limits too hard
            await sleep(2000); 
        }

        // --- 5. PERSISTENCE ---
        sendUpdate({ status: "Saving to Vault...", progress: 98 });
        const project = new Project({
            userId: req.user.id,
            title: req.file ? req.file.originalname : (type === 'text' ? 'Text Draft' : content.substring(0,30)),
            source: { 
                type: type.toUpperCase(), 
                url: req.file ? cloudUrl : content, 
                publicId: cloudId, 
                rawTranscript: textToProcess 
            },
            assets: assetList
        });

        await project.save();

        // --- 6. FINAL SUCCESS CHUNK ---
        sendUpdate({ 
            success: true, 
            bundle, 
            projectId: project._id, 
            progress: 100, 
            status: "Mission Accomplished" 
        });

        res.end(); // Properly close the SSE connection

    } catch (e) {
        console.error("❌ ENGINE FAILURE:", e.message);
        sendUpdate({ error: e.message });
        res.end();
    }
});

// ... (Rest of your history and delete routes remain the same)

app.get('/api/history', auth, async (req, res) => {
    try {
        const history = await Project.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(history);
    } catch (e) {
        res.status(500).json({ msg: "Server Error" });
    }
});
// --- 1. FULL PROJECT DELETE (For your Vault) ---
app.delete('/api/projects/:id', auth, async (req, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.id, userId: req.user.id });
        if (!project) return res.status(404).json({ error: "Project not found" });

        // Cleanup Cloudinary
        if (project.source.publicId) {
            await cloudinary.uploader.destroy(project.source.publicId);
        }

        await Project.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Project wiped." });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- 2. SINGLE ASSET DELETE (For your Dashboard Cards) ---
app.delete('/api/projects/:projectId/asset/:platform', auth, async (req, res) => {
    try {
        const { projectId, platform } = req.params;
        const updatedProject = await Project.findOneAndUpdate(
            { _id: projectId, userId: req.user.id },
            { $pull: { assets: { platform: platform.toUpperCase() } } }, // Removes only this platform
            { new: true }
        );
        res.json({ success: true, assets: updatedProject.assets });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/generate-image-prompt', auth, async (req, res) => {
    try {
        const { platform, content } = req.body;

        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: "You are a world-class Art Director. Create a single, highly detailed image generation prompt (for DALL-E or Midjourney) that visually represents the provided text. Focus on lighting, composition, and mood. No talk, just the prompt."
                },
                {
                    role: "user",
                    content: `Platform: ${platform}\nPost Content: ${content}`
                }
            ]
        });

        res.json({ prompt: response.choices[0].message.content });
    } catch (e) {
        res.status(500).json({ error: "Failed to generate visual prompt." });
    }
});


app.delete('/api/history', auth, async (req, res) => {
    try {
        await Project.deleteMany({ userId: req.user.id });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

const PORT = process.env.PORT || 10000; // Render likes 10000
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});