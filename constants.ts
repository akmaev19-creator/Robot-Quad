import { BarrelType, CoreType, AmmoType, WeaponParts, ConsumableType } from "./types";

export const GAME_VERSION = "0.2.1"; // Update this when releasing fixes

export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 700;

export const PLAYER_SPEED = 5;
export const PLAYER_SIZE = 36; 
export const MAX_CONSUMABLE_STACK = 5;
export const BASE_SCROLL_SPEED = 2; 

// --- Stats Definition ---

interface BarrelStat {
    name: string;
    range: number;
    accuracy: number;
    cooldownMult: number;
    speed: number;
    visualLength: number; 
}

interface CoreStat {
    name: string;
    baseDmg: number;
    baseCooldown: number;
    description: string;
    visualWidth: number; 
}

interface AmmoStat {
    name: string;
    dmgMult: number;
    color: string;
    description: string;
    isExplosive?: boolean;
}

export const BARREL_STATS: Record<BarrelType, BarrelStat> = {
    [BarrelType.SHORT]: { name: "Короткий", range: 45, accuracy: 0.8, cooldownMult: 0.7, speed: 9, visualLength: 8 },
    [BarrelType.MEDIUM]: { name: "Средний", range: 75, accuracy: 0.95, cooldownMult: 1.0, speed: 12, visualLength: 14 },
    [BarrelType.LONG]: { name: "Длинный", range: 130, accuracy: 1.0, cooldownMult: 1.4, speed: 16, visualLength: 22 },
};

export const CORE_STATS: Record<CoreType, CoreStat> = {
    [CoreType.BLASTER]: { name: "Бластер", baseDmg: 12, baseCooldown: 20, description: "Одиночный выстрел", visualWidth: 6 },
    [CoreType.SCATTER]: { name: "Дробовик", baseDmg: 10, baseCooldown: 45, description: "Тройной выстрел", visualWidth: 10 }, 
    [CoreType.BEAM]: { name: "Лазер", baseDmg: 18, baseCooldown: 30, description: "Пронзающий луч", visualWidth: 8 }, 
};

export const AMMO_STATS: Record<AmmoType, AmmoStat> = {
    [AmmoType.STANDARD]: { name: "Обычные", dmgMult: 1.0, color: "#06b6d4", description: "Стандарт" },
    [AmmoType.EXPLOSIVE]: { name: "Разрывные", dmgMult: 0.8, color: "#f97316", isExplosive: true, description: "Урон по площади" },
    [AmmoType.INCENDIARY]: { name: "Плазма", dmgMult: 1.5, color: "#a855f7", description: "Высокий урон" },
};

export const CONSUMABLE_COSTS = {
    [ConsumableType.MEDKIT]: { scrap: 100, name: "Рем-Набор", desc: "Восстанавливает 50 HP" },
    [ConsumableType.GRENADE]: { scrap: 75, name: "Граната", desc: "Уничтожает врагов на экране" } 
};

// Updated Prices
export const PART_COSTS = {
    [BarrelType.SHORT]: 200,
    [BarrelType.MEDIUM]: 250,
    [BarrelType.LONG]: 320,
    
    [CoreType.BLASTER]: 210,
    [CoreType.SCATTER]: 150,
    [CoreType.BEAM]: 300,

    [AmmoType.STANDARD]: 150,
    [AmmoType.EXPLOSIVE]: 270,
    [AmmoType.INCENDIARY]: 320
};

export const CRAFTING_COST = {
    scrap: 200, 
    cores: 3
};

export const XP_PER_LEVEL = 100; 

// Scrap required to finish a level
export const getLevelQuota = (chapter: number, level: number) => {
    return (chapter * 100) + (level * 20);
};

// Helper to calculate final weapon stats (includes Level Scaling)
export const calculateWeaponStats = (parts: WeaponParts, level: number = 1) => {
    const barrel = BARREL_STATS[parts.barrel];
    const core = CORE_STATS[parts.core];
    const ammo = AMMO_STATS[parts.ammo];

    // Level Multiplier (10% per level)
    const levelMult = 1 + ((level - 1) * 0.1);

    return {
        damage: Math.round(core.baseDmg * ammo.dmgMult * levelMult),
        cooldown: Math.round(core.baseCooldown * barrel.cooldownMult),
        speed: barrel.speed,
        rangeLife: barrel.range,
        color: ammo.color,
        isExplosive: ammo.isExplosive || false,
        name: `${ammo.name} ${core.name} MK.${level}`,
        gunLength: barrel.visualLength,
        gunWidth: core.visualWidth,
        gunColor: ammo.color
    };
};

