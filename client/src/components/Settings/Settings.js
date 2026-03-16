import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, User, Bell, Info, Save, ShieldCheck, Trash2, AlertTriangle, Zap } from 'lucide-react';

// UI Components
import Modal from '../UI/Modal';
import Notification from '../UI/Notification';

export default function SettingsPage({ user, setUser }) {
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const [brandVoice, setBrandVoice] = useState(user?.brandVoice || "");
  const [isSavingVoice, setIsSavingVoice] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const navigate = useNavigate();
  const API_BASE = (process.env.REACT_APP_API_URL || "http://localhost:10000") + "/api/auth";

  // UI State
  const [notification, setNotification] = useState(null);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'info' });

  const handleUpdatePassword = async () => {
    if (!passwords.old || !passwords.new) {
      setNotification({ message: "Both current and new passwords are required.", type: 'error' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE}/update-password`, 
        { oldPassword: passwords.old, newPassword: passwords.new }, 
        { headers: { 'x-auth-token': token } }
      );
      setNotification({ message: "Security credentials updated successfully.", type: 'success' });
      setPasswords({ old: '', new: '', confirm: '' });
    } catch (err) {
      setNotification({ message: "Update failed: " + (err.response?.data?.msg || err.message), type: 'error' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = () => {
    setModal({
      isOpen: true,
      title: "Permanent Account Deletion",
      message: "CRITICAL: Are you sure you want to permanently delete your account? This will wipe all your assets, projects, and transcription history. This action CANNOT be undone.",
      type: 'danger',
      confirmLabel: "Delete Everything",
      onConfirm: () => {
        // Second verification step
        setModal({
          isOpen: true,
          title: "Final Confirmation Required",
          message: "This is your LAST warning. Deleting your account will result in immediate loss of all data. Are you absolutely certain?",
          type: 'danger',
          confirmLabel: "Yes, Delete My Account",
          onConfirm: async () => {
            try {
              const token = localStorage.getItem('token');
              await axios.delete(`${API_BASE}/delete-account`, { headers: { 'x-auth-token': token } });
              setNotification({ message: "Account successfully purged.", type: 'success' });
              setTimeout(() => {
                localStorage.removeItem('token');
                if (setUser) setUser(null);
                navigate('/');
              }, 2000);
            } catch (err) {
              setNotification({ message: "Emm... deletion failed: " + (err.response?.data?.msg || err.message), type: 'error' });
            }
          }
        });
      }
    });
  };

  const handleSaveBrandVoice = async () => {
    setIsSavingVoice(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_BASE}/brand-voice`, { brandVoice }, { headers: { 'x-auth-token': token } });
      if (setUser) {
        setUser(prev => ({ ...prev, brandVoice: res.data.brandVoice }));
      }
      setNotification({ message: "AI Brand Voice Updated", type: 'success' });
    } catch (err) {
      setNotification({ message: "Update failed: " + (err.response?.data?.msg || err.message), type: 'error' });
    } finally {
      setIsSavingVoice(false);
    }
  };

  return (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8 pb-20">
      
      {/* 1. PROFILE MODULE */}
      <section className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-50 p-2 rounded-xl text-blue-600"><User size={20}/></div>
          <h3 className="font-black text-sm uppercase tracking-widest text-slate-800">Operator Profile</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Display Name</label>
            <input 
              disabled 
              value={user?.name || "Active Operator"} 
              className="w-full mt-2 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Email Identity</label>
            <input 
              disabled 
              value={user?.email || "operator@echothread.io"} 
              className="w-full mt-2 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-500 cursor-not-allowed"
            />
          </div>
        </div>
      </section>

      {/* 2. BRAND PERSONA MODULE */}
      <section className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-purple-50 p-2 rounded-xl text-purple-600"><Zap size={20}/></div>
          <h3 className="font-black text-sm uppercase tracking-widest text-slate-800">Custom Brand Voice</h3>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Pase examples of your past posts or describe your writing style (e.g., "Professional but witty, uses short sentences, avoids emojis"). The AI engine will strictly follow these guidelines.
          </p>
          <textarea 
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-6 text-sm min-h-[150px] outline-none focus:border-purple-200 transition-all leading-relaxed"
            placeholder="e.g., My style is minimalist and direct. I use data-driven arguments and avoid hype-words..."
            value={brandVoice}
            onChange={(e) => setBrandVoice(e.target.value)}
          />
          <button 
            onClick={handleSaveBrandVoice}
            disabled={isSavingVoice}
            className="w-full bg-black text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-purple-600 transition-all flex items-center justify-center gap-2"
          >
            {isSavingVoice ? "Saving Style..." : <><Save size={16}/> Save Voice Guidelines</>}
          </button>
        </div>
      </section>

      {/* 3. SECURITY MODULE (Reset Password) */}
      <section className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-orange-50 p-2 rounded-xl text-orange-600"><Lock size={20}/></div>
          <h3 className="font-black text-sm uppercase tracking-widest text-slate-800">Security Override</h3>
        </div>

        <div className="space-y-4 max-w-md">
          <input 
            type="password" 
            placeholder="Current Password"
            value={passwords.old}
            className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm focus:border-black outline-none transition-all"
            onChange={(e) => setPasswords({...passwords, old: e.target.value})}
          />
          <input 
            type="password" 
            placeholder="New Encryption Key (Password)"
            value={passwords.new}
            className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm focus:border-black outline-none transition-all"
            onChange={(e) => setPasswords({...passwords, new: e.target.value})}
          />
          <button 
            onClick={handleUpdatePassword}
            disabled={isUpdatingPassword}
            className="w-full bg-black text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
          >
            {isUpdatingPassword ? "Processing Security Override..." : <><ShieldCheck size={16}/> Update Security Credentials</>}
          </button>
        </div>
      </section>

      {/* 3. DANGER ZONE */}
      <section className="bg-white border border-red-100 rounded-[32px] p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-red-50 p-2 rounded-xl text-red-600"><AlertTriangle size={20}/></div>
          <h3 className="font-black text-sm uppercase tracking-widest text-red-600">Danger Zone</h3>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-red-50/50 p-6 rounded-2xl border border-red-100">
          <div className="text-left">
            <h4 className="font-bold text-slate-900 text-sm">Delete Account Permanently</h4>
            <p className="text-xs text-slate-500 mt-1">Once you delete your account, there is no going back. All your data will be wiped instantly.</p>
          </div>
          <button 
            onClick={handleDeleteAccount}
            className="shrink-0 bg-red-600 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-2"
          >
            <Trash2 size={16}/> Delete My Account
          </button>
        </div>
      </section>

      {/* 4. SYSTEM INFO MODULE */}
      <section className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-white/10 p-2 rounded-xl text-white"><Info size={20}/></div>
            <h3 className="font-black text-sm uppercase tracking-widest">System Information</h3>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-white/40 text-[10px] font-bold uppercase">Core Model</span>
              <span className="text-xs font-mono text-blue-400">Gemini 3 Flash (Free Tier)</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-white/40 text-[10px] font-bold uppercase">Vision/Audio Engine</span>
              <span className="text-xs font-mono text-emerald-400">Whisper-Large-V3 / Veo</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-white/40 text-[10px] font-bold uppercase">Build Version</span>
              <span className="text-xs font-mono">v3.1.2-STABLE</span>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-[60px] rounded-full"></div>
      </section>

      <Modal 
        {...modal} 
        onClose={() => setModal({ ...modal, isOpen: false })} 
      />

      {notification && (
        <Notification 
          {...notification} 
          onClose={() => setNotification(null)} 
        />
      )}
    </div>
  );
}