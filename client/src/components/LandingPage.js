import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Cpu, 
  Download, 
  Layers, 
  Zap, 
  // FileJson, 
  FileText,
  Copy
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    // Changed h-screen to min-h-screen to allow scrolling
    <div className="relative min-h-screen w-full bg-[#0c0c0e] font-body selection:bg-white selection:text-black text-zinc-300">
      
      {/* --- FIXED BACKGROUND LAYER (Stays put while you scroll) --- */}
      <div className="fixed inset-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        {/* Grid Texture */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        
        {/* Glowing Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-900/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-purple-900/10 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] bg-zinc-800/30 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000" />
        
        {/* Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0e] via-transparent to-[#0c0c0e]/90" />
      </div>

      {/* --- SECTION 1: HERO (Full Height - UNTOUCHED) --- */}
      <section className="relative z-10 h-screen flex flex-col items-center justify-center px-6">
        
        {/* Status Tag */}
        <div className="mb-8 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-heading">
            System Operational
          </span>
        </div>

        {/* Big Title */}
        <h1 className="text-8xl md:text-[10rem] font-heading font-bold text-white tracking-tighter leading-none mb-6 drop-shadow-2xl">
          Echoly
        </h1>

        {/* Description Line */}
        <p className="max-w-xl text-zinc-400 text-lg md:text-xl font-light mb-12 leading-relaxed text-center">
          The AI-powered neural engine that repurposes your core narrative into infinite digital artifacts.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <button 
            onClick={() => navigate('/register')}
            className="group relative w-full md:w-48 h-14 bg-white text-black font-heading font-bold text-xs uppercase tracking-[0.2em] rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
          >
            <div className="absolute inset-0 flex items-center justify-center gap-2 group-hover:-translate-y-14 transition-transform duration-300">
              Get Started
            </div>
            <div className="absolute inset-0 flex items-center justify-center gap-2 translate-y-14 group-hover:translate-y-0 transition-transform duration-300">
              Initialize <ArrowRight size={14} />
            </div>
          </button>

          <button 
            onClick={() => navigate('/login')}
            className="w-full md:w-48 h-14 text-zinc-500 hover:text-white font-heading font-bold text-xs uppercase tracking-[0.2em] transition-colors border border-transparent hover:border-zinc-800 rounded-full"
          >
            Login
          </button>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 animate-bounce text-zinc-700">
          <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-zinc-500 to-transparent mx-auto"></div>
        </div>
      </section>


      {/* --- SECTION 2: HOW IT WORKS (Glass Cards) --- */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="mb-16">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
            One Input. <span className="text-zinc-500">Infinite Outputs.</span>
          </h2>
          <p className="max-w-md text-zinc-400">
            Stop creating content for every platform. Echoly takes one source file and generates a full content ecosystem.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: The Engine */}
          <div className="col-span-1 md:col-span-2 p-8 rounded-3xl border border-zinc-800 bg-black/40 backdrop-blur-md hover:bg-zinc-900/40 transition-colors group">
            <div className="w-12 h-12 bg-blue-900/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Cpu className="text-blue-400" />
            </div>
            <h3 className="text-2xl font-heading font-bold text-white mb-2">Neural Synthesis</h3>
            <p className="text-zinc-500 leading-relaxed">
              Our proprietary AI models don't just summarize; they rewrite. 
              Upload a <strong>YouTube video, Podcast audio, or Blog post</strong>. 
              Echoly understands context, tone, and nuance to generate platform-native content.
            </p>
          </div>

          {/* Card 2: Speed */}
          <div className="col-span-1 p-8 rounded-3xl border border-zinc-800 bg-black/40 backdrop-blur-md hover:bg-zinc-900/40 transition-colors group">
            <div className="w-12 h-12 bg-purple-900/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Zap className="text-purple-400" />
            </div>
            <h3 className="text-2xl font-heading font-bold text-white mb-2">Zero Latency</h3>
            <p className="text-zinc-500 leading-relaxed">
              From raw audio to 12 distinct social artifacts in under <strong>45 seconds</strong>.
            </p>
          </div>

          {/* Card 3: Artifacts */}
          <div className="col-span-1 p-8 rounded-3xl border border-zinc-800 bg-black/40 backdrop-blur-md hover:bg-zinc-900/40 transition-colors group">
            <div className="w-12 h-12 bg-green-900/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Layers className="text-green-400" />
            </div>
            <h3 className="text-2xl font-heading font-bold text-white mb-2">Multi-Format</h3>
            <ul className="space-y-2 text-zinc-500 text-sm mt-4 font-heading uppercase tracking-wider">
              <li className="flex items-center gap-2"><div className="w-1 h-1 bg-white rounded-full"></div> X / Twitter Threads</li>
              <li className="flex items-center gap-2"><div className="w-1 h-1 bg-white rounded-full"></div> LinkedIn Articles</li>
              <li className="flex items-center gap-2"><div className="w-1 h-1 bg-white rounded-full"></div> Newsletter Drafts</li>
              <li className="flex items-center gap-2"><div className="w-1 h-1 bg-white rounded-full"></div> TikTok Scripts</li>
            </ul>
          </div>

          {/* Card 4: Distribution (UPDATED: Export Focus) */}
          <div className="col-span-1 md:col-span-2 p-8 rounded-3xl border border-zinc-800 bg-black/40 backdrop-blur-md hover:bg-zinc-900/40 transition-colors group">
            <div className="w-12 h-12 bg-orange-900/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Download className="text-orange-400" />
            </div>
            <h3 className="text-2xl font-heading font-bold text-white mb-2">Universal Export</h3>
            <p className="text-zinc-500 leading-relaxed">
              Your content belongs to you. Download your generated assets in <strong>Markdown, JSON, or Plain Text</strong>. 
              Copy directly to your clipboard and paste into your favorite tools perfectly formatted.
            </p>
          </div>
        </div>
      </section>

      {/* --- SECTION 3: SIMPLE WORKFLOW (UPDATED) --- */}
      <section className="relative z-10 py-24 border-t border-zinc-900/50 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-zinc-500 font-heading uppercase tracking-[0.3em] mb-12 text-xs">The Protocol</p>
          
          <div className="flex flex-col md:flex-row justify-center items-center gap-12 md:gap-24">
            
            {/* Step 1 */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center text-white">
                <FileText size={32} />
              </div>
              <h4 className="text-white font-heading font-bold">1. Upload Source</h4>
              <p className="text-zinc-600 text-sm max-w-[200px]">Paste a URL or upload a file.</p>
            </div>

            {/* Connector */}
            <div className="hidden md:block w-24 h-[1px] bg-zinc-800"></div>

            {/* Step 2 */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full border border-blue-900/50 bg-blue-900/10 flex items-center justify-center text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                <Cpu size={32} />
              </div>
              <h4 className="text-white font-heading font-bold">2. Processing</h4>
              <p className="text-zinc-600 text-sm max-w-[200px]">Deep analysis & regeneration.</p>
            </div>

            {/* Connector */}
            <div className="hidden md:block w-24 h-[1px] bg-zinc-800"></div>

            {/* Step 3 (UPDATED) */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center text-white">
                <Copy size={32} />
              </div>
              <h4 className="text-white font-heading font-bold">3. Review & Deploy</h4>
              <p className="text-zinc-600 text-sm max-w-[200px]">Copy formatted text & publish.</p>
            </div>

          </div>
        </div>
      </section>

      {/* --- FOOTER (SIMPLE) --- */}
      <footer className="relative z-10 border-t border-zinc-900 bg-[#050505] py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center justify-center gap-4">
          <div className="text-2xl font-heading font-bold text-white tracking-tighter">Echoly</div>
          <div className="text-zinc-600 text-[10px] font-heading uppercase tracking-widest text-center">
            © 2026 Echoly Systems Inc. <br className="md:hidden"/> All Rights Reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}