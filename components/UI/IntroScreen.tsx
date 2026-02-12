import React, { useEffect } from 'react';

interface IntroScreenProps {
    onComplete: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete();
        }, 1500);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="absolute inset-0 bg-white flex items-center justify-center z-50 animate-out fade-out duration-500 delay-1000 fill-mode-forwards">
             {/* Using a styled div representation of the logo based on description since image path is relative */}
             <div className="flex flex-col items-center">
                 <div className="bg-red-600 text-white font-black text-4xl px-6 py-2 rounded-lg shadow-[0_4px_0_rgb(153,27,27)] transform -rotate-2">
                     AKMAI
                 </div>
                 <div className="text-red-600 font-bold tracking-[0.5em] text-xs mt-4">
                     INDIE DEV
                 </div>
             </div>
        </div>
    );
};

export default IntroScreen;