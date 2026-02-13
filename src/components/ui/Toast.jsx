import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
    message: string;
    type?: ToastType;
    isVisible: boolean;

const Toast = ({ message, type = 'success', isVisible, onClose }) => {
    useEffect() => {
        if (isVisible) {
            const timer = setTimeout() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className={`flex items-center space-x-3 pl-4 pr-10 py-3 rounded-xl border shadow-2xl backdrop-blur-md
                ${type === 'success' ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-100' : 'bg-rose-950/40 border-rose-500/30 text-rose-100'}
            `}>
                <div className={`p-1.5 rounded-full ${type === 'success' ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                    {type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                </div>
                <span className="text-sm font-medium">{message}</span>
                <button
                    onClick={onClose}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};

export default Toast;
