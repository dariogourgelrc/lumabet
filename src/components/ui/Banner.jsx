import React from 'react';
import { Gamepad2 } from 'lucide-react';

const Banner = ({ onAction }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            {/* Primary Banner */}
            <div className="relative h-64 rounded-2xl overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-indigo-900"></div>
                <img
                    src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1000&auto=format&fit=crop"
                    alt="Sports"
                    className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 p-8 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent">
                    <span className="bg-primary text-black text-xs font-bold px-2 py-1 rounded w-fit mb-2 uppercase tracking-wide">Promoção Exclusiva</span>
                    <h2 className="text-3xl font-bold text-white mb-1">Champions League</h2>
                    <p className="text-gray-300 mb-4">Aposte nos jogos de hoje e ganhe 100% de bônus.</p>
                    <button
                        onClick={() => onAction && onAction('Apostas Esportivas indisponíveis no momento.')}
                        className="bg-white text-black font-bold py-2.5 px-6 rounded-lg w-fit hover:bg-gray-200 transition-colors"
                    >
                        Apostar Agora
                    </button>
                </div>
            </div>

            {/* Secondary Banners Grid */}
            <div className="grid grid-cols-2 gap-4 h-64">
                <div
                    onClick={() => onAction && onAction('Cassino ao vivo em manutenção.')}
                    className="relative rounded-2xl overflow-hidden group cursor-pointer bg-card border border-white/5 hover:border-primary/50 transition-all"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-black"></div>
                    <div className="absolute inset-0 p-5 flex flex-col justify-between">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <span className="text-xl">🎰</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Cassino</h3>
                            <p className="text-xs text-muted">5.000.000 Kz em prêmios</p>
                        </div>
                    </div>
                </div>
                <div
                    onClick={() => onAction && onAction('Crash indisponível. Jogue Mines!')}
                    className="relative rounded-2xl overflow-hidden group cursor-pointer bg-card border border-white/5 hover:border-primary/50 transition-all"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-900/50 to-black"></div>
                    <div className="absolute inset-0 p-5 flex flex-col justify-between">
                        <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                            <span className="text-xl">🚀</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Crash</h3>
                            <p className="text-xs text-muted">Multiplicadores insanos</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Banner;
