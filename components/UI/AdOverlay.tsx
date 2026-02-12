import React, { useEffect, useState } from 'react';

interface AdOverlayProps {
    reason: 'LEVEL' | 'REVIVE' | 'RESET_CHAPTER' | 'BOSS_VICTORY';
    onAdComplete: () => void;
}

const AdOverlay: React.FC<AdOverlayProps> = ({ reason, onAdComplete }) => {
    // 5 seconds for normal level transition
    // 15 seconds for Boss Victory, Revive, or Restart (High value actions)
    const initialTime = reason === 'LEVEL' ? 5 : 15;
    const [timer, setTimer] = useState(initialTime);

    useEffect(() => {
        // Init Yandex Ad Render
        const win = window as any;
        win.yaContextCb = win.yaContextCb || [];
        win.yaContextCb.push(() => {
            if (win.Ya && win.Ya.Context && win.Ya.Context.AdvManager) {
                try {
                    win.Ya.Context.AdvManager.render({
                        "blockId": "R-A-18712496-1",
                        "renderTo": "yandex_rtb_R-A-18712496-1"
                    });
                } catch (e) {
                    console.error("Yandex Ad Render Error:", e);
                }
            }
        });

        const interval = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    onAdComplete();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [onAdComplete]);

    const getTitle = () => {
        switch (reason) {
            case 'REVIVE': return 'ВОССТАНОВЛЕНИЕ ЯДРА...';
            case 'RESET_CHAPTER': return 'ПЕРЕЗАГРУЗКА СИСТЕМЫ...';
            case 'BOSS_VICTORY': return 'УГРОЗА УСТРАНЕНА!';
            default: return 'СЛЕДУЮЩИЙ УРОВЕНЬ';
        }
    };

    return (
        <div className="absolute inset-0 bg-white z-[100] flex flex-col items-center justify-center p-6 text-black">
             {/* Yandex RTB Block Container */}
             <div id="yandex_rtb_R-A-18712496-1" className="w-full max-w-[320px] min-h-[250px] bg-slate-100 flex items-center justify-center mb-6 overflow-hidden relative rounded shadow-inner">
                 <span className="text-[10px] text-gray-400 absolute">Загрузка рекламы...</span>
             </div>
             
             <h2 className="text-xl font-bold mb-4 text-center animate-pulse">
                 {getTitle()}
             </h2>
             <div className="text-5xl font-black text-cyan-600 mb-4">{timer}</div>
             <p className="text-xs text-slate-500 text-center max-w-[250px]">
                 {reason === 'LEVEL' 
                    ? 'Подготовка следующего сектора...' 
                    : 'Ожидайте полного восстановления для продолжения операции.'}
             </p>
        </div>
    );
};

export default AdOverlay;