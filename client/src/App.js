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
    <div className="bg-[#0c0c0e] h-screen flex items-center justify-center font-heading text-zinc-100">
      <div className="animate-pulse tracking-widest text-xs uppercase">Initialising_System_Protocols...</div>
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