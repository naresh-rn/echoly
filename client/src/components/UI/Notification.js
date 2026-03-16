import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export default function Notification({ message, type = 'success', onClose, duration = 4000 }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const config = {
    success: {
      icon: CheckCircle,
      bg: 'bg-slate-900',
      text: 'text-white',
      iconColor: 'text-emerald-400'
    },
    error: {
      icon: AlertCircle,
      bg: 'bg-red-600',
      text: 'text-white',
      iconColor: 'text-white'
    }
  };

  const { icon: Icon, bg, text, iconColor } = config[type] || config.success;

  return (
    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-3 px-6 py-4 rounded-2xl ${bg} ${text} shadow-2xl animate-in slide-in-from-bottom-8 duration-300`}>
      <Icon size={18} className={iconColor} />
      <span className="text-xs font-bold tracking-wide">{message}</span>
      <button onClick={onClose} className="ml-2 p-1 hover:bg-white/10 rounded-lg transition-colors">
        <X size={14} />
      </button>
    </div>
  );
}
