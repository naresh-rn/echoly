import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Copy, Check, Edit3, X, Maximize2, Trash2, Share2, 
  RefreshCw, Image as ImageIcon, MoreVertical, Wand2,
} from 'lucide-react';

const API_BASE =
  (process.env.REACT_APP_API_URL || "http://localhost:5000") + "/api";

export default function ResultCard({
  platform,
  content,
  projectId,
  fetchHistory,
  onRegenerate, 
  onGenerateImage, 
  onShare,
  isGenerating 
}) {

  // ---------------- STATE ----------------
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [copied, setCopied] = useState(false);
  const [realImage, setRealImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => setEditedContent(content), [content]);

  // ---------------- PLATFORM STYLE ----------------
  const getPlatformIdentity = (p) => {
    const str = p.toLowerCase();
    if (str.includes("linkedin"))
      return { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", label: "LinkedIn" };
    if (str.includes("twitter") || str.includes("x"))
      return { color: "text-zinc-900", bg: "bg-zinc-50", border: "border-zinc-200", label: "Twitter / X" };
    if (str.includes("instagram"))
      return { color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-100", label: "Instagram" };
    if (str.includes("facebook"))
      return { color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", label: "Facebook" };
    return { color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100", label: p };
  };

  const ui = getPlatformIdentity(platform);

  // ---------------- ACTIONS ----------------
  const handleCopy = () => {
    navigator.clipboard.writeText(editedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (onShare) {
      onShare(); // Use the logic passed from Dashboard
    } else if (navigator.share) {
      navigator.share({ title: `Echoly ${platform}`, text: editedContent });
    } else {
      handleCopy();
      alert("Link copied to clipboard!");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete this ${platform} draft permanently?`)) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${API_BASE}/projects/${projectId}/asset/${platform}`,
        { headers: { "x-auth-token": token } }
      );
      fetchHistory && fetchHistory();
    } catch {
      alert("Delete failed.");
      setIsDeleting(false);
    }
  };

  const generateImage = async () => {
    setImageLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE}/generate-image-prompt`,
        { platform, content: editedContent.substring(0, 500) },
        { headers: { "x-auth-token": token } }
      );

      // Clean the prompt of markdown symbols before encoding
      const cleanPrompt = res.data.prompt
        .replace(/\*\*/g, '')
        .replace(/#/g, '')
        .replace(/"/g, '')
        .trim();

      const encodedPrompt = encodeURIComponent(cleanPrompt);
      const imageUrl = `https://pollinations.ai/p/${encodedPrompt}?width=1024&height=1024&seed=${Math.floor(Math.random()*100000)}&model=flux&nologo=true`;

      setRealImage(imageUrl);
      // Optional: Update dashboard global state if needed
      if(onGenerateImage) onGenerateImage(imageUrl); 
    } catch {
      alert("Visualization failed.");
    } finally {
      setImageLoading(false);
    }
  };

  if (isDeleting) return null;

  return (
    <div className="break-inside-avoid group relative bg-white rounded-[2.5rem] border border-gray-200 shadow-sm hover:shadow-2xl hover:shadow-gray-200/40 transition-all duration-500 flex flex-col overflow-hidden mb-6">
      
      {/* HEADER */}
      <div className="flex justify-between items-center px-7 py-6">
        <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border ${ui.bg} ${ui.border}`}>
          <div className={`w-2 h-2 rounded-full animate-pulse ${ui.color.replace('text','bg')}`} />
          <span className={`text-[11px] font-bold uppercase tracking-[0.15em] ${ui.color}`}>
            {ui.label}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* SHARE BUTTON ADDED HERE */}
          <button
            onClick={handleShare}
            className="p-2.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
            title="Share"
          >
            <Share2 size={18} />
          </button>

          <button
            onClick={() => setIsExpanded(true)}
            className="p-2.5 text-gray-400 hover:text-black hover:bg-gray-50 rounded-xl"
          >
            <Maximize2 size={18} />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2.5 text-gray-400 hover:text-black hover:bg-gray-50 rounded-xl"
            >
              <MoreVertical size={20} />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 mt-3 w-56 bg-white border rounded-[1.5rem] shadow-2xl z-20 py-3">
                  <button
                    onClick={() => { setIsEditing(true); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-5 py-3 text-sm hover:bg-gray-50"
                  >
                    <Edit3 size={16}/> Edit Draft
                  </button>

                  <button
                    onClick={() => { onRegenerate(platform); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-5 py-3 text-sm hover:bg-gray-50"
                  >
                    <RefreshCw size={16}/> AI Regenerate
                  </button>

                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-3 px-5 py-3 text-sm text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={16}/> Delete Forever
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="px-9 pb-8">
        {isEditing ? (
          <textarea
            className="w-full min-h-[220px] bg-gray-50 rounded-3xl p-6 text-[15px] resize-none focus:ring-2 focus:ring-indigo-100 outline-none border-none"
            value={editedContent}
            onChange={(e)=>setEditedContent(e.target.value)}
          />
        ) : (
          <p className="text-[17px] leading-[1.7] text-gray-700 whitespace-pre-wrap">
            {editedContent}
          </p>
        )}
        
        {/* SAVE BUTTON FOR EDITING */}
        {isEditing && (
          <button 
            onClick={() => setIsEditing(false)}
            className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-bold"
          >
            SAVE CHANGES
          </button>
        )}

        {(realImage || imageLoading) && (
          <div className="mt-8 rounded-[2rem] overflow-hidden border bg-gray-50 aspect-video relative">
            {imageLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <Wand2 className="animate-spin text-indigo-500" size={32}/>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Generating Visual...</span>
              </div>
            ) : (
              <img src={realImage} className="w-full h-full object-cover animate-in fade-in duration-700" alt="AI visual"/>
            )}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="px-8 py-5 bg-gray-50/40 border-t flex justify-between items-center">
        <button
          onClick={handleCopy}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[11px] font-bold transition-all ${
            copied ? "bg-green-500 text-white shadow-lg shadow-green-100" : "bg-white border hover:border-gray-300"
          }`}
        >
          {copied ? <Check size={14}/> : <Copy size={14}/>}
          {copied ? "COPIED" : "COPY TEXT"}
        </button>

        {!realImage && (
        <button 
          onClick={() => onGenerateImage(card.content)}
          disabled={isGenerating} // Disable button while loading
          className={`ml-auto flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all 
            ${isGenerating ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
          >
          {isGenerating ? (
            <>
              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              Warming Engine...
            </>
          ) : (
            <>
              <ImageIcon size={14} /> Create Visual
            </>
          )}
          </button>
        )}

        <span className="text-[10px] font-black text-gray-300">
          {editedContent.length} CHARS
        </span>
      </div>

      {/* EXPANDED MODAL */}
      {isExpanded && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-white/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 max-w-5xl w-full p-12 overflow-y-auto max-h-[90vh] relative">
            <button
              onClick={()=>setIsExpanded(false)}
              className="absolute top-8 right-8 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={28}/>
            </button>
            <div className="max-w-3xl mx-auto">
              <p className="text-3xl leading-[1.5] text-gray-800 whitespace-pre-wrap font-medium">
                {editedContent}
              </p>
              {realImage && (
                <img src={realImage} className="mt-10 rounded-3xl w-full shadow-2xl border border-gray-100" alt="Expanded AI visual"/>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}