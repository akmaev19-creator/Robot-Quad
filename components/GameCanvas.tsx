import React, { useRef, useEffect, useState } from 'react';
import { GameState, Player, Enemy, Projectile, Particle, Collectible, ConstructedWeapon, ConsumableType, CoreType, BarrelType, UtilitySlot, Obstacle, SpeedMode, AmmoType, GameSettings, SFXType } from '../types';
import { GAME_WIDTH, GAME_HEIGHT, PLAYER_SPEED, PLAYER_SIZE, calculateWeaponStats, SPRITES, BASE_SCROLL_SPEED, getLevelQuota } from '../constants';
import { Play, RotateCcw } from 'lucide-react';

interface GameCanvasProps {
  playerHp: number; 
  weapons: (ConstructedWeapon | null)[];
  selectedWeaponIndex: number;
  utilities: UtilitySlot[];
  onConsumeUtility: (index: number) => void;
  isPaused: boolean;
  onScrapUpdate: (amount: number) => void;
  onCoreUpdate: (amount: number) => void;
  onHpUpdate: (hp: number) => void;
  initialScrap: number;
  initialCores: number;
  currentChapter: number;
  currentLevel: number;
  onLevelComplete: (isBoss: boolean) => void;
  settings: GameSettings;
  setGameState: (s: GameState) => void;
  gameState: GameState;
  onRestartLevel: (fullyRestart: boolean) => void;
  playSfx: (type: SFXType) => void;
  pendingUtilityUsage?: number | null;
  onClearPendingUtility?: () => void;
}

const HOUSE_DEPTH = 85; 
const SIDEWALK_WIDTH = 35; 
const HOUSE_UNIT_HEIGHT = 140; 
const INTERSECTION_FREQUENCY = 6; 
// Collision boundaries (Road area)
const PLAY_AREA_MIN_X = HOUSE_DEPTH + SIDEWALK_WIDTH; 
const PLAY_AREA_MAX_X = GAME_WIDTH - HOUSE_DEPTH - SIDEWALK_WIDTH;

const ROOF_COLORS = [
    '#57534e', // Stone
    '#44403c', // Dark Stone
    '#7f1d1d', // Muted Red
    '#1e3a8a', // Muted Blue
    '#3f6212', // Muted Green
    '#713f12', // Muted Brown
    '#581c87', // Muted Purple
    '#374151'  // Slate
];

const WALL_COLORS = [
    '#57534e', // Standard
    '#404040', // Darker
    '#52525b', // Zinc
    '#4b5563'  // Gray
];

