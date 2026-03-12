const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
const multer = require('multer');
const ffmpegPath = require('ffmpeg-static');
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
const { GoogleGenerativeAI } = require("@google/generative-ai");
const pdf = require('pdf-parse'); 
const { YoutubeTranscript } = require('youtube-transcript');

require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- MODELS ---
const User = require('./models/User');
const app = express();

// --- 1. BULLETPROOF CORS SETUP ---
app.use((req, res, next) => {
    const allowedOrigins = [
        "http://localhost:3000",
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

// --- DIRECTORY SETUP & CLEANUP ---
const tempDir = 'temp_uploads';
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

const cleanTempFolder = () => {
    fs.readdirSync(tempDir).forEach(file => {
        try {
            fs.unlinkSync(path.join(tempDir, file));
        } catch (err) {
            console.error(`Error deleting ${file}:`, err);
        }
    });
    console.log("Clarified: 🧹 Temp Folder Cleansed");
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
        publicId: String,
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

const Project = mongoose.model('Project', ProjectSchema);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
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

// REGISTER
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        user = new User({ name, email, password });
        await user.save();

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.status(200).json({
            token,
            user: { id: user._id, email: user.email, name: user.name }
        });
    } catch (err) {
        console.error("DEBUGGING ERROR:", err);
        res.status(500).json({
            msg: 'Server Error',
            actualError: err.message
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

// VERIFY
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
    { id: 'linkedin', prompt: "LinkedIn Ghostwriter. Use PAS framework. Professional hook. No markdown" },
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
    let attempts = 0;
    const maxAttempts = 3;

    // ADD THIS: Pre-clean the text for the AI
    const systemPrompt = `
        ${config.prompt} 
        Tone: ${tone}. 
        IMPORTANT: The source text may be from a PDF or Scraper and contain messy artifacts like page numbers, headers, or broken lines. 
        IGNORE any metadata/headers and focus ONLY on the core message. 
        Return ONLY the final post. No markdown headers.
    `;

    while (attempts < maxAttempts) {
        try {
            const completion = await groq.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: text.substring(0, 8000) } // Increased context window
                ],
                model: "llama-3.1-8b-instant",
            });

            let cleanResult = completion.choices[0].message.content;
            cleanResult = cleanResult.replace(/\*\*/g, '').replace(/#+/g, '');
            return cleanResult;
        } catch (error) {
            if (error.status === 429 && attempts < maxAttempts - 1) {
                attempts++;
                const waitTime = 2000 * attempts;
                console.log(`🐢 Rate limit hit. Retrying in ${waitTime}ms...`);
                await sleep(waitTime);
            } else {
                throw error;
            }
        }
    }
}

// --- PROJECT ENGINE ROUTES ---

// 1. Add this at the very top of index.js (after your other requires)

// 2. The Full Route
app.post('/api/repurpose-all', auth, upload.single('file'), async (req, res) => {
    // --- SSE HEADERS FOR REAL-TIME UPDATES ---
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendUpdate = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Track file path for cleanup in finally block
    const filePath = req.file ? req.file.path : null;

    try {
        const { type, content, tone } = req.body;
        let textToProcess = "";
        let cloudUrl = "TEXT_INPUT";
        let cloudId = null;

        sendUpdate({ status: "Initializing Engine...", progress: 5 });

        // --- 1. EXTRACTION LAYER ---
        if (req.file) {
            const mimetype = req.file.mimetype;

            if (mimetype.includes('audio') || mimetype.includes('video')) {
                sendUpdate({ status: "Uploading Media for Analysis...", progress: 10 });
                
                // Cloudinary upload (Resource type 'auto' handles audio and video)
                const cloudRes = await cloudinary.uploader.upload(filePath, { 
                    resource_type: "auto",
                    folder: "echoly_media" 
                });
                cloudUrl = cloudRes.secure_url;
                cloudId = cloudRes.public_id;

                sendUpdate({ status: "Transcribing with Whisper AI...", progress: 15 });
                const transcription = await groq.audio.transcriptions.create({
                    file: fs.createReadStream(filePath),
                    model: "whisper-large-v3"
                });
                textToProcess = transcription.text;
            } 
            else if (mimetype === 'application/pdf') {
                sendUpdate({ status: "Parsing PDF Document...", progress: 15 });
                const dataBuffer = fs.readFileSync(filePath);
                const pdfData = await pdf(dataBuffer);
                textToProcess = pdfData.text;
                cloudUrl = "PDF_DOCUMENT";
            } 
            else {
                // Default for .txt, .doc, etc.
                sendUpdate({ status: "Reading File Content...", progress: 15 });
                textToProcess = fs.readFileSync(filePath, 'utf8');
                cloudUrl = "DOC_FILE";
            }
        } 
else if (type === 'youtube') {
            sendUpdate({ status: "Analyzing YouTube URL...", progress: 10 });
            
            const extractVideoId = (url) => {
                const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
                return match ? match[1] : null;
            };

            const videoId = extractVideoId(content);
            if (!videoId) throw new Error("Invalid YouTube URL. Please provide a standard link or Shorts link.");

            cloudUrl = content; 

            try {
                sendUpdate({ status: "Extracting official video transcript...", progress: 40 });
                
                const transcriptArr = await YoutubeTranscript.fetchTranscript(videoId);
                if (!transcriptArr || transcriptArr.length === 0) {
                    throw new Error("No captions found.");
                }

                textToProcess = transcriptArr.map(t => t.text).join(" ").replace(/\s+/g, " ").trim();
                sendUpdate({ status: "Transcript extracted successfully!", progress: 50 });

            } catch (err) {
                console.log("YoutubeTranscript failed, initiating yt-dlp audio fallback...");
                sendUpdate({ status: "Bypassing YouTube security blocks...", progress: 30 });
                
                try {
                    const audioPath = path.join(tempDir, `${videoId}.mp3`);
                    
                    await yt(content, {
                        extractAudio: true,
                        audioFormat: 'mp3',
                        output: audioPath,
                        format: 'worstaudio', 
                        noCheckCertificates: true,
                        noWarnings: true,
                        ffmpegLocation: ffmpegPath,
                        // ✨ CRITICAL FIX: This flag bypasses YouTube's bot protection on Render!
                        extractorArgs: 'youtube:player_client=android'
                    });

                    sendUpdate({ status: "Transcribing audio with Whisper AI...", progress: 45 });
                    
                    const transcription = await groq.audio.transcriptions.create({
                        file: fs.createReadStream(audioPath),
                        model: "whisper-large-v3"
                    });
                    
                    textToProcess = transcription.text;

                    if (fs.existsSync(audioPath)) {
                        fs.unlinkSync(audioPath);
                    }

                    if (!textToProcess || textToProcess.length < 10) {
                         throw new Error("Transcription resulted in empty text.");
                    }

                    sendUpdate({ status: "Audio transcribed successfully!", progress: 50 });
                } catch (fallbackErr) {
                    console.error("YouTube Fallback Failed:", fallbackErr.message);
                    // A much friendlier error message if it still fails
                    throw new Error("YouTube's bot protection is too strong for this specific video. Please download the video locally and use the 'Upload' tab instead!");
                }
            }
        }
        else if (type === 'blog') {
            sendUpdate({ status: "Scraping Article Content...", progress: 10 });
            try {
                const { data } = await axios.get(content, {
                    timeout: 10000,
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
                });
                const $ = cheerio.load(data);
                $('nav, footer, script, style, ad, .comments').remove();
                textToProcess = $('article').text() || $('main').text() || $('body').text();
                cloudUrl = content;
            } catch (err) {
                throw new Error("Failed to scrape the article. The website may be protected.");
            }
        } 
        else {
            // Manual Text Input
            textToProcess = content;
        }

        // --- VALIDATION ---
        if (!textToProcess || textToProcess.trim().length < 10) {
            throw new Error("The source provided contains no readable text.");
        }

        sendUpdate({ status: "Content Secured. Beginning AI Synthesis...", progress: 20 });

        // --- 2. AI GENERATION LAYER ---
        const assetList = [];
        const bundle = {};

        for (let i = 0; i < PLATFORMS_CONFIG.length; i++) {
            const p = PLATFORMS_CONFIG[i];
            // Progress scales from 20% to 95% across all platforms
            const currentProgress = 20 + Math.round(((i + 1) / PLATFORMS_CONFIG.length) * 75);

            try {
                const aiResult = await generatePlatformText(p.id, textToProcess, tone);

                sendUpdate({
                    status: `Generated ${p.id.toUpperCase()} Asset`,
                    progress: currentProgress,
                    partialResult: {
                        platform: p.id.toLowerCase(),
                        content: aiResult
                    }
                });

                assetList.push({ 
                    platform: p.id.toUpperCase(), 
                    content: aiResult,
                    generatedAt: new Date()
                });
                bundle[p.id.toLowerCase()] = aiResult;

                // Essential delay to prevent Groq Rate Limit (429) errors
                await new Promise(r => setTimeout(r, 1200));
            } catch (genErr) {
                console.error(`Error generating for ${p.id}:`, genErr.message);
                // Continue to next platform even if one fails
            }
        }

        // --- 3. FINAL SAVE TO DATABASE ---
        sendUpdate({ status: "Archiving to Vault...", progress: 98 });
        
        const projectTitle = req.file ? req.file.originalname : 
                           (type === 'text' ? 'Text Draft' : 
                           (type === 'youtube' || type === 'blog' ? content.split('/').pop().substring(0, 40) : 'Untitled Project'));

        const project = new Project({
            userId: req.user.id,
            title: projectTitle || "New Project",
            source: {
                type: type.toUpperCase(),
                url: cloudUrl,
                publicId: cloudId,
                rawTranscript: textToProcess
            },
            configuration: {
                tone: tone.toUpperCase()
            },
            assets: assetList,
            status: 'COMPLETED'
        });

        await project.save();

        // Final Success Update
        sendUpdate({
            success: true,
            bundle,
            projectId: project._id,
            rawTranscript: textToProcess,
            progress: 100,
            status: "All Assets Ready!"
        });

        res.end();

    } catch (e) {
        console.error("❌ ENGINE FAILURE:", e.message);
        sendUpdate({ 
            error: e.message,
            status: "Engine Stopped"
        });
        res.end();
    } finally {
        // ALWAYS cleanup temp files regardless of success or failure
        if (filePath && fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (err) {
                console.error("Failed to delete temp file:", err);
            }
        }
    }
});

// --- DASHBOARD ROUTES ---

app.get('/api/history', auth, async (req, res) => {
    try {
        const history = await Project.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(history);
    } catch (e) {
        res.status(500).json({ msg: "Server Error" });
    }
});

app.put('/api/projects/:projectId/asset', auth, async (req, res) => {
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
});

app.delete('/api/projects/:id', auth, async (req, res) => {
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
});

app.delete('/api/projects/:projectId/asset/:platform', auth, async (req, res) => {
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
});

// --- IMAGE GENERATION ---

app.post('/api/generate-image-prompt', auth, async (req, res) => {
    try {
        const { content } = req.body;
        const response = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a professional prompt engineer. Return ONLY a 20-word visual description. DO NOT use quotes, DO NOT use bolding. Just raw text."
                },
                { role: "user", content: `Context: ${content}` }
            ],
            model: "llama-3.1-8b-instant",
        });

        let prompt = response.choices[0].message.content.replace(/["'**#]/g, '').replace(/\n/g, ' ').trim();
        res.json({ prompt });
    } catch (error) {
        res.status(500).json({ error: "Failed to create prompt" });
    }
});

