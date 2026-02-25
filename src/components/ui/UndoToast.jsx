import React, { useEffect } from 'react';
import { RotateCcw, X } from 'lucide-react';

const UndoToast = ({ isVisible, message, onUndo, onClose, duration = 5000 }) => {
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [isVisible, onClose, duration]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-center gap-3 bg-[#111]/95 border border-[#2f2f2f] rounded-xl px-4 py-3 shadow-2xl backdrop-blur-md min-w-[300px]">
        <div className="text-sm text-white flex-1">{message}</div>
        <button
          onClick={onUndo}
          className="px-3 py-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-medium hover:bg-indigo-600/30 transition-colors"
        >
          <span className="inline-flex items-center gap-1">
            <RotateCcw size={12} />
            Undo
          </span>
        </button>
        <button
          onClick={onClose}
          className="p-1 text-[#999] hover:text-white rounded-md hover:bg-white/10 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default UndoToast;
