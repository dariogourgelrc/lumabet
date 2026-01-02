import React, { useEffect } from 'react';
import { Info, X } from 'lucide-react';

const Toast = ({ message, isVisible, onClose }) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    return (
        <div className="fixed top-24 right-6 z-50 animate-in slide-in-from-right duration-300">
            <div className="bg-secondary/90 backdrop-blur-md border border-white/10 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px]">
                <div className="bg-primary/20 p-2 rounded-full text-primary">
                    <Info size={20} />
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-sm">Funcionalidade Indisponível</h4>
                    <p className="text-xs text-muted">{message}</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-white/10 rounded-lg text-muted hover:text-white transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

export default Toast;
