import React, { useState, useRef } from 'react';
import { 
  Type, 
  Link as LinkIcon, 
  Youtube, 
  FileAudio, 
  UploadCloud, 
  Zap, 
  Check, 
  ArrowRight,
  Settings2
} from 'lucide-react';

export default function EngineWorkspace({ onRepurpose, isGenerating, cooldown }) {
  const [type, setType] = useState('text');
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [tone, setTone] = useState('Professional');
  const fileInputRef = useRef(null);

  // --- Configuration ---
  const INPUT_FORMATS = [
    { id: 'text', label: 'Script', icon: Type },
    { id: 'youtube', label: 'YouTube', icon: Youtube },
    { id: 'blog', label: 'Article', icon: LinkIcon },
    { id: 'file', label: 'Upload', icon: FileAudio },
  ];

  const TONES = ['Professional', 'Viral', 'Educational', 'Stoic', 'Bold', 'Casual'];

  // --- Handlers ---
  const handleTypeChange = (newType) => {
    setType(newType);
    setContent('');
    setSelectedFile(null);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
  };

  const clearFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const activeFormat = INPUT_FORMATS.find(f => f.id === type);

  return (
    <div className="bg-white rounded-xl shadow-lg shadow-zinc-200/40 border border-zinc-200 overflow-hidden flex flex-col lg:flex-row font-sans">
      
      {/* ==============================================
          LEFT PANEL: CONTROLS (Balanced Size)
      =============================================== */}
      <div className="w-full lg:w-[280px] bg-zinc-50/80 p-5 border-b lg:border-b-0 lg:border-r border-zinc-200 flex flex-col gap-5">
        
        {/* Header */}
        <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-black rounded-md text-white">
                <Settings2 size={16} />
            </div>
            <div>
                <h2 className="text-sm font-black text-black uppercase tracking-tight leading-none">Setup</h2>
                <p className="text-[10px] font-bold text-zinc-400 mt-0.5 uppercase tracking-wide">Config</p>
            </div>
        </div>

        {/* 1. INPUT FORMAT GRID */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Source</label>
          <div className="grid grid-cols-2 gap-2">
            {INPUT_FORMATS.map((format) => {
              const Icon = format.icon;
              const isSelected = type === format.id;
              return (
                <button
                  key={format.id}
                  onClick={() => handleTypeChange(format.id)}
                  className={`
                    group flex items-center justify-center gap-2 px-2 py-2.5 rounded-lg border text-xs font-bold uppercase tracking-wide transition-all duration-200
                    ${isSelected 
                      ? 'bg-black border-black text-white shadow-md transform scale-[1.02]' 
                      : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-black'}
                  `}
                >
                  <Icon size={14} strokeWidth={2.5} />
                  <span>{format.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. TONE SELECTION */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Tone</label>
          <div className="flex flex-wrap gap-1.5">
            {TONES.map((t) => {
              const isSelected = tone === t;
              return (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`
                    px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all
                    ${isSelected 
                      ? 'bg-zinc-800 border-zinc-800 text-white' 
                      : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-black'}
                  `}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ==============================================
          RIGHT PANEL: WORKSPACE (Balanced Size)
      =============================================== */}
      <div className="flex-1 p-6 flex flex-col bg-white relative">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <activeFormat.icon size={18} className="text-black" />
            <h2 className="text-sm font-black text-black uppercase tracking-tight">Input Content</h2>
          </div>
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest border border-zinc-200 px-2 py-0.5 rounded-md">Step 02</span>
        </div>

        {/* Dynamic Input Area (Height: 11rem / 176px) */}
        <div className="flex-1 mb-4">
          {type === 'file' ? (
            /* FILE DROPZONE */
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`
                h-44 w-full border border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group
                ${selectedFile 
                  ? 'border-black bg-zinc-50' 
                  : 'border-zinc-300 hover:border-black hover:bg-zinc-50'}
              `}
            >
              <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} accept=".mp3,.mp4,.wav,.m4a" />
              
              {selectedFile ? (
                <div className="text-center animate-in fade-in zoom-in-95">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-black text-white rounded-full text-[10px] font-bold uppercase mb-2 shadow-sm">
                    <Check size={12} /> Ready
                  </div>
                  <p className="text-zinc-900 font-bold text-xs truncate max-w-[200px]">{selectedFile.name}</p>
                  <button onClick={clearFile} className="mt-2 text-[10px] font-bold text-zinc-400 hover:text-red-600 uppercase tracking-wide underline transition-colors">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="text-center">
                   <UploadCloud size={24} className="text-zinc-300 mx-auto mb-2 group-hover:text-black transition-colors" />
                   <p className="text-xs font-bold text-zinc-900 uppercase tracking-wide">Click to Upload</p>
                   <p className="text-[10px] text-zinc-400 mt-0.5">MP3 / MP4 / WAV</p>
                </div>
              )}
            </div>
          ) : (
            /* TEXT / URL INPUT */
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={activeFormat?.id === 'text' ? "Paste script or notes..." : "Paste URL here..."}
              className="w-full h-44 bg-zinc-50 hover:bg-zinc-100 focus:bg-white text-sm font-medium text-zinc-900 placeholder-zinc-400 resize-none outline-none border border-transparent focus:border-zinc-300 rounded-xl p-4 transition-all leading-relaxed"
            />
          )}
        </div>

        {/* Action Button */}
        <button 
          onClick={() => onRepurpose(type, type === 'file' ? selectedFile : content, tone)}
          disabled={isGenerating || cooldown > 0 || (!content && !selectedFile)}
          className={`
            w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 shadow-lg
            ${(isGenerating || cooldown > 0 || (!content && !selectedFile))
              ? 'bg-zinc-100 text-zinc-300 cursor-not-allowed shadow-none' 
              : 'bg-black text-white hover:bg-zinc-800 hover:scale-[1.01] active:scale-[0.99] shadow-zinc-200'}
          `}
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              Processing <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
            </span>
          ) : cooldown > 0 ? (
            <span>Wait {cooldown}s</span>
          ) : (
            <>
              Initialize <ArrowRight size={14} />
            </>
          )}
        </button>

      </div>
    </div>
  );
}