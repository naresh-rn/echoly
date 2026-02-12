import React from 'react';
import { Zap, ShieldCheck, Rocket, ChevronRight } from 'lucide-react';

export default function HomePage({ onLogin, onSignup }) {
  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Background Blur */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />

      <div className="max-w-2xl w-full text-center z-10">
        {/* Badge */}
        <div className="inline-flex items-center space-x-2 bg-white border border-slate-200 px-4 py-2 rounded-full mb-8 shadow-sm">
          <Zap size={14} className="text-blue-600" fill="currentColor" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Next-Gen Content Intelligence</span>
        </div>

        {/* Branding */}
        <h1 className="text-7xl md:text-8xl font-black tracking-tighter uppercase italic mb-6 text-slate-900">
          COMMAND<span className="text-blue-600 text-outline">GRID</span>
        </h1>

        {/* Description */}
        <p className="text-lg md:text-xl font-medium text-slate-500 leading-relaxed mb-12 max-w-lg mx-auto">
          One source. Twelve platforms. Infinite impact. Transform any content into a synchronized digital army.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={onSignup}
            className="w-full sm:w-auto px-10 py-5 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center space-x-2 hover:bg-blue-600 transition-all shadow-2xl hover:-translate-y-1"
          >
            <Rocket size={16} />
            <span>Create Account</span>
          </button>

          <button 
            onClick={onLogin}
            className="w-full sm:w-auto px-10 py-5 bg-white text-slate-900 border border-slate-200 rounded-[24px] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center space-x-2 hover:bg-slate-50 transition-all shadow-xl hover:-translate-y-1"
          >
            <span>Sign In</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 pt-8 border-t border-slate-200 flex items-center justify-center space-x-8 text-slate-400">
          <div className="flex items-center space-x-2">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Secure Auth</span>
          </div>
          <div className="w-1 h-1 bg-slate-300 rounded-full" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Groq Llama 3.1</span>
        </div>
      </div>
    </div>
  );
}