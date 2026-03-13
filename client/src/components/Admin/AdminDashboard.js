import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, FileText, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = (process.env.REACT_APP_API_URL || "http://localhost:10000") + "/api/admin";

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [usersRes, projectsRes] = await Promise.all([
          axios.get(`${API_BASE}/users`, { headers: { 'x-auth-token': token } }),
          axios.get(`${API_BASE}/projects`, { headers: { 'x-auth-token': token } })
        ]);
        
        setUsers(usersRes.data);
        setProjects(projectsRes.data);
      } catch (err) {
        console.error("Admin data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [API_BASE]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Activity className="animate-pulse text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Users</p>
            <h3 className="text-3xl font-bold mt-2 text-slate-800">{users.length}</h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Projects</p>
            <h3 className="text-3xl font-bold mt-2 text-slate-800">{projects.length}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <FileText size={24} />
          </div>
        </div>
      </div>

      {/* USERS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-2">
           <Users size={16} className="text-slate-400" />
           <h2 className="font-bold text-slate-800">User Roster</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-medium text-slate-800">{u.name}</td>
                  <td className="px-6 py-4 text-slate-500">{u.email}</td>
                  <td className="px-6 py-4">
                    {u.isAdmin ? (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-[10px] font-bold uppercase">Admin</span>
                    ) : (
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase">User</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                   <td colSpan="4" className="px-6 py-8 text-center text-slate-400">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PROJECTS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-2">
           <FileText size={16} className="text-slate-400" />
           <h2 className="font-bold text-slate-800">Global Content History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
              <tr>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Owner</th>
                <th className="px-6 py-3">Source Type</th>
                <th className="px-6 py-3">Tone</th>
                <th className="px-6 py-3">Hashtags</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p._id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-medium text-slate-800 truncate max-w-[200px]" title={p.title}>{p.title}</td>
                  <td className="px-6 py-4 text-slate-500">{p.userId?.name || 'Unknown'}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-[10px] font-bold uppercase">
                      {p.source?.type || 'UNKNOWN'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{p.configuration?.tone || 'N/A'}</td>
                  <td className="px-6 py-4 text-slate-500">
                     {p.configuration?.useHashtags ? 'Yes' : 'No'}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr>
                   <td colSpan="6" className="px-6 py-8 text-center text-slate-400">No projects found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
