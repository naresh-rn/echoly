import React, { useState, useEffect } from 'react';
import { 
  Copy, 
  RefreshCw, 
  Image as ImageIcon, 
  Check, 
  Share2,
  Trash2,
  Edit3,
  Save,
  FileText
} from 'lucide-react';

export default function ResultCard({ 
  platform, 
  content, 
  projectId,
  isGenerating, 
  onRegenerate, 
  onGenerateImage,
  onDelete 
}) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState(content);

  // Sync local content if prop changes
  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  // --- HANDLERS ---
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(localContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Echoly - ${platform} Asset`,
          text: localContent,
        });
      } catch (err) {
        console.log('Share canceled');
      }
    } else {
      handleCopy(); 
      alert("Copied to clipboard (Share not supported on this device).");
    }
  };

  const handleDelete = () => {
    if (window.confirm("Delete this asset?")) {
      onDelete();
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 flex flex-col h-full shadow-sm hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 group">
      
      {/* 
        1. COMPACT HEADER 
        Left: Platform Info
        Right: Edit / Regen / Delete Tools
      */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          {/* Smaller Icon */}
          <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-md">
            <span className="font-bold text-[10px] uppercase">
              {platform ? platform.substring(0, 2) : 'AI'}
            </span>
          </div>
          
          <div className="leading-tight">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
              {platform || 'Untitled'}
            </h3>
            <span className="text-[9px] font-bold text-gray-400 uppercase">
              {localContent.length} chars
            </span>
          </div>
        </div>
        
        {/* Minimal Toolbar */}
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsEditing(!isEditing)}
            disabled={isGenerating}
            className={`p-1.5 rounded-md transition-colors ${isEditing ? 'bg-blue-50 text-blue-600' : 'text-gray-300 hover:text-slate-900 hover:bg-gray-50'}`}
            title={isEditing ? "Save" : "Edit"}
          >
            {isEditing ? <Save size={14} /> : <Edit3 size={14} />}
          </button>

          {onGenerateImage && (
            <button 
              onClick={onGenerateImage}
              disabled={isGenerating}
              className="p-1.5 rounded-md text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
              title="Generate Image"
            >
              <ImageIcon size={14} />
            </button>
          )}

          <button 
            onClick={onRegenerate}
            disabled={isGenerating}
            className={`p-1.5 rounded-md text-gray-300 hover:text-slate-900 hover:bg-gray-50 transition-colors ${isGenerating ? 'animate-spin text-blue-500' : ''}`}
            title="Regenerate"
          >
            <RefreshCw size={14} />
          </button>

          {projectId && (
            <button 
              onClick={handleDelete}
              disabled={isGenerating}
              className="p-1.5 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 
        2. CONTENT BODY 
        Minimal padding, cleaner look
      */}
      <div className={`flex-1 mb-3 relative rounded-xl border transition-colors duration-200 ${isEditing ? 'bg-white border-blue-200 ring-2 ring-blue-50' : 'bg-gray-50/50 border-transparent'}`}>
        <textarea 
          className={`w-full h-full min-h-[140px] text-xs leading-6 text-slate-600 bg-transparent resize-none outline-none font-medium p-3 scrollbar-hide ${isEditing ? 'text-slate-900' : ''}`}
          value={localContent}
          onChange={(e) => setLocalContent(e.target.value)}
          readOnly={!isEditing}
          spellCheck={isEditing}
        />
      </div>

      {/* 
        3. BOTTOM ACTIONS 
        Copy & Share side-by-side
      */}
      <div className="flex gap-2">
        {/* Copy Button (Primary) */}
        <button 
          onClick={handleCopy}
          className={`
            flex-1 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2 border
            ${copied 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
              : 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800 hover:border-slate-800 active:scale-[0.98]'}
          `}
        >
          {copied ? <Check size={14} strokeWidth={3} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>

        {/* Share Button (Secondary) */}
        <button 
          onClick={handleShare}
          className="px-4 py-2.5 rounded-lg border border-gray-200 text-gray-500 hover:text-slate-900 hover:border-slate-900 hover:bg-white transition-all active:scale-[0.98]"
          title="Share Asset"
        >
          <Share2 size={14} />
        </button>
      </div>

    </div>
  );
}