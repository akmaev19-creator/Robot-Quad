import React, { useEffect, useRef, useState } from 'react';
import { ShowPromiseResult } from '../../types';

interface AdOverlayProps {
    reason: 'LEVEL' | 'REVIVE' | 'RESET_CHAPTER' | 'BOSS_VICTORY';
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

        // 1. Инициализация Adsgram
        if (win.Adsgram) {
            try {
                // Инициализация с вашим Block ID
                adControllerRef.current = win.Adsgram.init({
                    blockId: "22852",
                    debug: false // Отключаем debug для продакшена, если нужно
                });

                setStatus('Реклама готова. Запуск...');

                // 2. Показ рекламы
                adControllerRef.current.show().then((result: ShowPromiseResult) => {
                    // Успешный просмотр или пропуск (если формат позволяет)
                    console.log("Adsgram result:", result);
                    onAdComplete();
                }).catch((result: ShowPromiseResult) => {
                    // Ошибка или проблема с загрузкой
                    console.warn("Adsgram error or skip:", result);
                    
                    // Fallback: даже если ошибка, мы не должны блокировать игрока навечно
                    setStatus('Ошибка рекламы. Продолжаем...');
                    setTimeout(() => {
                        onAdComplete();
                    }, 1000);
                });

            } catch (e) {
                console.error("Adsgram Init Exception:", e);
                // Если критическая ошибка инициализации, пропускаем
                setTimeout(onAdComplete, 1000);
            }
        } else {
            console.error("Adsgram script not loaded in window");
            setStatus('Скрипт рекламы не найден. Пропуск...');
            // Fallback если скрипт не загрузился в head
            setTimeout(onAdComplete, 1500);
        }
    }, [onAdComplete]);

    const getTitle = () => {
        switch (reason) {
            case 'REVIVE': return 'ВОССТАНОВЛЕНИЕ...';
            case 'RESET_CHAPTER': return 'ПЕРЕЗАГРУЗКА...';
            case 'BOSS_VICTORY': return 'ПОБЕДА!';
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
                 Adsgram ID: 22852
             </div>
        </div>
    );
};

export default AdOverlay;