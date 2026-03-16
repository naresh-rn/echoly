const fs = require('fs');
const Project = require('../models/Project');
const User = require('../models/User');
const { generatePlatformText, PLATFORMS_CONFIG, groq, sleep, generateImagePrompt, generateImage } = require('../services/aiService');
const { processYoutubeLink, processBlogLink, uploadToCloudinary, parsePdf } = require('../services/mediaService');

const repurposeAll = async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendUpdate = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);
    const filePath = req.file ? req.file.path : null;

    try {
        const user = await User.findById(req.user.id);
        const brandVoice = user?.brandVoice || "";

        let isCancelled = false;
        req.on('close', () => {
            isCancelled = true;
        });

        const { type, content, tone, includeHashtags } = req.body;
        const useHashtags = includeHashtags === 'true' || includeHashtags === true;

        let textToProcess = "";
        let cloudUrl = "TEXT_INPUT";
        let cloudId = null;

        sendUpdate({ status: "Initializing Engine...", progress: 5 });

        if (req.file) {
            const mimetype = req.file.mimetype;

            if (mimetype.includes('audio') || mimetype.includes('video')) {
                sendUpdate({ status: "Uploading Media for Analysis...", progress: 10 });
                const cloudRes = await uploadToCloudinary(filePath);
                cloudUrl = cloudRes.secure_url;
                cloudId = cloudRes.public_id;

                sendUpdate({ status: "Transcribing with AI...", progress: 15 });
                if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.includes('dummy')) {
                    await sleep(1000);
                    textToProcess = "Mocked transcription.";
                } else {
                    const transcription = await groq.audio.transcriptions.create({
                        file: fs.createReadStream(filePath),
                        model: "whisper-large-v3"
                    });
                    textToProcess = transcription.text;
                }
            } 
            else if (mimetype === 'application/pdf') {
                sendUpdate({ status: "Parsing PDF Document...", progress: 15 });
                const pdfData = await parsePdf(filePath);
                textToProcess = pdfData.text;
                cloudUrl = "PDF_DOCUMENT";
            } 
            else {
                sendUpdate({ status: "Reading File Content...", progress: 15 });
                textToProcess = fs.readFileSync(filePath, 'utf8');
                cloudUrl = "DOC_FILE";
            }
        } 
        else if (type === 'youtube') {
            textToProcess = await processYoutubeLink(content, 'temp_uploads', sendUpdate);
        }
        else if (type === 'blog') {
            textToProcess = await processBlogLink(content, sendUpdate);
            cloudUrl = content;
        } 
        else {
            textToProcess = content;
        }

        if (!textToProcess || textToProcess.trim().length < 10) {
            throw new Error("The source provided contains no readable text.");
        }

        sendUpdate({ status: "Content Secured. Beginning AI Synthesis...", progress: 20 });

        const assetList = [];
        const bundle = {};

        for (let i = 0; i < PLATFORMS_CONFIG.length; i++) {
            if (isCancelled) {
                console.log("⚠️ GENERATION CANCELLED BY USER");
                return res.end();
            }
            const p = PLATFORMS_CONFIG[i];
            const currentProgress = 20 + Math.round(((i + 1) / PLATFORMS_CONFIG.length) * 75);

            try {
                const aiResult = await generatePlatformText(p.id, textToProcess, tone, useHashtags, brandVoice);

                sendUpdate({
                    status: `Generated ${p.id.toUpperCase()} Asset`,
                    progress: currentProgress,
                    partialResult: { platform: p.id.toLowerCase(), content: aiResult }
                });

                assetList.push({ platform: p.id.toUpperCase(), content: aiResult, generatedAt: new Date() });
                bundle[p.id.toLowerCase()] = aiResult;

                await sleep(1200);
            } catch (genErr) {
                console.error(`Error generating for ${p.id}:`, genErr.message);
            }
        }

        sendUpdate({ status: "Archiving to Vault...", progress: 98 });
        
        const projectTitle = (req.body.title && req.body.title.trim()) ? req.body.title :
                           (req.file ? req.file.originalname : 
                           (type === 'text' ? 'Text Draft' : 
                           (type === 'youtube' || type === 'blog' ? content.split('/').pop().substring(0, 40) : 'Untitled Project')));

        const project = new Project({
            userId: req.user.id,
            title: projectTitle || "New Project",
            source: {
                type: type.toUpperCase(),
                url: cloudUrl,
                publicId: cloudId,
                rawTranscript: textToProcess
            },
            configuration: { tone: tone.toUpperCase(), useHashtags: useHashtags },
            assets: assetList,
            status: 'COMPLETED'
        });

        await project.save();

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
        sendUpdate({ error: e.message, status: "Engine Stopped" });
        res.end();
    } finally {
        if (filePath && fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (err) {}
        }
    }
};

const repurposeSingle = async (req, res) => {
    try {
        const { projectId, platformId, tone, includeHashtags } = req.body;
        const project = await Project.findOne({ _id: projectId, userId: req.user.id });
        if (!project) return res.status(404).json({ error: "Project not found" });

        const useHashtags = includeHashtags === true || includeHashtags === 'true';

        const user = await User.findById(req.user.id);
        const brandVoice = user?.brandVoice || "";

        const newContent = await generatePlatformText(
            platformId.toLowerCase(), 
            project.source.rawTranscript, 
            tone || 'PROFESSIONAL',
            useHashtags,
            brandVoice
        );

        await Project.findOneAndUpdate(
            { _id: projectId, "assets.platform": platformId.toUpperCase() },
            { $set: { "assets.$.content": newContent, "assets.$.generatedAt": new Date() } }
        );

        res.json({ success: true, content: newContent });
    } catch (e) {
        console.error("Single Repurpose Error:", e.message);
        res.status(500).json({ error: "Failed to regenerate asset." });
    }
};

const getImagePrompt = async (req, res) => {
    try {
        const { content } = req.body;
        const prompt = await generateImagePrompt(content);
        res.json({ prompt });
    } catch (error) {
        res.status(500).json({ error: "Failed to create prompt" });
    }
};

const makeImage = async (req, res) => {
    try {
        const { prompt } = req.body;
        const imgData = await generateImage(prompt);
        res.json(imgData);
    } catch (error) {
        res.status(500).json({ error: "Cloudflare failed to generate image." });
    }
};

module.exports = {
    repurposeAll,
    repurposeSingle,
    getImagePrompt,
    makeImage
};
