import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Zap, Archive, LogOut, Layout, Settings, Download, 
  Menu, X, ChevronRight, ChevronLeft, User, Activity, ShieldCheck 
} from 'lucide-react';

// Child Components
import EngineWorkspace from './Engine/EngineWorkspace';
import VaultArchive from './Archive/VaultArchive';
import ResultCard from './Engine/ResultCard';
import ProgressStepper from './Engine/ProgressStepper';
import SettingsPage from './Settings/Settings'; 
import StatusPage from './Settings/StatusPage';
import PulsePage from './Settings/PulsePage';

export default function Dashboard({ user, setUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // UI State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Core Logic State
  const [bundle, setBundle] = useState(null);
  const [rawText, setRawText] = useState(""); 
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState("Ready");
  const [progress, setProgress] = useState(0); 
  const [history, setHistory] = useState([]);
  const [cooldown, setCooldown] = useState(0);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [currentProjectId, setCurrentProjectId] = useState(null);

  const API_BASE = (process.env.REACT_APP_API_URL || "http://localhost:5000") + "/api";

  // --- VAULT SYNC ---
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
  }, [API_BASE]);

  useEffect(() => {
    fetchHistory();
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown, fetchHistory]);

  // --- CORE REPURPOSE LOGIC (SSE STREAMING) ---
  const handleRepurpose = async (type, content, tone) => {
      setIsGenerating(true);
      setBundle({});
      setProgress(0);
      setStatusText("Initializing Engine...");
      setRawText(type === 'text' ? content : ""); // Save source text for regeneration

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
          let buffer = ""; 

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
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
                      if (data.projectId) setCurrentProjectId(data.projectId);
                  } catch (e) { console.log("Streaming data...") }
              }
            }
          }
      } catch (e) {
          setStatusText("Failed");
          alert(e.message);
      } finally {
          setTimeout(() => setIsGenerating(false), 1000);
          fetchHistory();
      }
  };

  // --- SINGLE ASSET REGENERATE ---
  const handleSingleRegenerate = async (platform) => {
    if (!rawText) return alert("Source text missing. Try a new repurpose session.");
    setIsGenerating(true);
    setStatusText(`Refining ${platform}...`);
    try {
        const token = localStorage.getItem('token');
        const res = await axios.post(`${API_BASE}/repurpose-all`, {
            type: 'text',
            content: rawText,
            tone: 'PROFESSIONAL'
        }, { headers: { 'x-auth-token': token } });

        setBundle(prev => ({
            ...prev,
            [platform.toLowerCase()]: res.data.bundle[platform.toLowerCase()]
        }));
    } catch (e) {
        alert("Regeneration failed.");
    } finally { setIsGenerating(false); }
  };

  // --- VAULT RESTORE ---
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

  // --- DOWNLOAD ALL ---
  const handleDownloadAll = () => {
    if (!bundle) return;
    let fileContent = `ECHOLY REPURPOSE REPORT\nDate: ${new Date().toLocaleString()}\n\n`;
    Object.entries(bundle).forEach(([platform, content]) => {
        fileContent += `--- ${platform.toUpperCase()} ---\n\n${content}\n\n`;
    });
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Echoly_Assets_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- CLOUDFLARE IMAGE GENERATION ---
  const handleGenerateImage = async (content) => {
    if (!content) return;
    try {
      setIsGenerating(true);
      setGeneratedImage(null); 
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_BASE}/generate-image`, 
        { prompt: content }, 
        { headers: { 'x-auth-token': token } }
      );
      const imageUrl = `data:${res.data.mimeType};base64,${res.data.imageData}`;
      setGeneratedImage(imageUrl);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      alert("AI Visual Engine is processing. Please try again in a moment.");
    } finally { setIsGenerating(false); }
  };

  // --- LOGOUT ---
  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/');
  };

  // --- SIDEBAR ITEM COMPONENT ---
  const SidebarItem = ({ to, icon: Icon, label, exact = false }) => {
    const isActive = exact ? location.pathname === "/dashboard" : location.pathname === to;
    return (
      <Link 
        to={to} 
        onClick={() => setIsMobileMenuOpen(false)}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-body text-sm font-medium mb-1 group ${
          isActive ? 'bg-black text-white' : 'text-gray-500 hover:text-black hover:bg-gray-100'
        }`}
      >
        <Icon size={20} className="shrink-0" />
        <span className={`leading-none whitespace-nowrap overflow-hidden transition-all duration-300 ${
          isSidebarCollapsed && !isMobileMenuOpen ? 'md:w-0 md:opacity-0' : 'w-auto opacity-100'
        }`}>
          {label}
        </span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex font-body text-slate-900 overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anek+Odia:wght@300;400;500;600;700&display=swap');
        .font-body { font-family: 'Anek Odia', sans-serif; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
      `}</style>

      {/* 1. MOBILE BACKDROP */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* 2. SIDEBAR (Collapsible & Responsive) */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] bg-white border-r border-gray-100 
        flex flex-col transition-all duration-300 ease-in-out
        md:translate-x-0 md:static
        ${isMobileMenuOpen ? 'translate-x-0 w-72 shadow-2xl' : '-translate-x-full w-0 md:w-auto md:translate-x-0'}
        ${!isMobileMenuOpen && (isSidebarCollapsed ? 'md:w-24' : 'md:w-72')}
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-black p-2 rounded-xl text-white shrink-0">
              <Zap size={20} fill="currentColor" />
            </div>
            <span className={`font-bold text-xl tracking-tighter transition-all duration-300 ${isSidebarCollapsed && !isMobileMenuOpen ? 'md:opacity-0' : 'opacity-100'}`}>
              ECHOLY
            </span>
          </div>
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="hidden md:flex p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
            {isSidebarCollapsed ? <ChevronRight size={18}/> : <ChevronLeft size={18}/>}
          </button>
        </div>

        <nav className="flex-grow px-3 mt-4">
          <div className={`text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 mb-4 ${isSidebarCollapsed && !isMobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}>Menu</div>
          <SidebarItem to="/dashboard" icon={Layout} label="Dashboard" exact/>
          <SidebarItem to="/dashboard/vault" icon={Archive} label="Vault" />
          
          <div className="my-8 h-[1px] bg-gray-50 mx-4" />
          
          <div className={`text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 mb-4 ${isSidebarCollapsed && !isMobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}>System</div>
          <SidebarItem to="/dashboard/pulse" icon={Activity} label="Pulse" />
          <SidebarItem to="/dashboard/status" icon={ShieldCheck} label="Status" />
          <SidebarItem to="/dashboard/settings" icon={Settings} label="Settings" />
        </nav>

        <div className="p-4 border-t border-gray-50">
          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold text-white shrink-0">
               {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className={`flex flex-col overflow-hidden transition-all duration-300 ${isSidebarCollapsed && !isMobileMenuOpen ? 'md:w-0 md:opacity-0' : 'w-auto opacity-100'}`}>
               <span className="text-xs font-bold truncate">{user?.name || 'User'}</span>
               <button onClick={handleLogout} className="text-[10px] text-red-500 font-bold mt-1 text-left uppercase hover:underline">Logout</button>
            </div>
          </div>
        </div>
      </aside>

      {/* 3. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Navbar Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b z-50">
          <div className="flex items-center gap-2">
             <Zap size={20} fill="black" />
             <span className="font-bold tracking-tighter">ECHOLY</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg">
            <Menu size={24} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-12 relative scroll-smooth bg-[#FBFBFC]">
          {/* Dynamic Page Header */}
          <header className="max-w-6xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">
                <span>Main</span>
                <ChevronRight size={12} />
                <span className="text-black">
                  {location.pathname.includes('vault') ? 'Vault' : (location.pathname.includes('pulse') ? 'Pulse' : 'Engine')}
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                {location.pathname.includes('vault') ? 'Archive' : (location.pathname.includes('pulse') ? 'System Pulse' : 'Generator')}
              </h1>
            </div>
            {bundle && Object.keys(bundle).length > 0 && !isGenerating && location.pathname === "/dashboard" && (
               <button onClick={handleDownloadAll} className="flex items-center gap-2 bg-black hover:bg-zinc-800 text-white px-8 py-4 rounded-2xl font-bold text-sm shadow-xl transition-all active:scale-95">
                 <Download size={16} /> Export All Assets
               </button>
            )}
          </header>

          <div className="max-w-6xl mx-auto">
             <Routes>
                {/* GENERATOR DASHBOARD */}
                <Route path="/" element={
                  <div className="space-y-10">
                    <div className="bg-white rounded-[1.5rem] p-2 border border-gray-100 shadow-sm">
                      <EngineWorkspace onRepurpose={handleRepurpose} isGenerating={isGenerating} cooldown={cooldown} />
                    </div>
                    {isGenerating && <ProgressStepper progress={progress} statusText={statusText} />}
                    
                    {/* IMAGE PREVIEW */}
                    {generatedImage && (
                      <div className="max-w-6xl mx-auto mb-10 animate-in fade-in zoom-in duration-500">
                        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl overflow-hidden">
                          <div className="aspect-video w-full bg-slate-900 overflow-hidden relative group">
                            <img src={generatedImage} alt="AI Visual" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
                          </div>
                          <div className="p-6 flex justify-between items-center bg-white border-t">
                            <button onClick={() => setGeneratedImage(null)} className="px-6 py-3 rounded-2xl border text-xs font-bold hover:bg-gray-50 transition-colors">Clear</button>
                            <a href={generatedImage} download="Echoly_Asset.png" className="bg-black text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-zinc-800 transition-all">Download PNG</a>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* RESULTS GRID */}
                    {(Object.keys(bundle || {}).length > 0 || isGenerating) && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {Object.entries(bundle || {}).map(([p, c]) => (
                          <ResultCard 
                            key={p} 
                            platform={p} 
                            content={c} 
                            projectId={currentProjectId} 
                            fetchHistory={fetchHistory} 
                            isGenerating={isGenerating} 
                            onRegenerate={() => handleSingleRegenerate(p)} 
                            onGenerateImage={() => handleGenerateImage(c)} 
                          />
                        ))}
                      </div>
                    )}
                  </div>
                } />

                {/* VAULT ROUTE */}
                <Route path="/vault" element={
                  <VaultArchive 
                    projects={history} 
                    onRestore={handleRestore} 
                    fetchHistory={fetchHistory} 
                    onDelete={async (id) => { 
                      try { 
                        await axios.delete(`${API_BASE}/projects/${id}`, { headers: { 'x-auth-token': localStorage.getItem('token') } }); 
                        fetchHistory(); 
                      } catch (e) { alert("Delete failed"); } 
                    }} 
                  />
                } />

                {/* SYSTEM ROUTES */}
                <Route path="/settings" element={<SettingsPage user={user} />} />
                <Route path="/pulse" element={<PulsePage />} />
                <Route path="/status" element={<StatusPage user={user} />} />
             </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}