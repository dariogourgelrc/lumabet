import React from 'react';
import { X, Bell, CheckCircle, Info } from 'lucide-react';

const NotificationsModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const notifications = [
        { id: 1, title: 'Bônus de Boas-vindas!', message: 'Receba 100% até 200.000 Kz no seu primeiro depósito.', type: 'success', time: '2m atrás' },
        { id: 2, title: 'Cashback Semanal', message: 'Seu cashback de 5% já está disponível na sua conta.', type: 'info', time: '1h atrás' },
        { id: 3, title: 'Manutenção Programada', message: 'O sistema passará por manutenção às 03:00.', type: 'warning', time: '5h atrás' }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 lg:p-10 pointer-events-none">
            <div className="w-full max-w-sm bg-[#121212] border border-white/10 shadow-2xl rounded-2xl overflow-hidden pointer-events-auto animate-in slide-in-from-right-10 duration-200 mt-16">
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-secondary/30">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Bell size={16} className="text-primary" />
                        Notificações
                    </h3>
                    <button onClick={onClose} className="text-muted hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>
                <div className="max-h-[70vh] overflow-y-auto">
                    {notifications.length > 0 ? (
                        <div className="divide-y divide-white/5">
                            {notifications.map(notif => (
                                <div key={notif.id} className="p-4 hover:bg-white/5 transition-colors cursor-pointer group">
                                    <div className="flex gap-3">
                                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${notif.type === 'success' ? 'bg-green-500' : notif.type === 'info' ? 'bg-blue-500' : 'bg-yellow-500'}`}></div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors">{notif.title}</h4>
                                            <p className="text-xs text-muted mt-1 leading-relaxed">{notif.message}</p>
                                            <span className="text-[10px] text-gray-500 mt-2 block">{notif.time}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-muted">
                            <Bell size={32} className="mx-auto mb-3 opacity-20" />
                            <p className="text-sm">Nenhuma notificação nova.</p>
                        </div>
                    )}
                </div>
                <div className="p-3 border-t border-white/5 text-center">
                    <button className="text-xs font-bold text-primary hover:text-green-400 transition-colors">Marcar todas como lidas</button>
                </div>
            </div>

            {/* Backdrop for mobile only if needed, but usually dropdowns just overlay */}
            <div className="fixed inset-0 z-[-1]" onClick={onClose}></div>
        </div>
    );
};

export default NotificationsModal;
