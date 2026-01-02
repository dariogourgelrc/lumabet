import React from 'react';
import { X, User, Settings, LogOut, History, CreditCard } from 'lucide-react';

const ProfileModal = ({ isOpen, onClose, onLogout, user }) => {
    if (!isOpen) return null;

    const menuItems = [
        { icon: User, label: 'Minha Conta' },
        { icon: CreditCard, label: 'Transações e Depósitos' },
        { icon: History, label: 'Histórico de Apostas' },
        { icon: Settings, label: 'Configurações' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 lg:p-10 pointer-events-none">
            {/* Invisible backdrop to catch clicks outside */}
            <div className="fixed inset-0 pointer-events-auto bg-black/5 md:bg-transparent" onClick={onClose}></div>

            <div className="w-full max-w-xs bg-[#121212] border border-white/10 shadow-2xl rounded-2xl overflow-hidden pointer-events-auto animate-in slide-in-from-right-5 zoom-in-95 duration-200 mt-16 relative z-10">
                {/* User Header */}
                <div className="p-6 bg-gradient-to-br from-secondary to-black border-b border-white/5 text-center relative overflow-hidden">
                    <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-white">
                        <X size={18} />
                    </button>

                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-green-400 p-[2px] mx-auto mb-3 shadow-[0_0_20px_rgba(0,231,1,0.2)]">
                        <div className="w-full h-full rounded-full bg-[#121212] flex items-center justify-center">
                            <span className="text-2xl font-bold text-white uppercase">{user ? user.name.charAt(0) : 'U'}</span>
                        </div>
                    </div>
                    <h3 className="font-bold text-white text-lg">{user ? user.name : 'Dário User'}</h3>
                    <p className="text-xs text-muted">ID: {user ? user.id : '8829103'}</p>
                </div>

                {/* Menu */}
                <div className="p-2">
                    {menuItems.map((item, index) => (
                        <button key={index} className="w-full flex items-center gap-3 p-3 text-muted hover:text-white hover:bg-white/5 rounded-xl transition-all group text-left">
                            <item.icon size={18} className="group-hover:text-primary transition-colors" />
                            <span className="text-sm font-medium">{item.label}</span>
                        </button>
                    ))}

                    <div className="my-2 border-t border-white/5"></div>

                    <button onClick={onLogout} className="w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all text-left">
                        <LogOut size={18} />
                        <span className="text-sm font-bold">Sair da Conta</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
