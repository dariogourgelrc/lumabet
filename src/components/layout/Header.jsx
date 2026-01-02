import React from 'react';
import { Bell, Search, User, Menu } from 'lucide-react';
import Wallet from '../ui/Wallet';

const Header = ({ balance, onOpenMenu, onOpenWallet, onOpenNotifications, onOpenProfile }) => {
    return (
        <header className="fixed top-0 left-0 right-0 h-20 bg-background/80 backdrop-blur-md border-b border-white/5 z-10 md:pl-64 flex items-center justify-between px-6 transition-all duration-300">
            {/* Mobile Menu & Search (Left) */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onOpenMenu}
                    className="md:hidden p-2 text-muted hover:text-white rounded-lg hover:bg-white/5"
                >
                    <Menu size={24} />
                </button>
                <div className="relative hidden sm:block">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                        type="text"
                        placeholder="Buscar jogos..."
                        className="bg-secondary text-sm text-white pl-10 pr-4 py-2.5 rounded-full border border-white/5 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 w-64 transition-all"
                    />
                </div>
            </div>

            {/* Wallet & Profile (Right) */}
            <div className="flex items-center gap-4">
                <div onClick={onOpenWallet} className="cursor-pointer">
                    <Wallet balance={balance} />
                </div>

                <div className="h-8 w-[1px] bg-white/10 mx-1 hidden sm:block"></div>

                <button
                    onClick={onOpenNotifications}
                    className="relative p-2 text-muted hover:text-white rounded-full hover:bg-white/10 transition-colors"
                >
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-background"></span>
                </button>

                <button
                    onClick={onOpenProfile}
                    className="flex items-center gap-2 pl-2"
                >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-green-300 p-[2px] cursor-pointer hover:shadow-lg hover:shadow-primary/20 transition-all">
                        <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                            <User size={18} className="text-white" />
                        </div>
                    </div>
                </button>
            </div>
        </header>
    );
};

export default Header;
