import React from 'react';
import { X } from 'lucide-react';

interface LevelSelectMenuProps {
    isOpen: boolean;
    onClose: () => void;
    currentChapter: number;
    maxUnlockedChapter: number;
    currentLevel: number;
    maxUnlockedLevel: number;
    onSelectLevel: (chapter: number, level: number) => void;
}

const LevelSelectMenu: React.FC<LevelSelectMenuProps> = ({
    isOpen, onClose, currentChapter, maxUnlockedChapter, 
    currentLevel, maxUnlockedLevel, onSelectLevel
}) => {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 bg-slate-950/95 z-40 flex flex-col p-6 animate-in fade-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-white">КАРТА</h2>
                <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(chapter => {
                        const isUnlocked = chapter <= maxUnlockedChapter;
                        return (
                            <div key={chapter} className={`p-4 rounded border ${isUnlocked ? 'border-slate-700 bg-slate-900' : 'border-slate-800 bg-black opacity-50'}`}>
                                <h4 className="font-bold text-cyan-400 mb-2">ГЛАВА {chapter}</h4>
                                {isUnlocked && (
                                    <div className="grid grid-cols-5 gap-2">
                                        {[1,2,3,4,5,6,7,8,9,10].map(lvl => {
                                            let locked = true;
                                            if (chapter < maxUnlockedChapter) locked = false;
                                            else if (chapter === maxUnlockedChapter && lvl <= maxUnlockedLevel) locked = false;

                                            return (
                                                <button key={lvl} disabled={locked} onClick={() => onSelectLevel(chapter, lvl)} className={`p-1 text-xs text-center rounded ${locked ? 'bg-slate-800 text-slate-600' : (currentChapter === chapter && currentLevel === lvl ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-cyan-100 hover:bg-slate-600')}`}>
                                                    {lvl}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

export default LevelSelectMenu;