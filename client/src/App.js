import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// Components
import LandingPage from './components/LandingPage';
import LoginPage from './components/auth/LoginPage';
import SignUpPage from './components/auth/SignUpPage';
import Dashboard from './components/Dashboard';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) { 
        setLoading(false); 
        return; 
      }
      try {
        // Verify token with backend
        const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
          headers: { 'x-auth-token': token }
        });
        setUser(res.data);
      } catch (err) {
        console.error("Session invalid, clearing storage.");
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[9999]">
      {/* Application Name */}
      <h1 className="font-heading text-8xl text-white mb-6 tracking-tighter animate-in fade-in zoom-in duration-1000">
        ECHOLY
      </h1>

      {/* Loading Text */}
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-[1px] bg-white/20 relative overflow-hidden">
           <div className="absolute inset-0 bg-white animate-[shimmer_2s_infinite]" />
        </div>
        
        <span className="text-[10px] text-white/40 font-bold uppercase tracking-[0.5em] animate-pulse">
          INITIALISING_SYSTEM_PROTOCOLS...
        </span>
      </div>

      {/* Subtle background decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>
    </div>
  );

  return (
    <Router>
      <Routes>
        {/* LANDING: Only for non-logged users */}
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
        
        {/* AUTH: Passing setUser prop correctly now */}
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage setUser={setUser} />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <SignUpPage setUser={setUser} />} />

        {/* PROTECTED: Dashboard requires user state */}
        <Route 
          path="/dashboard/*" 
          element={user ? <Dashboard user={user} setUser={setUser} /> : <Navigate to="/" />} 
        />

        {/* REDIRECT: Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}