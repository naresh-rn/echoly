import React from 'react';

const PlatformSelector = ({ active, setPlatform }) => {
  const platforms = [
    { id: 'linkedin', label: 'LinkedIn Post', icon: '💼' },
    { id: 'shorts', label: 'YouTube Shorts', icon: '📱' },
    { id: 'blog', label: 'Blog Post', icon: '✍️' }
  ];

  return (
    <div className="flex flex-wrap gap-3 my-6">
      {platforms.map((p) => (
        <button
          key={p.id}
          onClick={() => setPlatform(p.id)}
          className={`flex-1 py-3 px-4 rounded-lg border-2 flex items-center justify-center gap-2 font-bold transition-all ${
            active === p.id 
            ? 'border-blue-600 bg-blue-50 text-blue-600' 
            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
          }`}
        >
          <span>{p.icon}</span> {p.label}
        </button>
      ))}
    </div>
  );
};

export default PlatformSelector;