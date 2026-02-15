import React, { useState } from 'react';
import { Calendar, Search, Layers, ArrowRight, Trash2, FileText, Youtube, Globe, HardDrive, X, Check } from 'lucide-react';
import axios from 'axios';

const API_BASE = (process.env.REACT_APP_API_URL || "http://localhost:5000") + "/api";

export default function VaultArchive({ projects, onRestore, fetchHistory, onDelete }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [deletingId, setDeletingId] = useState(null);

    // Filter projects based on the Search Input
    const filteredProjects = projects.filter((project) =>
        project.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const deleteHistory = async () => {
        if (window.confirm("ARE YOU SURE? THIS WILL PERMANENTLY WIPE THE VAULT.")) {
            try {
                await axios.delete(`${API_BASE}/history`, {
                    headers: { 'x-auth-token': localStorage.getItem('token') }
                });
                fetchHistory();
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
            {/* SEARCH & ACTIONS HEADER */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="relative w-full md:w-96">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search missions by title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-blue-400 outline-none transition-all text-sm"
                    />
                </div>

                <button 
                    onClick={deleteHistory}
                    className="flex items-center gap-2 text-red-400 hover:text-red-600 transition-colors text-[10px] font-black uppercase tracking-widest px-4 py-2 hover:bg-red-50 rounded-xl"
                >
                    <Trash2 size={14} /> Wipe All Records
                </button>
            </div>

            {/* PROJECT GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredProjects.length > 0 ? (
                    filteredProjects.map((project) => (
                        <div 
                            key={project._id}
                            className="bg-white border border-slate-200 rounded-[32px] p-8 hover:shadow-xl hover:border-blue-100 transition-all group relative"
                        >
                            {/* TOP ROW: ICON & DATE */}
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl">
                                    {getSourceIcon(project.source?.type)}
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">
                                        {project.source?.type || 'CORE'}
                                    </span>
                                </div>
                                
                                {/* DELETE BUTTON LOGIC */}
                                {deletingId === project._id ? (
                                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                                        <button 
                                            onClick={() => { onDelete(project._id); setDeletingId(null); }}
                                            className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 shadow-lg shadow-red-200"
                                            title="Confirm Delete"
                                        >
                                            <Check size={14} />
                                        </button>
                                        <button 
                                            onClick={() => setDeletingId(null)}
                                            className="bg-slate-100 text-slate-500 p-2 rounded-lg hover:bg-slate-200"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setDeletingId(project._id)}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>

                            <h3 className="text-slate-800 font-bold text-base leading-tight mb-6 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                {project.title || "Untitled Mission"}
                            </h3>

                            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                <div className="text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                                    <Calendar size={12} />
                                    {new Date(project.createdAt).toLocaleDateString()}
                                </div>
                                
                                <button 
                                    onClick={() => onRestore(project)}
                                    className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                >
                                    Restore <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center">
                        <p className="text-slate-400 text-sm">No missions found matching "{searchQuery}"</p>
                    </div>
                )}
            </div>
        </div>
    );
}