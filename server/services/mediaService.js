const yt = require('yt-dlp-exec');
const cheerio = require('cheerio');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const { YoutubeTranscript } = require('youtube-transcript');
const cloudinary = require('cloudinary').v2;
const { groqYoutube, sleep } = require('./aiService');

const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegInstaller);

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// ─── Ensure temp dir exists ───────────────────────────────────────────────────
function ensureTempDir(dir) {
    const abs = path.resolve(dir);
    if (!fs.existsSync(abs)) fs.mkdirSync(abs, { recursive: true });
    return abs;
}

// ─── Extract video ID from any YouTube URL format ─────────────────────────────
function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?(?:.*&)?v=)([^&\s]{11})/,
        /(?:youtube\.com\/shorts\/)([^?\s/]{11})/,
        /(?:youtube\.com\/live\/)([^?\s/]{11})/,
        /(?:youtube\.com\/embed\/)([^?\s/]{11})/,
        /(?:youtu\.be\/)([^?\s/]{11})/,
        /(?:youtube\.com\/v\/)([^?\s/]{11})/,
    ];
    for (const p of patterns) {
        const m = url.match(p);
        if (m?.[1]) return m[1];
    }
    return null;
}

// ─── Wrap a promise with a hard timeout ──────────────────────────────────────
function withTimeout(promise, ms, label) {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
        )
    ]);
}

// ─── Caption Method A: youtube-transcript package ─────────────────────────────
async function tryPkgTranscript(videoId) {
    const arr = await YoutubeTranscript.fetchTranscript(videoId);
    const text = arr.map(t => t.text).join(' ').trim();
    if (text.length < 80) throw new Error('Transcript too short');
    return text;
}

// ─── Caption Method B: Page scrape → ytInitialPlayerResponse captions ─────────
// More robust parser that handles multiple YouTube JSON caption formats.
async function tryPageCaptionScrape(videoId) {
    const { data: html } = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 12000
    });

    // Pull ytInitialPlayerResponse
    const jsonMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*(?:;|\n)/s);
    if (!jsonMatch) throw new Error('ytInitialPlayerResponse not found');
    const player = JSON.parse(jsonMatch[1]);

    const tracks = player?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!tracks?.length) throw new Error('No caption tracks found');

    const track = tracks.find(t => t.languageCode === 'en') || tracks[0];

    // Try json3 format first, fall back to XML
    let text = '';
    try {
        const { data } = await axios.get(track.baseUrl + '&fmt=json3', { timeout: 8000 });
        if (data?.events?.length) {
            text = data.events
                .filter(e => e.segs)
                .flatMap(e => e.segs.map(s => s.utf8 || ''))
                .join(' ')
                .replace(/\n/g, ' ')
                .trim();
        }
    } catch {
        // fallback to XML format
        const { data: xmlData } = await axios.get(track.baseUrl, { timeout: 8000 });
        text = xmlData.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").trim();
    }

    if (text.length < 80) throw new Error('Caption text too short');
    return text;
}

// ─── Caption Method C: yt-dlp subtitle extraction (no audio download) ─────────
// yt-dlp can pull subtitle/caption files directly — much faster than downloading audio.
async function tryYtDlpSubtitles(videoId, tempDir) {
    const absDir = ensureTempDir(tempDir);
    const outBase = path.join(absDir, `sub_${videoId}`);

    await yt(`https://www.youtube.com/watch?v=${videoId}`, {
        skipDownload:    true,
        writeSubs:       true,
        writeAutoSubs:   true,
        subLangs:        'en',
        subFormat:       'vtt',
        output:          outBase,
        noCheckCertificates: true,
    });

    // yt-dlp writes files like: sub_ID.en.vtt or sub_ID.en-US.vtt
    const vttFile = fs.readdirSync(absDir).find(f => f.startsWith(`sub_${videoId}`) && f.endsWith('.vtt'));
    if (!vttFile) throw new Error('No subtitle file produced');

    const raw = fs.readFileSync(path.join(absDir, vttFile), 'utf8');
    // Strip VTT header + timestamps, keep only text
    const text = raw
        .split('\n')
        .filter(l => l && !l.startsWith('WEBVTT') && !l.match(/^\d{2}:\d{2}/) && !l.match(/^NOTE/) && !l.match(/^\s*\d+\s*$/))
        .join(' ')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    // Cleanup subtitle file
    try { fs.unlinkSync(path.join(absDir, vttFile)); } catch (_) {}

    if (text.length < 80) throw new Error('Subtitle text too short');
    return text;
}

