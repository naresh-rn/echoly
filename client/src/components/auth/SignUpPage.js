import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { EyeOff, Eye } from 'lucide-react';

export default function SignupPage({ setUser }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== confirmPassword) {
      setError("Security Keys do not match");
      setIsLoading(false);
      return;
    }
    
    // Inside SignupPage.js handleSignup
// Inside handleSignup function
try {
  const res = await axios.post('http://localhost:5000/api/auth/register', formData);
  
  // 1. Save Token
  localStorage.setItem('token', res.data.token);
  
  // 2. Update Global State
  setUser(res.data.user);
  
  // 3. Navigate to Dashboard
  navigate('/dashboard');
} catch (err) {
  setError(err.response?.data?.msg || "Connection Failed");
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
          .bg-signup-image {
            background-image: url('https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?q=80&w=2564&auto=format&fit=crop');
          }
        `}
      </style>

      {/* Main Container: Fixed Height, No Overflow */}
      <div className="h-screen w-full flex flex-col lg:flex-row bg-[#0c0c0e] font-body text-zinc-400 overflow-hidden">
          
        {/* LEFT COLUMN: Visuals */}
        <div className="hidden lg:flex w-1/2 h-full relative flex-col justify-between p-12 overflow-hidden border-r border-zinc-900/30">
          <div className="absolute inset-0 bg-cover bg-center z-0 grayscale contrast-125 brightness-50 bg-signup-image" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40 z-0" />

          <div className="relative z-10">
              <span className="text-6xl font-heading font-bold text-white tracking-tighter">Echoly</span>
          </div>

          <div className="relative z-10">
            <h1 className="text-white text-5xl font-heading leading-tight mb-8 tracking-wide drop-shadow-lg italic">
              Join the Network,<br />
              Amplify Your Voice.
            </h1>
            <div className="flex gap-2 opacity-50">
              <div className="h-1.5 w-16 bg-white rounded-full"></div>
              <div className="h-1.5 w-6 bg-zinc-600 rounded-full"></div>
              <div className="h-1.5 w-6 bg-zinc-600 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Form */}
        {/* CHANGED: overflow-hidden to stop scroll, flex-col to center content vertically */}
        <div className="w-full lg:w-1/2 h-full flex flex-col justify-center items-center px-8 lg:px-24 relative bg-[#0c0c0e] overflow-hidden">
          
          <div className="w-full max-w-md">
            {/* Header */}
            {/* CHANGED: Reduced margin bottom from mb-10 to mb-6 */}
            <div className="mb-6">
              <h2 className="text-4xl lg:text-5xl font-heading font-bold text-white mb-2 tracking-tight">Create Account</h2>
              <p className="text-zinc-500 text-base">
                Already an operator? 
                <Link to="/" className="text-white hover:text-zinc-300 underline underline-offset-4 ml-1 transition-colors">Log in</Link>
              </p>
            </div>

            {error && (
              <div className="mb-4 bg-red-900/10 border border-red-900/30 text-red-500 text-xs px-4 py-2 rounded-lg text-center font-medium animate-pulse">
                {error}
              </div>
            )}

            {/* Form */}
            {/* CHANGED: Reduced space-y-5 to space-y-4 */}
            <form onSubmit={handleSignup} className="space-y-4">
              
              {/* Name Field */}
              <div className="group space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Full Name</label>
                {/* CHANGED: Height h-14 to h-11 */}
                <input 
                  type="text" 
                  required 
                  placeholder="Operator Name"
                  className="w-full h-11 px-4 rounded-lg bg-[#050505] border border-zinc-800 text-zinc-100 text-sm outline-none focus:border-white transition-all placeholder:text-zinc-700 font-body"
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                />
              </div>

              {/* Email Field */}
              <div className="group space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Email Identity</label>
                {/* CHANGED: Height h-14 to h-11 */}
                <input 
                  type="email" 
                  required 
                  placeholder="name@example.com"
                  className="w-full h-11 px-4 rounded-lg bg-[#050505] border border-zinc-800 text-zinc-100 text-sm outline-none focus:border-white transition-all placeholder:text-zinc-700 font-body"
                  value={formData.email} 
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                />
              </div>

              {/* Password Field */}
              <div className="group space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Access Key</label>
                <div className="relative">
                  {/* CHANGED: Height h-14 to h-11 */}
                  <input 
                    type={showPassword ? "text" : "password"}
                    required 
                    placeholder="Create security key"
                    className="w-full h-11 px-4 rounded-lg bg-[#050505] border border-zinc-800 text-zinc-100 text-sm outline-none focus:border-white transition-all placeholder:text-zinc-700 font-body"
                    value={formData.password} 
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
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

              {/* Confirm Password Field */}
              <div className="group space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Confirm Access Key</label>
                <div className="relative">
                  {/* CHANGED: Height h-14 to h-11 */}
                  <input 
                    type={showConfirmPassword ? "text" : "password"}
                    required 
                    placeholder="Verify security key"
                    className="w-full h-11 px-4 rounded-lg bg-[#050505] border border-zinc-800 text-zinc-100 text-sm outline-none focus:border-white transition-all placeholder:text-zinc-700 font-body"
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              {/* CHANGED: Height h-14 to h-12, reduced top margin */}
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-12 mt-4 bg-zinc-100 hover:bg-white text-black rounded-lg font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all shadow-xl shadow-white/5 active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? "Provisioning..." : "Initialize Registration"}
              </button>
            </form>

            {/* Footer */}
            {/* CHANGED: Reduced margin top from mt-10 to mt-6 */}
            <div className="mt-6 text-center">
                <p className="text-[10px] text-zinc-600 leading-relaxed uppercase tracking-tighter">
                    By registering, you agree to <br/>
                    <span className="text-zinc-500 hover:text-white cursor-pointer underline transition-colors">Security Protocols</span>.
                </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}