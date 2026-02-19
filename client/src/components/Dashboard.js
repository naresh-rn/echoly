import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Zap, Archive, LogOut, Layout, Settings, Download, Menu, ChevronRight, Activity, ShieldCheck, Image as ImageIcon, X 
} from 'lucide-react';

// Child Components
import EngineWorkspace from './Engine/EngineWorkspace';
import VaultArchive from './Archive/VaultArchive';
import ResultCard from './Engine/ResultCard';
import SettingsPage from './Settings/Settings'; 
import StatusPage from './Settings/StatusPage';
import PulsePage from './Settings/PulsePage';

export default function Dashboard({ user, setUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // --- STATE ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [bundle, setBundle] = useState({});
  const [rawText, setRawText] = useState(""); 
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState("System Ready");
  const [progress, setProgress] = useState(0); 
  const [history, setHistory] = useState([]);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [currentProjectId, setCurrentProjectId] = useState(null);

  const bundleRef = useRef({});
  const API_BASE = (process.env.REACT_APP_API_URL || "http://localhost:10000") + "/api";

  // --- 1. VAULT SYNC ---
  const fetchHistory = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE}/history`, { headers: { 'x-auth-token': token } });
      setHistory(res.data);
      return res.data;
    } catch (e) {
      console.error("Vault Sync Error:", e.message);
      return [];
    }
  }, [API_BASE]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // --- 2. ENGINE LOGIC ---
  const handleRepurpose = async (type, content, tone) => {
      setIsGenerating(true);
      setBundle({});
      bundleRef.current = {};
      setGeneratedImage(null);
      setProgress(5);
      setStatusText("Initializing Connection...");
      
      if (type === 'text') setRawText(content);

      const formData = new FormData();
      if (type === 'file') formData.append('file', content);
      else formData.append('content', content);
      formData.append('type', type);
      formData.append('tone', tone);

      try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${API_BASE}/repurpose-all`, {
              method: 'POST',
              body: formData,
              headers: { 'x-auth-token': token }
          });

          if (!response.body) throw new Error("Connection failed");

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
                      const data = JSON.parse(line.replace('data: ', '').trim());
                      if (data.error) throw new Error(data.error);
                      if (data.progress) setProgress(data.progress);
                      if (data.status) setStatusText(data.status);
                      
                      if (data.partialResult) {
                          const { platform, content } = data.partialResult;
                          bundleRef.current[platform] = content;
                          setBundle(prev => ({ ...prev, [platform]: content }));
                      }
                      if (data.bundle) {
                          setBundle(data.bundle);
                          bundleRef.current = data.bundle;
                      }
                      if (data.projectId) setCurrentProjectId(data.projectId);
                  } catch (e) { console.warn("Stream parse warning:", e); }
              }
            }
          }
      } catch (e) {
          setStatusText("Processing Error");
          alert("Error: " + e.message);
      } finally {
          setProgress(100);
          setStatusText("Finalizing Assets...");
          setTimeout(async () => {
              setIsGenerating(false);
              if (Object.keys(bundleRef.current).length === 0) {
                  const latestHistory = await fetchHistory();
                  if (latestHistory && latestHistory.length > 0) handleRestore(latestHistory[0]);
              } else {
                  fetchHistory();
              }
          }, 1000);
      }
  };

  // --- 3. ASSET MANAGEMENT ---
  const handleSingleRegenerate = async (platform) => {
    if (!rawText && !bundle[platform]) return alert("Cannot regenerate without context.");
    setIsGenerating(true);
    setStatusText(`Refining ${platform}...`);
    try {
        const token = localStorage.getItem('token');
        const res = await axios.post(`${API_BASE}/repurpose-all`, {
            type: 'text', content: rawText || bundle[platform], tone: 'PROFESSIONAL' 
        }, { headers: { 'x-auth-token': token } });

        if (res.data && res.data.bundle) {
           setBundle(prev => ({ ...prev, [platform]: res.data.bundle[platform] || prev[platform] }));
        }
    } catch (e) { alert("Regeneration busy."); } finally { setIsGenerating(false); }
  };

  const handleDeleteAsset = async (platform) => {
    if (!currentProjectId) return alert("Project not saved yet.");
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/projects/${currentProjectId}/asset/${platform}`, {
        headers: { 'x-auth-token': token }
      });
      setBundle(prev => {
        const newBundle = { ...prev };
        delete newBundle[platform];
        return newBundle;
      });
    } catch (e) { alert("Failed to delete asset: " + e.message); }
  };

  const handleRestore = (project) => {
    const restoredBundle = {};
    if (project.assets) {
      project.assets.forEach(asset => { restoredBundle[asset.platform.toLowerCase()] = asset.content; });
      setRawText(project.source?.rawTranscript || ""); 
    }
    setBundle(restoredBundle);
    bundleRef.current = restoredBundle;
    setCurrentProjectId(project._id);
    navigate('/dashboard'); 
  };

  const handleDownloadAll = () => {
    if (!bundle) return;
    let fileContent = `ECHOLY REPORT\nDate: ${new Date().toLocaleString()}\n\n`;
    Object.entries(bundle).forEach(([platform, content]) => { fileContent += `--- ${platform.toUpperCase()} ---\n\n${content}\n\n`; });
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Echoly_Assets.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateImage = async (content) => {
    if (!content) return;
    try {
      setIsGenerating(true);
      setStatusText("Generating Visuals...");
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_BASE}/generate-image`, { prompt: content }, { headers: { 'x-auth-token': token } });
      setGeneratedImage(`data:${res.data.mimeType};base64,${res.data.imageData}`);
    } catch (error) { alert("Visual Engine is busy."); } finally { setIsGenerating(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/');
  };

  // Sidebar Helper
  const SidebarItem = ({ to, icon: Icon, label }) => {
    const isActive = location.pathname === to;
    return (
      <Link 
        to={to} 
        onClick={() => setIsMobileMenuOpen(false)} 
        className={`flex items-center justify-between px-4 py-2.5 rounded-lg transition-all mb-1 ${
          isActive ? 'bg-black text-white' : 'text-slate-500 hover:text-black hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon size={16} /> 
          <span className="text-[13px] font-medium leading-none">{label}</span>
        </div>
        {!isActive && <ChevronRight size={12} className="text-slate-200" />}
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-[#FAFAFA] text-slate-900 overflow-hidden antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm z-[60] md:hidden transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-[70] w-64 bg-white border-r border-slate-100 flex flex-col transition-transform duration-300 md:static md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-black p-1.5 rounded text-white"><Zap size={14} fill="currentColor" /></div>
            <span className="font-bold text-sm tracking-tight uppercase">ECHOLY</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-grow px-3 mt-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-4">Core</div>
          <SidebarItem to="/dashboard" icon={Layout} label="Workspace" />
          <SidebarItem to="/dashboard/vault" icon={Archive} label="Vault Archive" />
          <div className="my-6 h-px bg-slate-100 mx-4" />
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-4">System</div>
          <SidebarItem to="/dashboard/pulse" icon={Activity} label="Pulse" />
          <SidebarItem to="/dashboard/status" icon={ShieldCheck} label="Status" />
          <SidebarItem to="/dashboard/settings" icon={Settings} label="Settings" />
        </nav>

        <div className="p-4 border-t border-slate-50">
          <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100 overflow-hidden">
            <div className="w-8 h-8 rounded bg-black flex items-center justify-center text-[10px] font-bold text-white shrink-0">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col overflow-hidden">
               <span className="text-[11px] font-semibold truncate">{user?.name || 'User'}</span>
               <button onClick={handleLogout} className="text-[9px] text-slate-400 font-bold hover:text-red-500 uppercase text-left">Log Out</button>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* MOBILE HEADER */}
        <header className="md:hidden flex items-center justify-between px-4 h-14 bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2"><Zap size={16} fill="black" /><span className="font-bold text-xs uppercase">ECHOLY</span></div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-1.5 text-slate-600"><Menu size={20} /></button>
        </header>

        <main className="flex-1 overflow-y-auto relative scroll-smooth bg-[#FAFAFA]">
          <div className="max-w-6xl mx-auto p-4 md:p-10">
            {/* MINIMAL TITLE HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1">
                  <span>ECHOLY</span> <ChevronRight size={8} /> 
                  <span className="text-slate-900">{location.pathname.includes('vault') ? 'VAULT' : 'ENGINE'}</span>
                </div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
                  {location.pathname.includes('vault') ? 'History Archive' : 'Engine Workspace'}
                </h1>
              </div>

              {bundle && Object.keys(bundle).length > 0 && !isGenerating && location.pathname === "/dashboard" && (
                <button onClick={handleDownloadAll} className="flex items-center justify-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-slate-800 transition-all shadow-sm">
                  <Download size={14} /> Export Report
                </button>
              )}
            </div>

            <div className="pb-10">
              <Routes>
                <Route path="/" element={
                  <div className="space-y-8">
                    <EngineWorkspace 
                      onRepurpose={handleRepurpose} 
                      isGenerating={isGenerating} 
                      progress={progress} 
                      statusText={statusText} 
                    />
                    
                    {generatedImage && (
                      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                        <img src={generatedImage} alt="AI Visual" className="w-full h-auto" />
                        <div className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                          <div className="text-left w-full sm:w-auto">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Visual Asset</span>
                            <span className="text-sm font-semibold">AI Generated Render</span>
                          </div>
                          <a href={generatedImage} download="Echoly_Visual.png" className="w-full sm:w-auto text-center bg-black text-white px-6 py-2 rounded-lg font-bold text-[10px] uppercase">Download Image</a>
                        </div>
                      </div>
                    )}

                    {(Object.keys(bundle || {}).length > 0) && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {Object.entries(bundle || {}).map(([p, c]) => (
                          <ResultCard 
                            key={p} 
                            platform={p} 
                            content={c} 
                            projectId={currentProjectId}
                            isGenerating={isGenerating} 
                            onRegenerate={() => handleSingleRegenerate(p)} 
                            onGenerateImage={() => handleGenerateImage(c)} 
                            onDelete={() => handleDeleteAsset(p)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                } />
                <Route path="/vault" element={<VaultArchive projects={history} onRestore={handleRestore} fetchHistory={fetchHistory} onDelete={async (id) => { await axios.delete(`${API_BASE}/projects/${id}`, { headers: { 'x-auth-token': localStorage.getItem('token') } }); fetchHistory(); }} />} />
                <Route path="/settings" element={<SettingsPage user={user} />} />
                <Route path="/pulse" element={<PulsePage />} />
                <Route path="/status" element={<StatusPage user={user} />} />
              </Routes>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}