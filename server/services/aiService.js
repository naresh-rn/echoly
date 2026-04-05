const Groq = require('groq-sdk');
const axios = require('axios');
require('dotenv').config();

// Primary Groq Instances
const groq        = new Groq({ apiKey: process.env.GROQ_API_KEY });
const groqVisual  = new Groq({ apiKey: process.env.GROQ_API_KEY_VISUAL  || process.env.GROQ_API_KEY });
const groqYoutube = new Groq({ apiKey: process.env.GROQ_API_KEY_YOUTUBE || process.env.GROQ_API_KEY });
const groqContent = new Groq({ apiKey: process.env.GROQ_API_KEY_CONTENT || process.env.GROQ_API_KEY });

// ─── Round-Robin Content Key Pool ────────────────────────────────────────────
// Spreads 12 platform generations across all available API keys to avoid
// hitting the per-key per-minute token limit.
const contentKeyPool = [
    process.env.GROQ_API_KEY_CONTENT,
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_VISUAL,
    process.env.GROQ_API_KEY_YOUTUBE,
].filter(k => k && !k.includes('dummy')); // remove missing or dummy keys

const groqPool = contentKeyPool.length > 0
    ? contentKeyPool.map(k => new Groq({ apiKey: k }))
    : [groqContent]; // fallback to single instance

let poolIndex = 0;
function nextGroqClient() {
    const client = groqPool[poolIndex % groqPool.length];
    poolIndex++;
    return client;
}

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

// Increased to 6000 heavily retain original text
const MAX_INPUT_CHARS = 6000;

async function summarizeIfNeeded(text, userGroqKey = "") {
    if (!text || typeof text !== 'string') return text;
    text = text.replace(/\s+/g, ' ').trim();
    if (text.length <= MAX_INPUT_CHARS) return text;

    console.log(`📝 Text too long (${text.length} chars). Employing Map-Reduce Chunk Summarization...`);
    const client = userGroqKey ? new Groq({ apiKey: userGroqKey }) : groqContent;
    
    try {
        // Groq handles ~8k tokens (roughly 30,000 characters) per request safely.
        // We chunk the text into 20k character segments to ensure it never crashes.
        const chunkSize = 20000;
        let chunks = [];
        for (let i = 0; i < text.length; i += chunkSize) {
            chunks.push(text.substring(i, i + chunkSize));
        }

        console.log(`🧩 Splitting text into ${chunks.length} chunks for parallel analysis...`);
        
        const chunkPromises = chunks.map(async (chunk) => {
            // Distribute load across available API keys to prevent throttling 
            const requestClient = userGroqKey ? client : nextGroqClient();
            const response = await requestClient.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are an expert content distiller. Extract all primary arguments, data points, and critical context from this segment. Do NOT drop important information. Return ONLY a highly detailed synthesis. No introductory meta-chatter."
                    },
                    { role: "user", content: chunk }
                ],
                model: "llama-3.1-8b-instant",
                max_tokens: 1000, 
            });
            return response.choices[0].message.content.trim();
        });

        const aggregatedSummaries = await Promise.all(chunkPromises);

        const combinedText = aggregatedSummaries.join('\\n\\n');

        // If the combined summary is now nicely compact, return it! 
        // If it's STILL massively huge, we do one final master-summarization sweep.
        if (combinedText.length <= MAX_INPUT_CHARS * 1.5) {
            console.log(`✅ Chunking complete. Final text length: ${combinedText.length} chars.`);
            return combinedText;
        }

        console.log(`📝 Combined chunks still large (${combinedText.length} chars). Applying Final Polish Master-Summary...`);
        const finalResponse = await client.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Synthesize this master document. Retain ALL core themes, quotes, and primary facts. Keep the length detailed but under 2,500 words. Format clearly."
                },
                { role: "user", content: combinedText.substring(0, 25000) }
            ],
            model: "llama-3.1-8b-instant",
            max_tokens: 1500,
        });

        const finalSummary = finalResponse.choices[0].message.content.trim();
        console.log(`✅ Final Master Summary completed down to ${finalSummary.length} chars.`);
        return finalSummary;
        
    } catch (err) {
        console.warn(`⚠️ Summarization map-reduce failed, falling back to safe truncation:`, err.message);
        return text.substring(0, MAX_INPUT_CHARS);
    }
}

