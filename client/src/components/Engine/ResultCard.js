import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Copy, Check, Edit3, X, Maximize2, Trash2,
  RefreshCw, Image as ImageIcon, MoreVertical, Wand2,
} from 'lucide-react';

const API_BASE =
  (process.env.REACT_APP_API_URL || "http://localhost:5000") + "/api";

export default function ResultCard({
  platform,
  content,
  projectId,
  fetchHistory,
  onRegenerate
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
        { platform, content },
        { headers: { "x-auth-token": token } }
      );

      const encodedPrompt = encodeURIComponent(
        res.data.prompt.substring(0, 400)
      );

      const imageUrl =
        `https://pollinations.ai/p/${encodedPrompt}?width=1024&height=1024&seed=${Math.floor(Math.random()*100000)}&model=flux&nologo=true`;

      setRealImage(imageUrl);
    } catch {
      alert("Visualization failed.");
    } finally {
      setImageLoading(false);
    }
  };

  if (isDeleting) return null;

  // ---------------- UI ----------------
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
                    onClick={() => { onRegenerate(platform, content); setShowMenu(false); }}
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

      {/* CONTENT (NO FLEX-GROW ANYMORE) */}
      <div className="px-9 pb-8">

        {isEditing ? (
          <textarea
            className="w-full min-h-[220px] bg-gray-50 rounded-3xl p-6 text-[15px] resize-none"
            value={editedContent}
            onChange={(e)=>setEditedContent(e.target.value)}
          />
        ) : (
          <p className="text-[17px] leading-[1.7] text-gray-700 whitespace-pre-wrap">
            {editedContent}
          </p>
        )}
        {(realImage || imageLoading) && (
          <div className="mt-8 rounded-[2rem] overflow-hidden border bg-gray-50 aspect-video">

            {imageLoading ? (
              <div className="flex items-center justify-center h-full">
                <Wand2 className="animate-spin text-indigo-500" size={32}/>
              </div>
            ) : (
              <img src={realImage} className="w-full h-full object-cover" alt="AI visual"/>
            )}

          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="px-8 py-5 bg-gray-50/40 border-t flex justify-between items-center">

        <button
          onClick={handleCopy}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[11px] font-bold ${
            copied ? "bg-green-500 text-white" : "bg-white border"
          }`}
        >
          {copied ? <Check size={14}/> : <Copy size={14}/>}
          {copied ? "COPIED" : "COPY TEXT"}
        </button>

        {!realImage && (
          <button
            onClick={generateImage}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-black text-white text-[11px] font-bold"
          >
            <ImageIcon size={14}/>
            VISUALIZE
          </button>
        )}

        <span className="text-[10px] font-black text-gray-300">
          {editedContent.length} CHARS
        </span>

      </div>

      {/* EXPANDED MODAL */}
      {isExpanded && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-white/90 backdrop-blur-xl">

          <div className="bg-white rounded-[3rem] max-w-5xl w-full p-12 overflow-y-auto max-h-[90vh]">

            <button
              onClick={()=>setIsExpanded(false)}
              className="absolute top-6 right-6"
            >
              <X size={28}/>
            </button>

            <p className="text-3xl leading-[1.5] text-gray-800 whitespace-pre-wrap">
              {editedContent}
            </p>

            {realImage && (
              <img src={realImage} className="mt-10 rounded-3xl"/>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
