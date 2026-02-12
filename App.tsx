import React, { useState, useEffect, useRef } from 'react';
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
  const [isDataLoaded, setIsDataLoaded] = useState(false); 
  
  // Ad State
  const [adReason, setAdReason] = useState<'LEVEL' | 'REVIVE' | 'RESET_CHAPTER' | 'BOSS_VICTORY' | 'UNLOCK_SKIN' | null>(null);
  const levelsSinceLastAd = useRef(0);

  // Transition Logic State
  const pendingLevelData = useRef<{chapter: number, level: number, trophies: boolean[], maxChapter: number, maxLevel: number} | null>(null);

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

  // Customization
  const [playerColor, setPlayerColor] = useState<string>('#3b82f6');
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(['#3b82f6']);
  const [pendingSkinUnlock, setPendingSkinUnlock] = useState<string | null>(null);

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
  
  // Bridge for UI clicks to Game Logic
  const [pendingUtilityUsage, setPendingUtilityUsage] = useState<number | null>(null);

  const [playerHp, setPlayerHp] = useState<number>(100);
  const [isCraftingOpen, setIsCraftingOpen] = useState(false);

  // --- Persistence & Telegram Init ---
  useEffect(() => {
      // 1. Init Telegram (Safe check)
      try {
        if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.ready();
            try {
                window.Telegram.WebApp.expand();
            } catch (e) { console.log('Expand not supported'); }
        }
      } catch(e) { console.error("Telegram init error", e); }

      // 2. Load Data (Try Telegram Cloud first IF supported, then LocalStorage)
      const loadData = async () => {
          // Helper to parse and apply
          const applyData = (jsonStr: string) => {
              try {
                  const data = JSON.parse(jsonStr);
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
                  setPlayerColor(data.playerColor || '#3b82f6');
                  setUnlockedSkins(data.unlockedSkins || ['#3b82f6']);
                  return true;
              } catch (e) {
                  console.error("Save corrupted", e);
                  return false;
              }
          };

          const tg = window.Telegram?.WebApp;
          // CloudStorage was introduced in version 6.9
          const isCloudSupported = tg && tg.isVersionAtLeast && tg.isVersionAtLeast('6.9') && tg.CloudStorage;

          if (isCloudSupported && tg.CloudStorage) {
              tg.CloudStorage.getItem(STORAGE_KEY, (err, value) => {
                  if (!err && value) {
                      console.log("Loaded from Telegram Cloud");
                      applyData(value);
                  } else {
                      // Fallback to LocalStorage if cloud is empty or error
                      console.log("Cloud empty/error, checking local");
                      const saved = localStorage.getItem(STORAGE_KEY);
                      if (saved) applyData(saved);
                  }
                  setIsDataLoaded(true); // Allow saving now
              });
          } else {
              // Standard Browser or Old Telegram
              console.log("Using LocalStorage (Browser/Old TG)");
              const saved = localStorage.getItem(STORAGE_KEY);
              if (saved) applyData(saved);
              setIsDataLoaded(true); // Allow saving now
          }
      };

      loadData();
  }, []);

  // Save Data Effect
  useEffect(() => {
      audio.setSettings(settings.musicEnabled, settings.sfxEnabled);
      
      // ONLY SAVE IF INTRO IS DONE AND DATA WAS LOADED
      if (!showIntro && isDataLoaded) {
          const data: SaveData = {
              chapter, level, maxChapter,
              scrap: scrapCount, cores: coreCount, xp: weaponXP,
              weapons, utilities, trophies, settings,
              playerColor, unlockedSkins
          };
          const jsonStr = JSON.stringify(data);
          
          // Always Save Local (Backups are good)
          try {
            localStorage.setItem(STORAGE_KEY, jsonStr);
          } catch(e) { console.error('Local save failed', e); }
          
          // Save Cloud if supported
          const tg = window.Telegram?.WebApp;
          const isCloudSupported = tg && tg.isVersionAtLeast && tg.isVersionAtLeast('6.9') && tg.CloudStorage;

          if (isCloudSupported && tg.CloudStorage) {
              tg.CloudStorage.setItem(STORAGE_KEY, jsonStr, (err, stored) => {
                  if (err) console.error("Cloud Save Error", err);
              });
          }
      }
  }, [chapter, level, scrapCount, coreCount, weaponXP, weapons, utilities, trophies, settings, showIntro, playerColor, unlockedSkins, isDataLoaded]);

  // --- Handlers ---
  const initAudio = () => {
      audio.init();
      audio.startMusic();
  }

  const applyPendingLevel = () => {
      if (pendingLevelData.current) {
          const { chapter: nextC, level: nextL, trophies: nextT, maxChapter: maxC, maxLevel: maxL } = pendingLevelData.current;
          
          setTrophies(nextT);
          setChapter(nextC);
          setLevel(nextL);
          setMaxChapter(maxC);
          setMaxLevel(maxL);
          
          setPlayerHp(100);
          setGameState(GameState.PLAYING);
          
          pendingLevelData.current = null;
      } else {
          // Fallback if no pending data (shouldn't happen in flow, but for safety)
          setPlayerHp(100);
          setGameState(GameState.PLAYING);
      }
  };

  const handleLevelComplete = (isBoss: boolean) => {
      const xpGain = level * 10 * chapter;
      setWeaponXP(prev => prev + xpGain);
      
      // 1. Calculate Next State
      let nextLevel = level;
      let nextChapter = chapter;
      let nextTrophies = [...trophies];
      let nextMaxChapter = maxChapter;
      let nextMaxLevel = maxLevel;

      if (isBoss) {
          if (chapter <= 5) nextTrophies[chapter-1] = true;
          
          if (chapter < 5) {
              nextChapter = chapter + 1;
              nextLevel = 1;
              nextMaxChapter = Math.max(nextMaxChapter, nextChapter);
          } else {
              // Game Loop / Victory
              nextChapter = 1;
              nextLevel = 1;
          }
      } else {
          if (level < 10) {
            nextLevel = level + 1;
            nextMaxLevel = Math.max(nextMaxLevel, nextLevel);
          }
      }

      // Store in ref so we don't lose it during ad
      pendingLevelData.current = {
          chapter: nextChapter,
          level: nextLevel,
          trophies: nextTrophies,
          maxChapter: nextMaxChapter,
          maxLevel: nextMaxLevel
      };

      // 2. Ad Logic: Every 3 levels OR Boss Victory
      levelsSinceLastAd.current += 1;
      
      let shouldShowAd = false;
      let reason: 'BOSS_VICTORY' | 'LEVEL' | null = null;

      if (isBoss) {
          shouldShowAd = true;
          reason = 'BOSS_VICTORY';
      } else if (levelsSinceLastAd.current >= 3) {
          shouldShowAd = true;
          reason = 'LEVEL';
          levelsSinceLastAd.current = 0;
      }

      if (shouldShowAd && reason) {
          setAdReason(reason);
          setGameState(GameState.AD_BREAK);
      } else {
          // No Ad needed, proceed immediately
          applyPendingLevel();
      }
  };

  const handleDeathChoice = (fullyRestart: boolean) => {
      if (fullyRestart) {
          // Restart with NO ad, but 0 scrap penalty
          setScrapCount(0); 
          setPlayerHp(100);
          setGameState(GameState.PLAYING);
      } else {
          // Revive with Ad
          setAdReason('REVIVE');
          setGameState(GameState.AD_BREAK);
      }
  };

  const handleUnlockSkin = (color: string, costType: 'CORES' | 'AD') => {
      if (costType === 'CORES') {
          if (coreCount >= 30) {
              setCoreCount(prev => prev - 30);
              setUnlockedSkins(prev => [...prev, color]);
              setPlayerColor(color);
              audio.playSFX('POWERUP');
          }
      } else {
          setPendingSkinUnlock(color);
          setAdReason('UNLOCK_SKIN');
          setGameState(GameState.AD_BREAK);
      }
  };

  const onAdComplete = () => {
      if (adReason === 'REVIVE') {
          setPlayerHp(100);
          setGameState(GameState.PLAYING);
      } else if (adReason === 'BOSS_VICTORY' || adReason === 'LEVEL') {
          // Apply the calculated level transition
          applyPendingLevel();
      } else if (adReason === 'UNLOCK_SKIN' && pendingSkinUnlock) {
          setUnlockedSkins(prev => [...prev, pendingSkinUnlock]);
          setPlayerColor(pendingSkinUnlock);
          setPendingSkinUnlock(null);
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
                pendingUtilityUsage={pendingUtilityUsage}
                onClearPendingUtility={() => setPendingUtilityUsage(null)}
                playerColor={playerColor}
            />
            
            {/* Main Menu Overlay - MOVED AFTER GAMECANVAS FOR Z-INDEX SAFETY */}
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
                playerColor={playerColor}
                unlockedSkins={unlockedSkins}
                onUnlockSkin={handleUnlockSkin}
                onEquipSkin={setPlayerColor}
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
                onUseUtility={(idx) => { if(gameState === GameState.PLAYING && !isCraftingOpen) setPendingUtilityUsage(idx); }}
            />
        </div>
      </div>
    </div>
  );
};

export default App;