import React, { useState, useEffect } from 'react';
import { Activity, Cpu, Zap, Globe, HardDrive, ShieldCheck, BarChart3, Radio } from 'lucide-react';

const MetricCard = ({ title, value, sub, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${color.bg} ${color.text}`}>
        <Icon size={20} />
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Active</span>
      </div>
    </div>
    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{title}</h4>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-bold text-slate-900">{value}</span>
      <span className="text-[10px] font-medium text-slate-400">{sub}</span>
    </div>
  </div>
);

export default function PulsePage() {
  const [timestamp, setTimestamp] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => setTimestamp(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="bg-black rounded-[3rem] p-12 mb-8 text-white relative overflow-hidden shadow-2xl shadow-black/20">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 mb-4">
              <Radio size={16} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Live System Feed</span>
            </div>
            <h1 className="font-heading text-6xl md:text-7xl tracking-tighter mb-4 uppercase">PULSE</h1>
            <p className="text-slate-400 text-sm max-w-sm font-medium leading-relaxed">
              Monitoring Echoly's distributed neural nodes and transcription pipelines.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] min-w-[200px]">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2">System Time (UTC)</span>
            <span className="text-3xl font-mono font-medium tracking-widest">{timestamp}</span>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full -mr-20 -mt-20" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard title="API Latency" value="42" sub="ms" icon={Globe} color={{bg:"bg-blue-50", text:"text-blue-600"}} />
        <MetricCard title="AI Inference" value="0.8" sub="sec" icon={Zap} color={{bg:"bg-amber-50", text:"text-amber-600"}} />
        <MetricCard title="Engine Load" value="14" sub="%" icon={Cpu} color={{bg:"bg-indigo-50", text:"text-indigo-600"}} />
        <MetricCard title="Vault Health" value="100" sub="%" icon={HardDrive} color={{bg:"bg-purple-50", text:"text-purple-600"}} />
      </div>
    </div>
  );
}