async function generatePlatformText(platformId, text, tone, useHashtags = false, brandVoice = "", userGroqKey = "") {
    const config = PLATFORMS_CONFIG.find(p => p.id === platformId);
    if (!config) throw new Error(`Unknown platform: ${platformId}`);

    const maxAttempts = 5; // more retries across the key pool

    let systemPrompt = `
        ${config.prompt}
        Tone: ${tone}.
        ${brandVoice ? `USER BRAND VOICE / GUIDELINES: "${brandVoice}" - STRICTLY ADHERE TO THIS STYLE.` : ''}
        IMPORTANT: The source text may be from a PDF or Scraper and contain messy artifacts like page numbers, headers, or broken lines.
        IGNORE any metadata/headers and focus ONLY on the core message.
        Return ONLY the final post. No markdown headers.
    `;

    if (useHashtags) {
        systemPrompt += "\nInclude 3-5 relevant and trending hashtags at the end of the post formatted correctly for the specific platform.";
    }

    // Check if all keys are dummy/missing — return mock if so
    const primaryKey = userGroqKey || process.env.GROQ_API_KEY_CONTENT || process.env.GROQ_API_KEY;
    if (primaryKey && primaryKey.includes('dummy') && contentKeyPool.length === 0 && !userGroqKey) {
        await sleep(500);
        return `[MOCKED ${platformId.toUpperCase()}] Dummy post for ${platformId} (${tone}): "${text.substring(0, 30)}..."${useHashtags ? '\n\n#mockdata #test' : ''}`;
    }

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Use user key if provided, otherwise rotate existing pool
        let client;
        if (userGroqKey) {
            client = new Groq({ apiKey: userGroqKey });
        } else {
            client = nextGroqClient();
        }
        try {
            const completion = await client.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user",   content: text.substring(0, MAX_INPUT_CHARS) }
                ],
                model: "llama-3.1-8b-instant",
            });

            let cleanResult = completion.choices[0].message.content;
            cleanResult = cleanResult.replace(/\*\*/g, '').replace(/#+/g, '#');
            return cleanResult;
        } catch (error) {
            if (error.status === 429) {
                // Exponential backoff: 3s, 6s, 12s, 24s — and rotate to next key
                const waitTime = Math.min(3000 * Math.pow(2, attempt), 30000);
                console.log(`🐢 Rate limit on attempt ${attempt + 1}/${maxAttempts}. Rotating key & waiting ${waitTime}ms...`);
                await sleep(waitTime);
            } else {
                // Non-rate-limit error — bail immediately
                console.error(`❌ generatePlatformText [${platformId}] error:`, error.message);
                throw error;
            }
        }
    }

    // All attempts exhausted — return a fallback string instead of throwing,
    // so the rest of the 12 platforms can still complete.
    console.warn(`⚠️ All ${maxAttempts} attempts failed for [${platformId}] — returning fallback.`);
    return `[${platformId.toUpperCase()}] Content generation temporarily unavailable due to API rate limits. Please try regenerating this asset.`;
}

async function generateImagePrompt(content) {
    const currentApiKey = process.env.GROQ_API_KEY_VISUAL || process.env.GROQ_API_KEY;
    if (currentApiKey && currentApiKey.includes('dummy')) {
        return "A highly detailed, cinematic mock render representing your text content.";
    }
    const response = await groqVisual.chat.completions.create({
        messages: [
            {
                role: "system",
                content: "You are a professional prompt engineer. Return ONLY a 20-word visual description. DO NOT use quotes, DO NOT use bolding. Just raw text."
            },
            { role: "user", content: `Context: ${content}` }
        ],
        model: "llama-3.1-8b-instant",
    });

    return response.choices[0].message.content.replace(/["'**#]/g, '').replace(/\n/g, ' ').trim();
}

async function generateImage(prompt) {
    const currentApiKey = process.env.GROQ_API_KEY_VISUAL || process.env.GROQ_API_KEY;
    if (process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_API_TOKEN.includes('dummy')) {
        const dummyImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
        return { imageData: dummyImage, mimeType: "image/png" };
    }

    const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
    const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

    if (!ACCOUNT_ID || !API_TOKEN) {
        throw new Error("Cloudflare credentials missing.");
    }

    const brainResponse = await groqVisual.chat.completions.create({
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
        url: `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/@cf/bytedance/stable-diffusion-xl-lightning`,
        method: "POST",
        headers: {
            "Authorization": `Bearer ${API_TOKEN}`,
            "Content-Type": "application/json",
        },
        data: JSON.stringify({ prompt: visualPrompt, num_steps: 4 }), // SDXL-Lightning uses 4 steps
        responseType: 'arraybuffer',
    });

    const base64Image = Buffer.from(response.data).toString('base64');
    return { imageData: base64Image, mimeType: "image/png" };
}

module.exports = {
    generatePlatformText,
    generateImagePrompt,
    generateImage,
    PLATFORMS_CONFIG,
    sleep,
    summarizeIfNeeded,
    groq,
    groqVisual,
    groqYoutube,
    groqContent
};
