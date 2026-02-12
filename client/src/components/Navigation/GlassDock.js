export default function GlassDock() {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center px-6 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl z-50">
      <div className="flex space-x-6 text-[10px] font-black tracking-widest uppercase">
        <span className="text-emerald-500">System: Active</span>
        <span className="text-zinc-500 italic">Credits: 420</span>
        <span className="text-blue-500">Mode: Viral</span>
      </div>
    </div>
  );
}