import { X, Mail, Lock, UserPlus, LogIn, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function AuthModal({ type, onClose, onAuthSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const isLogin = type === 'login';

  const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
        
        try {
            setError(null);
            const res = await axios.post(`http://localhost:10000${endpoint}`, { email, password });
            localStorage.setItem('token', res.data.token);
            onAuthSuccess(res.data.user);
        } catch (err) {
            setError(err.response?.data?.msg || "Authentication failed. Double check your protocols.");
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

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={14} className="text-red-600" />
              <p className="text-[11px] font-bold text-red-600 uppercase tracking-tight">{error}</p>
            </div>
          )}

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