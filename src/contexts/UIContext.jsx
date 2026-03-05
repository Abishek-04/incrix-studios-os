'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const UIContext = createContext(null);

export function UIProvider({ children }) {
  // Toast state
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  // Confirm modal state
  const [confirmState, setConfirmState] = useState(null);

  const showToast = useCallback((message, type = 'error') => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const confirm = useCallback((title, message) => {
    return new Promise((resolve) => {
      setConfirmState({ title, message, resolve });
    });
  }, []);

  const handleConfirm = () => {
    confirmState?.resolve(true);
    setConfirmState(null);
  };

  const handleCancel = () => {
    confirmState?.resolve(false);
    setConfirmState(null);
  };

  return (
    <UIContext.Provider value={{ showToast, confirm }}>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isInfo = toast.type === 'info';
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center space-x-3 pl-4 pr-10 py-3 rounded-xl border shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 fade-in duration-300 relative
                ${isSuccess ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-100'
                  : isInfo ? 'bg-blue-950/40 border-blue-500/30 text-blue-100'
                  : 'bg-rose-950/40 border-rose-500/30 text-rose-100'}
              `}
            >
              <div className={`p-1.5 rounded-full ${isSuccess ? 'bg-emerald-500/20' : isInfo ? 'bg-blue-500/20' : 'bg-rose-500/20'}`}>
                {isSuccess ? <CheckCircle size={16} /> : isInfo ? <Info size={16} /> : <AlertCircle size={16} />}
              </div>
              <span className="text-sm font-medium max-w-xs">{toast.message}</span>
              <button
                onClick={() => dismissToast(toast.id)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      {confirmState && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1e1e1e] border border-[#333] rounded-2xl w-full max-w-sm p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-rose-500/10 text-rose-500 rounded-full">
                <AlertCircle size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-2">{confirmState.title}</h3>
                <p className="text-sm text-[#888] mb-6">{confirmState.message}</p>
                <div className="flex space-x-3 justify-end">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#333] text-[#ccc] text-sm font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-rose-900/20 transition-colors"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </UIContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useToast must be used within UIProvider');
  return ctx.showToast;
}

export function useConfirm() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useConfirm must be used within UIProvider');
  return ctx.confirm;
}
