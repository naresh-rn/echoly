import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Zap, 
  Archive, 
  LogOut, 
  Layout, 
  Settings, 
  Download, 
  Menu, 
  X, 
  ChevronRight, 
  User, 
  Activity 
} from 'lucide-react';

// Child Components
import EngineWorkspace from './Engine/EngineWorkspace';
import VaultArchive from './Archive/VaultArchive';
import ResultCard from './Engine/ResultCard';
import ProgressStepper from './Engine/ProgressStepper';
import SettingsPage from './Settings/Settings'; 
import AboutPage from './Settings/About';

export default function Dashboard({ user, setUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // UI State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Core Logic State
  const [bundle, setBundle] = useState(null);
  const [rawText, setRawText] = useState(""); 
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState("Initializing System...");
  const [progress, setProgress] = useState(0); 
  const [history, setHistory] = useState([]);
  const [cooldown, setCooldown] = useState(0);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [currentProjectId, setCurrentProjectId] = useState(null);

  const API_BASE = (process.env.REACT_APP_API_URL || "http://localhost:5000") + "/api";
  
const fetchHistory = useCallback(async () => {
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
}, [API_BASE]); // Added API_BASE as a dependency

  useEffect(() => {
    fetchHistory();
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown, fetchHistory]);

  // Actions
// Dashboard.js -> handleRepurpose

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
        let buffer = ""; // THIS IS THE FIX: A buffer for partial chunks

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            
            // Keep the last (potentially incomplete) part in the buffer
            buffer = lines.pop(); 

            for (const line of lines) {
                if (line.trim().startsWith('data: ')) {
                    try {
                        const jsonString = line.replace('data: ', '').trim();
                        const data = JSON.parse(jsonString);
                        
                        if (data.progress) setProgress(data.progress);
                        if (data.status) setStatusText(data.status);
                        if (data.partialResult) {
                            setBundle(prev => ({
                                ...prev,
                                [data.partialResult.platform]: data.partialResult.content
                            }));
                        }
                        if (data.projectId) {
                            setCurrentProjectId(data.projectId);
                        }
                    } catch (e) {
                        console.log("Waiting for next chunk...");
                    }
                }
            }
        }
    } catch (e) {
        setStatusText("Mission Failed");
        alert("Streaming error: " + e.message);
    } finally {
        setTimeout(() => setIsGenerating(false), 1000);
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
            tone: 'PROFESSIONAL'
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
    let fileContent = `ECHOLY REPURPOSE REPORT\nDate: ${new Date().toLocaleString()}\n==========================================\n\n`;
    Object.entries(bundle).forEach(([platform, content]) => {
        fileContent += `--- ${platform.toUpperCase()} ---\n\n${content}\n\n------------------------------------------\n\n`;
    });
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

// Inside Dashboard.js
// Dashboard.js

const handleGenerateImage = async (content) => {
  if (!content) return;
  
  try {
    setIsGenerating(true);
    setGeneratedImage(null); // Clear old image to show fresh start

    const token = localStorage.getItem('token');
    const res = await axios.post(`${API_BASE}/generate-image`, 
      { prompt: content }, 
      { headers: { 'x-auth-token': token } }
    );

    const imageUrl = `data:${res.data.mimeType};base64,${res.data.imageData}`;
    setGeneratedImage(imageUrl);
    
    // Smooth scroll to the top to show the new visual
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (error) {
    console.error("Visual Error:", error);
    alert("The engine is refining your brand visual. Please try again in 10 seconds.");
  } finally {
    setIsGenerating(false);
  }
};

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/');
  };

  // Helper component for Sidebar Links
const SidebarItem = ({ to, icon: Icon, label, exact = false }) => {
  const isActive = exact ? location.pathname === to : location.pathname.includes(to);
  return (
    <Link 
      to={to} 
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-body text-sm font-medium mb-1 ${
        isActive ? 'bg-black text-white' : 'text-gray-500 hover:text-black hover:bg-gray-100'
      }`}
      // shadow-lg and shadow-black/10 have been removed above
    >
      <Icon size={18} />
      {/* leading-none and flex items-center removes the 2px top gap */}
      <span className="leading-none flex items-center">{label}</span>
    </Link>
  );
};

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row font-body text-slate-900 overflow-hidden">
      
      {/* Global Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anek+Odia:wght@300;400;500;600;700&display=swap');
        .font-body { font-family: 'Anek Odia', sans-serif; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        @keyframes shimmer { 100% { transform: translateX(100%); } }
      `}</style>

      {/* MOBILE HEADER */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center gap-2">
           <Zap size={20} fill="black" />
           <span className="font-bold text-lg pt-2">Echoly</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 hover:bg-gray-100 rounded-lg">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-100 flex flex-col transform transition-transform duration-300 md:translate-x-0 md:static ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 hidden md:flex items-center gap-3">
          <div className="bg-black p-2 pt-2 rounded-xl shadow-md shadow-black/10 text-white">
            <Zap size={20} fill="currentColor" />
          </div>
          <span className="font-bold text-2xl pt-2 tracking-tight">Echoly</span>
        </div>

        <nav className="flex-grow px-4 mt-4">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 mb-4">Main Menu</div>
          <SidebarItem to="/dashboard" className='pt-2'icon={Layout} label="Dashboard" exact/>
          <SidebarItem to="/dashboard/vault" icon={Archive} label="Vault (History)" />
          
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 mb-4 mt-8">System</div>
          <SidebarItem to="/dashboard/settings" icon={Settings} label="Settings" />
          <SidebarItem to="/about" icon={Activity} label="Status" />
        </nav>

        <div className="p-6 border-t border-gray-50 mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold border border-gray-200">
                 {user?.name?.charAt(0).toUpperCase() || <User size={14} />}
              </div>
              <div className="flex flex-col">
                 <span className="text-xs font-bold leading-none">{user?.name || 'User'}</span>
                 <span className="text-[10px] text-gray-400 mt-1">Free Plan</span>
              </div>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 p-2 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 h-[calc(100vh-60px)] md:h-screen overflow-y-auto p-5 md:p-12 relative">
        <header className="max-w-6xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">
              <span>Main</span>
              <ChevronRight size={12} />
              <span className="text-black">{location.pathname.includes('vault') ? 'Vault' : 'Engine'}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              {location.pathname.includes('vault') ? 'Archive' : 'Generator'}
            </h1>
          </div>
          
          {bundle && Object.keys(bundle).length > 0 && !isGenerating && (
             <button onClick={handleDownloadAll} className="flex items-center gap-2 bg-black hover:bg-zinc-800 text-white px-6 py-3.5 rounded-2xl font-bold text-sm shadow-xl shadow-black/10 transition-all active:scale-95">
               <Download size={16} />
               <span>Export All Assets</span>
             </button>
          )}
        </header>

        <div className="max-w-6xl mx-auto">
           <Routes>
            <Route path="/" element={
              <div className="space-y-10">
                <div className="bg-white rounded-[5px] p-2 border border-gray-100 shadow-sm">
                  <EngineWorkspace onRepurpose={handleRepurpose} isGenerating={isGenerating} cooldown={cooldown} />
                </div>

                {isGenerating && <ProgressStepper progress={progress} statusText={statusText} />}

                {generatedImage && (
                  <div className="max-w-6xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-2xl overflow-hidden">
                      
                      {/* Visual Header */}
                      <div className="px-8 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          EchoThread Visual Engine (Powered by Puter)
                        </span>
                          <button 
                            onClick={() => onGenerateImage(editedContent)} 
                            disabled={isGenerating}
                            className={`ml-auto flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-bold uppercase transition-all 
                              ${isGenerating ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
                          >
                            {isGenerating ? (
                              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <ImageIcon size={14} />
                            )}
                            <span>{isGenerating ? "Drawing..." : "Create Visual"}</span>
                          </button>
                      </div>

                      {/* 16:9 Aspect Ratio Container */}
                      <div className="aspect-video w-full bg-slate-900 overflow-hidden group">
                        <img 
                          src={generatedImage} 
                          alt="Puter AI Visual" 
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                      </div>

                      {/* Actions */}
                      <div className="p-6 flex justify-between items-center bg-white">
                        <div className="text-[10px] font-bold text-slate-300">1024 x 576 • 4K UPSCALE</div>
                        <a 
                          href={generatedImage} 
                          download="asset-visual.png"
                          className="bg-black text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-black/10 hover:bg-zinc-800 transition-all"
                        >
                          Export High-Res Asset
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* TWO COLUMN GRID FOR RESULTS */}
                {(Object.keys(bundle || {}).length > 0 || isGenerating) && (
                  <div className="columns-1 md:columns-2 gap-6 space-y-6">
                      {Object.entries(bundle || {}).map(([platform, content]) => (
                        <ResultCard 
                            key={platform}
                            platform={platform} 
                            content={content} 
                            projectId={currentProjectId}
                            fetchHistory={fetchHistory}
                            isGenerating={isGenerating} // Pass loading state
                            onRegenerate={() => handleSingleRegenerate(platform)} 
                            onGenerateImage={handleGenerateImage} // Pass function
                            onShare={() => { /* share logic */ }}
                        />
                      ))}
                  </div>
                )}
              </div>
            } />
            
            
            <Route path="/vault" element={
              <VaultArchive 
                projects={history} 
                onRestore={handleRestore} 
                fetchHistory={fetchHistory} 
                onDelete={async (id) => {
                  try {
                    await axios.delete(`${API_BASE}/projects/${id}`, {
                      headers: { 'x-auth-token': localStorage.getItem('token') }
                    });
                    fetchHistory(); // Refresh the list after deleting
                  } catch (e) {
                    alert("Delete failed");
                  }
                }} 
              />
            } />
            <Route path="/settings" element={<SettingsPage user={user} />} />
            <Route path="/about" element={<AboutPage user={user} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}