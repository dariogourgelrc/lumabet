import React, { useState } from 'react';
import { Wallet as WalletIcon, Plus } from 'lucide-react';

const Wallet = ({ balance }) => {
    // const [balance, setBalance] = useState(1000.00);

    return (
        <div className="bg-secondary rounded-full p-1 pl-4 flex items-center gap-3 border border-white/5 shadow-lg shadow-black/20">
            <div className="flex flex-col items-end mr-1">
                <span className="text-[10px] text-muted font-medium uppercase tracking-wider leading-none mb-0.5">Saldo</span>
                <span className="text-sm font-bold text-white leading-none">{balance.toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kz</span>
            </div>
            <button className="bg-primary hover:bg-green-400 text-black font-bold text-sm px-4 py-2 rounded-full flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(0,231,1,0.3)]">
                <span>Depositar</span>
                <Plus size={16} strokeWidth={3} />
            </button>
        </div>
    );
};

export default Wallet;
