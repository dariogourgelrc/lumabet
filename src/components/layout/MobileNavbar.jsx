import React from 'react';
import { Home, Gamepad2, Menu, Wallet, Trophy } from 'lucide-react';

const MobileNavbar = ({ onNavigate, onOpenMenu, onOpenWallet }) => {
    const navItems = [
        { icon: Home, label: 'Início', active: true },
        { icon: Gamepad2, label: 'Cassino', active: false },
        { icon: Wallet, label: 'Carteira', active: false },
        { icon: Trophy, label: 'Esportes', active: false },
        { icon: Menu, label: 'Menu', active: false },
    ];

    return (
        <div className="fixed bottom-0 left-0 w-full z-50 md:hidden bg-[#121212] pt-safe-bottom">
            <div className="bg-[#121212]/95 backdrop-blur-xl border-t border-white/10 flex justify-between items-center px-6 py-4 pb-6">
                {navItems.map((item, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            if (item.label === 'Carteira') {
                                onOpenWallet && onOpenWallet();
                            } else if (item.label === 'Menu') {
                                onOpenMenu && onOpenMenu();
                            } else if (!item.active) {
                                onNavigate && onNavigate(`${item.label} indisponível.`);
                            }
                        }}
                        className={`flex flex-col items-center gap-1 transition-all active:scale-95 ${item.active ? 'text-primary' : 'text-muted hover:text-white'
                            }`}
                    >
                        <item.icon size={24} strokeWidth={item.active ? 2.5 : 2} className={item.active ? 'drop-shadow-[0_0_8px_rgba(0,231,1,0.5)]' : ''} />
                        <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default MobileNavbar;
