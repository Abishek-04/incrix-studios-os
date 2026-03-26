'use client';

export default function LoadingScreen({ message }) {
  return (
    <div className="flex items-center justify-center h-full w-full" style={{ background: 'var(--bg)' }}>
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center animate-pulse shadow-xl shadow-indigo-500/25">
            <span className="text-white font-black text-3xl">I</span>
          </div>
          <div className="absolute inset-[-10px] rounded-3xl border-2 border-transparent border-t-indigo-400/50 animate-spin" style={{ animationDuration: '1.2s' }} />
        </div>
        {message && <p className="text-sm animate-pulse" style={{ color: 'var(--text-muted)' }}>{message}</p>}
      </div>
    </div>
  );
}
