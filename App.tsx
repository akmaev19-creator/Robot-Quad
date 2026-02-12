import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import WeaponBar from './components/UI/WeaponBar';
import CraftingMenu from './components/UI/CraftingMenu';
import SettingsMenu from './components/UI/SettingsMenu';
import LevelSelectMenu from './components/UI/LevelSelectMenu';
import IntroScreen from './components/UI/IntroScreen';
import AdOverlay from './components/UI/AdOverlay';
import Header from './components/UI/Header';
import MainMenu from './components/UI/MainMenu';
import { ConstructedWeapon, ConsumableType, BarrelType, CoreType, AmmoType, UtilitySlot, GameState, SaveData, GameSettings, SFXType } from './types';
import { MAX_CONSUMABLE_STACK } from './constants';
import { Settings as SettingsIcon, Map } from 'lucide-react';
import { audio } from './audio';

const STORAGE_KEY = 'QUAD_SAVE_V1';

const App: React.FC = () => {
  // --- Global State ---
  const [showIntro, setShowIntro] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  
  // Ad State
  const [adReason, setAdReason] = useState<'LEVEL' | 'REVIVE' | 'RESET_CHAPTER' | null>(null);

  // Progression
  const [chapter, setChapter] = useState(1);
  const [level, setLevel] = useState(1);
  const [maxChapter, setMaxChapter] = useState(1);
  const [maxLevel, setMaxLevel] = useState(1); 
  const [trophies, setTrophies] = useState<boolean[]>([false, false, false, false, false]);

  // Resources
  const [scrapCount, setScrapCount] = useState<number>(250); 
  const [coreCount, setCoreCount] = useState<number>(5);
  const [weaponXP, setWeaponXP] = useState<number>(0);

  // Settings
  const [settings, setSettings] = useState<GameSettings>({
      musicEnabled: true,
      sfxEnabled: true,
      devMode: false
  });

  // Inventory
  const [weapons, setWeapons] = useState<(ConstructedWeapon | null)[]>([
      {
          id: 'default',
          name: 'Старт Бластер',
          parts: { barrel: BarrelType.MEDIUM, core: CoreType.BLASTER, ammo: AmmoType.STANDARD },
          level: 1,
          xpInvested: 0
      },
      null,
      null
  ]);
  const [selectedWeaponIndex, setSelectedWeaponIndex] = useState<number>(0);
  const [utilities, setUtilities] = useState<UtilitySlot[]>([
      { type: ConsumableType.EMPTY, count: 0 },
      { type: ConsumableType.EMPTY, count: 0 }
  ]);

  const [playerHp, setPlayerHp] = useState<number>(100);
  const [isCraftingOpen, setIsCraftingOpen] = useState(false);

  // --- Persistence ---
  useEffect(() => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
          try {
              const data = JSON.parse(saved);
              setChapter(data.chapter || 1);
              setLevel(data.level || 1);
              setMaxChapter(data.maxChapter || 1);
              setScrapCount(data.scrap !== undefined ? data.scrap : 250);
              setCoreCount(data.cores !== undefined ? data.cores : 5);
              setWeaponXP(data.xp || 0);
              setWeapons(data.weapons || []);
              setUtilities(data.utilities || [{ type: ConsumableType.EMPTY, count: 0 }, { type: ConsumableType.EMPTY, count: 0 }]);
              setTrophies(data.trophies || [false,false,false,false,false]);
              setSettings(data.settings || { musicEnabled: true, sfxEnabled: true, devMode: false });
          } catch (e) { console.error("Save corrupted", e); }
      }
  }, []);

  useEffect(() => {
      audio.setSettings(settings.musicEnabled, settings.sfxEnabled);
      if (!showIntro) {
          const data: SaveData = {
              chapter, level, maxChapter,
              scrap: scrapCount, cores: coreCount, xp: weaponXP,
              weapons, utilities, trophies, settings
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
  }, [chapter, level, scrapCount, coreCount, weaponXP, weapons, utilities, trophies, settings, showIntro]);

  // --- Handlers ---
  const initAudio = () => {
      audio.init();
      audio.startMusic();
  }

  const handleLevelComplete = (isBoss: boolean) => {
      setAdReason('LEVEL');
      setGameState(GameState.AD_BREAK);
      
      const xpGain = level * 10 * chapter;
      setWeaponXP(prev => prev + xpGain);
      
      if (isBoss) {
          const newTrophies = [...trophies];
          if (chapter <= 5) newTrophies[chapter-1] = true;
          setTrophies(newTrophies);
          if (chapter < 5) {
              setChapter(c => c + 1);
              setLevel(1);
              setMaxChapter(c => Math.max(c, chapter + 1));
          } else {
              alert("YOU SAVED THE SERVER!");
          }
      } else {
          if (level < 10) {
            setLevel(l => l + 1);
            setMaxLevel(l => Math.max(l, level + 1));
          }
      }
  };

  const handleDeathChoice = (fullyRestart: boolean) => {
      if (fullyRestart) {
          setAdReason('RESET_CHAPTER');
          setGameState(GameState.AD_BREAK);
      } else {
          setAdReason('REVIVE');
          setGameState(GameState.AD_BREAK);
      }
  };

  const onAdComplete = () => {
      if (adReason === 'REVIVE') {
          setPlayerHp(100);
          setGameState(GameState.PLAYING);
      } else if (adReason === 'RESET_CHAPTER') {
          setLevel(1);
          setPlayerHp(100);
          setGameState(GameState.PLAYING);
      } else if (adReason === 'LEVEL') {
          setPlayerHp(100);
          setGameState(GameState.PLAYING);
      }
      setAdReason(null);
  };

  const handleCraftWeapon = (newWeapon: ConstructedWeapon, slotIndex: number, refundAmount: number, costScrap: number) => {
      if (refundAmount > 0) {
         setWeaponXP(prev => prev + Math.floor(refundAmount));
      }
      if (!settings.devMode) {
          setScrapCount(prev => prev - costScrap);
      }
      const newWeapons = [...weapons];
      newWeapons[slotIndex] = newWeapon;
      setWeapons(newWeapons);
      setSelectedWeaponIndex(slotIndex);
  };

  const handleUpgradeWeapon = (slotIndex: number, xpCost: number) => {
      setWeaponXP(prev => prev - xpCost);
      const newWeapons = [...weapons];
      if (newWeapons[slotIndex]) {
          newWeapons[slotIndex]!.level += 1;
          newWeapons[slotIndex]!.xpInvested += xpCost;
      }
      setWeapons(newWeapons);
  };

  // Input listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key.toLowerCase() === 'c' && gameState === GameState.PLAYING) {
            audio.playSFX('CLICK');
            setIsCraftingOpen(prev => !prev);
        }
        if (e.key === '`' && settings.devMode) { 
             setScrapCount(prev => prev + 1000);
             setCoreCount(prev => prev + 100);
             setWeaponXP(prev => prev + 500);
        }
        if (!isCraftingOpen && !showSettings && gameState === GameState.PLAYING) {
            if (e.key === '1' && weapons[0]) setSelectedWeaponIndex(0);
            if (e.key === '2' && weapons[1]) setSelectedWeaponIndex(1);
            if (e.key === '3' && weapons[2]) setSelectedWeaponIndex(2);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [weapons, isCraftingOpen, settings.devMode, showSettings, gameState]);

  if (showIntro) {
      return <IntroScreen onComplete={() => { setShowIntro(false); initAudio(); }} />;
  }

  return (
    <div className="w-full h-screen bg-slate-950 flex justify-center items-center overflow-hidden" onClick={initAudio}>
      <div className="relative w-full h-full sm:max-w-[480px] sm:max-h-[850px] sm:border-x-4 sm:border-slate-800 bg-black flex flex-col shadow-2xl">
        <Header hp={playerHp} maxHp={100} />
        
        {/* Top Controls - Only show in game */}
        {gameState === GameState.PLAYING && (
            <div className="absolute top-16 left-4 z-30 flex flex-col gap-2">
                <button onClick={() => { audio.playSFX('CLICK'); setShowSettings(true); setGameState(GameState.PAUSED); }} className="p-2 bg-slate-900/80 rounded border border-slate-700 text-slate-400 hover:text-white"><SettingsIcon size={20} /></button>
                <button onClick={() => { audio.playSFX('CLICK'); setShowLevelSelect(true); setGameState(GameState.PAUSED); }} className="p-2 bg-slate-900/80 rounded border border-slate-700 text-slate-400 hover:text-white"><Map size={20} /></button>
            </div>
        )}

        <div className="flex-1 relative overflow-hidden">
            {/* Main Menu Overlay */}
            {gameState === GameState.MENU && (
                <MainMenu 
                    onStart={() => { setGameState(GameState.PLAYING); initAudio(); }}
                    onSettings={() => setShowSettings(true)}
                    onMap={() => setShowLevelSelect(true)}
                    chapter={chapter}
                    level={level}
                />
            )}

            {gameState === GameState.AD_BREAK && adReason && (
                <AdOverlay reason={adReason} onAdComplete={onAdComplete} />
            )}

            <GameCanvas 
                key={`${chapter}-${level}`} 
                playerHp={playerHp} 
                weapons={weapons} selectedWeaponIndex={selectedWeaponIndex} utilities={utilities}
                onConsumeUtility={(idx) => {
                    const u = [...utilities];
                    u[idx].count--;
                    if(u[idx].count <= 0) u[idx].type = ConsumableType.EMPTY;
                    setUtilities(u);
                }}
                isPaused={isCraftingOpen || showSettings || showLevelSelect || gameState === GameState.MENU || gameState === GameState.AD_BREAK}
                onScrapUpdate={setScrapCount} onCoreUpdate={setCoreCount} onHpUpdate={setPlayerHp}
                initialScrap={scrapCount} initialCores={coreCount} currentChapter={chapter} currentLevel={level}
                onLevelComplete={handleLevelComplete} settings={settings} setGameState={setGameState} gameState={gameState}
                onRestartLevel={handleDeathChoice}
                playSfx={(t) => audio.playSFX(t)}
            />
            
            <CraftingMenu 
                isOpen={isCraftingOpen} onClose={() => setIsCraftingOpen(false)}
                scrap={scrapCount} cores={coreCount} xp={weaponXP} weapons={weapons}
                onCraftWeapon={handleCraftWeapon} onUpgradeWeapon={handleUpgradeWeapon}
                onRenameWeapon={(idx, name) => { const w = [...weapons]; if(w[idx]) w[idx]!.name = name; setWeapons(w); }}
                utilities={utilities}
                onBuyConsumable={(type, idx, cost) => {
                    audio.playSFX('CLICK');
                    if(!settings.devMode) setScrapCount(p => p - cost);
                    const u = [...utilities];
                    if(u[idx].type === ConsumableType.EMPTY) { u[idx].type = type; u[idx].count = 1; }
                    else if(u[idx].type === type) u[idx].count++;
                    setUtilities(u);
                }}
                isDevMode={settings.devMode} chapter={chapter}
            />

            <SettingsMenu 
                isOpen={showSettings} onClose={() => { setShowSettings(false); if(gameState === GameState.PAUSED) setGameState(GameState.PLAYING); }}
                settings={settings} onToggleSetting={(k) => setSettings(p => ({...p, [k]: !p[k]}))}
                trophies={trophies}
            />

            <LevelSelectMenu 
                isOpen={showLevelSelect} onClose={() => { setShowLevelSelect(false); if(gameState === GameState.PAUSED) setGameState(GameState.PLAYING); }}
                currentChapter={chapter} maxUnlockedChapter={maxChapter} currentLevel={level} maxUnlockedLevel={maxLevel}
                onSelectLevel={(c, l) => { 
                    audio.playSFX('CLICK'); 
                    setChapter(c); 
                    setLevel(l); 
                    setPlayerHp(100); 
                    setShowLevelSelect(false); 
                    setGameState(GameState.PLAYING); 
                }}
            />
        </div>
        <div className="z-20">
            <WeaponBar 
                weapons={weapons} selectedWeaponIndex={selectedWeaponIndex} onSelectWeapon={setSelectedWeaponIndex}
                utilities={utilities} scrapCount={scrapCount} coreCount={coreCount} onOpenCrafting={() => { audio.playSFX('CLICK'); setIsCraftingOpen(true); }}
            />
        </div>
      </div>
    </div>
  );
};

export default App;