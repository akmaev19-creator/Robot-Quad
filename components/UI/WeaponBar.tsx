import React from 'react';
import { ConstructedWeapon, ConsumableType, UtilitySlot } from '../../types';
import { Hammer, CircleOff, Bomb, Heart, Box, Lock } from 'lucide-react';
import { audio } from '../../audio';

interface WeaponBarProps {
  weapons: (ConstructedWeapon | null)[];
  selectedWeaponIndex: number;
  onSelectWeapon: (index: number) => void;
  utilities: UtilitySlot[];
  scrapCount: number;
  coreCount: number;
  onOpenCrafting: () => void;
  onUseUtility?: (index: number) => void;
}

const WeaponBar: React.FC<WeaponBarProps> = ({ 
    weapons, selectedWeaponIndex, onSelectWeapon, utilities, scrapCount, coreCount, onOpenCrafting, onUseUtility
}) => {
  
  const getUtilIcon = (type: ConsumableType) => {
      if (type === ConsumableType.GRENADE) return <Bomb size={16} className="text-white" />;
      if (type === ConsumableType.MEDKIT) return <Heart size={16} className="text-green-500" />;
      return <CircleOff size={16} className="text-slate-700" />;
  };

  const handleUtilClick = (index: number) => {
      const slot = utilities[index];
      const isEmpty = slot.type === ConsumableType.EMPTY;
      if (!isEmpty && onUseUtility) {
          audio.playSFX('CLICK');
          onUseUtility(index);
      }
  };

  return (
    <div className="w-full bg-slate-900 border-t-4 border-slate-700 p-2 pb-6 sm:pb-2">
      {/* Resource Bar */}
      <div className="flex justify-between items-center mb-2 px-1">
        <div className="flex gap-3">
             <div className="flex items-center gap-1 text-amber-400">
                <div className="w-2 h-2 bg-amber-400 rounded-sm"></div>
                <span className="text-xs">{scrapCount}</span>
             </div>
             <div className="flex items-center gap-1 text-purple-400">
                <div className="w-2 h-2 bg-purple-400 rounded-sm animate-pulse"></div>
                <span className="text-xs">{coreCount}</span>
             </div>
        </div>
        
        <button 
            onClick={() => { audio.playSFX('CLICK'); onOpenCrafting(); }}
            className="flex items-center gap-1 px-3 py-1 bg-cyan-900 text-cyan-200 text-[10px] rounded hover:bg-cyan-800 border border-cyan-700"
        >
            <Box size={12} />
            ИНВЕНТАРЬ [C]
        </button>
      </div>
      
      <div className="flex gap-2 h-14">
        {/* Weapon Slots (1-3) */}
        <div className="flex-1 grid grid-cols-3 gap-1">
            {[0, 1, 2].map((index) => {
                const weapon = weapons[index];
                const isSelected = selectedWeaponIndex === index;
                const lockedText = index === 1 ? "ГЛ. 2" : index === 2 ? "ГЛ. 3" : "ПУСТО";
                
                return (
                    <button
                        key={index}
                        onClick={() => { if(weapon) { onSelectWeapon(index); audio.playSFX('CLICK'); } }}
                        className={`
                            relative rounded flex flex-col items-center justify-center border-2 overflow-hidden
                            ${isSelected ? 'border-cyan-400 bg-slate-800' : 'border-slate-700 bg-slate-900/50'}
                            ${!weapon ? 'opacity-50' : 'hover:bg-slate-800'}
                        `}
                    >
                        <span className="absolute top-0 right-1 text-[8px] text-slate-500">{index + 1}</span>
                        {weapon ? (
                            <div className="text-[10px] leading-tight text-center font-bold text-white px-1 w-full break-words">
                                {weapon.name}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full">
                                {index > 0 && <Lock size={12} className="text-slate-600 mb-1"/>}
                                <span className="text-[8px] text-slate-500 font-bold">{index === 0 ? "ПУСТО" : lockedText}</span>
                            </div>
                        )}
                    </button>
                );
            })}
        </div>

        {/* Utility Slots (4-5) */}
        <div className="w-1/3 grid grid-cols-2 gap-1 border-l border-slate-700 pl-2">
            {[0, 1].map((index) => {
                const slot = utilities[index];
                const isEmpty = slot.type === ConsumableType.EMPTY;
                return (
                    <button 
                        key={index} 
                        onClick={() => handleUtilClick(index)}
                        // Adding onTouchEnd for potentially better mobile responsiveness if click is swallowed
                        onTouchEnd={(e) => {
                            e.preventDefault(); // Prevent double firing if click follows
                            handleUtilClick(index);
                        }}
                        className={`rounded border flex flex-col items-center justify-center relative transition-colors ${isEmpty ? 'bg-slate-900 border-slate-700' : 'bg-slate-800 border-slate-600 hover:bg-slate-700 active:bg-slate-600'}`}
                    >
                        <span className="absolute top-0 right-1 text-[8px] text-slate-500">{index + 4}</span>
                        {getUtilIcon(slot.type)}
                        {!isEmpty && (
                             <>
                                <span className="text-[8px] mt-1 text-slate-400">{slot.type === ConsumableType.MEDKIT ? 'HP' : 'BOOM'}</span>
                                <span className="absolute bottom-0 right-1 text-[10px] font-bold text-white">{slot.count}</span>
                             </>
                        )}
                    </button>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default WeaponBar;