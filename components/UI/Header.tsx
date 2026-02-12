import React from 'react';

interface HeaderProps {
    hp: number;
    maxHp: number;
}

const Header: React.FC<HeaderProps> = ({ hp, maxHp }) => {
    const hpPercent = (hp / maxHp) * 100;
    
    return (
        <div className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-start pointer-events-none">
            <div className="flex flex-col gap-1 w-full max-w-[200px]">
                <div className="flex justify-between text-[10px] text-cyan-400 uppercase font-bold tracking-widest">
                    <span>ЗДОРОВЬЕ КВАДА</span>
                    <span>{Math.max(0, hp)}%</span>
                </div>
                <div className="h-4 bg-slate-900 border border-slate-700 w-full relative skew-x-[-12deg]">
                    <div 
                        className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-300"
                        style={{ width: `${Math.max(0, hpPercent)}%` }}
                    ></div>
                </div>
            </div>
            
            {/* Stage Indicator */}
            <div className="bg-slate-900 border border-slate-700 px-3 py-1 text-xs text-slate-400 skew-x-[-12deg]">
                <span className="skew-x-[12deg] inline-block font-bold">УР 01</span>
            </div>
        </div>
    );
};

export default Header;