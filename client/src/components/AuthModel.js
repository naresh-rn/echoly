import React, { useState } from 'react';
import { X, Mail, Lock, UserPlus, LogIn } from 'lucide-react';

export default function AuthModal({ type, onClose, onAuthSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const isLogin = type === 'login';

  const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
        
        try {
            const res = await axios.post(`http://localhost:5000${endpoint}`, { email, password });
            
            // Save the "Digital ID Card" in the browser's memory
            localStorage.setItem('token', res.data.token);
            
            // Tell App.js we are logged in!
            onAuthSuccess(res.data.user);
        } catch (err) {
            alert(err.response?.data?.msg || "Authentication failed");
        }
    };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden relative animate-in zoom-in duration-300">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all">
          <X size={20} />
        </button>

        <div className="p-10">
          <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-blue-600/10 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
              {isLogin ? <LogIn size={32} /> : <UserPlus size={32} />}
            </div>
            <h2 className="text-3xl font-black tracking-tighter uppercase italic text-slate-900">
              {isLogin ? 'Welcome Back' : 'Join Command'}
            </h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">
              {isLogin ? 'Enter your credentials' : 'Create your secure account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-4 text-slate-300" size={18} />
              <input 
                type="email" required placeholder="Email Address" 
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-600/20 text-sm font-medium transition-all"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-4 text-slate-300" size={18} />
              <input 
                type="password" required placeholder="Password" 
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-600/20 text-sm font-medium transition-all"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-blue-600 transition-all shadow-xl shadow-blue-600/10 active:scale-95">
              {isLogin ? 'Sign Into Grid' : 'Initialize Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}