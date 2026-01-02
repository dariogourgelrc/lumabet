import React, { useState } from 'react';
import { Bomb, Gem } from 'lucide-react';
import confetti from 'canvas-confetti';

const MinesGame = ({ balance, setBalance }) => {
    // ... existing state ...
    const [betAmount, setBetAmount] = useState(100.00);
    const [minesCount, setMinesCount] = useState(3);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isWin, setIsWin] = useState(false);
    const [gridState, setGridState] = useState(Array(25).fill(null));
    const [minesLocations, setMinesLocations] = useState([]);
    const [pickCount, setPickCount] = useState(0);

    // Sound effects stub
    const playSound = (type) => {
        // console.log(type); 
    };

    // Helper: Calculate multiplier for a specific step
    const calculateMultiplier = (step, mines) => {
        let multiplier = 1;
        const totalTiles = 25;
        const safeTiles = totalTiles - mines;

        for (let i = 0; i < step; i++) {
            const remainingTiles = totalTiles - i;
            const remainingSafe = safeTiles - i;
            multiplier *= (remainingTiles / remainingSafe);
        }
        return multiplier;
    };

    // Visual Effect: Trigger Confetti based on multiplier
    const triggerWinEffect = (multiplier) => {
        if (multiplier < 2) {
            // Small burst
            confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.7 }
            });
        } else if (multiplier < 5) {
            // Medium celebration
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        } else {
            // BIG WIN (Fireworks)
            const duration = 3000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            const randomInRange = (min, max) => Math.random() * (max - min) + min;

            const interval = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                // since particles fall down, start a bit higher than random
                confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
                confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
            }, 250);
        }
    };

    // ... existing calculations ...
    const currentMultiplier = calculateMultiplier(pickCount, minesCount);
    const nextMultiplier = calculateMultiplier(pickCount + 1, minesCount);
    const currentPayout = betAmount * currentMultiplier;

    // ... existing odds generation ...
    const nextOdds = [];
    for (let i = 0; i < 5; i++) {
        if (pickCount + i < (25 - minesCount)) {
            nextOdds.push(calculateMultiplier(pickCount + i + 1, minesCount));
        }
    }

    const handleStartGame = () => {
        if (betAmount > balance) {
            alert("Saldo insuficiente!");
            return;
        }
        if (betAmount <= 0) return;

        setBalance(prev => prev - betAmount);
        setIsPlaying(true);
        setIsGameOver(false);
        setIsWin(false);
        setGridState(Array(25).fill(null));
        setPickCount(0);

        const mines = new Set();
        while (mines.size < minesCount) {
            mines.add(Math.floor(Math.random() * 25));
        }
        setMinesLocations(Array.from(mines));
        playSound('start');
    };

    const handleCashout = () => {
        if (!isPlaying || isGameOver) return;

        setBalance(prev => prev + currentPayout);
        setIsPlaying(false);
        setIsGameOver(true);
        setIsWin(true);
        revealAll(true);
        playSound('cashout');

        // Trigger Visual Effect
        triggerWinEffect(currentMultiplier);
    };

    const handleTileClick = (index) => {
        if (!isPlaying || isGameOver || gridState[index] !== null) return;

        if (minesLocations.includes(index)) {
            handleGameOverLoss(index);
        } else {
            const newGrid = [...gridState];
            newGrid[index] = 'gem';
            setGridState(newGrid);
            setPickCount(prev => prev + 1);
            playSound('gem');

            if (pickCount + 1 === (25 - minesCount)) {
                handleCashout();
            }
        }
    };

    const handleGameOverLoss = (hitIndex) => {
        setIsPlaying(false);
        setIsGameOver(true);
        setIsWin(false);

        const newGrid = [...gridState];
        newGrid[hitIndex] = 'bomb';
        setGridState(newGrid);

        revealAll(false);
        playSound('explosion');
    };

    const revealAll = (won) => {
        const finalGrid = [...gridState];
        for (let i = 0; i < 25; i++) {
            if (finalGrid[i] === null) {
                finalGrid[i] = minesLocations.includes(i) ? 'bomb' : 'gem';
            }
        }
        setGridState(finalGrid);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 p-4 sm:p-6 max-w-6xl mx-auto rounded-3xl bg-secondary/30 border border-white/5 backdrop-blur-sm">
            {/* LEFT: Controls */}
            <div className="w-full lg:w-1/3 flex flex-col gap-6 bg-sidebar p-5 sm:p-6 rounded-2xl border border-white/5 shadow-xl">

                {/* Bet Inputs */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-muted uppercase tracking-wide">Valor da Aposta</label>
                        <span className="text-[10px] font-bold text-muted bg-white/5 px-2 py-1 rounded">Max: 500.000 Kz</span>
                    </div>
                    <div className="relative group">
                        <input
                            type="number"
                            value={betAmount}
                            onChange={(e) => setBetAmount(Number(e.target.value))}
                            disabled={isPlaying}
                            className="w-full bg-background border-2 border-white/5 group-hover:border-white/10 rounded-xl px-4 py-4 text-white font-bold text-lg focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50 appearance-none pl-12"
                            placeholder="0.00"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm font-bold pointer-events-none">Kz</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button disabled={isPlaying} onClick={() => setBetAmount(betAmount / 2)} className="bg-secondary hover:bg-white/10 active:bg-white/20 py-3 rounded-xl text-xs font-bold text-muted transition-colors disabled:opacity-50 uppercase tracking-widest">Metade</button>
                        <button disabled={isPlaying} onClick={() => setBetAmount(betAmount * 2)} className="bg-secondary hover:bg-white/10 active:bg-white/20 py-3 rounded-xl text-xs font-bold text-muted transition-colors disabled:opacity-50 uppercase tracking-widest">Dobro</button>
                    </div>
                </div>

                {/* Mines Count Select */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-muted uppercase tracking-wide">Número de Minas</label>
                    <div className="relative group">
                        <select
                            value={minesCount}
                            onChange={(e) => setMinesCount(Number(e.target.value))}
                            disabled={isPlaying}
                            className="w-full bg-background border-2 border-white/5 group-hover:border-white/10 rounded-xl px-4 py-4 text-white font-bold text-lg appearance-none cursor-pointer focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
                        >
                            {[...Array(24)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>{i + 1}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Bomb size={20} className="text-muted" />
                        </div>
                    </div>
                </div>

                {/* Info Stats (Desktop) */}
                <div className="hidden lg:grid grid-cols-2 gap-4 p-4 rounded-xl bg-black/20 border border-white/5">
                    <div>
                        <span className="text-xs text-muted block">Multiplicador</span>
                        <span className="text-xl font-bold text-white transition-all">{currentMultiplier.toFixed(2)}x</span>
                    </div>
                    <div className="text-right">
                        <span className="text-xs text-muted block">Próximo</span>
                        <span className="text-xl font-bold text-green-400">
                            {(currentMultiplier * ((25 - pickCount) / (25 - pickCount - minesCount))).toFixed(2)}x
                        </span>
                    </div>
                </div>

                {/* Action Button */}
                <button
                    onClick={isPlaying ? handleCashout : handleStartGame}
                    className={`w-full py-5 rounded-xl font-bold text-xl shadow-lg transform transition-all active:scale-[0.98] flex flex-col items-center justify-center gap-1 ${isPlaying
                        ? 'bg-orange-500 hover:bg-orange-400 text-white shadow-orange-500/20 ring-4 ring-orange-500/10'
                        : 'bg-primary hover:bg-green-400 text-black shadow-primary/20 ring-4 ring-primary/10'
                        }`}
                >
                    {isPlaying ? (
                        <>
                            <span className="text-[10px] opacity-80 uppercase tracking-widest font-black">Sacar Agora</span>
                            <span className="leading-none">{currentPayout.toFixed(2)} Kz</span>
                        </>
                    ) : (
                        'Começar o Jogo'
                    )}
                </button>

            </div>

            {/* RIGHT: Game Board */}
            <div className="w-full lg:w-2/3 flex flex-col items-center justify-center">

                {/* ODDS BAR (New) */}
                {isPlaying && (
                    <div className="w-full max-w-md mb-6 overflow-x-auto whitespace-nowrap scrollbar-hide flex gap-3 pb-2 px-1">
                        <div className="bg-primary text-black font-black px-5 py-3 rounded-xl shadow-[0_0_20px_rgba(0,231,1,0.3)] transform scale-105 border-2 border-white/20 min-w-[80px] text-center">
                            {currentMultiplier.toFixed(2)}x
                        </div>
                        {nextOdds.map((odd, i) => (
                            <div key={i} className="bg-secondary text-muted font-bold px-4 py-3 rounded-xl border border-white/5 opacity-40 min-w-[70px] text-center">
                                {odd.toFixed(2)}x
                            </div>
                        ))}
                    </div>
                )}

                <div className="w-full bg-[#0a0a0a] rounded-3xl p-4 sm:p-8 flex items-center justify-center border border-white/5 shadow-[inset_0_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden ring-1 ring-white/5">

                    {/* WIN OVERLAY (Visual Effect) */}
                    {isWin && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                            <div className={`bg-secondary border-2 border-primary/50 p-8 rounded-2xl shadow-[0_0_50px_rgba(0,231,1,0.3)] text-center transform animate-bounce-short ${currentMultiplier > 5 ? 'animate-shake' : ''}`}>
                                <h3 className="text-2xl font-bold text-white mb-2 uppercase tracking-widest">Vitória!</h3>
                                <div className="text-4xl font-black text-primary drop-shadow-lg mb-4">
                                    {currentPayout.toFixed(2)} Kz
                                </div>
                                <div className="text-sm text-muted">Multiplicador: {currentMultiplier.toFixed(2)}x</div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-5 gap-3 w-full max-w-md aspect-square relative z-10 transition-all duration-300">
                        {gridState.map((cellState, index) => {
                            const isLostMine = isGameOver && !isWin && minesLocations.includes(index) && cellState !== 'gem';
                            const isRevealedGem = cellState === 'gem';

                            return (
                                <button
                                    key={index}
                                    onClick={() => handleTileClick(index)}
                                    disabled={!isPlaying && !isGameOver}
                                    className={`
                                        relative w-full h-full rounded-xl transition-all duration-300 transform
                                        flex items-center justify-center text-3xl
                                        ${cellState === null
                                            ? 'bg-[#1a1a1a] hover:bg-[#252525] shadow-[0_4px_0_0_rgba(0,0,0,0.3)]'
                                            : 'bg-secondary border-4 border-transparent'}
                                        ${isPlaying && cellState === null ? 'cursor-pointer hover:-translate-y-1 active:translate-y-0 active:shadow-none' : ''}
                                        ${(!isPlaying && !isGameOver) ? 'opacity-50 cursor-not-allowed' : ''}
                                        
                                        ${isRevealedGem ? 'bg-secondary !border-green-500/20 shadow-[inset_0_0_20px_rgba(0,231,1,0.2)]' : ''}
                                        ${cellState === 'bomb' || isLostMine ? 'bg-secondary !border-red-500/20 shadow-[inset_0_0_20px_rgba(239,68,68,0.2)]' : ''}
                                        ${isLostMine && !cellState ? 'opacity-50' : ''} 
                                    `}
                                >
                                    <div className={`transition-all duration-500 flex items-center justify-center w-full h-full ${cellState || isLostMine ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
                                        {(cellState === 'gem') && <Gem size="50%" className="text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.8)] animate-bounce-short" />}
                                        {(cellState === 'bomb' || isLostMine) && <Bomb size="50%" className={`text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] ${cellState === 'bomb' ? 'animate-pulse' : ''}`} />}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MinesGame;
