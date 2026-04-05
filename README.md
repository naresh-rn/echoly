# Echoly - AI Content Repurposing Platform 🚀

Echoly is an ultra-fast, robust, and scalable AI-powered content engine that takes raw creative sources (like massive PDF documents, YouTube videos, or Blog links) and dynamically repurposes them into tailored social media posts across 12 different platforms simultaneously.

## Core Features ✨

- **Omni-Channel Generation:** Automatically spin raw content into tailored ghostwritten assets for LinkedIn, Twitter, Instagram, TikTok, Threads, Pinterest, Medium, Reddit, and Newsletters.
- **Deep PDF Knowledge Extraction:** Employs advanced Map-Reduce Chunking algorithms that can safely process and retain intelligence from massive documents (up to 60k+ characters) without dropping context or crashing LLM size constraints.
- **Robust YouTube Transcriptions:** Multi-stage, fail-safe audio pipeline utilizes everything from direct scraping to full localized `Whisper-Large-V3` fallback analysis via yt-dlp to guarantee flawless transcriptions of all video content.
- **High-Velocity Cloudflare Integration:** Utilizes `Stable Diffusion XL-Lightning` inference directly through Cloudflare to spin up highly detailed, custom-generated aesthetic visual assets automatically appended to your posts natively.
- **Fault-Tolerant Engine Dynamics:** Round-robin key-pooling completely bypasses free-tier restrictive TPM (Tokens-Per-Minute) API limits on the backend, parallelizing all API interactions perfectly to drop 30-second generations into 2 seconds flat!

## Tech Stack 🛠️
- **Frontend Front:** React, Tailwind CSS, Lucide UI
- **Backend Frame:** Node.js, Express, File-Saver, JSZip
- **Persistence:** MongoDB Atlas (+ Stateless JWT auth)
- **AI Inferencing Models:** 
  - `Llama-3.1-8b-instant` (Groq Engine)
  - `Whisper-Large-V3` (Audio Analysis)
  - `SDXL-Lightning` (Cloudflare GenAI)

## Setup & Execution 💻
Echoly is structured as a full-stack mono-layout containing a `client` and a `server`. 

**Backend Configuration:**
1. Populate your `server/.env` with your API Tokens (`GROQ_API_KEY`, `MONGO_URI` (Atlas), `CLOUDINARY_API_KEY`, `CLOUDFLARE_API_TOKEN`, etc.)
2. `cd server` -> `npm install`
3. `npm start` (Runs securely on port 5000)

**Frontend Configuration:**
1. `cd client` -> `npm install`
2. `npm start` (Spins up on port 3000)

Your AI architecture is now alive. Enjoy content genesis!
