import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Copy, 
  CheckCircle, 
  Share2, 
  Edit3, 
  X,
  Zap, 
  Maximize2, 
  Trash2, 
  RefreshCw 
} from 'lucide-react';

// Ensure this matches your backend URL
const API_BASE = "http://localhost:5000/api";

export default function ResultCard({ platform, content, projectId, fetchHistory, onRegenerate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [copied, setCopied] = useState(false);
  const [realImage, setRealImage] = useState(null);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  // Sync edited content if the parent content changes (e.g., on regeneration)
  useEffect(() => {
    setEditedContent(content);
  }, [content]);

  // --- DELETE LOGIC (Targets a single asset in the project array) ---
  const handleDelete = async () => {
    if (!projectId) {
      alert("No Project ID found. Try repurposing again first.");
      return;
    }

    if (!window.confirm(`Permanently remove this ${platform} draft?`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/projects/${projectId}/asset/${platform}`, {
        headers: { 'x-auth-token': token }
      });
      
      // Refresh the dashboard and vault history
      if (fetchHistory) fetchHistory();
      
      alert(`Success: ${platform} removed.`);
    } catch (e) {
      console.error("Delete Error:", e);
      alert(e.response?.data?.error || "Could not remove this specific post.");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `EchoThread | ${platform}`,
          text: editedContent,
        });
      } catch (err) { console.log("Share cancelled"); }
    } else {
      alert("Web Share not supported on this browser.");
    }
  };
const generateRealImage = async () => {
  setIsVisualizing(true);
  setRealImage(null);
  setImageLoading(true); // Start loading immediately
  
  try {
    const token = localStorage.getItem('token');
    const res = await axios.post(`${API_BASE}/generate-image-prompt`, 
      { platform, content }, 
      { headers: { 'x-auth-token': token } }
    );
    
    // 1. Simplify the prompt slightly for the free API
    const aiPrompt = res.data.prompt;
    const encodedPrompt = encodeURIComponent(aiPrompt.substring(0, 400)); // Keep it under 400 chars
    
    // 2. Add 'model=flux' - it's often faster and higher quality on Pollinations
    const imageUrl = `https://pollinations.ai/p/${encodedPrompt}?width=1024&height=1024&seed=${Math.floor(Math.random() * 100000)}&model=flux&nologo=true`;    
    
    setRealImage(imageUrl);
    
    // 3. SAFETY NET: If it takes more than 40 seconds, tell the user to retry
    setTimeout(() => {
      if (imageLoading) {
        setImageLoading(false);
        setRealImage(null);
        alert("The art engine is busy. Please try clicking 'Magic Image' again!");
      }
    }, 40000);

  } catch (e) {
    setImageLoading(false);
    setIsVisualizing(false);
    alert("Image generation failed.");
  } finally {
    setIsVisualizing(false);
  }
};

  const toggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <>
      {/* 1. STANDARD GRID CARD */}
      <div className="relative bg-white border border-slate-100 rounded-[32px] p-8 transition-all duration-500 flex flex-col h-[500px] hover:border-black hover:-translate-y-2 hover:shadow-2xl group">
        
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
            <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-800">{platform}</h3>
          </div>
          
          <div className="flex gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-100">
            <button onClick={toggleExpand} className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-white transition-all" title="Expand View"><Maximize2 size={14} /></button>
            <button onClick={() => setIsEditing(!isEditing)} className="p-2 rounded-xl text-slate-400 hover:text-orange-600 hover:bg-white transition-all" title="Edit Content">
                {isEditing ? <X size={14} /> : <Edit3 size={14} />}
            </button>
            {onRegenerate && (
              <button onClick={onRegenerate} className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-white transition-all" title="Regenerate Platform"><RefreshCw size={14} /></button>
            )}
            <button onClick={handleShare} className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-white transition-all" title="Share Content"><Share2 size={14} /></button>
            <button onClick={handleCopy} className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-white transition-all" title="Copy Content">
                {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
            </button>
            <button 
                onClick={handleDelete}
                className="p-2 text-slate-400 hover:text-red-500 transition-all rounded-xl hover:bg-white"
                title="Delete Asset"
            >
                <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-hidden flex flex-col bg-slate-50/50 rounded-2xl p-5 border border-slate-100">
          <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
            {isEditing ? (
              <textarea 
                className="w-full h-full bg-transparent text-[13px] leading-[1.8] font-medium text-slate-800 outline-none resize-none"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                autoFocus
              />
            ) : (
              <p className="text-slate-600 text-[13px] leading-[1.8] font-medium whitespace-pre-wrap">{editedContent}</p>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-50 flex flex-col gap-4">
          
          {/* THE REAL IMAGE DISPLAY */}
          {realImage && (
            <div className="relative group/img rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 min-h-[300px] flex items-center justify-center animate-in zoom-in-95 duration-500">
              
              {/* Loading Overlay - visible until image is ready */}
              {imageLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-10">
                  <RefreshCw className="animate-spin text-blue-500 mb-2" size={24} />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rendering Pixels...</span>
                </div>
              )}

              <img 
                src={realImage} 
                alt="AI Generated Visual" 
                className={`w-full h-full object-cover transition-opacity duration-700 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageLoading(false);
                  setRealImage(null);
                  alert("Image failed to render. Let's try one more time!");
                }}
              />
              
              {!imageLoading && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button 
                    onClick={() => window.open(realImage, '_blank')}
                    className="bg-white text-slate-900 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
                  >
                    View Full Artwork
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button onClick={handleCopy} className="bg-slate-900 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2">
                {copied ? <CheckCircle size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy Text'}
              </button>

              {/* THE MAGIC IMAGE BUTTON */}
              {!realImage && (
                <button 
                  onClick={generateRealImage}
                  disabled={isVisualizing}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2"
                >
                  <Zap size={14} className={isVisualizing ? "animate-spin" : ""} />
                  {isVisualizing ? 'Generating Image...' : 'Magic Image'}
                </button>
              )}
            </div>
            
            <span className="text-[10px] font-bold text-slate-300 uppercase">Echoly v1.0</span>
          </div>
        </div>
      </div>

      {/* 2. EXPANDED VIEW (Modal) */}
      {isExpanded && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={toggleExpand} />
          <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Focused View</span>
                <h2 className="text-2xl font-black uppercase italic text-slate-900">{platform} Artifact</h2>
              </div>
              <button onClick={toggleExpand} className="p-3 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex-grow p-10 overflow-y-auto bg-slate-50/30">
              <p className="text-lg text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                {editedContent}
              </p>
            </div>
            <div className="p-8 bg-white border-t border-slate-100 grid grid-cols-2 gap-4">
              <button onClick={handleCopy} className="bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
                {copied ? <CheckCircle size={18} /> : <Copy size={18} />} {copied ? 'Copied' : 'Copy'}
              </button>
              <button onClick={handleShare} className="bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                <Share2 size={18} /> Share
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}