// ─── Audio Fallback: yt-dlp + Groq Whisper (any duration up to ~90 min) ──────
// At 32kbps mono: 90 min ≈ 21MB — well within Groq's 25MB Whisper limit.
async function tryWhisperFallback(videoId, normalizedUrl, tempDir, sendUpdate) {
    sendUpdate({ status: "Downloading audio for AI transcription...", progress: 13 });

    const absDir = ensureTempDir(tempDir);
    const audioPath = path.join(absDir, `yt_${videoId}.mp3`);

    try {
        await yt(normalizedUrl, {
            extractAudio:        true,
            audioFormat:         'mp3',
            audioQuality:        '32K',      // 32kbps mono → ~4KB/s → 90 min ≈ 21MB
            output:              audioPath,
            noCheckCertificates: true,
            noPlaylist:          true,
            // No time cap — let yt-dlp download the full video (up to ~90 min safely)
            // For extreme edge cases (3h+ videos), postprocessor will handle size check below
            addHeader: ['referer:youtube.com', 'user-agent:Mozilla/5.0']
        });

        if (!fs.existsSync(audioPath)) throw new Error('yt-dlp produced no output file');

        const sizeMB = fs.statSync(audioPath).size / (1024 * 1024);
        console.log(`📦 Audio: ${sizeMB.toFixed(2)} MB`);

        // If somehow over 24.5MB (3+ hour video), trim it
        // by re-downloading with a 90-min section cap
        if (sizeMB > 24.5) {
            console.log('⚠️ File too large — re-downloading with 90-min cap...');
            fs.unlinkSync(audioPath);
            await yt(normalizedUrl, {
                extractAudio:     true,
                audioFormat:      'mp3',
                audioQuality:     '32K',
                output:           audioPath,
                noCheckCertificates: true,
                noPlaylist:       true,
                downloadSections: '*00:00:00-01:30:00',  // 90 min cap for extreme cases
                addHeader: ['referer:youtube.com', 'user-agent:Mozilla/5.0']
            });
        }

        sendUpdate({ status: "Transcribing with Whisper AI...", progress: 16 });

        const apiKey = process.env.GROQ_API_KEY_YOUTUBE || process.env.GROQ_API_KEY;
        if (apiKey?.includes('dummy')) {
            return "Mocked Whisper transcription — replace GROQ_API_KEY_YOUTUBE with a real key.";
        }

        const transcription = await groqYoutube.audio.transcriptions.create({
            file:  fs.createReadStream(audioPath),
            model: 'whisper-large-v3'
        });
        return transcription.text;

    } finally {
        if (fs.existsSync(audioPath)) try { fs.unlinkSync(audioPath); } catch (_) {}
    }
}

// ─── MAIN: processYoutubeLink ─────────────────────────────────────────────────
//
// FASTEST PIPELINE — 3 stages, D only runs when necessary:
//
//   STAGE 1 (A + B + C in parallel, no timeout):
//     A — youtube-transcript pkg   → 1-3s  if it works (pure HTTP)
//     B — page caption scrape      → 1-3s  if it works (pure HTTP)
//     C — yt-dlp VTT subtitles     → 5-15s (small subtitle file only)
//     First to succeed returns immediately.
//     If A/B work → result in ~2s. If not → C wins in ~10s.
//
//   STAGE 2 (D — Whisper audio, ONLY if A+B+C all fail):
//     No wasted audio downloads when a caption method succeeds.
//
//   STAGE 3: Metadata fallback
//   STAGE 4: Placeholder — never crashes
//
async function processYoutubeLink(content, tempDir, sendUpdate) {
    sendUpdate({ status: "Probing YouTube link...", progress: 10 });

    const videoId = extractVideoId(content);
    if (!videoId) throw new Error("Could not extract a video ID from the URL you pasted.");

    const normalizedUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log(`🎬 Processing YouTube ID: ${videoId}`);

    // Metadata fetch runs in background from the start
    let metadataText = '';
    const metaPromise = (async () => {
        try {
            const { data: html } = await axios.get(normalizedUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                timeout: 8000
            });
            const $ = cheerio.load(html);
            const title = $('title').text().replace(' - YouTube', '').trim();
            const desc  = $('meta[name="description"]').attr('content') || '';
            metadataText = `VIDEO TITLE: ${title}\n\nDESCRIPTION:\n${desc}`;
            console.log('✅ Metadata ready');
        } catch { console.log('⚠️ Metadata fetch failed'); }
    })();

    // ── STAGE 1: A + B + C in parallel (no artificial timeout) ───────────────
    // A and B are instant HTTP requests (~1-3s). C is a small VTT download (~10s).
    // D (audio) is NOT started here — saves bandwidth if A/B/C succeed.
    sendUpdate({ status: "Fetching transcript...", progress: 11 });
    console.log('🚀 Stage 1: A (pkg) + B (scrape) + C (VTT) racing in parallel...');

    const stage1 = await Promise.any([
        tryPkgTranscript(videoId)
            .then(t => { console.log(`✅ Stage 1 winner: A (youtube-transcript, ${t.length} chars)`); return t; }),
        tryPageCaptionScrape(videoId)
            .then(t => { console.log(`✅ Stage 1 winner: B (page scrape, ${t.length} chars)`); return t; }),
        tryYtDlpSubtitles(videoId, tempDir)
            .then(t => { console.log(`✅ Stage 1 winner: C (yt-dlp VTT, ${t.length} chars)`); return t; }),
    ]).catch(err => {
        console.log(`⚠️ Stage 1 (A+B+C) all failed — starting Whisper. Reason: ${err.message}`);
        return null;
    });

    if (stage1) {
        sendUpdate({ status: "Transcript secured!", progress: 15 });
        return stage1;
    }

    // ── STAGE 2: D — Whisper audio (only starts here, after A+B+C failed) ─────
    sendUpdate({ status: "Downloading audio for AI analysis...", progress: 12 });
    console.log('🎤 Stage 2: Starting Whisper AI audio fallback...');
    try {
        const text = await tryWhisperFallback(videoId, normalizedUrl, tempDir, sendUpdate);
        console.log(`✅ Stage 2: Whisper succeeded (${text.length} chars)`);
        sendUpdate({ status: "Audio transcription complete!", progress: 15 });
        return text;
    } catch (err) {
        console.error('❌ Stage 2 (Whisper) failed:', err.message);
    }

    // ── STAGE 3: Metadata (title + description) ───────────────────────────────
    await metaPromise;
    if (metadataText?.trim().length > 20) {
        console.log('🛡️ Stage 3: Using metadata fallback');
        sendUpdate({ status: "Using video metadata...", progress: 18 });
        return metadataText;
    }

    // ── STAGE 4: Guaranteed placeholder — never crashes ───────────────────────
    console.log('⚠️ Stage 4: All methods failed — placeholder');
    sendUpdate({ status: "Generating from video context...", progress: 18 });
    return `YouTube video (ID: ${videoId}). Please generate social media content for this video. URL: ${content}`;
}

