import React, { useState } from 'react';
import { Lock, User, Bell, Info, Save, ShieldCheck } from 'lucide-react';

export default function SettingsPage({ user }) {
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });

  return (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8 pb-20">
      
      {/* 1. PROFILE MODULE */}
      <section className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-50 p-2 rounded-xl text-blue-600"><User size={20}/></div>
          <h3 className="font-black text-sm uppercase tracking-widest text-slate-800">Operator Profile</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Display Name</label>
            <input 
              disabled 
              value={user?.name || "Active Operator"} 
              className="w-full mt-2 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Email Identity</label>
            <input 
              disabled 
              value={user?.email || "operator@echothread.io"} 
              className="w-full mt-2 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-500 cursor-not-allowed"
            />
          </div>
        </div>
      </section>

      {/* 2. SECURITY MODULE (Reset Password) */}
      <section className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-orange-50 p-2 rounded-xl text-orange-600"><Lock size={20}/></div>
          <h3 className="font-black text-sm uppercase tracking-widest text-slate-800">Security Override</h3>
        </div>

        <div className="space-y-4 max-w-md">
          <input 
            type="password" 
            placeholder="Current Password"
            className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm focus:border-black outline-none transition-all"
            onChange={(e) => setPasswords({...passwords, old: e.target.value})}
          />
          <input 
            type="password" 
            placeholder="New Encryption Key (Password)"
            className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm focus:border-black outline-none transition-all"
            onChange={(e) => setPasswords({...passwords, new: e.target.value})}
          />
          <button className="w-full bg-black text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
            <ShieldCheck size={16}/> Update Security Credentials
          </button>
        </div>
      </section>

      {/* 3. SYSTEM INFO MODULE */}
      <section className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-white/10 p-2 rounded-xl text-white"><Info size={20}/></div>
            <h3 className="font-black text-sm uppercase tracking-widest">System Information</h3>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-white/40 text-[10px] font-bold uppercase">Core Model</span>
              <span className="text-xs font-mono text-blue-400">Gemini 3 Flash (Free Tier)</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-white/40 text-[10px] font-bold uppercase">Vision/Audio Engine</span>
              <span className="text-xs font-mono text-emerald-400">Whisper-Large-V3 / Veo</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-white/40 text-[10px] font-bold uppercase">Build Version</span>
              <span className="text-xs font-mono">v3.1.2-STABLE</span>
            </div>
          </div>
        </div>
        {/* Decorative Grid Pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-[60px] rounded-full"></div>
      </section>
    </div>
  );
}