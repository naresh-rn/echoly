import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { EyeOff, Eye } from 'lucide-react';

export default function LoginPage({ setUser }) {
  // --- LOGIC SECTION ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.msg || "Authentication Failed: Check credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Anek+Odia:wght@100..800&family=Stack+Sans+Notch:wght@400;500;600;700&display=swap');
          .font-heading { font-family: 'Stack Sans Notch', sans-serif; }
          .font-body { font-family: 'Anek Odia', sans-serif; }
          .bg-login-image {
            background-image: url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop');
          }
        `}
      </style>

      {/* Main Container: Fixed Height, No Overflow (Matches Signup Layout) */}
      <div className="h-screen w-full flex flex-col lg:flex-row bg-[#0c0c0e] font-body text-zinc-400 overflow-hidden">
          
        {/* LEFT COLUMN: Visuals */}
        <div className="hidden lg:flex w-1/2 h-full relative flex-col justify-between p-12 overflow-hidden border-r border-zinc-900/30">
          <div className="absolute inset-0 bg-cover bg-center z-0 grayscale contrast-125 brightness-50 bg-login-image" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90 z-0" />

          <div className="relative z-10">
              <span className="text-6xl font-heading font-bold text-white tracking-tighter">Echoly</span>
          </div>

          <div className="relative z-10">
            <h1 className="text-white text-5xl font-heading leading-tight mb-8 tracking-wide drop-shadow-lg italic">
              Automate Your Reach,<br />
              Expand Your Legacy.
            </h1>
            <div className="flex gap-2 opacity-50">
              <div className="h-1.5 w-16 bg-white rounded-full"></div>
              <div className="h-1.5 w-6 bg-zinc-600 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Form */}
        <div className="w-full lg:w-1/2 h-full flex flex-col justify-center items-center px-8 lg:px-24 relative bg-[#0c0c0e] overflow-hidden">
          
          <div className="w-full max-w-md">
            
            {/* Header */}
            {/* CHANGED: Reduced margin bottom for better vertical fit */}
            <div className="mb-8">
              <h2 className="text-4xl lg:text-5xl font-heading font-bold text-white mb-2 tracking-tight">Log in</h2>
              <p className="text-zinc-500 text-base">
                Access your Mission Control center.
              </p>
            </div>

            {error && (
              <div className="mb-6 bg-red-900/10 border border-red-900/30 text-red-500 text-xs px-4 py-2 rounded-lg text-center font-medium animate-pulse">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              
              {/* Email Input */}
              <div className="group space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Email Identity</label>
                {/* CHANGED: h-14 to h-11 for compact UI */}
                <input 
                  type="email" 
                  required 
                  placeholder="name@example.com"
                  className="w-full h-11 px-4 rounded-lg bg-[#050505] border border-zinc-800 text-zinc-100 text-sm outline-none focus:border-white transition-all placeholder:text-zinc-700 font-body"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                />
              </div>

              {/* Password Input */}
              <div className="group space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Access Key</label>
                  <button type="button" className="text-[10px] text-zinc-500 hover:text-white transition-colors">Forgot Key?</button>
                </div>
                <div className="relative">
                  {/* CHANGED: h-14 to h-11 for compact UI */}
                  <input 
                    type={showPassword ? "text" : "password"}
                    required 
                    placeholder="Enter security key"
                    className="w-full h-11 px-4 rounded-lg bg-[#050505] border border-zinc-800 text-zinc-100 text-sm outline-none focus:border-white transition-all placeholder:text-zinc-700 font-body"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              {/* CHANGED: h-14 to h-12 */}
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-12 mt-4 bg-zinc-100 hover:bg-white text-black rounded-lg font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all shadow-xl shadow-white/5 active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? "Authenticating..." : "Initialize Session"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}