// ─── Blog scraper ─────────────────────────────────────────────────────────────
async function processBlogLink(content, sendUpdate) {
    sendUpdate({ status: "Scraping article content...", progress: 10 });
    try {
        const { data } = await axios.get(content, {
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        const $ = cheerio.load(data);
        $('nav, footer, script, style, ad, .comments').remove();
        return $('article').text() || $('main').text() || $('body').text();
    } catch {
        throw new Error("Failed to scrape the article. The website may be protected.");
    }
}

// ─── Cloudinary upload ────────────────────────────────────────────────────────
async function uploadToCloudinary(filePath) {
    if (!process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY.includes('dummy')) {
        return { secure_url: "https://dummyimage.com/600x400/000/fff&text=Mock+Media", public_id: "dummy_cloud_id" };
    }
    return cloudinary.uploader.upload(filePath, { resource_type: "auto", folder: "echoly_media" });
}

// ─── PDF parser ───────────────────────────────────────────────────────────────
async function parsePdf(filePath) {
    let rawText = "";

    if (pdf.PDFParse) {
        // Handle new pdf-parse 2.x
        const parser = new pdf.PDFParse({ data: fs.readFileSync(filePath) });
        const result = await parser.getText();
        rawText = result.text;
    } else {
        // Handle standard pdf-parse 1.x
        const parseFunction = typeof pdf === "function" ? pdf : pdf.default;
        const result = await parseFunction(fs.readFileSync(filePath));
        rawText = result.text;
    }

    // Optimize text output: strip excess line breaks and spaces to save tokens
    const optimizedText = rawText.replace(/\s+/g, ' ').trim();
    return { text: optimizedText };
}

// ─── Downsample Audio/Video File to 32kbps MP3 ────────────────────────────────
async function compressMediaToAudio(inputPath, tempDir, sendUpdate) {
    if (sendUpdate) sendUpdate({ status: "Compressing media for AI...", progress: 12 });
    const absDir = ensureTempDir(tempDir);
    const audioPath = path.join(absDir, `compressed_${Date.now()}.mp3`);

    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .noVideo()
            .audioCodec('libmp3lame')
            .audioBitrate('32k') // 32kbps mono ensures up to 90 min fits easily in Groq's 25MB limit
            .audioChannels(1)
            .output(audioPath)
            .on('end', () => {
                console.log(`✅ Media heavily compressed to: ${audioPath}`);
                resolve(audioPath);
            })
            .on('error', (err) => {
                console.error(`❌ Compression failed:`, err.message);
                reject(err);
            })
            .run();
    });
}

module.exports = { processYoutubeLink, processBlogLink, uploadToCloudinary, parsePdf, compressMediaToAudio };
