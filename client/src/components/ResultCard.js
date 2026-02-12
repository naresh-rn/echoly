import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Twitter, Linkedin, Mail, FileText, Instagram, Music, 
  Facebook, Youtube, MessageCircle, Pin, PenTool, Share2,
  RefreshCw, Copy, Check, Share
} from 'lucide-react';

const PLATFORM_UI = {
  linkedin: { icon: <Linkedin size={18} />, color: "#0A66C2" },
  twitter: { icon: <Twitter size={18} />, color: "#1DA1F2" },
  instagram: { icon: <Instagram size={18} />, color: "#E4405F" },
  tiktok: { icon: <Music size={18} />, color: "#00f2ea" },
  newsletter: { icon: <Mail size={18} />, color: "#EA4335" },
  blog: { icon: <FileText size={18} />, color: "#10B981" },
  threads: { icon: <MessageCircle size={18} />, color: "#000000" },
  facebook: { icon: <Facebook size={18} />, color: "#1877F2" },
  pinterest: { icon: <Pin size={18} />, color: "#BD081C" },
  youtube: { icon: <Youtube size={18} />, color: "#FF0000" },
  medium: { icon: <PenTool size={18} />, color: "#000000" },
  reddit: { icon: <Share2 size={18} />, color: "#FF4500" }
};

const ResultCard = ({ platform, content, originalText, tone }) => {
  const ui = PLATFORM_UI[platform] || { icon: <Share2 size={18} />, color: "#64748b" };
  const [text, setText] = useState(content);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { setText(content); }, [content]);

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/regenerate-single', {
        platform, originalText, tone
      });
      if (res.data.success) setText(res.data.content);
    } catch (e) { alert("Regen failed"); }
    setLoading(false);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `My ${platform} Post`, text: text });
      } catch (e) { console.log("Share failed"); }
    } else {
      alert("Sharing not supported on this browser. Text copied instead!");
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="bg-white rounded-[35px] border border-slate-100 shadow-xl flex flex-col h-full hover:shadow-2xl transition-all overflow-hidden">
      <div className="p-5 flex justify-between items-center border-b border-slate-50 bg-white">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl text-white" style={{ backgroundColor: ui.color }}>{ui.icon}</div>
          <span className="font-black text-[10px] uppercase tracking-widest text-slate-400">{platform}</span>
        </div>
        <div className="flex space-x-1">
          <button onClick={handleRegenerate} disabled={loading} className={`p-2 hover:bg-slate-50 rounded-full transition-all ${loading ? 'animate-spin' : ''}`}>
            <RefreshCw size={14} className="text-slate-400" />
          </button>
          <button onClick={() => setIsEditing(!isEditing)} className="text-[9px] font-black px-3 py-1 bg-slate-50 rounded-full text-slate-500 uppercase">
            {isEditing ? 'Save' : 'Edit'}
          </button>
        </div>
      </div>

      <div className="p-6 flex-grow">
        <textarea
          readOnly={!isEditing}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={`w-full h-56 text-sm leading-relaxed outline-none resize-none font-medium transition-all ${isEditing ? 'bg-slate-50 p-4 rounded-2xl shadow-inner' : 'text-slate-600'}`}
        />
      </div>

      <div className="p-6 pt-0 flex space-x-2">
        <button
          onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="flex-grow py-4 bg-slate-900 text-white text-[10px] font-black rounded-2xl uppercase tracking-[0.2em] flex items-center justify-center space-x-2 hover:bg-blue-600 transition-all"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
        <button onClick={handleShare} className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all">
          <Share size={18} />
        </button>
      </div>
    </div>
  );
};

export default ResultCard;