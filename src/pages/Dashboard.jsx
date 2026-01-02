import React, { useState } from 'react'
import MainLayout from '../components/layout/MainLayout'
import Banner from '../components/ui/Banner'
import MinesGame from '../components/games/MinesGame'
import Toast from '../components/ui/Toast'
import WalletModal from '../components/modals/WalletModal'
import NotificationsModal from '../components/modals/NotificationsModal'
import ProfileModal from '../components/modals/ProfileModal'
import { Star } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Dashboard = () => {
    const { user, updateBalance, logout } = useAuth();
    const [toast, setToast] = useState({ visible: false, message: '' });

    // Modal State Manager: 'wallet', 'notifications', 'profile', 'menu' (sidebar), or null
    const [activeModal, setActiveModal] = useState(null);

    const showToast = (message) => {
        setToast({ visible: true, message });
    };

    const closeToast = () => {
        setToast(prev => ({ ...prev, visible: false }));
    };

    const handleAction = (message) => {
        showToast(message);
    };

    const handleNavigate = (message) => {
        showToast(message);
        setActiveModal(null); // Close menu on navigate
    };

    const setBalanceAdapter = (newValOrFunc) => {
        let newValue;
        if (typeof newValOrFunc === 'function') {
            newValue = newValOrFunc(user.balance);
        } else {
            newValue = newValOrFunc;
        }
        updateBalance(newValue);
    };

    if (!user) return null; // Should be handled by protected route, but safety check

    return (
        <>
            <MainLayout
                balance={user.balance}
                onNavigate={handleNavigate}
                onOpenMenu={() => setActiveModal('menu')}
                onOpenWallet={() => setActiveModal('wallet')}
                onOpenNotifications={() => setActiveModal('notifications')}
                onOpenProfile={() => setActiveModal('profile')}
                isMenuOpen={activeModal === 'menu'}
                onCloseMenu={() => setActiveModal(null)}
            >
                <Banner onAction={handleAction} />

                {/* Mines Game Section */}
                <div className="mb-12">
                    <div className="flex items-center gap-2 mb-6 text-white">
                        <Star className="text-primary" fill="currentColor" />
                        <h2 className="text-xl font-bold uppercase tracking-wide">Mines Originals</h2>
                    </div>
                    <MinesGame balance={user.balance} setBalance={setBalanceAdapter} />
                </div>
            </MainLayout>

            <Toast
                message={toast.message}
                isVisible={toast.visible}
                onClose={closeToast}
            />

            {/* Global Modals */}
            <WalletModal
                isOpen={activeModal === 'wallet'}
                onClose={() => setActiveModal(null)}
                balance={user.balance}
            />
            <NotificationsModal
                isOpen={activeModal === 'notifications'}
                onClose={() => setActiveModal(null)}
            />
            <ProfileModal
                isOpen={activeModal === 'profile'}
                onClose={() => setActiveModal(null)}
                onLogout={logout}
                user={user}
            />
        </>
    )
}

export default Dashboard;
