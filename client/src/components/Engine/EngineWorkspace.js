import React, { useState, useRef } from 'react';
import { 
  Type, 
  Link as LinkIcon, 
  Youtube, 
  FileAudio, 
  UploadCloud,  
  Check, 
  ArrowRight,
  Settings2,
  Sparkles
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
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden flex flex-col lg:flex-row">
      
      {/* ==============================================
          LEFT PANEL: CONTROLS
      =============================================== */}
      <div className="w-full lg:w-[300px] bg-gray-50/50 p-8 border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex items-center gap-3">
            <div className="p-2 bg-black rounded-xl text-white shadow-lg shadow-black/10">
                <Settings2 size={18} />
            </div>
            <div>
                <h2 className="text-xs font-black text-black uppercase tracking-widest">Configuration</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Setup Engine</p>
            </div>
        </div>

        {/* 1. SOURCE SELECTION */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Source Type</label>
          <div className="grid grid-cols-2 gap-2.5">
            {INPUT_FORMATS.map((format) => {
              const Icon = format.icon;
              const isSelected = type === format.id;
              return (
                <button
                  key={format.id}
                  onClick={() => handleTypeChange(format.id)}
                  className={`
                    group flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border transition-all duration-300
                    ${isSelected 
                      ? 'bg-white border-gray-200 text-black shadow-sm ring-2 ring-black/5' 
                      : 'bg-transparent border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'}
                  `}
                >
                  <Icon size={18} strokeWidth={isSelected ? 2.5 : 2} />
                  <span className="text-[10px] font-bold uppercase tracking-tight">{format.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. TONE SELECTION */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Output Tone</label>
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => {
              const isSelected = tone === t;
              return (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`
                    px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border
                    ${isSelected 
                      ? 'bg-black border-black text-white shadow-md' 
                      : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300 hover:text-black'}
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
          RIGHT PANEL: WORKSPACE
      =============================================== */}
      <div className="flex-1 p-8 flex flex-col bg-white">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                <activeFormat.icon size={16} />
            </div>
            <h2 className="text-xs font-black text-black uppercase tracking-widest">Input Area</h2>
          </div>
        </div>

        {/* Dynamic Input Area */}
        <div className="flex-1 mb-8">
          {type === 'file' ? (
            /* FILE DROPZONE */
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`
                h-52 w-full border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center cursor-pointer transition-all duration-500 group
                ${selectedFile 
                  ? 'border-emerald-500 bg-emerald-50/30' 
                  : 'border-gray-100 bg-gray-50/30 hover:border-black hover:bg-gray-50'}
              `}
            >
              <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} accept=".mp3,.mp4,.wav,.m4a" />
              
              {selectedFile ? (
                <div className="text-center animate-in fade-in zoom-in-95 duration-500">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase mb-3 shadow-lg shadow-emerald-200">
                    <Check size={12} strokeWidth={3} /> Upload Ready
                  </div>
                  <p className="text-black font-bold text-sm truncate max-w-[250px]">{selectedFile.name}</p>
                  <button onClick={clearFile} className="mt-3 text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-[0.2em] transition-colors">
                    Remove File
                  </button>
                </div>
              ) : (
                <div className="text-center">
                   <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                      <UploadCloud size={24} className="text-gray-300 group-hover:text-black transition-colors" />
                   </div>
                   <p className="text-[11px] font-black text-black uppercase tracking-widest">Drop audio or video here</p>
                   <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold tracking-tighter">MP3, MP4, WAV, M4A up to 50MB</p>
                </div>
              )}
            </div>
          ) : (
            /* TEXT / URL INPUT */
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={activeFormat?.id === 'text' ? "Enter your script or core ideas here..." : "https://www.youtube.com/watch?v=..."}
              className="w-full h-52 bg-gray-50/50 hover:bg-gray-50 focus:bg-white text-base font-medium text-gray-800 placeholder-gray-300 resize-none outline-none border border-gray-100 focus:border-gray-200 rounded-[2rem] p-8 transition-all leading-relaxed shadow-inner"
            />
          )}
        </div>

        {/* Action Button */}
        <div className="relative group">
            {/* Pulsing glow background for active state */}
            {!isGenerating && !cooldown && (content || selectedFile) && (
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
            )}
            
            <button 
                onClick={() => onRepurpose(type, type === 'file' ? selectedFile : content, tone)}
                disabled={isGenerating || cooldown > 0 || (!content && !selectedFile)}
                className={`
                    relative w-full py-5 rounded-[1.25rem] font-black text-xs uppercase tracking-[0.3em] transition-all duration-500 flex items-center justify-center gap-3
                    ${(isGenerating || cooldown > 0 || (!content && !selectedFile))
                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                    : 'bg-black text-white hover:bg-zinc-900 hover:translate-y-[-2px] active:translate-y-[0px] shadow-2xl shadow-black/20'}
                `}
            >
                {isGenerating ? (
                    <div className="flex items-center gap-3">
                        <span className="animate-pulse">Processing Mission</span>
                        <div className="flex gap-1">
                            <div className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-1 h-1 bg-white rounded-full animate-bounce"></div>
                        </div>
                    </div>
                ) : cooldown > 0 ? (
                    <span className="opacity-50 tracking-[0.1em]">Engine Cooldown {cooldown}s</span>
                ) : (
                    <>
                        <Sparkles size={16} className="text-blue-400" />
                        Initialize Repurpose
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </>
                )}
            </button>
        </div>

        {/* System Footer Info */}
        <div className="mt-4 flex justify-center gap-6">
            <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Neural Link Active</span>
            </div>
            <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">SDXL Visuals Engaged</span>
            </div>
        </div>

      </div>
    </div>
  );
}