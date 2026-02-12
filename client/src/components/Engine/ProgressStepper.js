import React from 'react';

const ProgressStepper = ({ progress, statusText }) => {
  return (
    <div className="max-w-4xl mx-auto mb-12 px-10 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex justify-between items-end mb-4">
        <div>
          <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-1">Status</p>
          <h3 className="text-lg font-black uppercase italic tracking-tighter text-slate-800">{statusText}</h3>
        </div>
        <span className="text-2xl font-black italic text-slate-200">{Math.round(progress)}%</span>
      </div>
      
      {/* The Actual Bar */}
      <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-1">
        <div 
          className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(37,99,235,0.4)] relative overflow-hidden"
          style={{ width: `${progress}%` }}
        >
          {/* Subtle Shimmer Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
        </div>
      </div>
    </div>
  );
};

export default ProgressStepper;