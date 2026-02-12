import React from 'react';
import { Calendar, Layers, ArrowRight, Trash2, FileText, Youtube, Globe, HardDrive } from 'lucide-react';
import axios from 'axios';

export default function VaultArchive({ projects, onRestore, fetchHistory }) {
  
  // Inside your Vault/Archive component
const handleFullDelete = async (id) => {
    if (!window.confirm("WARNING: This deletes the original file and ALL 12 posts. Proceed?")) return;

    try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_BASE}/projects/${id}`, {
            headers: { 'x-auth-token': token }
        });
        fetchHistory(); // Refresh the list
    } catch (e) {
        alert("Error deleting project.");
    }
};

  const deleteHistory = async () => {
    if (window.confirm("ARE YOU SURE? THIS WILL PERMANENTLY WIPE THE VAULT.")) {
      try {
        await axios.delete('http://localhost:5000/api/history', {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        fetchHistory(); // Refresh the UI
      } catch (e) {
        alert("Failed to wipe vault.");
      }
    }
  };

  const getSourceIcon = (type) => {
    switch (type) {
      case 'YOUTUBE': return <Youtube size={16} className="text-red-500" />;
      case 'BLOG': return <Globe size={16} className="text-emerald-500" />;
      case 'FILE': return <HardDrive size={16} className="text-blue-500" />;
      default: return <FileText size={16} className="text-slate-500" />;
    }
  };

  if (!projects || projects.length === 0) {
    return (
      <div className="bg-white border-2 border-dashed border-slate-200 rounded-[32px] py-32 flex flex-col items-center justify-center text-center">
        <div className="bg-slate-50 p-6 rounded-full mb-4">
          <Layers size={40} className="text-slate-300" />
        </div>
        <h3 className="text-slate-900 font-bold text-lg">Your Vault is Empty</h3>
        <p className="text-slate-400 text-sm max-w-xs mt-2">
          Once you repurpose content in the Engine, your missions will appear here for archival.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* VAULT HEADER ACTIONS */}
      <div className="flex justify-between items-center px-2">
        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">
          Showing {projects.length} Saved Missions
        </span>
        <button 
          onClick={deleteHistory}
          className="flex items-center gap-2 text-red-400 hover:text-red-600 transition-colors text-xs font-bold uppercase"
        >
          <Trash2 size={14} /> Wipe All Records
        </button>
      </div>

      {/* PROJECT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((project) => (
          <div 
            key={project._id}
            className="bg-white border border-slate-200 rounded-[32px] p-8 hover:shadow-xl hover:border-blue-100 transition-all group relative"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl">
                {getSourceIcon(project.source?.type)}
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">
                  {project.source?.type || 'CORE'}
                </span>
              </div>
              <div className="flex items-center text-slate-400 gap-1.5 font-bold text-[10px]">
                <Calendar size={12} />
                {new Date(project.createdAt).toLocaleDateString()}
              </div>
            </div>

            <h3 className="text-slate-800 font-bold text-base leading-tight mb-6 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {project.title}
            </h3>

            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
              <div className="text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                {project.assets ? project.assets.length : 0} Platform Artifacts
              </div>
              
              <button 
                onClick={() => onRestore(project)}
                className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all"
              >
                Restore <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}