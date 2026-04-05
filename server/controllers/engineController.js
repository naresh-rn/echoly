const fs = require('fs');
const Project = require('../models/Project');
const User = require('../models/User');
const { generatePlatformText, PLATFORMS_CONFIG, groq, groqYoutube, sleep, generateImagePrompt, generateImage, summarizeIfNeeded } = require('../services/aiService');
const { processYoutubeLink, processBlogLink, uploadToCloudinary, parsePdf, compressMediaToAudio } = require('../services/mediaService');

const repurposeAll = async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendUpdate = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);
    const filePath = req.file ? req.file.path : null;

    try {
        const user = await User.findById(req.user.id);
        const brandVoice = user?.brandVoice || "";
        const userGroqKey = user?.apiKeys?.groq || "";

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

                let fileToTranscribe = filePath;
                try {
                    fileToTranscribe = await compressMediaToAudio(filePath, 'temp_uploads', sendUpdate);
                } catch (err) {
                    console.error("Compression failed, trying original file...", err);
                }

                sendUpdate({ status: "Transcribing with AI...", progress: 15 });
                const currentApiKey = process.env.GROQ_API_KEY_YOUTUBE || process.env.GROQ_API_KEY;
                if (currentApiKey && currentApiKey.includes('dummy')) {
                    await sleep(1000);
                    textToProcess = "Mocked media transcription. Replace GROQ_API_KEY_YOUTUBE with a real key to see actual Whisper AI results!";
                } else {
                    const transcription = await groqYoutube.audio.transcriptions.create({
                        file: fs.createReadStream(fileToTranscribe),
                        model: "whisper-large-v3"
                    });
                    textToProcess = transcription.text;
                }

                // Cleanup compressed audio if we created one
                if (fileToTranscribe !== filePath && fs.existsSync(fileToTranscribe)) {
                    try { fs.unlinkSync(fileToTranscribe); } catch (_) {}
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
            try {
                textToProcess = await processYoutubeLink(content, 'temp_uploads', sendUpdate);
            } catch (ytErr) {
                // processYoutubeLink is already bulletproof, but just in case:
                console.error('⚠️ YouTube processing unexpected failure:', ytErr.message);
                textToProcess = `YouTube video content. URL: ${content}. Please create social media content based on this YouTube video.`;
                sendUpdate({ status: 'Running on video context...', progress: 18 });
            }
        }
        else if (type === 'blog') {
            textToProcess = await processBlogLink(content, sendUpdate);
            cloudUrl = content;
        } 
        else {
            textToProcess = content;
        }

        // Never hard-fail on short text — just log a warning and continue
        if (!textToProcess || textToProcess.trim().length < 5) {
            textToProcess = 'Content provided by user. Generate engaging social media posts based on the topic.';
            console.warn('⚠️ textToProcess was empty — using placeholder to allow generation to proceed.');
        }

        textToProcess = await summarizeIfNeeded(textToProcess, userGroqKey);

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
                const aiResult = await generatePlatformText(p.id, textToProcess, tone, useHashtags, brandVoice, userGroqKey);

                sendUpdate({
                    status: `Generated ${p.id.toUpperCase()} Asset`,
                    progress: currentProgress,
                    partialResult: { platform: p.id.toLowerCase(), content: aiResult }
                });

                assetList.push({ platform: p.id.toUpperCase(), content: aiResult, generatedAt: new Date() });
                bundle[p.id.toLowerCase()] = aiResult;

                await sleep(500);
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
        const userGroqKey = user?.apiKeys?.groq || "";

        const newContent = await generatePlatformText(
            platformId.toLowerCase(), 
            project.source.rawTranscript, 
            tone || 'PROFESSIONAL',
            useHashtags,
            brandVoice,
            userGroqKey
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
