import React, { useEffect, useRef, useState } from 'react';
import { ShowPromiseResult } from '../../types';
import { Copy, Check } from 'lucide-react'; // Assuming lucide-react is available as per other files

interface AdOverlayProps {
    reason: 'LEVEL' | 'REVIVE' | 'RESET_CHAPTER' | 'BOSS_VICTORY';
    onAdComplete: () => void;
}

const AdOverlay: React.FC<AdOverlayProps> = ({ reason, onAdComplete }) => {
    const [status, setStatus] = useState<string>('Загрузка модуля рекламы...');
    const [rewardUrl, setRewardUrl] = useState<string | null>(null);
    const adControllerRef = useRef<any>(null);
    const hasAttemptedShow = useRef(false);

    // Generate a consistent mock ID for this session
    const [userId] = useState(() => "USER_" + Math.floor(Math.random() * 1000000));

    useEffect(() => {
        if (hasAttemptedShow.current) return;
        hasAttemptedShow.current = true;

        const win = window as any;

        if (win.Adsgram) {
            try {
                adControllerRef.current = win.Adsgram.init({
                    blockId: "22852",
                    debug: false 
                });

                setStatus('Реклама готова. Запуск...');

                adControllerRef.current.show().then((result: ShowPromiseResult) => {
                    // Success or Skip (Interstitial)
                    console.log("Adsgram result:", result);
                    
                    // Generate the Reward URL
                    const url = `https://test.adsgram.ai/reward?userid=${userId}`;
                    console.log(`%c [REWARD URL]: ${url}`, 'color: #4ade80; font-size: 14px;');
                    
                    // Show it in UI instead of closing immediately
                    setRewardUrl(url);

                }).catch((result: ShowPromiseResult) => {
                    // Error
                    console.warn("Adsgram error:", result);
                    setStatus('Ошибка рекламы. Пропуск...');
                    setTimeout(onAdComplete, 1000);
                });

            } catch (e) {
                console.error("Adsgram Init Exception:", e);
                setTimeout(onAdComplete, 1000);
            }
        } else {
            console.error("Adsgram script not loaded");
            setTimeout(onAdComplete, 1500);
        }
    }, [onAdComplete, userId]);

    const getTitle = () => {
        switch (reason) {
            case 'REVIVE': return 'ВОССТАНОВЛЕНИЕ...';
            case 'RESET_CHAPTER': return 'ПЕРЕЗАГРУЗКА...';
            case 'BOSS_VICTORY': return 'ПОБЕДА!';
            default: return 'СЛЕДУЮЩИЙ УРОВЕНЬ';
        }
    };

    // --- REWARD SCREEN ---
    if (rewardUrl) {
        return (
            <div className="absolute inset-0 bg-slate-950 z-[100] flex flex-col items-center justify-center p-6 text-white animate-in fade-in duration-300">
                <div className="w-full max-w-sm bg-slate-900 border-2 border-green-500 rounded-lg p-6 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
                            <Check className="text-green-400" size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-green-400">НАГРАДА ПОЛУЧЕНА</h2>
                        <p className="text-xs text-slate-400">Данные отправлены на сервер</p>
                    </div>

                    <div className="mb-2 text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                        GET Endpoint:
                    </div>
                    <div className="bg-black/50 border border-slate-700 rounded p-3 mb-6 break-all font-mono text-[10px] text-green-300 relative group">
                        {rewardUrl}
                    </div>

                    <button 
                        onClick={onAdComplete}
                        className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded transition-all active:scale-95 shadow-lg"
                    >
                        ПРОДОЛЖИТЬ ИГРУ
                    </button>
                </div>
            </div>
        );
    }

    // --- LOADING / AD SCREEN ---
    return (
        <div className="absolute inset-0 bg-black z-[100] flex flex-col items-center justify-center p-6 text-white">
             <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-8"></div>
             
             <h2 className="text-xl font-bold mb-4 text-center text-cyan-400">
                 {getTitle()}
             </h2>
             
             <p className="text-sm text-slate-400 text-center animate-pulse">
                 {status}
             </p>
             
             <div className="mt-8 text-[10px] text-slate-600 font-mono">
                 Adsgram ID: 22852
             </div>
        </div>
    );
};

export default AdOverlay;