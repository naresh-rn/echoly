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
  const[generatedAssets, setGeneratedAssets] = useState({});

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

const handleRepurpose = async (type, payload, tone) => {
    setIsGenerating(true);
    setProgress(0);
    setStatusText("Connecting to Engine...");
    setGeneratedAssets({}); // Clear previous results

    try {
        // 1. Prepare FormData (Crucial for file uploads + mixed data)
        const formData = new FormData();
        formData.append('type', type);
        formData.append('tone', tone);
        
        if (type === 'file') {
            formData.append('file', payload); // payload is the File object
        } else {
            formData.append('content', payload); // payload is URL or Text
        }

        // 2. Fetch using POST, but handle it as a Stream
        const response = await fetch(`${API_BASE}/repurpose-all`, {
            method: 'POST',
            headers: {
                // DO NOT set 'Content-Type': 'multipart/form-data', fetch handles it automatically!
                'x-auth-token': localStorage.getItem('token')
            },
            body: formData
        });

        if (!response.ok) throw new Error("Failed to connect to engine.");

        // 3. Setup Stream Reader
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Decode the stream chunk
            buffer += decoder.decode(value, { stream: true });
            
            // SSE chunks are separated by newlines
            const lines = buffer.split('\n');
            buffer = lines.pop(); // Keep incomplete lines in the buffer for the next chunk

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonStr = line.replace('data: ', '').trim();
                    if (!jsonStr) continue;

                    try {
                        const parsed = JSON.parse(jsonStr);

                        // --- UPDATE FRONTEND UI IN REAL TIME ---
                        
                        if (parsed.status) setStatusText(parsed.status);
                        if (parsed.progress) setProgress(parsed.progress);

                        // If a single platform finished, we can optionally show it immediately!
                        if (parsed.partialResult) {
                            setGeneratedAssets(prev => ({
                                ...prev,[parsed.partialResult.platform]: parsed.partialResult.content
                            }));
                        }

                        // If an error occurred mid-stream
                        if (parsed.error) {
                            alert(`Engine Error: ${parsed.error}`);
                            setIsGenerating(false);
                            return;
                        }

                        // Complete!
                        if (parsed.success) {
                            // Update your Vault/History state if needed
                            fetchHistory(); // Assuming you have a function to refresh the vault
                            
                            // Delay slightly before removing the progress overlay for a smooth UI feel
                            setTimeout(() => {
                                setIsGenerating(false);
                                setProgress(0);
                            }, 1000);
                        }

                    } catch (err) {
                        console.error("Error parsing stream chunk", err);
                    }
                }
            }
        }
    } catch (error) {
        console.error("Process Failed:", error);
        alert("Failed to process content.");
        setIsGenerating(false);
    }
};

  const handleSingleRegenerate = async (platform) => {
      // We need the Project ID to know which transcript to use
      if (!currentProjectId) return alert("Please wait for the project to save first.");

      setIsGenerating(true);
      setStatusText(`Refining ${platform.toUpperCase()}...`);
      
      try {
          const token = localStorage.getItem('token');
          const res = await axios.post(`${API_BASE}/repurpose-single`, {
              projectId: currentProjectId,
              platformId: platform, // e.g., 'linkedin'
              tone: 'Professional'  // You can later make this dynamic
          }, { 
              headers: { 'x-auth-token': token } 
          });

          if (res.data && res.data.content) {
              // Update ONLY the specific platform in the bundle state
              setBundle(prev => ({ 
                  ...prev, 
                  [platform.toLowerCase()]: res.data.content 
              }));
              setStatusText("Asset Refined!");
          }
      } catch (e) {
          console.error("Regeneration Error:", e);
          alert("Visual Engine is busy. Please try again.");
      } finally {
          setIsGenerating(false);
          // Briefly show success then reset status
          setTimeout(() => setStatusText("System Ready"), 2000);
      }
  };

  const handleUpdateAsset = async (platform, newContent) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE}/projects/${currentProjectId}/asset`, {
        platform: platform.toUpperCase(),
        content: newContent
      }, { headers: { 'x-auth-token': token } });
      
      // Update local state so the UI stays in sync
      setBundle(prev => ({ ...prev, [platform.toLowerCase()]: newContent }));
    } catch (e) {
      alert("Failed to save changes to database: " + e.message);
    }
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

// --- Updated handleRestore in Dashboard.js ---
const handleRestore = (project) => {
    const restoredBundle = {};
    if (project.assets) {
        project.assets.forEach(asset => { 
            restoredBundle[asset.platform.toLowerCase()] = asset.content; 
        });
    }
    
    // Set the current project ID so 'repurpose-single' knows what project we are on
    setCurrentProjectId(project._id);
    
    // Set the bundle to show the cards
    setBundle(restoredBundle);
    
    // Crucial: Set the raw text so we can use it for AI context later
    setRawText(project.source?.rawTranscript || ""); 
    
    navigate('/dashboard'); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
                            onUpdate={handleUpdateAsset}
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