// --- Sprites (8x8 or similar Grids) ---
export const SPRITES = {
    PLAYER_ROUND: [
        [0,0,1,1,1,1,0,0],
        [0,1,1,3,3,1,1,0], 
        [1,1,3,3,3,3,1,1], 
        [1,1,2,3,3,2,1,1], 
        [1,1,3,3,3,3,1,1],
        [1,1,1,1,1,1,1,1],
        [0,1,1,0,0,1,1,0], 
        [0,0,1,0,0,1,0,0]  
    ],
    ENEMY_BASIC: [
        [0,0,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,0],
        [1,2,1,1,1,1,2,1],
        [1,2,1,1,1,1,2,1],
        [1,1,1,0,0,1,1,1],
        [0,1,0,1,1,0,1,0],
        [0,1,0,0,0,0,1,0],
        [0,1,0,0,0,0,1,0]
    ],
    ENEMY_BASIC_MOVE: [
        [0,0,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,0],
        [1,2,1,1,1,1,2,1],
        [1,2,1,1,1,1,2,1],
        [1,1,1,0,0,1,1,1],
        [0,1,0,1,1,0,1,0],
        [0,0,1,0,0,1,0,0],
        [0,1,0,0,0,0,1,0]
    ],
    ENEMY_FAST: [
        [0,0,0,1,1,0,0,0],
        [0,0,1,1,1,1,0,0],
        [0,1,2,1,1,2,1,0],
        [1,1,1,0,0,1,1,1],
        [0,0,1,1,1,1,0,0],
        [0,1,0,1,1,0,1,0],
        [1,0,0,0,0,0,0,1],
        [0,0,0,0,0,0,0,0]
    ],
    ENEMY_TANK: [ 
        [0,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1],
        [1,2,2,1,1,2,2,1],
        [1,1,1,1,1,1,1,1],
        [1,3,3,3,3,3,3,1],
        [1,1,1,1,1,1,1,1],
        [0,1,0,1,1,0,1,0],
        [1,1,0,0,0,0,1,1]
    ],
    BOSS: [
        [0,1,1,1,1,1,1,0],
        [1,2,2,1,1,2,2,1],
        [1,2,3,1,1,3,2,1], 
        [1,1,1,1,1,1,1,1],
        [1,1,3,3,3,3,1,1], 
        [1,1,1,1,1,1,1,1],
        [0,1,0,1,1,0,1,0],
        [1,1,0,0,0,0,1,1]
    ],
    DUMPSTER: [
        [0,0,0,0,0,0,0,0],
        [0,1,1,1,1,1,1,0],
        [1,2,2,2,2,2,2,1], 
        [1,3,3,3,3,3,3,1], 
        [1,3,3,3,3,3,3,1],
        [1,3,3,3,3,3,3,1],
        [1,3,3,3,3,3,3,1],
        [0,1,1,0,0,1,1,0] 
    ],
    CAR: [
        [0,0,1,1,1,1,0,0],
        [0,1,1,2,2,1,1,0], 
        [1,1,1,1,1,1,1,1], 
        [1,1,1,2,2,1,1,1], 
        [1,1,1,1,1,1,1,1],
        [1,3,3,3,3,3,3,1], 
        [1,1,1,0,0,1,1,1],
        [1,1,1,0,0,1,1,1]
    ],
    FLOWER: [
        [0,0,0,0,0,0,0,0],
        [0,0,1,0,1,0,0,0],
        [0,1,2,2,2,1,0,0],
        [0,0,2,3,2,0,0,0],
        [0,1,2,2,2,1,0,0],
        [0,0,1,0,1,0,0,0],
        [0,0,0,4,0,0,0,0],
        [0,0,0,4,0,0,0,0]
    ],
    BOAT: [
        [0,0,0,0,0,1,1,0],
        [0,0,0,0,1,1,1,0],
        [0,0,0,1,1,1,1,0],
        [0,0,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1],
        [0,1,1,1,1,1,1,0],
        [0,0,1,1,1,1,0,0],
        [0,0,0,0,0,0,0,0]
    ]
};