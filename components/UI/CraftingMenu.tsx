import React, { useState, useEffect } from 'react';
import { BarrelType, CoreType, AmmoType, ConstructedWeapon, ConsumableType, UtilitySlot } from '../../types';
import { BARREL_STATS, CORE_STATS, AMMO_STATS, CRAFTING_COST, calculateWeaponStats, CONSUMABLE_COSTS, PART_COSTS, XP_PER_LEVEL } from '../../constants';
import { X, Box, Edit2 } from 'lucide-react';
import { audio } from '../../audio';

interface CraftingMenuProps {
  isOpen: boolean;
  onClose: () => void;
  scrap: number;
  cores: number;
  xp: number;
  weapons: (ConstructedWeapon | null)[];
  onCraftWeapon: (weapon: ConstructedWeapon, slotIndex: number, refundAmount: number, costScrap: number) => void;
  onUpgradeWeapon: (slotIndex: number, xpCost: number) => void;
  onRenameWeapon: (slotIndex: number, newName: string) => void;
  utilities: UtilitySlot[];
  onBuyConsumable: (type: ConsumableType, slotIndex: number, cost: number) => void;
  isDevMode: boolean;
  chapter: number;
}

const CraftingMenu: React.FC<CraftingMenuProps> = ({ 
    isOpen, onClose, scrap, cores, xp, weapons, onCraftWeapon, onUpgradeWeapon, onRenameWeapon, utilities, onBuyConsumable, isDevMode, chapter
}) => {
  const [selectedTab, setSelectedTab] = useState<'CRAFT' | 'UPGRADE' | 'SHOP'>('CRAFT');
  const [selectedSlot, setSelectedSlot] = useState<number>(0);
  
  const [renameText, setRenameText] = useState("");
  const [barrel, setBarrel] = useState<BarrelType>(BarrelType.MEDIUM);
  const [core, setCore] = useState<CoreType>(CoreType.BLASTER);
  const [ammo, setAmmo] = useState<AmmoType>(AmmoType.STANDARD);
  
  useEffect(() => {
      // Always update rename text when slot changes or weapons change
      const w = weapons[selectedSlot];
      setRenameText(w ? w.name : "");
  }, [selectedSlot, weapons, isOpen]);

  if (!isOpen) return null;

  const totalScrapCost = isDevMode ? 0 : PART_COSTS[barrel] + PART_COSTS[core] + PART_COSTS[ammo];
  const canAffordWeapon = (scrap >= totalScrapCost && cores >= CRAFTING_COST.cores) || isDevMode;

  const handleCraft = () => {
      if (!canAffordWeapon) return;
      audio.playSFX('POWERUP');

      const existing = weapons[selectedSlot];
      let refund = 0;
      if (existing) {
          // REMOVED CONFIRMATION DIALOG as requested
          refund = existing.xpInvested * 0.9;
      }

      const newWeapon: ConstructedWeapon = {
          id: Date.now().toString(),
          name: renameText.trim() ? renameText : "Custom Weapon",
          parts: { barrel, core, ammo },
          level: 1,
          xpInvested: 0
      };
      
      onCraftWeapon(newWeapon, selectedSlot, refund, totalScrapCost);
  };

  const previewStats = calculateWeaponStats({ barrel, core, ammo });

  return (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col p-4 animate-in fade-in duration-200 overflow-hidden pointer-events-auto">
        <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
            <h2 className="text-xl text-cyan-400 font-bold flex items-center gap-2"><Box size={20} /> МАСТЕРСКАЯ</h2>
            <button onClick={() => { audio.playSFX('CLICK'); onClose(); }} className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white"><X size={24} /></button>
        </div>

        <div className="flex gap-4 mb-4 bg-slate-900/90 p-2 rounded border border-slate-800 text-xs">
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-400 rounded-sm"></div><span className="text-amber-400 font-bold">{scrap} ЛОМ</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-purple-500 rounded-sm animate-pulse"></div><span className="text-purple-400 font-bold">{cores} ЯДРА</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full"></div><span className="text-green-400 font-bold">{xp} XP</span></div>
        </div>

        <div className="flex gap-2 mb-4">
            <button onClick={() => setSelectedTab('CRAFT')} className={`flex-1 py-2 text-xs font-bold rounded ${selectedTab === 'CRAFT' ? 'bg-cyan-900 border border-cyan-700 text-white' : 'bg-slate-900 text-slate-500'}`}>СОЗДАТЬ</button>
            <button onClick={() => setSelectedTab('UPGRADE')} className={`flex-1 py-2 text-xs font-bold rounded ${selectedTab === 'UPGRADE' ? 'bg-green-900 border border-green-700 text-white' : 'bg-slate-900 text-slate-500'}`}>УЛУЧШИТЬ</button>
            <button onClick={() => setSelectedTab('SHOP')} className={`flex-1 py-2 text-xs font-bold rounded ${selectedTab === 'SHOP' ? 'bg-amber-900 border border-amber-700 text-white' : 'bg-slate-900 text-slate-500'}`}>МАГАЗИН</button>
        </div>

        {selectedTab === 'CRAFT' && (
            <div className="flex-1 flex flex-col overflow-y-auto">
                <div className="flex gap-2 mb-4 justify-center">
                    {[0, 1, 2].map(slot => {
                        const isLocked = !isDevMode && slot >= chapter; 
                        return (
                            <button key={slot} disabled={isLocked} onClick={() => { audio.playSFX('CLICK'); setSelectedSlot(slot); }} className={`w-12 h-12 border-2 rounded flex flex-col items-center justify-center text-[10px] font-bold relative ${selectedSlot === slot ? 'border-cyan-400 bg-slate-800' : 'border-slate-700 bg-slate-900'} ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {isLocked ? `ГЛ.${slot+1}` : slot + 1}
                            </button>
                        );
                    })}
                </div>

                <div className="mb-4 bg-slate-800/50 p-2 rounded flex items-center gap-2">
                    <Edit2 size={16} className="text-slate-400"/>
                    <input 
                        className="flex-1 bg-transparent border-b border-slate-600 text-xs text-white py-1 outline-none focus:border-cyan-400" 
                        value={renameText} 
                        onChange={(e) => {
                            setRenameText(e.target.value);
                            // Real-time update if weapon exists
                            if (weapons[selectedSlot]) {
                                onRenameWeapon(selectedSlot, e.target.value);
                            }
                        }} 
                        placeholder={weapons[selectedSlot] ? weapons[selectedSlot]!.name : "Название оружия..."}
                        maxLength={15}
                    />
                </div>

                <div className="space-y-4 mb-4 mt-4">
                    <div className="grid grid-cols-3 gap-1">
                        {Object.values(BarrelType).map(t => (
                            <button key={t} onClick={() => setBarrel(t)} className={`flex flex-col items-center p-2 text-[10px] rounded border ${barrel === t ? 'border-cyan-500 bg-cyan-950 text-white' : 'border-slate-700 bg-slate-900 text-slate-500'}`}>
                                <span>{BARREL_STATS[t].name}</span>
                                <span className={isDevMode ? 'text-green-400 line-through' : 'text-amber-500'}>{PART_COSTS[t]}</span>
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                        {Object.values(CoreType).map(t => (
                            <button key={t} onClick={() => setCore(t)} className={`flex flex-col items-center p-2 text-[10px] rounded border ${core === t ? 'border-purple-500 bg-purple-950 text-white' : 'border-slate-700 bg-slate-900 text-slate-500'}`}>
                                <span>{CORE_STATS[t].name}</span>
                                <span className={isDevMode ? 'text-green-400 line-through' : 'text-amber-500'}>{PART_COSTS[t]}</span>
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                        {Object.values(AmmoType).map(t => (
                            <button key={t} onClick={() => setAmmo(t)} className={`flex flex-col items-center p-2 text-[10px] rounded border ${ammo === t ? 'border-amber-500 bg-amber-950 text-white' : 'border-slate-700 bg-slate-900 text-slate-500'}`}>
                                <span>{AMMO_STATS[t].name}</span>
                                <span className={isDevMode ? 'text-green-400 line-through' : 'text-amber-500'}>{PART_COSTS[t]}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-auto bg-slate-900 p-3 rounded border border-slate-800">
                     <h3 className="text-cyan-400 font-bold text-sm mb-2">{previewStats.name}</h3>
                     <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-3 text-slate-300">
                         <div className="flex justify-between"><span>Урон:</span> <span className="text-white">{previewStats.damage}</span></div>
                         <div className="flex justify-between"><span>Скоростр:</span> <span className="text-white">{(60/previewStats.cooldown).toFixed(1)}/s</span></div>
                     </div>
                     <div className="flex justify-between items-center">
                         <div className="text-xs">
                             <span className={scrap >= totalScrapCost ? 'text-amber-400' : 'text-red-500'}>{totalScrapCost} Л</span> + <span className={cores >= CRAFTING_COST.cores ? 'text-purple-400' : 'text-red-500'}>{CRAFTING_COST.cores} Я</span>
                         </div>
                         <button onClick={handleCraft} disabled={!canAffordWeapon} className={`px-4 py-2 rounded text-sm font-bold shadow ${canAffordWeapon ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-500'}`}>
                             {weapons[selectedSlot] ? 'ЗАМЕНИТЬ' : 'СОЗДАТЬ'}
                         </button>
                     </div>
                </div>
            </div>
        )}

        {selectedTab === 'UPGRADE' && (
             <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
                 <h3 className="text-center text-sm text-slate-400">ВЫБЕРИТЕ ОРУЖИЕ ДЛЯ УЛУЧШЕНИЯ</h3>
                 {[0, 1, 2].map(slot => {
                     const weapon = weapons[slot];
                     const isLocked = !isDevMode && slot >= chapter;
                     if (isLocked) return <div key={slot} className="bg-slate-900 border border-slate-800 p-4 rounded text-center opacity-50"><div className="text-xs text-slate-500">СЛОТ {slot + 1}</div><div className="font-bold text-slate-600">ОТКРОЕТСЯ В ГЛАВЕ {slot + 1}</div></div>;
                     if (!weapon) return <div key={slot} className="bg-slate-900 border border-slate-800 p-4 rounded text-center"><div className="text-xs text-slate-500">СЛОТ {slot + 1}</div><div className="font-bold text-slate-400">ПУСТО</div></div>;

                     const upgradeCost = weapon.level * XP_PER_LEVEL;
                     const canUpgrade = xp >= upgradeCost || isDevMode;

                     return (
                        <div key={slot} className="bg-slate-900 border border-slate-700 p-3 rounded flex justify-between items-center">
                            <div>
                                <div className="text-cyan-400 font-bold text-sm">{weapon.name}</div>
                                <div className="text-xs text-white">УРОВЕНЬ {weapon.level}</div>
                            </div>
                            <button onClick={() => { audio.playSFX('POWERUP'); onUpgradeWeapon(slot, isDevMode ? 0 : upgradeCost); }} disabled={!canUpgrade} className={`px-4 py-2 rounded text-xs font-bold flex flex-col items-center ${canUpgrade ? 'bg-green-700 hover:bg-green-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                <span>УЛУЧШИТЬ</span>
                                <span className={isDevMode ? 'line-through text-white' : ''}>{upgradeCost} XP</span>
                            </button>
                        </div>
                     );
                 })}
             </div>
        )}

        {selectedTab === 'SHOP' && (
            <div className="space-y-2 pt-4">
                {[ConsumableType.MEDKIT, ConsumableType.GRENADE].map(type => {
                    const info = CONSUMABLE_COSTS[type];
                    const canBuySlot4 = (scrap >= info.scrap || isDevMode);
                    const canBuySlot5 = (scrap >= info.scrap || isDevMode);

                    return (
                        <div key={type} className="bg-slate-900/80 border border-slate-800 p-3 rounded flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-white text-sm">{info.name}</h4>
                                <p className="text-[10px] text-slate-400">{info.desc}</p>
                                <p className="text-xs text-amber-500 mt-1 font-bold">{info.scrap} ЛОМ</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => canBuySlot4 && onBuyConsumable(type, 0, info.scrap)} disabled={!canBuySlot4} className={`px-2 py-1 text-[10px] border rounded ${canBuySlot4 ? 'border-amber-500 text-amber-400' : 'border-slate-700 text-slate-600'}`}>СЛОТ 4 ({utilities[0].count})</button>
                                <button onClick={() => canBuySlot5 && onBuyConsumable(type, 1, info.scrap)} disabled={!canBuySlot5} className={`px-2 py-1 text-[10px] border rounded ${canBuySlot5 ? 'border-amber-500 text-amber-400' : 'border-slate-700 text-slate-600'}`}>СЛОТ 5 ({utilities[1].count})</button>
                            </div>
                        </div>
                    )
                })}
            </div>
        )}
    </div>
  );
};

export default CraftingMenu;