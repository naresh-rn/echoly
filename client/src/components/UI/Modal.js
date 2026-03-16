import React from 'react';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, message, onConfirm, type = 'info', confirmLabel = 'Confirm', cancelLabel = 'Cancel' }) {
  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      btn: 'bg-red-600 hover:bg-red-700'
    },
    success: {
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      btn: 'bg-emerald-600 hover:bg-emerald-700'
    },
    info: {
      icon: Info,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      btn: 'bg-black hover:bg-slate-800'
    }
  };

  const config = typeConfig[type] || typeConfig.info;
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className={`${config.bg} ${config.color} p-3 rounded-2xl`}>
              <Icon size={24} />
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <h3 className="text-xl font-black text-slate-900 mb-2">{title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed mb-8">{message}</p>
          
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400 border border-slate-100 hover:bg-slate-50 transition-all"
            >
              {cancelLabel}
            </button>
            <button 
              onClick={() => { onConfirm(); onClose(); }}
              className={`flex-1 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest text-white transition-all shadow-lg ${config.btn}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
