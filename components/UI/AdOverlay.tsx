import React, { useEffect, useRef, useState } from 'react';
import { ShowPromiseResult } from '../../types';

interface AdOverlayProps {
    reason: 'LEVEL' | 'REVIVE' | 'RESET_CHAPTER' | 'BOSS_VICTORY' | 'UNLOCK_SKIN';
    onAdComplete: () => void;
}

const AdOverlay: React.FC<AdOverlayProps> = ({ reason, onAdComplete }) => {
    const [status, setStatus] = useState<string>('Загрузка модуля рекламы...');
    const adControllerRef = useRef<any>(null);
    const hasAttemptedShow = useRef(false);

    useEffect(() => {
        if (hasAttemptedShow.current) return;
        hasAttemptedShow.current = true;

        const win = window as any;

        if (win.Adsgram) {
            try {
                adControllerRef.current = win.Adsgram.init({
                    blockId: "22872",
                    debug: false 
                });

                setStatus('Реклама готова. Запуск...');

                adControllerRef.current.show().then((result: ShowPromiseResult) => {
                    // Успех или пропуск
                    console.log("Adsgram result:", result);
                    
                    // Сразу продолжаем игру
                    onAdComplete();

                }).catch((result: ShowPromiseResult) => {
                    // Ошибка
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
    }, [onAdComplete]);

    const getTitle = () => {
        switch (reason) {
            case 'REVIVE': return 'ВОССТАНОВЛЕНИЕ...';
            case 'RESET_CHAPTER': return 'ПЕРЕЗАГРУЗКА...';
            case 'BOSS_VICTORY': return 'ПОБЕДА!';
            case 'UNLOCK_SKIN': return 'РАЗБЛОКИРОВКА...';
            default: return 'СЛЕДУЮЩИЙ УРОВЕНЬ';
        }
    };

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
                 Adsgram ID: 22872
             </div>
        </div>
    );
};

export default AdOverlay;