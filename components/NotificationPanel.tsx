import React from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { Notification } from '../types';

interface NotificationPanelProps {
    notifications: Notification[];
    onClose: () => void;
    onMarkAllRead: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications, onClose, onMarkAllRead }) => {
    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle size={16} className="text-emerald-500" />;
            case 'warning': return <AlertTriangle size={16} className="text-amber-500" />;
            case 'error': return <AlertCircle size={16} className="text-rose-500" />;
            default: return <Info size={16} className="text-blue-500" />;
        }
    };

    const getTimeAgo = (timestamp: number) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return 'Yesterday';
    };

    return (
        <div className="absolute top-16 right-8 w-80 bg-[#151515] border border-[#222] rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-[#222]">
                <h3 className="font-bold text-white text-sm">Notifications</h3>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={onMarkAllRead}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                        Mark all read
                    </button>
                    <button onClick={onClose} className="text-[#666] hover:text-white">
                        <X size={16} />
                    </button>
                </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-[#666] text-sm">
                        No new notifications
                    </div>
                ) : (
                    notifications.map((notif) => (
                        <div
                            key={notif.id}
                            className={`p-4 border-b border-[#1f1f1f] hover:bg-[#1a1a1a] transition-colors ${!notif.read ? 'bg-[#1a1a1a]/50' : ''}`}
                        >
                            <div className="flex items-start space-x-3">
                                <div className="mt-0.5 flex-shrink-0">
                                    {getIcon(notif.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white mb-0.5">{notif.title}</p>
                                    <p className="text-xs text-[#888] leading-relaxed mb-2">{notif.message}</p>
                                    <span className="text-[10px] text-[#555]">{getTimeAgo(notif.timestamp)}</span>
                                </div>
                                {!notif.read && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2"></div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-3 bg-[#111] text-center border-t border-[#1f1f1f]">
                <button className="text-xs text-[#666] hover:text-white transition-colors">
                    View all history
                </button>
            </div>
        </div>
    );
};

export default NotificationPanel;
