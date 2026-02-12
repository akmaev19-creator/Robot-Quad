import React from 'react';
import { X, Volume2, VolumeX, Music, MicOff, Trophy } from 'lucide-react';
import { GameSettings } from '../../types';
import { GAME_VERSION } from '../../constants';

interface SettingsMenuProps {
    isOpen: boolean;
    onClose: () => void;
    settings: GameSettings;
    onToggleSetting: (key: keyof GameSettings) => void;
    trophies: boolean[];
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({
    isOpen, onClose, settings, onToggleSetting, trophies
}) => {
    if (!isOpen) return null;

    const trophyColors = ['#22c55e', '#ef4444', '#3b82f6', '#a855f7', '#eab308'];

    return (
        <div className="absolute inset-0 bg-slate-950/95 z-40 flex flex-col p-6 animate-in fade-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-white">НАСТРОЙКИ</h2>
                <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
            </div>

            <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center bg-slate-900 p-4 rounded border border-slate-800">
                    <div className="flex items-center gap-3">{settings.musicEnabled ? <Music className="text-cyan-400" /> : <MicOff className="text-slate-600" />}<span>Музыка</span></div>
                    <button onClick={() => onToggleSetting('musicEnabled')} className={`w-12 h-6 rounded-full relative transition-colors ${settings.musicEnabled ? 'bg-cyan-600' : 'bg-slate-700'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.musicEnabled ? 'left-7' : 'left-1'}`} /></button>
                </div>
                <div className="flex justify-between items-center bg-slate-900 p-4 rounded border border-slate-800">
                    <div className="flex items-center gap-3">{settings.sfxEnabled ? <Volume2 className="text-cyan-400" /> : <VolumeX className="text-slate-600" />}<span>Звуки</span></div>
                    <button onClick={() => onToggleSetting('sfxEnabled')} className={`w-12 h-6 rounded-full relative transition-colors ${settings.sfxEnabled ? 'bg-cyan-600' : 'bg-slate-700'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.sfxEnabled ? 'left-7' : 'left-1'}`} /></button>
                </div>
            </div>

            <div className="mb-8">
                <h3 className="text-sm text-slate-400 uppercase mb-2">Награды</h3>
                <div className="flex gap-2">
                    {trophies.map((unlocked, idx) => (
                        <div key={idx} className={`w-12 h-12 rounded border-2 flex items-center justify-center ${unlocked ? 'border-slate-600 bg-slate-900' : 'border-slate-800 bg-black'}`}>
                            {unlocked ? <Trophy size={20} color={trophyColors[idx]} fill={trophyColors[idx]} /> : <div className="w-2 h-2 rounded-full bg-slate-800" />}
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-auto flex flex-col items-center opacity-50">
                 <div className="text-xs text-slate-500 mb-2">ВЕРСИЯ v{GAME_VERSION}</div>
                 <div className="bg-red-900/50 text-white font-black text-sm px-3 py-1 rounded shadow-sm transform -rotate-1">AKMAI</div>
            </div>
        </div>
    );
};

export default SettingsMenu;