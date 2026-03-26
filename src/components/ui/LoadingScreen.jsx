'use client';

export default function LoadingScreen({ message }) {
  return (
    <div className="flex items-center justify-center h-full w-full" style={{ background: 'var(--bg)' }}>
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-xl shadow-violet-500/25" style={{ animation: 'pulse 2s cubic-bezier(0.23,1,0.32,1) infinite' }}>
            <span className="text-white font-black text-3xl">I</span>
          </div>
          <div className="absolute inset-[-10px] rounded-3xl border-2 border-transparent border-t-violet-400/50" style={{ animation: 'spin 1s cubic-bezier(0.23,1,0.32,1) infinite' }} />
        </div>
        {message && <p className="text-sm animate-pulse" style={{ color: 'var(--text-muted)' }}>{message}</p>}
      </div>
    </div>
  );
}
