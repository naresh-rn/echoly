import React, { useState, useRef } from 'react';
import { 
  Type, 
  Youtube, 
  Link as LinkIcon, 
  FileAudio, 
  Settings2, 
  ArrowRight, 
  UploadCloud, 
  Check, 
  Sparkles 
} from 'lucide-react';
import ProgressStepper from './ProgressStepper'; 

export default function EngineWorkspace({ onRepurpose, isGenerating, progress, statusText }) {
  const [type, setType] = useState('text');
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [tone, setTone] = useState('Professional');
  
  const fileInputRef = useRef(null);

  const TONES = ['Professional', 'Viral', 'Educational', 'Stoic', 'Bold', 'Casual'];
  const INPUT_FORMATS = [
    { id: 'text', label: 'Script', icon: Type },
    { id: 'youtube', label: 'YouTube', icon: Youtube },
    { id: 'blog', label: 'Article', icon: LinkIcon },
    { id: 'file', label: 'Upload', icon: FileAudio },
  ];

  const activeFormat = INPUT_FORMATS.find(f => f.id === type);
  const ActiveIcon = activeFormat ? activeFormat.icon : Type;

  const handleTypeChange = (newType) => {
    setType(newType);
    setContent('');
    setSelectedFile(null);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleInitialize = () => {
    const payload = type === 'file' ? selectedFile : content;
    if (!payload) return; 
    onRepurpose(type, payload, tone);
  };

  const isInputReady = type === 'file' ? !!selectedFile : content.trim().length > 0;
  const isDisabled = isGenerating || !isInputReady;

  return (
    <div className="relative bg-white rounded-2xl border border-slate-200 overflow-hidden">
      
      {/* MAIN CONTENT AREA */}
      <div className={`flex flex-col lg:flex-row transition-all duration-500 ${
        isGenerating ? 'blur-sm opacity-30 pointer-events-none' : 'opacity-100'
      }`}>
        
        {/* LEFT PANEL: CONFIGURATION */}
        <div className="w-full lg:w-72 bg-slate-50/50 p-6 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col gap-6">
          
          <div className="flex items-center gap-2.5">
              <Settings2 size={16} className="text-slate-400" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700">Configuration</h2>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Source DNA</label>
            <div className="grid grid-cols-2 gap-2">
              {INPUT_FORMATS.map((f) => (
                <button 
                  key={f.id} 
                  onClick={() => handleTypeChange(f.id)}
                  className={`
                    flex items-center justify-center gap-2 py-3 rounded-lg border text-[11px] font-medium transition-all
                    ${type === f.id 
                      ? 'bg-white border-slate-300 text-slate-900 shadow-sm' 
                      : 'bg-transparent border-transparent text-slate-500 hover:text-slate-700'}
                  `}
                >
                  <f.icon size={14} />
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Output Tone</label>
            <div className="flex flex-wrap gap-1.5">
              {TONES.map((t) => (
                <button 
                  key={t} 
                  onClick={() => setTone(t)}
                  className={`
                    px-3 py-1.5 rounded-md text-[11px] font-medium border transition-all
                    ${tone === t 
                      ? 'bg-slate-900 border-slate-900 text-white' 
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}
                  `}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: INPUT AREA */}
        <div className="flex-1 p-6 bg-white flex flex-col relative">
          
          <div className="flex items-center gap-2 mb-4">
            <ActiveIcon size={14} className="text-blue-500" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              {type === 'youtube' ? 'Video URL' : type === 'file' ? 'Upload Media' : 'Content Input'}
            </h2>
          </div>

          <div className="flex-1 mb-6">
            {type === 'file' ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`
                  h-48 w-full border border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all
                  ${selectedFile 
                    ? 'border-emerald-200 bg-emerald-50/20' 
                    : 'border-slate-200 bg-slate-50/30 hover:border-blue-300'}
                `}
              >
                <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} accept=".mp3,.mp4,.wav,.m4a" />
                
                {selectedFile ? (
                  <div className="text-center">
                    <div className="inline-flex items-center gap-1.5 text-emerald-600 text-[10px] font-bold uppercase mb-1">
                      <Check size={12} strokeWidth={3} /> File Ready
                    </div>
                    <p className="text-slate-700 font-medium text-sm">{selectedFile.name}</p>
                  </div>
                ) : (
                  <div className="text-center">
                     <UploadCloud size={24} className="text-slate-300 mx-auto mb-2" />
                     <p className="text-[11px] font-medium text-slate-600">Click to upload media</p>
                  </div>
                )}
              </div>
            ) : (
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  type === 'youtube' ? "Paste YouTube Link..." :
                  type === 'blog' ? "Paste Article URL..." :
                  "Paste your script or notes..."
                }
                className="w-full h-full min-h-[200px] bg-slate-50/30 rounded-xl p-5 text-sm font-normal text-slate-700 placeholder-slate-300 resize-none outline-none border border-slate-100 focus:bg-white focus:border-blue-200 transition-all leading-relaxed"
              />
            )}
          </div>

          <button 
            onClick={handleInitialize}
            disabled={isDisabled}
            className={`
              w-full py-4 rounded-xl font-semibold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2
              ${isDisabled 
                ? 'bg-slate-100 text-slate-300' 
                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99]'}
            `}
          >
            {type === 'file' ? 'Process Media' : 'Initialize Engine'} 
            {!isDisabled && <ArrowRight size={14} />}
          </button>

        </div>
      </div>

      {/* PROGRESS OVERLAY */}
      {isGenerating && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 px-6">
           <div className="w-full max-w-md p-8 rounded-2xl bg-white border border-slate-100 shadow-xl">
              <ProgressStepper progress={progress} statusText={statusText} />
              <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                <Sparkles size={12} className="animate-pulse" />
                <span>Generating your assets</span>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}