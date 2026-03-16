const Groq = require('groq-sdk');
const axios = require('axios');
require('dotenv').config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

async function generatePlatformText(platformId, text, tone, useHashtags = false, brandVoice = "") {
    const config = PLATFORMS_CONFIG.find(p => p.id === platformId);
    let attempts = 0;
    const maxAttempts = 3;

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

    while (attempts < maxAttempts) {
        try {
            if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.includes('dummy')) {
                await sleep(500);
                return `[MOCKED ${platformId.toUpperCase()}] This is a dummy generated post for ${platformId} in a ${tone} tone based on your input: "${text.substring(0, 30)}...". Replace GROQ_API_KEY in server/.env with a real key to see actual AI generation!${useHashtags ? '\n\n#mockdata #test' : ''}`;
            }

            const completion = await groq.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: text.substring(0, 15000) } 
                ],
                model: "llama-3.1-8b-instant",
            });

            let cleanResult = completion.choices[0].message.content;
            cleanResult = cleanResult.replace(/\*\*/g, '').replace(/#+/g, '#');
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

async function generateImagePrompt(content) {
    if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.includes('dummy')) {
        return "A highly detailed, cinematic mock render representing your text content.";
    }
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

    return response.choices[0].message.content.replace(/["'**#]/g, '').replace(/\n/g, ' ').trim();
}

async function generateImage(prompt) {
    if (process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_API_TOKEN.includes('dummy')) {
        const dummyImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
        return { imageData: dummyImage, mimeType: "image/png" };
    }

    const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
    const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

    if (!ACCOUNT_ID || !API_TOKEN) {
        throw new Error("Cloudflare credentials missing.");
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
    groq
};
