import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { Zap, Archive, LogOut, Layout, Settings, Download } from 'lucide-react';

import EngineWorkspace from './Engine/EngineWorkspace';
import VaultArchive from './Archive/VaultArchive';
import ResultCard from './Engine/ResultCard';
import ProgressStepper from './Engine/ProgressStepper';
import SettingsPage from './Settings/Settings'; 
import AboutPage from './Settings/About';


// const PLATFORMS_CONFIG = [
//   { id: 'linkedin', label: 'LinkedIn' },
//   { id: 'twitter', label: 'Twitter / X' },
//   { id: 'instagram', label: 'Instagram' },
//   { id: 'tiktok', label: 'TikTok' },
//   { id: 'newsletter', label: 'Newsletter' },
//   { id: 'blog', label: 'Blog Post' },
//   { id: 'threads', label: 'Threads' },
//   { id: 'facebook', label: 'Facebook' },
//   { id: 'pinterest', label: 'Pinterest' },
//   { id: 'youtube', label: 'YouTube' },
//   { id: 'medium', label: 'Medium' },
//   { id: 'reddit', label: 'Reddit' }
// ];

export default function Dashboard({ user, setUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State Management
  const [bundle, setBundle] = useState(null);
  const [rawText, setRawText] = useState(""); 
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState("Initializing...");
  const [progress, setProgress] = useState(0); 
  const [history, setHistory] = useState([]);
  const [cooldown, setCooldown] = useState(0);
  const [currentProjectId, setCurrentProjectId] = useState(null);

const API_BASE = (process.env.REACT_APP_API_URL || "http://localhost:5000") + "/api";
  const fetchHistory = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE}/history`, {
        headers: { 'x-auth-token': token }
      });
      setHistory(res.data);
    } catch (e) {
      console.error("Vault Sync Error:", e.message);
    }
  };

  useEffect(() => {
    fetchHistory();
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

const handleRepurpose = async (type, content, tone) => {
    setIsGenerating(true);
    setBundle({});
    setProgress(0);
    setStatusText("Initializing Engine...");

    const formData = new FormData();
    if (type === 'file') formData.append('file', content);
    else formData.append('content', content);
    formData.append('type', type);
    formData.append('tone', tone);

    try {
        const response = await fetch(`${API_BASE}/repurpose-all`, {
            method: 'POST',
            body: formData,
            headers: { 'x-auth-token': localStorage.getItem('token') }
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const lines = decoder.decode(value).split('\n\n');
          lines.forEach(line => {
              if (line.startsWith('data: ')) {
                  const data = JSON.parse(line.replace('data: ', ''));

                  if (data.progress) setProgress(data.progress);
                  if (data.status) setStatusText(data.status);

                  // NEW: Append single platform to bundle immediately
                  if (data.partialResult) {
                      setBundle(prev => ({
                          ...prev,
                          [data.partialResult.platform]: data.partialResult.content
                      }));
                  }

                  if (data.projectId) {
                      setCurrentProjectId(data.projectId);
                      fetchHistory();
                  }
              }
          });
      }
    } catch (e) {
        console.error(e);
        setStatusText("Mission Failed");
        alert(e.message);
    } finally {
        setTimeout(() => setIsGenerating(false), 2000);
        fetchHistory();
    }
};

  const handleSingleRegenerate = async (platform) => {
    if (!rawText) return alert("Source text missing.");
    setIsGenerating(true);
    setStatusText(`Refining ${platform}...`);
    
    try {
        const token = localStorage.getItem('token');
        const res = await axios.post(`${API_BASE}/repurpose-all`, {
            type: 'text',
            content: rawText,
            tone: 'PROFESSIONAL' // or pass current tone
        }, {
            headers: { 'x-auth-token': token }
        });

        setBundle(prev => ({
            ...prev,
            [platform.toLowerCase()]: res.data.bundle[platform.toLowerCase()]
        }));
    } catch (e) {
        alert("Regeneration failed.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleRestore = (project) => {
    const restoredBundle = {};
    if (project.assets) {
      project.assets.forEach(asset => {
        restoredBundle[asset.platform.toLowerCase()] = asset.content;
      });
      setRawText(project.source?.rawTranscript || ""); 
    }
    setBundle(restoredBundle);
    setCurrentProjectId(project._id);
    navigate('/dashboard'); 
  };

  const handleDownloadAll = () => {
    if (!bundle || Object.keys(bundle).length === 0) return;

    let fileContent = `ECHOLY REPURPOSE REPORT\n`;
    fileContent += `Date: ${new Date().toLocaleString()}\n`;
    fileContent += `==========================================\n\n`;

    // Loop through the bundle to add each platform's content
    Object.entries(bundle).forEach(([platform, content]) => {
        fileContent += `--- ${platform.toUpperCase()} ---\n\n`;
        fileContent += `${content}\n\n`;
        fileContent += `------------------------------------------\n\n`;
    });

    // Create the file and trigger download
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Echoly_Assets_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans selection:bg-blue-100">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-6 sticky top-0 h-screen z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2 mb-10 px-2">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-lg shadow-blue-200">
            <Zap size={20} fill="currentColor" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800 uppercase italic">Echoly</span>
        </div>

        <nav className="flex-grow space-y-2">
          <Link to="/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${location.pathname === '/dashboard' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50'}`}>
            <Layout size={20} /> Content Engine
          </Link>
          <Link to="/dashboard/vault" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${location.pathname.includes('vault') ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50'}`}>
            <Archive size={20} /> Project Vault
          </Link>
          <Link to="/dashboard/settings" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${location.pathname.includes('settings') ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50'}`}>
            <Settings size={20} /> System Settings
          </Link>
        </nav>

        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-500 mt-auto font-black text-[10px] uppercase tracking-widest">
          <LogOut size={18} /> Exit System
        </button>
      </aside>

      <main className="flex-grow p-10 overflow-y-auto">
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">
              {location.pathname.includes('vault') ? 'Project Vault' : location.pathname.includes('settings') ? 'Settings Control' : 'Mission Control'}
            </h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
              Operator: <span className="text-blue-600">{user?.name || "Unidentified"}</span>
            </p>
          </div>
        </header>

        {/* Only show the download button if there is content in the bundle */}
        {/* In Dashboard.js */}
        {bundle && Object.keys(bundle).length > 0 && !isGenerating && (
          <div className="flex justify-end mb-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <button 
              onClick={handleDownloadAll}
              className="group flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-200"
            >
              {/* Change this line right here */}
              <Download size={16} className="group-hover:translate-y-0.5 transition-transform" />
              Download All Assets (.txt)
            </button>
          </div>
        )}

        <Routes>
          <Route path="/" element={
  <div className="max-w-6xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <EngineWorkspace onRepurpose={handleRepurpose} isGenerating={isGenerating} cooldown={cooldown} />
    
    {isGenerating && <ProgressStepper progress={progress} statusText={statusText} />}
    
    {/* Use a fragment <> or a div to wrap the grid so it renders if bundle HAS data OR if we are generating */}
    {(Object.keys(bundle || {}).length > 0 || isGenerating) && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-32">
        
        {/* 1. COMPLETED CARDS */}
        {Object.entries(bundle || {}).map(([platformKey, content]) => (
          <div key={platformKey} className="animate-in fade-in zoom-in-95 duration-500">
            <ResultCard 
              platform={platformKey} 
              content={content} 
              projectId={currentProjectId}
              fetchHistory={fetchHistory}
              onRegenerate={() => handleSingleRegenerate(platformKey)} 
            />
          </div>
        ))}

        {/* 2. THE ACTIVE WORKER SKELETON */}
        {isGenerating && (
          <div className="h-[500px] bg-white border border-slate-100 rounded-[32px] p-8 flex flex-col animate-pulse shadow-sm border-dashed">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                 <div className="h-3 w-24 bg-slate-100 rounded-full"></div>
              </div>
              <div className="h-6 w-6 bg-slate-50 rounded-lg"></div>
            </div>
            <div className="flex-grow bg-slate-50/50 rounded-2xl p-6 space-y-4">
              <div className="h-3 w-3/4 bg-slate-100 rounded"></div>
              <div className="h-3 w-full bg-slate-100 rounded"></div>
              <div className="h-3 w-5/6 bg-slate-100 rounded"></div>
            </div>
            <div className="mt-6 h-10 w-32 bg-slate-200 rounded-xl"></div>
          </div>
        )}
      </div>
    )}
  </div>
} />
          <Route path="/vault" element={<VaultArchive projects={history} onRestore={handleRestore} fetchHistory={fetchHistory} />} />
          <Route path="/settings" element={<SettingsPage user={user} />} />
          <Route path='/about' element={<AboutPage user={user} />} />
        </Routes>
      </main>
    </div>
  );
}