app.post('/api/generate-image', auth, async (req, res) => {
    try {
        const { prompt } = req.body;
        const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
        const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

        if (!ACCOUNT_ID || !API_TOKEN) {
            return res.status(500).json({ error: "Cloudflare credentials missing." });
        }

        const brainResponse = await groq.chat.completions.create({
            messages: [
                { 
                role: "system", 
                content: "You are a professional 3D artist. Create a high-end, minimalist technical scene description. Style: Frosted glass, glowing edges, isometric view, 8k render, Unreal Engine 5 aesthetic. NO text, NO people." 
                },
                { role: "user", content: `Create a visual for this topic: ${prompt.substring(0, 200)}` }
            ],
            model: "llama-3.1-8b-instant",
        });

        const visualPrompt = brainResponse.choices[0].message.content.replace(/["']/g, "");

        const response = await axios({
            url: `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`,
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_TOKEN}`,
                "Content-Type": "application/json",
            },
            data: JSON.stringify({
                prompt: visualPrompt,
                num_steps: 20
            }),
            responseType: 'arraybuffer',
        });

        const base64Image = Buffer.from(response.data).toString('base64');
        res.json({
            imageData: base64Image,
            mimeType: "image/png"
        });

    } catch (error) {
        if (error.response && error.response.data) {
            const errDesc = Buffer.from(error.response.data).toString();
            console.error("❌ Cloudflare API Error:", errDesc);
        } else {
            console.error("❌ Request Error:", error.message);
        }
        res.status(500).json({ error: "Cloudflare failed to generate image." });
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

app.post('/api/repurpose-single', auth, async (req, res) => {
    try {
        const { projectId, platformId, tone } = req.body;
        
        // 1. Find the project and ensure it belongs to this user
        const project = await Project.findOne({ _id: projectId, userId: req.user.id });
        if (!project) return res.status(404).json({ error: "Project not found" });

        // 2. Use the transcript already saved in the database
        // This is much faster than sending the text from the frontend again
        const newContent = await generatePlatformText(
            platformId.toLowerCase(), 
            project.source.rawTranscript, 
            tone || 'PROFESSIONAL'
        );

        // 3. Update specifically that platform in the assets array
        await Project.findOneAndUpdate(
            { _id: projectId, "assets.platform": platformId.toUpperCase() },
            { $set: { "assets.$.content": newContent, "assets.$.generatedAt": new Date() } }
        );

        res.json({ success: true, content: newContent });
    } catch (e) {
        console.error("Single Repurpose Error:", e.message);
        res.status(500).json({ error: "Failed to regenerate asset." });
    }
});

const { execSync } = require('child_process');
// const ffmpegPath = require('ffmpeg-static');

app.get('/api/diagnostics', async (req, res) => {
    const health = {
        ffmpeg: "Checking...",
        groq: "Checking...",
        database: mongoose.connection.readyState === 1 ? "✅ Connected" : "❌ Disconnected"
    };

    // 1. Test FFmpeg
    try {
        // This runs a simple command to check if FFmpeg can execute on Render's Linux servers
        execSync(`${ffmpegPath} -version`);
        health.ffmpeg = "✅ Installed and Executable";
    } catch (err) {
        health.ffmpeg = `❌ Failed: ${err.message}`;
    }

    // 2. Test Groq API Key
    try {
        // Asks Groq for a list of models to verify the API key is valid
        await groq.models.list();
        health.groq = "✅ API Key Valid";
    } catch (err) {
        health.groq = `❌ Failed: ${err.message}`;
    }

    res.json(health);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});