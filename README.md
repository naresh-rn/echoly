# ECHOLY ⚡ — The Ultimate AI Content Repurposing Engine

![Echoly Banner](https://images.unsplash.com/photo-1614850523296-e8c0d1ff74g2?auto=format&fit=crop&w=1200&q=80)

Echoly is a state-of-the-art AI-powered platform designed for creators, marketers, and technical writers. It transforms high-density content—like long-form videos, dense PDFs, technical articles, or raw scripts—into a high-performance distribution bundle for every major social platform.

---

## 🚀 The Concept: "One Spark, Infinite Distribution"

Modern content creation is fragmented. A single podcast or blog post contains hundreds of potential "micro-content" sparks, but manual repurposing is time-consuming and often misses the specific nuances of different platforms.

**Echoly solves this by:**
1.  **Extraction:** Pulling clean metadata and transcripts from YouTube, web URLs, or uploaded media.
2.  **Synthesis:** Using high-reasoning LLMs (Llama 3.1) to rewrite the content through different "platform lenses" (e.g., PAS framework for LinkedIn, viral threads for X).
3.  **Visualization:** Automatically generating high-end 3D renders using Stable Diffusion to match your content's theme.
4.  **Archiving:** Storing every mission in a persistent "Asset History" for future restoration and refinement.

---

## ✨ Key Features

### 🛠️ The Engine Workspace
-   **Source DNA:** Input content via **YouTube Links**, **Blog URLs**, **Media Uploads** (.mp3, .mp4, .pdf, .txt), or **Raw Text**.
-   **Custom Mission Titles:** Name your project—the title is used to drive both the database organization and the AI visual engine.
-   **Tone Selection:** Choose between Professional, Viral, Educational, Stoic, Bold, or Casual outputs.
-   **Hashtag Engine:** Toggle specific, platform-relevant hashtag generation.

### 🎨 Visual Engine
-   **SDXL Lightning:** Integrated with Cloudflare Workers AI to generate minimalist, high-end 3D visual assets (Unreal Engine 5 aesthetic) for your posts in under 5 seconds.

### 📂 Asset History (The Vault)
-   **Persistent Storage:** Every generation is saved to a specialized MongoDB collection.
-   **Restoration Logic:** Instantly restore any past project, including the original transcript and all generated social posts.
-   **Live Editing:** Modify generated assets directly in the UI and save them back to the database.

### 🛡️ Admin Dashboard (Command Center)
-   **Global Oversight:** Admins can view a roster of all active users.
-   **Content Feed:** A global table tracking every project generated across the platform for quality control and system monitoring.

---

## 🛠️ Technical Stack

### **Frontend**
-   **React 18 & Vite:** For a blazing fast, single-page application experience.
-   **Vanilla CSS + Tailwind:** A custom high-end design system featuring glassmorphism and modern typography.
-   **Lucide React:** Premium iconography.
-   **Server-Sent Events (SSE):** Real-time progress streaming from the backend engine.

### **Backend**
-   **Node.js & Express:** Modular, controller-service architecture.
-   **MongoDB & Mongoose:** Scalable document storage with customized collection mapping.
-   **JWT & Bcrypt:** Secure authentication and password hashing.
-   **Multer:** Binary media stream processing with original extension preservation.

### **AI Core**
-   **Groq SDK (Llama 3.1-8b):** Ultra-fast text generation and prompt engineering.
-   **Groq Whisper-Large-v3:** High-fidelity audio/video transcription.
-   **Cloudflare Workers AI:** Running Stable Diffusion XL Lightning for image synthesis.
-   **Cloudinary:** For secure, high-speed CDN cloud storage of media assets.

---

## 📦 Installation & Setup

### **1. Prerequisites**
-   Node.js (v18+)
-   MongoDB Instance (Local or Atlas)
-   API Keys: Groq, Cloudinary, and Cloudflare.

### **2. Environment Configuration**
Create a `.env` file in the `server` directory:
```env
PORT=10000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret

GROQ_API_KEY=your_groq_key
CLOUDINARY_CLOUD_NAME=name
CLOUDINARY_API_KEY=key
CLOUDINARY_API_SECRET=secret
CLOUDFLARE_ACCOUNT_ID=id
CLOUDFLARE_API_TOKEN=token
```

### **3. Running Locally**

**Backend:**
```bash
cd server
npm install
npm start
```

**Frontend:**
```bash
cd client
npm install
npm start
```
*The app will be available at `http://localhost:3000` (or `3001` if port 3000 is busy).*

---

## 🏗️ Architecture Overview

The backend follows a **Modular MVC (Model-View-Controller)** pattern for scalability:
-   `/models`: Definition of User and Project schemas.
-   `/routes`: Entry points for Auth, Projects, Admin, and the Generation Engine.
-   `/controllers`: Handling the request-response cycle and status updates.
-   `/services`: Isolated heavy-lifting logic (AI generation, media processing, Cloudinary uploads).
-   `/middleware`: Security layers for JWT verification and Admin-only enforcement.

---

## 👨‍💻 Author

**Echoly Team**  
Designed for creators who value speed and aesthetic excellence.

*License: MIT*
