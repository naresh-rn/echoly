const yt = require('yt-dlp-exec');
const cheerio = require('cheerio');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const { YoutubeTranscript } = require('youtube-transcript');
const cloudinary = require('cloudinary').v2;
const { groq, sleep } = require('./aiService');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

async function processYoutubeLink(content, tempDir, sendUpdate) {
    sendUpdate({ status: "Probing YouTube Link...", progress: 10 });
            
    const videoIdMatch = content.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;
    if (!videoId) throw new Error("Invalid YouTube URL format.");

    let transcriptSuccess = false;
    let metadataText = "";
    let textToProcess = "";

    try {
        const { data: html } = await axios.get(content, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
        });
        const $ = cheerio.load(html);
        const title = $('title').text().replace(' - YouTube', '');
        const description = $('meta[name="description"]').attr('content') || "";
        metadataText = `VIDEO TITLE: ${title}\n\nSUMMARY/DESCRIPTION:\n${description}`;
        console.log("✅ YouTube Metadata Captured");
    } catch (metaErr) {
        console.log("⚠️ Metadata Extraction failed, proceeding with transcript methods.");
    }

    try {
        console.log(`📡 Attempting Method A (Scraping) for ID: ${videoId}`);
        const transcriptArr = await YoutubeTranscript.fetchTranscript(videoId);
        textToProcess = transcriptArr.map(t => t.text).join(' ');
        
        if (textToProcess && textToProcess.trim().length > 100) {
            transcriptSuccess = true;
            sendUpdate({ status: "Full Transcript Secured!", progress: 15 });
        }
    } catch (err) {
        console.log("❌ Method A Failed:", err.message);
    }

    if (!transcriptSuccess) {
        console.log("🎤 Initiating Method B (Whisper AI Fallback)...");
        sendUpdate({ status: "Captions restricted. Analyzing audio...", progress: 12 });

        const audioPath = path.join(tempDir, `yt_${videoId}.mp3`);
        
        try {
            await yt(content, {
                extractAudio: true,
                audioFormat: 'mp3',
                output: audioPath,
                noCheckCertificates: true,
                addHeader: ['referer:youtube.com', 'user-agent:googlebot']
            });

            sendUpdate({ status: "Synthesizing Speech...", progress: 15 });
            const transcription = await groq.audio.transcriptions.create({
                file: fs.createReadStream(audioPath),
                model: "whisper-large-v3"
            });
            textToProcess = transcription.text;
            transcriptSuccess = true;
            console.log("✅ Method B Successful");
        } catch (fallbackErr) {
            console.error("❌ Method B Failed:", fallbackErr.message);
            
            if (metadataText) {
                console.log("🛡️ Using Metadata Fallback (Method C)");
                textToProcess = metadataText;
                transcriptSuccess = true;
                sendUpdate({ status: "Extracting Meta-Content...", progress: 18 });
            } else {
                throw new Error("YouTube is blocking all extraction attempts for this video.");
            }
        } finally {
            if (fs.existsSync(audioPath)) {
                try { fs.unlinkSync(audioPath); } catch(err) {}
            }
        }
    }

    return textToProcess;
}

async function processBlogLink(content, sendUpdate) {
    sendUpdate({ status: "Scraping Article Content...", progress: 10 });
    try {
        const { data } = await axios.get(content, {
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        const $ = cheerio.load(data);
        $('nav, footer, script, style, ad, .comments').remove();
        return $('article').text() || $('main').text() || $('body').text();
    } catch (err) {
        throw new Error("Failed to scrape the article. The website may be protected.");
    }
}

async function uploadToCloudinary(filePath) {
    if (!process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY.includes('dummy')) {
        return { secure_url: "https://dummyimage.com/600x400/000/fff&text=Mock+Media", public_id: "dummy_cloud_id" };
    }
    return await cloudinary.uploader.upload(filePath, { 
        resource_type: "auto",
        folder: "echoly_media" 
    });
}

function parsePdf(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    return pdf(dataBuffer);
}

module.exports = {
    processYoutubeLink,
    processBlogLink,
    uploadToCloudinary,
    parsePdf
};