const GameCanvas: React.FC<GameCanvasProps> = ({ 
    playerHp, weapons, selectedWeaponIndex, utilities, onConsumeUtility, isPaused, onScrapUpdate, onCoreUpdate, onHpUpdate, initialScrap, initialCores, currentChapter, currentLevel, onLevelComplete, settings, setGameState, gameState, onRestartLevel, playSfx, pendingUtilityUsage, onClearPendingUtility
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [speedMode, setSpeedMode] = useState<SpeedMode>(SpeedMode.NORMAL);
  
  const frameRef = useRef<number>(0);
  const playerRef = useRef<Player>({
    id: 0, x: GAME_WIDTH / 2 - PLAYER_SIZE / 2, y: GAME_HEIGHT - 140, width: PLAYER_SIZE, height: PLAYER_SIZE, vx: 0, vy: 0, hp: 100, maxHp: 100, scrap: initialScrap, glitchCores: initialCores, weaponXP: 0, weapons: [], selectedWeaponIndex: 0, utilities: [], iframes: 0
  });

  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const touchX = useRef<number | null>(null);
  
  const enemiesRef = useRef<Enemy[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const collectiblesRef = useRef<Collectible[]>([]);
  const obstaclesRef = useRef<Obstacle[]>([]);
  
  const lastShotTime = useRef<number>(-999); // Initialize negative to allow immediate shooting
  const frameCount = useRef<number>(0);
  const scrollOffset = useRef<number>(0); 
  const lastProcessedBlockId = useRef<number>(-1);
  const levelScrapCollected = useRef<number>(0);
  const isBossSpawnedRef = useRef(false);

  const LEVEL_SCRAP_QUOTA = getLevelQuota(currentChapter, currentLevel);

  useEffect(() => {
    playerRef.current.hp = playerHp;
  }, [playerHp]);

  useEffect(() => {
      // If we are already playing, reset level
      if (gameState === GameState.PLAYING) {
         startGame();
      }
  }, [currentLevel, currentChapter]);

  // Monitor Game State to trigger Start
  useEffect(() => {
    if (gameState === GameState.PLAYING && frameCount.current === 0) {
        // If switched to PLAYING and frames are 0, it means fresh start
        startGame();
    }
    
    if (gameState === GameState.MENU || gameState === GameState.PLAYING) {
        playerRef.current.scrap = initialScrap;
        playerRef.current.glitchCores = initialCores;
    }
  }, [gameState, initialScrap, initialCores]);

  // Handle Utility Usage Logic
  const executeUtility = (slotIdx: number) => {
    const utility = utilities[slotIdx];
    if (utility.type !== ConsumableType.EMPTY && utility.count > 0) {
        let used = false;
        if (utility.type === ConsumableType.MEDKIT) {
            if (playerRef.current.hp < playerRef.current.maxHp) {
                playerRef.current.hp = Math.min(playerRef.current.maxHp, playerRef.current.hp + 50);
                onHpUpdate(playerRef.current.hp);
                createParticles(playerRef.current.x, playerRef.current.y, '#22c55e', 10, 'HIT');
                playSfx('POWERUP');
                used = true;
            }
        } else if (utility.type === ConsumableType.GRENADE) {
            playSfx('EXPLOSION');
            let bossHit = false;
            enemiesRef.current.forEach(en => {
                createParticles(en.x, en.y, '#f97316', 15, 'EXPLOSION');
                if (en.type === 'BOSS') {
                    en.hp -= en.maxHp / 5; 
                    bossHit = true;
                } else {
                    en.hp = 0; 
                }
            });
            if (!bossHit) enemiesRef.current = enemiesRef.current.filter(e => e.type === 'BOSS'); 
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx) { ctx.fillStyle = 'white'; ctx.fillRect(0,0, GAME_WIDTH, GAME_HEIGHT); }
            used = true;
        }
        if (used) onConsumeUtility(slotIdx);
    }
  };

  // Watch for pending utility usage from UI (Touch/Click in WeaponBar)
  useEffect(() => {
      if (pendingUtilityUsage !== null && pendingUtilityUsage !== undefined) {
          executeUtility(pendingUtilityUsage);
          if (onClearPendingUtility) onClearPendingUtility();
      }
  }, [pendingUtilityUsage, utilities]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { 
        keysPressed.current[e.code] = true; 
        if (gameState === GameState.PLAYING && !isPaused) {
            if (e.key.toLowerCase() === 's') setSpeedMode(prev => prev === SpeedMode.NORMAL ? SpeedMode.TURBO : SpeedMode.NORMAL);
            
            if (e.key === '4') executeUtility(0);
            if (e.key === '5') executeUtility(1);
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [gameState, isPaused, utilities, playSfx, onConsumeUtility]); // Added deps

  const handleTouchStart = (e: React.TouchEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) touchX.current = ((e.touches[0].clientX - rect.left) / rect.width) * GAME_WIDTH;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) touchX.current = ((e.touches[0].clientX - rect.left) / rect.width) * GAME_WIDTH;
  };
  const handleTouchEnd = () => { touchX.current = null; };

  // --- Rendering ---
  const drawSprite = (ctx: CanvasRenderingContext2D, sprite: number[][], x: number, y: number, w: number, h: number, baseColor: string, flipX: boolean = false) => {
      const rows = sprite.length;
      const cols = sprite[0].length;
      const pxW = w / cols; const pxH = h / rows;
      for(let r=0; r<rows; r++) {
          for(let c=0; c<cols; c++) {
              let colIndex = flipX ? (cols-1)-c : c;
              const val = sprite[r][colIndex];
              if (val === 0) continue;
              if (val === 1) ctx.fillStyle = baseColor;
              else if (val === 2) ctx.fillStyle = '#ffffff'; 
              else if (val === 3) ctx.fillStyle = 'rgba(0,0,0,0.5)'; 
              else if (val === 4) ctx.fillStyle = '#22c55e'; // Stem
              ctx.fillRect(Math.floor(x + c * pxW), Math.floor(y + r * pxH), Math.ceil(pxW), Math.ceil(pxH));
          }
      }
  };

  // Pseudo-random helper for deterministic visual variety
  const getPseudoRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
  };

  const drawEnvironment = (ctx: CanvasRenderingContext2D, currentScrollSpeed: number) => {
      const effectiveScroll = isBossSpawnedRef.current ? 0 : currentScrollSpeed;
      scrollOffset.current += effectiveScroll;

      const roadColor = '#1c1917';
      const sidewalkColor = '#a8a29e';
      
      ctx.fillStyle = roadColor;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Noise (Asphalt)
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      for (let i = 0; i < 20; i++) {
        const noiseY = (scrollOffset.current + i * 50) % GAME_HEIGHT;
        ctx.fillRect(PLAY_AREA_MIN_X + 10 + (i*13)%100, noiseY, 4, 4);
      }

      // --- Dashed Center Line ---
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 4;
      ctx.setLineDash([40, 40]); 
      ctx.lineDashOffset = -scrollOffset.current; 
      ctx.moveTo(GAME_WIDTH / 2, -100);
      ctx.lineTo(GAME_WIDTH / 2, GAME_HEIGHT + 100);
      ctx.stroke();
      ctx.setLineDash([]); 
      // ---------------------------

      const offsetY = scrollOffset.current % HOUSE_UNIT_HEIGHT;
      // Iterate slightly beyond screen to ensure smooth scrolling
      for (let i = -1; i < (GAME_HEIGHT / HOUSE_UNIT_HEIGHT) + 1; i++) {
          const drawY = (i * HOUSE_UNIT_HEIGHT) + offsetY - HOUSE_UNIT_HEIGHT;
          const worldBlockId = Math.floor((scrollOffset.current - drawY) / HOUSE_UNIT_HEIGHT);
          const isIntersection = worldBlockId % INTERSECTION_FREQUENCY === 0;

          // Spawn Logic (Once per block)
          if (worldBlockId > lastProcessedBlockId.current && !isBossSpawnedRef.current) {
             lastProcessedBlockId.current = worldBlockId;
             
             if (isIntersection) {
                 // Nothing spawns on intersection right now to keep it clean
             } else {
                 // Spawn Trash Can
                 if (Math.random() > 0.6) {
                     const isLeft = Math.random() > 0.5;
                     obstaclesRef.current.push({
                         id: Date.now(),
                         x: isLeft ? HOUSE_DEPTH + 5 : GAME_WIDTH - HOUSE_DEPTH - 35,
                         y: -60,
                         width: 30, height: 30,
                         vx: 0, vy: 0,
                         hp: 30,
                         type: 'TRASH_CAN'
                     });
                 }
             }
          }

          if (isIntersection) {
               // Intersection Corners with Rounded Sidewalks
               ctx.fillStyle = sidewalkColor;
               const cornerRadius = 20;

               // Fill corners behind arcs
               ctx.fillRect(0, drawY, HOUSE_DEPTH + SIDEWALK_WIDTH, cornerRadius); // Top Left Backing
               ctx.fillRect(GAME_WIDTH - HOUSE_DEPTH - SIDEWALK_WIDTH, drawY, HOUSE_DEPTH + SIDEWALK_WIDTH, cornerRadius); // Top Right Backing
               ctx.fillRect(0, drawY + HOUSE_UNIT_HEIGHT - cornerRadius, HOUSE_DEPTH + SIDEWALK_WIDTH, cornerRadius); // Bot Left Backing
               ctx.fillRect(GAME_WIDTH - HOUSE_DEPTH - SIDEWALK_WIDTH, drawY + HOUSE_UNIT_HEIGHT - cornerRadius, HOUSE_DEPTH + SIDEWALK_WIDTH, cornerRadius); // Bot Right Backing

               // Draw Road patches over sidewalk to create arc
               ctx.fillStyle = roadColor;
               ctx.beginPath(); ctx.arc(HOUSE_DEPTH + SIDEWALK_WIDTH, drawY, cornerRadius, Math.PI, Math.PI * 0.5, true); ctx.lineTo(HOUSE_DEPTH + SIDEWALK_WIDTH, drawY); ctx.fill();
               ctx.beginPath(); ctx.arc(GAME_WIDTH - HOUSE_DEPTH - SIDEWALK_WIDTH, drawY, cornerRadius, 0, Math.PI * 0.5, false); ctx.lineTo(GAME_WIDTH - HOUSE_DEPTH - SIDEWALK_WIDTH, drawY); ctx.fill();
               ctx.beginPath(); ctx.arc(HOUSE_DEPTH + SIDEWALK_WIDTH, drawY + HOUSE_UNIT_HEIGHT, cornerRadius, Math.PI, Math.PI * 1.5, false); ctx.lineTo(HOUSE_DEPTH + SIDEWALK_WIDTH, drawY + HOUSE_UNIT_HEIGHT); ctx.fill();
               ctx.beginPath(); ctx.arc(GAME_WIDTH - HOUSE_DEPTH - SIDEWALK_WIDTH, drawY + HOUSE_UNIT_HEIGHT, cornerRadius, 0, Math.PI * 1.5, true); ctx.lineTo(GAME_WIDTH - HOUSE_DEPTH - SIDEWALK_WIDTH, drawY + HOUSE_UNIT_HEIGHT); ctx.fill();

               // Fill straight parts of sidewalk
               ctx.fillStyle = sidewalkColor;
               ctx.fillRect(HOUSE_DEPTH, drawY, SIDEWALK_WIDTH, 5); 
               ctx.fillRect(GAME_WIDTH - HOUSE_DEPTH - SIDEWALK_WIDTH, drawY, SIDEWALK_WIDTH, 5);
               ctx.fillRect(HOUSE_DEPTH, drawY + HOUSE_UNIT_HEIGHT - 5, SIDEWALK_WIDTH, 5); 
               ctx.fillRect(GAME_WIDTH - HOUSE_DEPTH - SIDEWALK_WIDTH, drawY + HOUSE_UNIT_HEIGHT - 5, SIDEWALK_WIDTH, 5);

               // Crosswalks (Zebra Stripes)
               ctx.fillStyle = '#ffffff';
               const stripeH = 6; const stripeGap = 6;
               // Vertical Crosswalks
               for(let s=0; s<HOUSE_UNIT_HEIGHT; s += stripeH + stripeGap) {
                   if (s > 20 && s < HOUSE_UNIT_HEIGHT - 20) {
                        ctx.fillRect(HOUSE_DEPTH + SIDEWALK_WIDTH - 15, drawY + s, 10, stripeH); 
                        ctx.fillRect(GAME_WIDTH - HOUSE_DEPTH - SIDEWALK_WIDTH + 5, drawY + s, 10, stripeH);
                   }
               }
               // Horizontal Crosswalks
               for(let s=HOUSE_DEPTH + SIDEWALK_WIDTH; s < GAME_WIDTH - HOUSE_DEPTH - SIDEWALK_WIDTH; s+= 20) {
                   ctx.fillRect(s, drawY + 10, 10, 20);
                   ctx.fillRect(s, drawY + HOUSE_UNIT_HEIGHT - 30, 10, 20);
               }
               
               // Traffic Lights
               ctx.fillStyle = '#262626';
               ctx.fillRect(HOUSE_DEPTH - 5, drawY - 30, 6, 25); 
               ctx.fillRect(GAME_WIDTH - HOUSE_DEPTH - 1, drawY - 30, 6, 25);
               
               const lightColor = (Math.floor(Date.now() / 1000) % 2 === 0) ? '#ef4444' : '#22c55e';
               ctx.fillStyle = lightColor;
               ctx.beginPath(); ctx.arc(HOUSE_DEPTH - 2, drawY - 24, 2, 0, Math.PI*2); ctx.fill();
               ctx.beginPath(); ctx.arc(GAME_WIDTH - HOUSE_DEPTH + 2, drawY - 24, 2, 0, Math.PI*2); ctx.fill();

          } else {
              // Standard Block
              ctx.fillStyle = sidewalkColor;
              ctx.fillRect(HOUSE_DEPTH, drawY, SIDEWALK_WIDTH, HOUSE_UNIT_HEIGHT);
              ctx.fillRect(GAME_WIDTH - HOUSE_DEPTH - SIDEWALK_WIDTH, drawY, SIDEWALK_WIDTH, HOUSE_UNIT_HEIGHT);

              // --- Independent House Generation (No Symmetry) ---
              
              // Left House
              const seedL = worldBlockId * 111;
              const rndL = getPseudoRandom(seedL);
              ctx.fillStyle = WALL_COLORS[Math.floor(rndL * WALL_COLORS.length)];
              ctx.fillRect(0, drawY, HOUSE_DEPTH, HOUSE_UNIT_HEIGHT);
              
              ctx.fillStyle = ROOF_COLORS[Math.floor(rndL * ROOF_COLORS.length)];
              const hModL = (rndL * 25);
              const wModL = (getPseudoRandom(seedL + 1) * 10);
              const mL = 4;
              ctx.fillRect(mL, drawY + mL + hModL, HOUSE_DEPTH - mL*2 - wModL, HOUSE_UNIT_HEIGHT - mL*2 - hModL);
              if (rndL > 0.5) { // Vent L
                 ctx.fillStyle = 'rgba(0,0,0,0.3)';
                 ctx.fillRect(20, drawY + 40 + hModL, 20, 20);
              }

              // Right House (Different seed)
              const seedR = worldBlockId * 222 + 55;
              const rndR = getPseudoRandom(seedR);
              ctx.fillStyle = WALL_COLORS[Math.floor(rndR * WALL_COLORS.length)];
              ctx.fillRect(GAME_WIDTH - HOUSE_DEPTH, drawY, HOUSE_DEPTH, HOUSE_UNIT_HEIGHT);
              
              ctx.fillStyle = ROOF_COLORS[Math.floor(rndR * ROOF_COLORS.length)];
              const hModR = (rndR * 25);
              const wModR = (getPseudoRandom(seedR + 1) * 10);
              const mR = 4;
              ctx.fillRect(GAME_WIDTH - HOUSE_DEPTH + mR + wModR, drawY + mR, HOUSE_DEPTH - mR*2 - wModR, HOUSE_UNIT_HEIGHT - mR*2 - hModR);
              if (rndR > 0.5) { // Vent R
                 ctx.fillStyle = 'rgba(0,0,0,0.3)';
                 ctx.fillRect(GAME_WIDTH - 45, drawY + 60, 25, 15);
              }
          }
      }
  };

  const spawnBoss = () => {
      playSfx('BOSS_ROAR');
      const bossHp = 1500 * currentChapter; 
      enemiesRef.current = [];
      enemiesRef.current.push({
          id: 99999,
          x: GAME_WIDTH / 2 - 50,
          y: -150,
          width: 100,
          height: 100,
          vx: 0,
          vy: 1, 
          hp: bossHp,
          maxHp: bossHp,
          type: 'BOSS',
          color: '#ef4444',
          animFrame: 0, animTimer: 0, flipX: false,
          bossState: 'IDLE',
          bossTimer: 0
      });
      isBossSpawnedRef.current = true;
  };

  const updateBoss = (boss: Enemy) => {
      if (boss.y < 50) {
          boss.y += 1; // Enter screen
          return;
      }
      if (!boss.bossState) boss.bossState = 'IDLE';
      boss.bossTimer = (boss.bossTimer || 0) + 1;

      // Keep boss on road
      if (boss.x < PLAY_AREA_MIN_X) { boss.x = PLAY_AREA_MIN_X; boss.vx = Math.abs(boss.vx || 0); }
      if (boss.x > PLAY_AREA_MAX_X - boss.width) { boss.x = PLAY_AREA_MAX_X - boss.width; boss.vx = -Math.abs(boss.vx || 0); }

      if (boss.bossState === 'IDLE') {
          boss.x += Math.sin(frameCount.current / 50) * 1.5; // Gentle float
          if (boss.bossTimer > 100) {
              if (Math.random() > 0.4) {
                  boss.bossState = 'CHARGE_LASER';
                  boss.laserX = playerRef.current.x + PLAYER_SIZE/2; 
              } else {
                   boss.bossState = 'FIRE_LASER'; 
                   playSfx('SHOOT');
                   for(let i=0; i<3+currentChapter; i++) {
                       const angle = Math.atan2(playerRef.current.y - (boss.y + 50), playerRef.current.x - (boss.x + 50));
                       const speed = 3 + currentChapter;
                       projectilesRef.current.push({
                           id: Math.random(), x: boss.x + 50, y: boss.y + 80, width: 16, height: 16,
                           vx: Math.cos(angle + (i*0.2 - 0.3)) * speed, vy: Math.sin(angle + (i*0.2 - 0.3)) * speed,
                           damage: 20, color: '#f97316', fromPlayer: false, life: 200, visualType: 'FIREBALL'
                       });
                   }
              }
              boss.bossTimer = 0;
          }
      } else if (boss.bossState === 'CHARGE_LASER') {
          if (boss.bossTimer > 120) { 
              boss.bossState = 'FIRE_LASER';
              boss.bossTimer = 0;
              playSfx('LASER');
              const p = playerRef.current;
              const lx = boss.laserX || 0;
              const lw = 60; // Wide beam
              if (p.x < lx + lw/2 && p.x + p.width > lx - lw/2) {
                   p.hp -= p.maxHp * 0.5;
                   onHpUpdate(p.hp);
                   createParticles(p.x, p.y, '#ef4444', 30, 'EXPLOSION');
                   if (p.hp <= 0) {
                       playSfx('GAME_OVER');
                       setGameState(GameState.GAME_OVER);
                   }
              }
          }
      } else if (boss.bossState === 'FIRE_LASER') {
          if (boss.bossTimer > 30) {
              boss.bossState = 'IDLE';
              boss.bossTimer = 0;
          }
      }
  };

  const spawnRoamingEnemy = () => {
    if (currentLevel === 10 && isBossSpawnedRef.current) return;
    if (currentLevel === 10 && levelScrapCollected.current >= LEVEL_SCRAP_QUOTA && !isBossSpawnedRef.current) {
        spawnBoss();
        return;
    }

    const typeRoll = Math.random();
    let minX = PLAY_AREA_MIN_X;
    let maxX = PLAY_AREA_MAX_X;
    const roadWidth = maxX - minX;

    let type: Enemy['type'] = 'GLITCH_BASIC';
    let hp = 20 * currentChapter;
    let width = 32;
    let vy = 1;
    let spawnX = minX + Math.random() * (roadWidth - width);
    let isSideAmbush = false;

    if (typeRoll > 0.95) {
         type = 'GLITCH_TANK'; hp = 80 * currentChapter; width = 48;
         // Tank always spawns on top of road now
         vy = 0.5; 
    } else if (typeRoll > 0.7) {
         type = 'GLITCH_FAST'; hp = 10 * currentChapter; width = 24; vy = 2.5;
         // Fast enemies might ambush from side occasionally if logic permits, 
         // but user asked to fix "passing through walls", so keeping them on road is safer.
    }

    enemiesRef.current.push({
        id: Date.now() + Math.random(),
        x: spawnX,
        y: -60, 
        width, height: width,
        vx: (Math.random() - 0.5) * 1.5, // Slight horizontal drift
        vy: vy,
        type, hp, maxHp: hp, color: '#ef4444',
        animFrame: 0, animTimer: 0, flipX: Math.random() > 0.5,
        isAmbush: isSideAmbush
    });
  };

  const createParticles = (x: number, y: number, color: string, count: number, type: 'HIT' | 'EXPLOSION' = 'HIT') => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        id: Math.random(), x, y,
        vx: (Math.random() - 0.5) * (type === 'EXPLOSION' ? 8 : 4),
        vy: (Math.random() - 0.5) * (type === 'EXPLOSION' ? 8 : 4),
        life: 20 + Math.random() * 20, color, size: Math.random() * 4 + 2
      });
    }
  };

  const shoot = () => {
    const player = playerRef.current;
    const currentWeapon = weapons[selectedWeaponIndex];
    if (!currentWeapon) return;
    const stats = calculateWeaponStats(currentWeapon.parts, currentWeapon.level);
    
    // Safety check: if frameCount is lower than lastShotTime (due to restart), reset lastShotTime
    if (frameCount.current < lastShotTime.current) {
        lastShotTime.current = -999;
    }

    if (frameCount.current - lastShotTime.current < stats.cooldown) return;

    lastShotTime.current = frameCount.current;
    const gunW = stats.gunWidth * 1.5; const gunH = stats.gunLength * 1.3;
    const gunX = player.x + (player.vx * 2) + player.width - 6; 
    const gunY = player.y + (Math.sin(frameCount.current / 15) * 3) + 8;
    const tipX = gunX + gunW / 2; const tipY = gunY - gunH;

    playSfx('SHOOT');

    const createProj = (offsetX: number, vx: number, vy: number) => {
        projectilesRef.current.push({
            id: Math.random(), x: tipX - 2 + offsetX, y: tipY, width: 4, height: stats.gunLength,
            vx, vy, damage: stats.damage, color: stats.color, fromPlayer: true,
            isExplosive: stats.isExplosive, life: stats.rangeLife, visualType: currentWeapon.parts.core === CoreType.BEAM ? 'BEAM' : currentWeapon.parts.ammo
        });
    };
    if (currentWeapon.parts.core === CoreType.BLASTER) createProj(0, 0, -stats.speed);
    else if (currentWeapon.parts.core === CoreType.SCATTER) { createProj(-6, -2, -stats.speed); createProj(0, 0, -stats.speed); createProj(6, 2, -stats.speed); } 
    else if (currentWeapon.parts.core === CoreType.BEAM) createProj(0, 0, -stats.speed * 1.5);
  };

  const update = () => {
    if (gameState !== GameState.PLAYING || isPaused) return;
    frameCount.current++;
    const player = playerRef.current;
    const currentScrollSpeed = speedMode === SpeedMode.TURBO ? BASE_SCROLL_SPEED * 2.5 : BASE_SCROLL_SPEED;

    if (keysPressed.current['ArrowLeft'] || (touchX.current !== null && touchX.current < GAME_WIDTH / 2)) player.vx = -1;
    else if (keysPressed.current['ArrowRight'] || (touchX.current !== null && touchX.current >= GAME_WIDTH / 2)) player.vx = 1;
    else player.vx = 0;
    
    let nextX = player.x + (player.vx * PLAYER_SPEED);
    if (nextX < PLAY_AREA_MIN_X) nextX = PLAY_AREA_MIN_X;
    if (nextX > PLAY_AREA_MAX_X - player.width) nextX = PLAY_AREA_MAX_X - player.width;
    
    let canMove = true;
    for (const obs of obstaclesRef.current) {
        if (nextX < obs.x + obs.width && nextX + player.width > obs.x && player.y < obs.y + obs.height && player.y + player.height > obs.y) canMove = false;
    }
    if (canMove) player.x = nextX;

    shoot();

    if (!isBossSpawnedRef.current) {
        if (frameCount.current % (speedMode === SpeedMode.TURBO ? 40 : 80) === 0) {
            spawnRoamingEnemy();
        }
    }

    const effectiveScroll = isBossSpawnedRef.current ? 0 : currentScrollSpeed;
    
    obstaclesRef.current.forEach(o => {
        o.y += effectiveScroll;
    }); 
    obstaclesRef.current = obstaclesRef.current.filter(o => o.y < GAME_HEIGHT && o.x > -200 && o.x < GAME_WIDTH + 200);

    projectilesRef.current.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; });
    projectilesRef.current = projectilesRef.current.filter(p => p.y > -100 && p.y < GAME_HEIGHT && p.life > 0);

    enemiesRef.current.forEach(e => {
        if (e.type === 'BOSS') {
            updateBoss(e);
        } else {
            // Standard monsters move down
            e.y += e.vy + (effectiveScroll * 0.5);
            e.x += e.vx;
            
            // STRICT WALL COLLISION - Prevent passing through walls
            if (e.x < PLAY_AREA_MIN_X) { e.x = PLAY_AREA_MIN_X; e.vx = Math.abs(e.vx); }
            if (e.x > PLAY_AREA_MAX_X - e.width) { e.x = PLAY_AREA_MAX_X - e.width; e.vx = -Math.abs(e.vx); }
        }

        if (player.iframes <= 0 && e.x < player.x + player.width && e.x + e.width > player.x && e.y < player.y + player.height && e.y + e.height > player.y) {
            player.hp -= 10;
            player.iframes = 60; 
            onHpUpdate(player.hp);
            createParticles(player.x, player.y, '#ef4444', 15, 'EXPLOSION');
            playSfx('HIT');
            if (player.hp <= 0) {
                 playSfx('GAME_OVER');
                 setGameState(GameState.GAME_OVER);
            }
        }
    });
    // Remove enemies off screen
    enemiesRef.current = enemiesRef.current.filter(e => e.y < GAME_HEIGHT + 100 && e.x > -100 && e.x < GAME_WIDTH + 100);

    for (let i = projectilesRef.current.length - 1; i >= 0; i--) {
        const p = projectilesRef.current[i];
        if (!p.fromPlayer) {
             if (p.x < player.x + player.width && p.x + p.width > player.x && p.y < player.y + player.height && p.y + p.height > player.y) {
                 player.hp -= p.damage;
                 onHpUpdate(player.hp);
                 createParticles(player.x, player.y, '#ef4444', 10, 'HIT');
                 playSfx('HIT');
                 if (player.hp <= 0) {
                     playSfx('GAME_OVER');
                     setGameState(GameState.GAME_OVER);
                 }
                 projectilesRef.current.splice(i, 1);
             }
             continue;
        }

        let hit = false;
        for (let j = enemiesRef.current.length - 1; j >= 0; j--) {
            const e = enemiesRef.current[j];
            if (p.x < e.x + e.width && p.x + p.width > e.x && p.y < e.y + e.height && p.y + p.height > e.y) {
                e.hp -= p.damage;
                createParticles(e.x + e.width/2, e.y + e.height/2, e.color, 3, 'HIT');
                hit = true; break;
            }
        }
        if (hit) projectilesRef.current.splice(i, 1);
    }

    for (let j = enemiesRef.current.length - 1; j >= 0; j--) {
        const e = enemiesRef.current[j];
        if (e.hp <= 0) {
            createParticles(e.x + e.width/2, e.y + e.height/2, e.color, 20, 'EXPLOSION');
            playSfx('EXPLOSION');
            
            let collectibleType: 'SCRAP' | 'CORE' = 'SCRAP';
            let val = speedMode === SpeedMode.TURBO ? 20 : 10; 
            let coreChance = 0.05; 
            if (e.type === 'GLITCH_TANK') { coreChance = 0.4; val = 30; }
            if (Math.random() < coreChance) { collectibleType = 'CORE'; val = 1; }

            collectiblesRef.current.push({
                id: Math.random(), x: e.x + e.width/2 - 8, y: e.y + e.height/2 - 8, width: 16, height: 16, vx: 0, vy: 0,
                value: val, type: collectibleType
            });
            
            if (e.type === 'BOSS') {
                playSfx('EXPLOSION');
                setGameState(GameState.LEVEL_COMPLETE); 
                setTimeout(() => { onLevelComplete(true); }, 2000);
            }
            
            enemiesRef.current.splice(j, 1);
        }
    }

    collectiblesRef.current.forEach(c => {
        c.y += c.vy + effectiveScroll; 
        if (c.x < player.x + player.width + 10 && c.x + c.width > player.x - 10 && c.y < player.y + player.height + 10 && c.y + c.height > player.y - 10) {
            if (c.type === 'SCRAP') {
                player.scrap += c.value;
                levelScrapCollected.current += c.value; 
                onScrapUpdate(player.scrap); 
                playSfx('CLICK');
                if (currentLevel < 10 && levelScrapCollected.current >= LEVEL_SCRAP_QUOTA) {
                     setGameState(GameState.LEVEL_COMPLETE);
                     setTimeout(() => { onLevelComplete(false); levelScrapCollected.current = 0; }, 1500);
                }
            } else {
                player.glitchCores += c.value;
                onCoreUpdate(player.glitchCores);
                playSfx('POWERUP');
            }
            c.value = 0;
        }
    });
    collectiblesRef.current = collectiblesRef.current.filter(c => c.value > 0 && c.y < GAME_HEIGHT);
    particlesRef.current.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);
    if (player.iframes > 0) player.iframes--;
  };
  
  const draw = (ctx: CanvasRenderingContext2D) => {
    const currentScrollSpeed = speedMode === SpeedMode.TURBO ? BASE_SCROLL_SPEED * 2.5 : BASE_SCROLL_SPEED;
    drawEnvironment(ctx, currentScrollSpeed);

    const player = playerRef.current;

    // Boss Laser
    enemiesRef.current.forEach(e => {
        if (e.type === 'BOSS' && e.bossState !== 'IDLE' && e.laserX) {
             const width = e.bossState === 'CHARGE_LASER' ? ((e.bossTimer || 0) / 120) * 4 : 40;
             const alpha = e.bossState === 'CHARGE_LASER' ? 0.3 : 0.9;
             
             ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
             ctx.fillRect(e.laserX - width/2, e.y + 100, width, GAME_HEIGHT);
             if (e.bossState === 'FIRE_LASER') {
                 ctx.fillStyle = 'white';
                 ctx.fillRect(e.laserX - 10, e.y + 100, 20, GAME_HEIGHT);
             }
        }
    });

    collectiblesRef.current.forEach(c => {
        if (c.type === 'SCRAP') {
            ctx.fillStyle = '#b45309'; ctx.fillRect(c.x, c.y, c.width, c.height);
            ctx.fillStyle = '#f59e0b'; ctx.fillRect(c.x + 2, c.y + 2, 4, 4);
        } else {
            ctx.shadowColor = '#06b6d4'; ctx.shadowBlur = 10; ctx.fillStyle = '#06b6d4';
            ctx.fillRect(c.x, c.y, c.width, c.height); ctx.fillStyle = '#fff'; ctx.fillRect(c.x + 4, c.y + 4, 8, 8);
            ctx.shadowBlur = 0;
        }
    });

    obstaclesRef.current.forEach(o => {
        if (o.type === 'TRASH_CAN') drawSprite(ctx, SPRITES.DUMPSTER, o.x, o.y, o.width, o.height, '#065f46');
    });

    projectilesRef.current.forEach(p => {
        if (p.visualType === 'FIREBALL') {
            ctx.fillStyle = '#f97316';
            ctx.beginPath(); ctx.arc(p.x + p.width/2, p.y + p.height/2, p.width/2, 0, Math.PI*2); ctx.fill();
        } else if (p.visualType === 'BEAM') {
            const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.height);
            grad.addColorStop(0, p.color); grad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = grad; ctx.fillRect(p.x, p.y, p.width, p.height);
        } else {
            ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.width, p.height);
        }
    });

    enemiesRef.current.forEach(e => {
        let sprite = SPRITES.ENEMY_BASIC;
        if (e.type === 'GLITCH_TANK') sprite = SPRITES.ENEMY_TANK;
        else if (e.type === 'GLITCH_FAST') sprite = SPRITES.ENEMY_FAST;
        else if (e.type === 'BOSS') sprite = SPRITES.BOSS;
        
        drawSprite(ctx, sprite, e.x, e.y, e.width, e.height, e.color, e.flipX);
        if (e.type === 'GLITCH_TANK' || e.type === 'BOSS') {
            ctx.fillStyle = 'red'; ctx.fillRect(e.x, e.y - 6, e.width, 4);
            ctx.fillStyle = 'green'; ctx.fillRect(e.x, e.y - 6, e.width * (e.hp / e.maxHp), 4);
        }
    });

    particlesRef.current.forEach(p => { ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); });

    if (gameState === GameState.PLAYING && (player.iframes % 10 < 5)) {
        const currentWeapon = weapons[selectedWeaponIndex];
        const stats = currentWeapon ? calculateWeaponStats(currentWeapon.parts, currentWeapon.level) : { gunColor: '#06b6d4', gunLength: 10, gunWidth: 6 };
        const tiltOffset = player.vx * 2;
        const bobOffset = Math.sin(frameCount.current / 15) * 3;
        const drawX = player.x + tiltOffset;
        const drawY = player.y + bobOffset;

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath(); ctx.ellipse(player.x + player.width/2, player.y + player.height + 15, 12, 4, 0, 0, Math.PI*2); ctx.fill();

        const gunW = stats.gunWidth * 1.5; const gunH = stats.gunLength * 1.3;
        const gunX = drawX + player.width - 6; const gunY = drawY + 8; 
        
        ctx.fillStyle = '#1e293b'; ctx.fillRect(drawX + player.width/2, drawY + 12, player.width/2, 6);
        ctx.fillStyle = stats.gunColor; ctx.fillRect(gunX, gunY - gunH, gunW, gunH);
        ctx.fillStyle = '#fff'; ctx.fillRect(gunX + 2, gunY - gunH + 2, 2, gunH - 4);

        drawSprite(ctx, SPRITES.PLAYER_ROUND, drawX, drawY, player.width, player.height, '#3b82f6');
    }
    
    if (gameState === GameState.LEVEL_COMPLETE) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, GAME_HEIGHT/2 - 40, GAME_WIDTH, 80);
        ctx.fillStyle = '#fff';
        ctx.font = '24px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText("УРОВЕНЬ ЗАВЕРШЕН", GAME_WIDTH/2, GAME_HEIGHT/2 + 10);
    }
  };

  const loop = () => {
    update();
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) { ctx.setTransform(1, 0, 0, 1, 0, 0); draw(ctx); }
    if (gameState === GameState.PLAYING || gameState === GameState.LEVEL_COMPLETE) {
        frameRef.current = requestAnimationFrame(loop);
    }
  };

  useEffect(() => {
    if (gameState === GameState.PLAYING) {
        frameRef.current = requestAnimationFrame(loop);
    } else {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) draw(ctx);
        cancelAnimationFrame(frameRef.current); 
    }
    return () => cancelAnimationFrame(frameRef.current);
  }, [gameState, weapons, selectedWeaponIndex, isPaused, speedMode]);

  const startGame = () => {
    playerRef.current.hp = 100;
    playerRef.current.scrap = initialScrap;
    playerRef.current.glitchCores = initialCores;
    playerRef.current.x = GAME_WIDTH / 2 - PLAYER_SIZE / 2;
    enemiesRef.current = [];
    projectilesRef.current = [];
    particlesRef.current = [];
    collectiblesRef.current = [];
    obstaclesRef.current = [];
    levelScrapCollected.current = 0;
    frameCount.current = 0; 
    lastShotTime.current = -999; // Reset shot timer so we can shoot immediately
    isBossSpawnedRef.current = false;
    onHpUpdate(100);
    onScrapUpdate(initialScrap);
    onCoreUpdate(initialCores);
    setGameState(GameState.PLAYING);
  };

  return (
    <div className="relative w-full h-full flex justify-center items-center bg-black">
        <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} className="h-full w-full object-contain image-pixelated touch-none"
            onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
            style={{ touchAction: 'none' }}
        />
        
        <div className="absolute top-16 left-0 right-0 z-10 px-4 flex justify-center pointer-events-none">
            <div className="w-full max-w-[200px] h-3 bg-slate-900 border border-slate-700 relative">
                <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${Math.min(100, (levelScrapCollected.current / LEVEL_SCRAP_QUOTA) * 100)}%` }}></div>
                <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white drop-shadow-md">
                    {currentLevel === 10 ? 'БОСС' : `ЦЕЛЬ ЛОМА: ${levelScrapCollected.current}/${LEVEL_SCRAP_QUOTA}`}
                </div>
            </div>
        </div>

        <div className="absolute top-4 right-4 z-10 text-[10px] text-right font-bold pointer-events-none">
             <div className="text-cyan-400">ГЛАВА: {currentChapter}</div>
             <div className="text-white">УРОВЕНЬ: {currentLevel}</div>
             {currentLevel === 10 && <div className="text-red-500 animate-pulse">МЕГА БОСС</div>}
        </div>

        {gameState === GameState.GAME_OVER && (
            <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center p-6 text-center z-20">
                 <h2 className="text-3xl text-red-500 mb-2">КРИТИЧЕСКИЙ СБОЙ</h2>
                 <p className="text-white mb-6">Восстановить систему?</p>
                 <div className="flex flex-col gap-4">
                     <button onClick={() => onRestartLevel(false)} className="flex items-center gap-2 bg-white text-black hover:bg-gray-200 px-6 py-3 rounded shadow active:translate-y-1 transition-all">
                        <Play size={20} />
                        СМОТРЕТЬ РЕКЛАМУ (100% HP)
                     </button>
                     <button onClick={() => onRestartLevel(true)} className="flex items-center gap-2 bg-transparent border border-white text-white hover:bg-white/10 px-6 py-2 rounded text-xs active:translate-y-1 transition-all">
                        <RotateCcw size={16} />
                        СДАТЬСЯ (НАЧАЛО ГЛАВЫ + РЕКЛАМА)
                     </button>
                 </div>
            </div>
        )}
        <div className="scanlines pointer-events-none"></div>
    </div>
  );
};

export default GameCanvas;