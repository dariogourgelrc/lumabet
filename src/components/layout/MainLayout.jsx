import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNavbar from './MobileNavbar';

const MainLayout = ({
    children,
    balance,
    onNavigate,
    onOpenMenu,
    onOpenWallet,
    onOpenNotifications,
    onOpenProfile,
    isMenuOpen,
    onCloseMenu
}) => {
    return (
        <div className="flex min-h-screen bg-background text-text font-sans selection:bg-primary/30">
            <Sidebar
                onNavigate={onNavigate}
                isOpen={isMenuOpen}
                onClose={onCloseMenu}
            />

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col md:pl-64 transition-all duration-300">
                <Header
                    balance={balance}
                    onOpenMenu={onOpenMenu}
                    onOpenWallet={onOpenWallet}
                    onOpenNotifications={onOpenNotifications}
                    onOpenProfile={onOpenProfile}
                />

                {/* Scrollable Area */}
                <main className="flex-1 pt-24 px-4 pb-32 md:px-8 md:pb-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </main>
            </div>

            <MobileNavbar
                onNavigate={onNavigate}
                onOpenMenu={onOpenMenu}
                onOpenWallet={onOpenWallet}
            />
        </div>
    );
};

export default MainLayout;
