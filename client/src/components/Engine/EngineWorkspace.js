import React, { useState, useRef } from 'react';
import { FileText, Link as LinkIcon, Youtube, UploadCloud, AlertCircle } from 'lucide-react';

export default function EngineWorkspace({ onRepurpose, isGenerating, cooldown }) {
  const [type, setType] = useState('text');
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [tone, setTone] = useState('Professional');
  const fileInputRef = useRef(null);

  return (
    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 space-y-6">
      {/* Type Selector */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        {['text', 'blog', 'youtube', 'file'].map((t) => (
          <button 
            key={t} onClick={() => { setType(t); setContent(''); setSelectedFile(null); }}
            className={`px-6 py-2 rounded-xl text-xs font-bold uppercase transition-all ${type === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {type === 'file' ? (
        <div 
          onClick={() => fileInputRef.current.click()} 
          className={`h-48 border-2 border-dashed rounded-[24px] flex flex-col items-center justify-center cursor-pointer transition-all ${selectedFile ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            hidden 
            onChange={(e) => setSelectedFile(e.target.files[0])} 
            accept=".mp3,.mp4,.wav,.m4a,.mpeg" // Restricts Windows/Mac explorer selection
          />
          <UploadCloud className={selectedFile ? "text-blue-600 mb-2" : "text-slate-400 mb-2"} size={32} />
          <p className="text-slate-500 font-bold text-xs uppercase">
            {selectedFile ? selectedFile.name : "Upload Audio/Video"}
          </p>
          <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-tight">Max Size: 25MB (Groq Limit)</p>
        </div>
      ) : (
        <textarea 
          className="w-full h-48 bg-slate-50 rounded-[24px] border-none p-6 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 transition-all outline-none text-sm font-medium"
          placeholder={`Paste your ${type} content here...`}
          value={content} onChange={(e) => setContent(e.target.value)}
        />
      )}

      <div className="flex gap-4">
        <select value={tone} onChange={(e) => setTone(e.target.value)} className="bg-slate-50 border-none text-slate-700 px-6 py-4 rounded-2xl text-xs font-bold uppercase outline-none flex-grow cursor-pointer">
          <option>Professional</option>
          <option>Viral</option>
          <option>Educational</option>
          <option>Humorous</option>
        </select>
        
        <button 
          onClick={() => onRepurpose(type, type === 'file' ? selectedFile : content, tone)}
          disabled={isGenerating || cooldown > 0 || (!content && !selectedFile)}
          className={`px-10 py-4 rounded-2xl font-bold uppercase text-xs transition-all shadow-lg shadow-blue-200 ${
            (isGenerating || cooldown > 0) 
            ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' 
            : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
          }`}
        >
          {cooldown > 0 ? `Wait ${cooldown}s` : isGenerating ? 'Synthesizing...' : 'Generate Content'}
        </button>
      </div>
    </div>
  );
}