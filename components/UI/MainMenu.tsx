import React from 'react';
import { Play, Map, Settings, Zap } from 'lucide-react';
import { GAME_VERSION } from '../../constants';
import { audio } from '../../audio';

interface MainMenuProps {
  onStart: () => void;
  onSettings: () => void;
  onMap: () => void;
  chapter: number;
  level: number;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStart, onSettings, onMap, chapter, level }) => {
  
  const handleStart = () => {
    audio.playSFX('CLICK');
    onStart();
  };

  return (
    <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
      
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
         <div className="absolute top-0 left-1/4 w-1 bg-cyan-500 h-full blur-sm"></div>
         <div className="absolute top-0 right-1/4 w-1 bg-red-500 h-full blur-sm"></div>
         <div className="scanlines"></div>
      </div>

      {/* Logo */}
      <div className="relative mb-12 flex flex-col items-center z-10">
        <h1 className="text-6xl font-black text-white tracking-tighter" style={{ textShadow: '4px 4px 0px #0891b2' }}>
            КВАД
        </h1>
        <div className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 mt-2 tracking-widest uppercase transform -skew-x-12">
            Последнее Ядро
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 text-center space-y-1 z-10">
          <p className="text-cyan-400 text-xs font-bold tracking-widest">ТЕКУЩИЙ ПРОГРЕСС</p>
          <div className="flex items-center justify-center gap-4 text-white text-sm">
             <span>ГЛАВА {chapter}</span>
             <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
             <span>УРОВЕНЬ {level}</span>
          </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-4 w-full max-w-[280px] z-10">
        <button 
            onClick={handleStart}
            className="group relative bg-cyan-600 hover:bg-cyan-500 text-white p-4 rounded shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3"
        >
            <Play size={24} fill="currentColor" />
            <span className="text-lg font-bold">НАЧАТЬ</span>
            <div className="absolute inset-0 border-2 border-white/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>

        <div className="flex gap-4">
            <button 
                onClick={() => { audio.playSFX('CLICK'); onMap(); }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 p-3 rounded border border-slate-700 flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
            >
                <Map size={20} />
                <span className="text-[10px] font-bold">КАРТА</span>
            </button>
            <button 
                onClick={() => { audio.playSFX('CLICK'); onSettings(); }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 p-3 rounded border border-slate-700 flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
            >
                <Settings size={20} />
                <span className="text-[10px] font-bold">НАСТРОЙКИ</span>
            </button>
        </div>
      </div>

      <div className="mt-auto text-slate-600 text-[10px] font-mono">
          v{GAME_VERSION} build
      </div>
    </div>
  );
};

export default MainMenu;