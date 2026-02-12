import React, { useEffect, useState } from 'react';

interface AdOverlayProps {
    reason: 'LEVEL' | 'REVIVE' | 'RESET_CHAPTER';
    onAdComplete: () => void;
}

const AdOverlay: React.FC<AdOverlayProps> = ({ reason, onAdComplete }) => {
    const [timer, setTimer] = useState(5);

    useEffect(() => {
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

    return (
        <div className="absolute inset-0 bg-white z-[100] flex flex-col items-center justify-center p-6 text-black">
             <div className="w-full h-64 bg-gray-200 border-2 border-gray-400 flex items-center justify-center mb-6 relative">
                 <span className="text-gray-500 font-bold text-xl">Google AdSense</span>
                 <div className="absolute top-2 right-2 bg-yellow-400 text-black text-[10px] px-1 font-bold">РЕКЛАМА</div>
             </div>
             <h2 className="text-xl font-bold mb-4 text-center">
                 {reason === 'REVIVE' ? 'ВОСКРЕШЕНИЕ...' : reason === 'RESET_CHAPTER' ? 'ЗАГРУЗКА ГЛАВЫ...' : 'СЛЕДУЮЩИЙ УРОВЕНЬ'}
             </h2>
             <div className="text-4xl font-black text-cyan-600 mb-2">{timer}</div>
             <p className="text-xs text-gray-500">Реклама закроется автоматически</p>
        </div>
    );
};

export default AdOverlay;