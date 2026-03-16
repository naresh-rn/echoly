# ⚡ ECHOLY — The Ultimate AI Content Repurposing Engine

![Echoly Banner](https://images.unsplash.com/photo-1614850523296-e8c0d1ff74g2?auto=format&fit=crop&w=1200&q=80)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-v18-61DAFB.svg)](https://reactjs.org/)
[![Database: MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248.svg)](https://www.mongodb.com/)
[![AI Engine: Llama 3.1](https://img.shields.io/badge/AI_Engine-Llama_3.1--8b-blue.svg)](https://groq.com/)

**Echoly** is a state-of-the-art AI-powered platform designed for creators, marketers, and technical writers. It transforms high-density content—like long-form videos, dense PDFs, technical articles, or raw scripts—into a high-performance distribution bundle for every major social platform.

---

## 🚀 The Concept: "One Spark, Infinite Distribution"

Modern content creation is fragmented. A single podcast or blog post contains hundreds of potential "micro-content" sparks, but manual repurposing is time-consuming and often misses the specific nuances of different platforms.

**Echoly solves this by:**
1.  **Extraction:** Pulling clean metadata and transcripts from YouTube, web URLs, or uploaded media via **Groq Whisper**.
2.  **Synthesis:** Using high-reasoning LLMs (**Llama 3.1 via Groq**) to rewrite content through different "platform lenses" (e.g., PAS framework for LinkedIn, viral threads for X).
3.  **Visualization:** Automatically generating high-end AI visuals using **Stable Diffusion XL Lightning** to match your content's theme.
4.  **Archiving:** Storing every mission in a persistent **Vault** for future restoration and refinement.

---

## ✨ Key Features

### 🛠️ The Engine Workspace
-   **Multi-Source Input:** Process content via **YouTube Links**, **Blog URLs**, **Media Uploads** (.mp3, .mp4, .pdf), or **Raw Text**.
-   **Mission Context:** Name your projects to drive both database organization and the AI visual engine prompts.
-   **Tone Control:** Choose from Professional, Viral, Educational, Stoic, Bold, or Casual outputs.
-   **Hashtag Generator:** Smart, platform-specific hashtag generation (optional).

### 🎨 Visual Engine (SDXL Lightning)
-   **Instant Visualization:** Integrated with Cloudflare Workers AI to generate minimalist, high-end 3D visual assets in under 5 seconds.
-   **Aesthetic Alignment:** Prompts are automatically engineered for a "Frosted glass, technical 8k render" look (Unreal Engine 5 aesthetic).

### 📂 The Vault (Asset History)
-   **Infinite Recall:** Every generation is saved to a specialized MongoDB collection.
-   **Live Studio:** Modify generated assets directly in the UI and save updates back to the cloud.
-   **Bulk Export:** Copy all assets or download as Markdown for immediate distribution.

### 🛡️ Command Center (Admin)
-   **Global Roster:** Track active users and platform usage metrics.
-   **Mission Monitoring:** Oversight of all projects generated across the platform for quality control.

---

## 🛠️ Technical Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Vanilla CSS + Tailwind, Lucide React, SSE (Real-time Progress) |
| **Backend** | Node.js, Express (Modular MVC), Multer, JWT + Bcrypt |
| **Database** | MongoDB Atlas / Compass (Mongoose ODM) |
| **AI (Text)** | Groq SDK (Llama 3.1-8b-instant) |
| **AI (Audio)** | Groq Whisper-Large-v3 (Hifi Transcription) |
| **AI (Image)** | Cloudflare Workers AI (SDXL Lightning) |
| **Storage** | Cloudinary CDN (Media assets) |

---

## 📦 Installation & Setup

### **1. Prerequisites**
- Node.js (v18+)
- MongoDB (Atlas or Local)
- API Keys: [Groq](https://console.groq.com/), [Cloudinary](https://cloudinary.com/), and [Cloudflare](https://dash.cloudflare.com/).

### **2. Setup Environment Variables**
Create a `.env` in the `server` directory:
```env
PORT=10000
MONGO_URI=mongodb+srv://your_uri
JWT_SECRET=your_secret_key

# AI Keys
GROQ_API_KEY=your_groq_key
CLOUDFLARE_ACCOUNT_ID=your_id
CLOUDFLARE_API_TOKEN=your_token

# Media Storage
CLOUDINARY_CLOUD_NAME=name
CLOUDINARY_API_KEY=key
CLOUDINARY_API_SECRET=secret
```

### **3. Running Locally (Monorepo)**
From the root directory:
```bash
# Install all dependencies
npm run install:all

# Start both Client & Server concurrently
npm run dev
```
*The app will be available at `http://localhost:3000`.*

---

## 🏗️ Architecture & Design
Detailed system documentation including ER Diagrams, Sequence Diagrams, and Architecture flows can be found in [DIAGRAMS.md](./DIAGRAMS.md).

---

## 👨– Author
**Echoly Team**  
*Designed for creators who value speed and aesthetic excellence.*

*License: MIT*
