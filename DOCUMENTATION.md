# Echoly — Comprehensive Project Documentation

Welcome to the central documentation hub for **Echoly**, the AI-powered content repurposing engine.

## 🌟 Project Vision
Echoly was built to empower creators by removing the "distribution tax"—the hours of manual labor required to turn one great idea into multiple platform-ready posts. Our goal is to make professional-grade content distribution accessible to everyone through high-speed AI inference.

## 🛠️ Technical Stack Deep-Dive

### Frontend
- **Framework**: React 18 (Vite)
- **Styling**: Vanilla CSS (for performance) + Tailwind (for utilities)
- **Icons**: Lucide React
- **Streaming**: EventSource (SSE) for real-time AI generation feedback.

### Backend
- **Runtime**: Node.js & Express
- **Persistence**: MongoDB Atlas (Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens) with Bcrypt password hashing.
- **Media Handling**: Multer (Uploads), yt-dlp (YouTube), Cheerio (Web Scraping).

### AI Infrastructure
- **Text Engine**: Groq SDK (Llama 3.1 8b/70b)
- **Audio Engine**: Groq Whisper-Large-v3
- **Image Engine**: Cloudflare Workers AI (SDXL Lightning)
- **CDN**: Cloudinary for media storage and transformation.

## 🚀 Roadmap
- [ ] **Phase 1**: Core MERN + Groq integration (Current)
- [ ] **Phase 2**: Multi-language support for 50+ languages.
- [ ] **Phase 3**: Direct social media API integration (Post directly to LinkedIn/X).
- [ ] **Phase 4**: Team workspaces and collaboration tools.

---
*For technical details, see [API_REFERENCE.md](./API_REFERENCE.md).*
*For user instructions, see [USER_GUIDE.md](./USER_GUIDE.md).*
