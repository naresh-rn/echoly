import React, { useState } from 'react';
import { Calendar, Search, Layers, ArrowRight, Trash2, FileText, Youtube, Globe, HardDrive, X, Check } from 'lucide-react';
import axios from 'axios';

const API_BASE = (process.env.REACT_APP_API_URL || "http://localhost:5000") + "/api";

export default function VaultArchive({ projects, onRestore, fetchHistory, onDelete }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [deletingId, setDeletingId] = useState(null);

    const filteredProjects = projects.filter((project) =>
        project.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const deleteHistory = async () => {
        if (window.confirm("PERMANENTLY WIPE THE VAULT?")) {
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
        // Uniform grayscale icons for a cleaner look
        const iconClass = "text-slate-400"; 
        switch (type) {
            case 'YOUTUBE': return <Youtube size={14} className={iconClass} />;
            case 'BLOG': return <Globe size={14} className={iconClass} />;
            case 'FILE': return <HardDrive size={14} className={iconClass} />;
            default: return <FileText size={14} className={iconClass} />;
        }
    };

    if (!projects || projects.length === 0) {
        return (
            <div className="bg-white border border-slate-200 rounded-2xl py-20 flex flex-col items-center justify-center text-center">
                <Layers size={32} className="text-slate-200 mb-3" />
                <h3 className="text-slate-900 font-semibold text-sm">Vault is Empty</h3>
                <p className="text-slate-400 text-xs max-w-xs mt-1 px-6 leading-relaxed">
                    Once you process content, your history will appear here.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* SEARCH & ACTIONS */}
            <div className="flex flex-col md:flex-row gap-3 justify-between items-center bg-white p-4 rounded-xl border border-slate-100">
                <div className="relative w-full md:w-80">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search mission title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-100 focus:border-slate-300 outline-none transition-all text-[13px]"
                    />
                </div>

                <button 
                    onClick={deleteHistory}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-black transition-colors text-[10px] font-semibold uppercase tracking-wider px-2"
                >
                    <Trash2 size={12} /> Wipe Vault
                </button>
            </div>

            {/* PROJECT GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProjects.length > 0 ? (
                    filteredProjects.map((project) => (
                        <div 
                            key={project._id}
                            className="bg-white border border-slate-100 rounded-xl p-5 hover:border-slate-300 transition-all group relative"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-md">
                                    {getSourceIcon(project.source?.type)}
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">
                                        {project.source?.type || 'CORE'}
                                    </span>
                                </div>
                                
                                {deletingId === project._id ? (
                                    <div className="flex items-center gap-1.5">
                                        <button 
                                            onClick={() => { onDelete(project._id); setDeletingId(null); }}
                                            className="bg-black text-white p-1.5 rounded-md hover:bg-slate-800"
                                        >
                                            <Check size={12} />
                                        </button>
                                        <button 
                                            onClick={() => setDeletingId(null)}
                                            className="bg-slate-100 text-slate-500 p-1.5 rounded-md"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setDeletingId(project._id)}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-black transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>

                            <h3 className="text-slate-800 font-semibold text-sm leading-snug mb-5 line-clamp-1 group-hover:text-black transition-colors">
                                {project.title || "Untitled Mission"}
                            </h3>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                <div className="text-slate-400 font-medium text-[10px] uppercase tracking-wide flex items-center gap-1.5">
                                    <Calendar size={11} />
                                    {new Date(project.createdAt).toLocaleDateString()}
                                </div>
                                
                                <button 
                                    onClick={() => onRestore(project)}
                                    className="flex items-center gap-1.5 bg-black text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-all"
                                >
                                    Restore <ArrowRight size={12} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-10 text-center">
                        <p className="text-slate-400 text-xs font-medium">No matches for "{searchQuery}"</p>
                    </div>
                )}
            </div>
        </div>
    );
}