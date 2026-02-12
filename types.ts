export enum GameState {
  INTRO = 'INTRO',
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER', // Death Choice Screen
  LEVEL_COMPLETE = 'LEVEL_COMPLETE',
  PAUSED = 'PAUSED',
  AD_BREAK = 'AD_BREAK',
  LEVEL_SELECT = 'LEVEL_SELECT'
}

export enum SpeedMode {
  NORMAL = 'NORMAL', // x1 speed
  TURBO = 'TURBO'    // x2 speed, x2 loot
}

// Components
export enum BarrelType {
  SHORT = 'SHORT',   
  MEDIUM = 'MEDIUM', 
  LONG = 'LONG'      
}

export enum CoreType {
  BLASTER = 'BLASTER', 
  SCATTER = 'SCATTER', 
  BEAM = 'BEAM'        
}

export enum AmmoType {
  STANDARD = 'STANDARD',   
  EXPLOSIVE = 'EXPLOSIVE', 
  INCENDIARY = 'INCENDIARY' 
}

export interface WeaponParts {
  barrel: BarrelType;
  core: CoreType;
  ammo: AmmoType;
}

export interface ConstructedWeapon {
  id: string;
  name: string;
  parts: WeaponParts;
  level: number;
  xpInvested: number; // XP spent on upgrades
}

export enum ConsumableType {
  GRENADE = 'GRENADE',
  MEDKIT = 'MEDKIT',
  EMPTY = 'EMPTY'
}

export interface UtilitySlot {
    type: ConsumableType;
    count: number;
}

export interface Entity {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
}

export interface Player extends Entity {
  hp: number;
  maxHp: number;
  scrap: number; 
  glitchCores: number;
  weaponXP: number; // New currency for upgrades
  // Inventory
  weapons: (ConstructedWeapon | null)[]; // 3 slots
  selectedWeaponIndex: number;
  utilities: UtilitySlot[]; // 2 slots
  iframes: number;
}

export interface Enemy extends Entity {
  type: 'GLITCH_BASIC' | 'GLITCH_FAST' | 'GLITCH_TANK' | 'BOSS';
  hp: number;
  maxHp: number;
  color: string;
  // Animation props
  animFrame: number;
  animTimer: number;
  flipX: boolean; 
  isAmbush?: boolean; 
  // Boss Specific
  bossState?: 'IDLE' | 'CHARGE_LASER' | 'FIRE_LASER';
  bossTimer?: number;
  laserX?: number; // X position of the laser beam
}

export interface Projectile extends Entity {
  damage: number;
  color: string;
  fromPlayer: boolean;
  isExplosive?: boolean;
  life: number; 
  visualType: AmmoType | 'BEAM' | 'FIREBALL'; 
}

export interface Obstacle extends Entity {
    hp: number; 
    type: 'TRASH_CAN' | 'CAR';
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export interface Collectible extends Entity {
  type: 'SCRAP' | 'CORE';
  value: number;
}

export interface GameSettings {
    musicEnabled: boolean;
    sfxEnabled: boolean;
    devMode: boolean; // Kept in type for compatibility but hidden in UI
}

export interface SaveData {
    chapter: number;
    level: number;
    maxChapter: number;
    scrap: number;
    cores: number;
    xp: number;
    weapons: (ConstructedWeapon | null)[];
    utilities: UtilitySlot[];
    trophies: boolean[]; // 5 chapters
    settings: GameSettings;
    playerColor: string;
    unlockedSkins: string[];
}

export type SFXType = 'SHOOT' | 'EXPLOSION' | 'HIT' | 'POWERUP' | 'LASER' | 'BOSS_ROAR' | 'GAME_OVER' | 'CLICK';

// Global Adsgram definition
export interface ShowPromiseResult {
    done: boolean; // true, если пользователь досмотрел до конца или пропустил (Interstitial формат)
    description: string;  // описание события
    state: 'load' | 'render' | 'playing' | 'destroy'; // состояние баннера
    error: boolean; // true, если событие связано с ошибкой, иначе false
}

declare global {
    interface Window {
        Adsgram?: {
            init: (config: { blockId: string; debug?: boolean; }) => {
                show: () => Promise<ShowPromiseResult>;
            };
        };
        Telegram?: {
            WebApp?: {
                CloudStorage: {
                    getItem: (key: string, callback: (err: any, value: string) => void) => void;
                    setItem: (key: string, value: string, callback?: (err: any, stored: boolean) => void) => void;
                };
                ready: () => void;
                expand: () => void;
            }
        }
    }
}