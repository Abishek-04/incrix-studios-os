'use client';

export default function LoadingScreen({ message }) {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="flex flex-col items-center gap-6">
        {/* Animated logo pulse */}
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse shadow-lg shadow-indigo-500/20">
            <span className="text-white font-bold text-2xl">I</span>
          </div>
          {/* Orbit ring */}
          <div className="absolute inset-[-8px] rounded-3xl border-2 border-transparent border-t-indigo-500/60 animate-spin" style={{ animationDuration: '1.2s' }} />
        </div>

        {message && (
          <p className="text-sm text-[#666] animate-pulse">{message}</p>
        )}
      </div>
    </div>
  );
}
