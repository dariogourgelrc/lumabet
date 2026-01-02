import React from 'react';
import { Play } from 'lucide-react';

const GameCard = ({ title, provider, image, rtp }) => {
    return (
        <div className="group relative aspect-square rounded-xl overflow-hidden bg-card border border-white/5 hover:border-primary/50 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10">
            <img
                src={image}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100"
            />

            {/* Overlay on Hover */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4">
                <button className="bg-primary hover:bg-green-400 text-black rounded-full p-4 mb-3 transform scale-50 group-hover:scale-100 transition-all duration-300 shadow-lg shadow-green-500/50">
                    <Play size={24} fill="currentColor" />
                </button>
                <span className="text-white font-bold text-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-300">{title}</span>
                <span className="text-primary text-xs font-medium uppercase tracking-wide translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">{provider}</span>
            </div>

            {/* Static Label (Optional, visible when not hovering if needed, but here implies clean look) */}
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white border border-white/10 group-hover:opacity-0 transition-opacity">
                RTP {rtp}%
            </div>
        </div>
    );
};

export default GameCard;
