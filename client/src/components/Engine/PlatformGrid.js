import React from 'react';

export default function PlatformGrid({ bundle }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-24">
      {Object.entries(bundle).map(([platform, text]) => (
        <div key={platform} className="border-2 border-[#1A1A1A] p-6 bg-[#050505] hover:border-blue-500/50 transition-all group">
          <div className="flex justify-between items-center mb-4">
            <span className="font-heading text-[10px] text-blue-500 uppercase tracking-tighter">{platform}</span>
            <button 
              onClick={() => navigator.clipboard.writeText(text)}
              className="text-[8px] font-black text-zinc-600 hover:text-white uppercase"
            >
              Copy Protocol
            </button>
          </div>
          <p className="text-zinc-400 text-xs leading-relaxed font-body whitespace-pre-wrap">{text}</p>
        </div>
      ))}
    </div>
  );
}