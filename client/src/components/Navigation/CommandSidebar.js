import React from 'react';
import { Zap, Archive, LogOut } from 'lucide-react';

export default function CommandSidebar({ activeView, setView, onLogout }) {
  const items = [
    { id: 'engine', icon: <Zap size={20}/>, label: 'ENGINE' },
    { id: 'vault', icon: <Archive size={20}/>, label: 'VAULT' }
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-20 flex flex-col items-center py-10 bg-[#050505] border-r border-[#1A1A1A] z-50">
      <div className="mb-12 font-heading text-blue-500 text-xl italic tracking-tighter">ET</div>
      <div className="flex flex-col space-y-10">
        {items.map(item => (
          <button 
            key={item.id}
            onClick={() => setView(item.id)}
            className={`transition-all ${activeView === item.id ? 'text-blue-500 scale-125' : 'text-zinc-700 hover:text-white'}`}
          >
            {item.icon}
          </button>
        ))}
      </div>
      <button onClick={onLogout} className="mt-auto text-zinc-800 hover:text-red-500 transition-colors">
        <LogOut size={20} />
      </button>
    </aside>
  );
}