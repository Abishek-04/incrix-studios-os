import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1e1e1e] border border-[#333] rounded-2xl w-full max-w-sm p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex items-start space-x-4">
                    <div className="p-3 bg-rose-500/10 text-rose-500 rounded-full">
                        <AlertCircle size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                        <p className="text-sm text-[#888] mb-6">{message}</p>

                        <div className="flex space-x-3 justify-end">
                            <button
                                onClick={onCancel}
                                className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#333] text-[#ccc] text-sm font-medium rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-rose-900/20 transition-colors"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
