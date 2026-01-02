import React from 'react';
import { Gamepad2, Trophy, Gift, Star, Menu } from 'lucide-react';
import logo from '../../assets/lumabet_logo.png';

const Sidebar = ({ onNavigate, isOpen, onClose }) => {
    const menuItems = [
        { icon: Gamepad2, label: 'Cassino', active: true },
        { icon: Trophy, label: 'Esportes', active: false },
        { icon: Gift, label: 'Promoções', active: false },
    ];

    const favorites = [
        { name: 'Mines', icon: Star },
        { name: 'Double', icon: Star },
        { name: 'Crash', icon: Star },
        { name: 'Slots', icon: Star },
    ];

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <div className={`fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-white/5 flex flex-col z-50 transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Logo Area */}
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={logo} alt="Lumabet" className="h-10 w-auto object-contain" />
                    </div>
                </div>

                {/* Main Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-2">
                    <div className="mb-8">
                        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4 px-2">Menu</h3>
                        <ul className="space-y-1">
                            {menuItems.map((item, index) => (
                                <li key={index}>
                                    <a
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            onNavigate && onNavigate(`${item.label} indisponível no momento.`);
                                        }}
                                        className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${item.active
                                            ? 'bg-white/10 text-white shadow-lg shadow-white/5'
                                            : 'text-muted hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        <item.icon size={20} className={item.active ? 'text-primary' : 'group-hover:text-white'} />
                                        <span className="font-medium">{item.label}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Favorites */}
                    <div>
                        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4 px-2">Favoritos</h3>
                        <ul className="space-y-1">
                            {favorites.map((fav, index) => (
                                <li key={index}>
                                    <a
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (fav.name !== 'Mines') {
                                                onNavigate && onNavigate(`${fav.name} em breve!`);
                                            }
                                        }}
                                        className={`flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 hover:text-white transition-all duration-200 group ${fav.name === 'Mines' ? 'text-white bg-white/5' : 'text-muted'
                                            }`}
                                    >
                                        <fav.icon size={18} className="text-yellow-500" />
                                        <span className="font-medium">{fav.name}</span>
                                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </nav>

                {/* Footer / User Info (Optional) */}
                <div className="p-4 border-t border-white/5">
                    <div className="bg-secondary/50 rounded-xl p-3 flex items-center gap-3 hover:bg-white/5 cursor-pointer transition-colors">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-sm font-medium text-muted">Online: 14.5k</span>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
