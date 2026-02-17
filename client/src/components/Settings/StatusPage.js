import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  Cpu, 
  Globe, 
  HardDrive, 
  Zap, 
  ShieldCheck, 
  Clock 
} from 'lucide-react';

const StatusCard = ({ title, status, icon: Icon, latency, color }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-2xl ${color.bg} ${color.text}`}>
        <Icon size={20} />
      </div>
      <div>
        <h4 className="text-sm font-bold text-slate-800">{title}</h4>
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mt-0.5">
          {latency ? `${latency}ms Response` : 'System Verified'}
        </p>
      </div>
    </div>
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">{status}</span>
    </div>
  </div>
);

export default function StatusPage({ user }) {
  const [uptime, setUptime] = useState('00:00:00');

  // Simple Mock Uptime Counter
  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const diff = Math.floor((Date.now() - startTime) / 1000);
      const h = String(Math.floor(diff / 3600)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
      const s = String(diff % 60).padStart(2, '0');
      setUptime(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const services = [
    { title: "Core API Gateway", status: "Operational", icon: Globe, latency: 42, color: { bg: "bg-blue-50", text: "text-blue-600" } },
    { title: "Transcription Engine", status: "Operational", icon: Cpu, latency: 128, color: { bg: "bg-indigo-50", text: "text-indigo-600" } },
    { title: "Visual Generation", status: "Operational", icon: Zap, latency: 850, color: { bg: "bg-amber-50", text: "text-amber-600" } },
    { title: "Vault Storage", status: "Operational", icon: HardDrive, latency: 12, color: { bg: "bg-purple-50", text: "text-purple-600" } },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* HEADER SECTION */}
      <div className="bg-black rounded-[2.5rem] p-10 mb-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="px-3 py-1 bg-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-full">
              All Systems Go
            </div>
          </div>
          <h2 className="text-4xl font-bold tracking-tight mb-2">System Infrastructure</h2>
          <p className="text-slate-400 text-sm max-w-md">
            Real-time monitoring of Echoly's distributed AI nodes and repurposing engines.
          </p>
        </div>
        <Activity className="absolute right-[-20px] bottom-[-20px] text-white/5 w-64 h-64" />
      </div>

      {/* GRID SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {services.map((s, i) => (
          <StatusCard key={i} {...s} />
        ))}
      </div>

      {/* TECHNICAL SPECS SECTION */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Security & Session</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold">
            <Clock size={14} className="text-gray-400" />
            <span>Session Uptime: {uptime}</span>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Protocol</p>
            <p className="text-sm font-bold text-slate-700">HTTPS / TLS 1.3</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Encryption</p>
            <p className="text-sm font-bold text-slate-700">AES-256 GCM</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Authentication</p>
            <p className="text-sm font-bold text-slate-700">JWT Stateless</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">AI Cluster</p>
            <p className="text-sm font-bold text-slate-700">Groq + Cloudflare</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Environment</p>
            <p className="text-sm font-bold text-emerald-600">Production v1.2.4</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">User Tier</p>
            <p className="text-sm font-bold text-slate-700">{user?.plan || 'Standard Development'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}